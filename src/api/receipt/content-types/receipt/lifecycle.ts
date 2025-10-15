export default {
  async afterCreate(event: any) {
    const { result } = event;
    const studentId = result.student?.id;
    const semesterId = result.semester?.id;

    if (!studentId || !semesterId) return;

    const semester = await strapi.db.query('api::semester.semester').findOne({
      where: { id: semesterId, Active: true },
    });

    if (semester) {
      await strapi.db.query('api::student.student').update({
        where: { id: studentId },
        data: { Active: true },
      });
      strapi.log.info(`Student ${studentId} activated for active semester ${semester.Name}`);
    } else {
      strapi.log.warn(
        `Receipt created for  inactive semester ${semesterId}; student ${studentId} not reactivated.`
      );
  }
}
}
