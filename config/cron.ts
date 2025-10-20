export default {
  '0 0 * * *': async ({ strapi }) => {
    // Runs every day at midnight
    const today = new Date();

    try {
      // Find all active semesters that have ended
      const endedSemesters = await strapi.db.query('api::semester.semester').findMany({
        where: {
          EndDate: { $lt: today },
          Active: true,
        },
      });

      if (endedSemesters.length === 0) {
        strapi.log.info("No semesters ended today.");
        return;
      }

      const endedSemesterIds = endedSemesters.map(s => s.id);

      // Mark each ended semester as inactive
      for (const semester of endedSemesters) {
        await strapi.db.query('api::semester.semester').update({
          where: { id: semester.id },
          data: { Active: false },
        });
      }

      strapi.log.info(
        `Marked ${endedSemesters.length} semester(s) inactive: ${endedSemesters
          .map(s => s.Name)
          .join(', ')}`
      );

      // Deactivate all boarding passes linked to ended semesters
      const updatedBoardingPasses = await strapi.db
        .query('api::boarding-pass.boarding-pass')
        .updateMany({
          where: { semester: { id: { $in: endedSemesterIds } } },
          data: { active: false },
        });

      strapi.log.info(
        `Deactivated ${updatedBoardingPasses.count || 0} boarding passes for ended semester(s).`
      );

      // 4️⃣ Deactivate all students 
      await strapi.db.query('api::student.student').updateMany({
        data: { Active: false },
      });

      strapi.log.info(
        `Deactivated all students for ended semester(s): ${endedSemesters
          .map(s => s.Name)
          .join(', ')}`
      );
    } catch (error) {
      strapi.log.error(`Error during semester cleanup cron: ${error.message}`);
    }
  },
};
