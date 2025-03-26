export const FirestorePaths = {
  semesterPlans: 'semester-plans',
  semesterPlan: (semesterPlanId: string) => `${FirestorePaths.semesterPlans}/${semesterPlanId}`,
  semesterPlanCourses: (semesterPlanId: string) => `${FirestorePaths.semesterPlans}/${semesterPlanId}/courses`,
  semesterPlanCourse: (semesterPlanId: string, courseId: string) => `${FirestorePaths.semesterPlanCourses(semesterPlanId)}/${courseId}`,
  semesterPlanCourseSections: (semesterPlanId: string, courseId: string) =>
    `${FirestorePaths.semesterPlanCourses(semesterPlanId)}/${courseId}/sections`,
  semesterPlanCourseSection: (semesterPlanId: string, courseId: string, sectionId: string) => `${FirestorePaths.semesterPlanCourseSections(semesterPlanId, courseId)}/${sectionId}`,
  schedules: 'schedules',
  schedule: (scheduleId: string) => `${FirestorePaths.schedules}/${scheduleId}`,
  scheduleCourses: (scheduleId: string) => `${FirestorePaths.schedules}/${scheduleId}/courses`,
  scheduleCourse: (scheduleId: string, courseId: string) => `${FirestorePaths.scheduleCourses(scheduleId)}/${courseId}`,
};
