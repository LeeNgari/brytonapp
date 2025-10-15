export default {
  '0 0 * * *': async ({ strapi }) => {
    // Runs every day at midnight
    const today = new Date();

    const endedSemesters = await strapi.db.query('api::semester.semester').findMany({
      where: {
        EndDate: { $lt: today },
        Active: true,
      },
    });

    if (endedSemesters.length > 0) {
      // Mark semesters inactive
      for (const sem of endedSemesters) {
        await strapi.db.query('api::semester.semester').update({
          where: { id: sem.id },
          data: { Active: false },
        });
      }

      // Deactivate all students
      await strapi.db.query('api::student.student').updateMany({
        data: { Active: false },
      });

      strapi.log.info(`Deactivated all students for ended semester(s): ${endedSemesters.map(s => s.Name).join(', ')}`);
    }
  },
};