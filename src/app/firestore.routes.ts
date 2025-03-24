export const FirestorePaths = {
  semesterPlans: 'semester-plans',
  semesterPlanCourses: (semesterPlanId: string) => `${FirestorePaths.semesterPlans}/${semesterPlanId}/courses`,
  semesterPlanCourseSections: (semesterPlanId: string, courseId: string) =>
    `${FirestorePaths.semesterPlanCourses(semesterPlanId)}/${courseId}/sections`,
  schedules: 'schedules',
  scheduleCourses: (scheduleId: string) => `${FirestorePaths.schedules}/${scheduleId}/courses`,
};
