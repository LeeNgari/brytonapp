import crypto from "crypto";
import { randomBytes } from "crypto";

function generateQrCode() {
  const random = crypto.randomBytes(3).toString("hex").toUpperCase();
  const timestamp = Date.now().toString().slice(-5);
  return `BP-${timestamp}-${random}`;
}

export default {
  /**
   * beforeCreate
   * Generates a custom ReceiptId using the semester name, random number, and current year.
   */
  async beforeCreate(event: any) {
    const { data } = event.params;

    // Normalize relations to ensure IDs are properly set
    if (data.student && typeof data.student === "object") {
      data.student = data.student.id || data.student.set?.[0]?.id;
    }
    if (data.semester && typeof data.semester === "object") {
      data.semester = data.semester.id || data.semester.set?.[0]?.id;
    }
    if (data.pick_up_point && typeof data.pick_up_point === "object") {
      data.pick_up_point =
        data.pick_up_point.id || data.pick_up_point.set?.[0]?.id;
    }

    const semesterId = data.semester;
    if (!semesterId) {
      strapi.log.warn(
        "beforeCreate: Missing semester ID, skipping ReceiptId generation.",
      );
      return;
    }

    // Fetch semester name
    const semester = await strapi.db.query("api::semester.semester").findOne({
      where: { id: semesterId },
      select: ["Name"],
    });

    if (!semester) {
      strapi.log.warn(
        `beforeCreate: Semester with id ${semesterId} not found, skipping ReceiptId generation.`,
      );
      return;
    }

    // Generate ReceiptId
    const namePart = semester.Name?.toUpperCase().replace(/\s+/g, "_") ?? "SEM";
    const randomPart = Math.floor(100 + Math.random() * 900);
    const receiptId = `${namePart}-${randomPart}`;

    data.ReceiptId = receiptId;
    strapi.log.info(
      `beforeCreate: Generated ReceiptId ${receiptId} for semester ${semester.Name}`,
    );
  },

  /**
   * afterCreate
   * Automatically creates a boarding pass and activates the student after a receipt is created.
   */
  async afterCreate(event: any) {
    strapi.log.info("afterCreate: Triggered for receipt creation.");

    const { result } = event;

    // Fetch the newly created receipt with relations
    const receipt = await strapi.db.query("api::receipt.receipt").findOne({
      where: { id: result.id },
      populate: ["student", "semester"],
    });

    if (!receipt) {
      strapi.log.error(
        `afterCreate: Receipt ${result.id} not found in database.`,
      );
      return;
    }

    const studentId = receipt.student?.id;
    const semesterId = receipt.semester?.id;
    const receiptId = receipt.id;
    const pickUpPointId = receipt.pick_up_point?.id;

    if (!studentId || !semesterId) {
      strapi.log.warn(
        `afterCreate: Missing student (${studentId}) or semester (${semesterId}) relation on receipt ${receiptId}.`,
      );
      return;
    }

    const semester = await strapi.db.query("api::semester.semester").findOne({
      where: { id: semesterId },
      select: ["Name"],
    });

    if (!semester) {
      strapi.log.warn(
        `afterCreate: Semester ${semesterId} not found while processing receipt ${receiptId}.`,
      );
      return;
    }

    const qrCode = generateQrCode();

    // Create boarding pass using Strapi 5 Document Service
    try {
      const boardingPass = await strapi
        .documents("api::boarding-pass.boarding-pass")
        .create({
          data: {
            student: studentId,
            semester: semesterId,
            receipt: receiptId,
            displayName: qrCode,
            Qr: qrCode,
            active: true,
          },
        });

      strapi.log.info(
        `afterCreate: Boarding pass ${boardingPass.documentId} created for student ${studentId} in semester ${semester.Name}.`,
      );
    } catch (bpError) {
      strapi.log.error(
        `afterCreate: Failed to create boarding pass for student ${studentId}, receipt ${receiptId}. Error: ${bpError.message}`,
      );
    }

    // Activate student using Document Service
    try {
      await strapi.db.query("api::student.student").update({
        where: { id: studentId },
        data: { pick_up_point: pickUpPointId, Active: true },
      });

      strapi.log.info(
        `afterCreate: Student ${studentId} activated for semester ${semester.Name}${
          pickUpPointId ? ` and assigned pick-up point ${pickUpPointId}` : ""
        }.`,
      );
    } catch (studentError: any) {
      strapi.log.error(
        `afterCreate: Failed to update student ${studentId}. Error: ${studentError.message}`,
      );
    }
  },
};
