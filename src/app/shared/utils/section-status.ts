import { ReadCourse } from "../interfaces/course";
import { ReadCourseSection } from "../interfaces/course-section";

/** A section made by hand has no status of its own, so it goes by its course. */
export function sectionStatus(section: ReadCourseSection | undefined, course: ReadCourse) {
  return section?.status ?? course.status;
}
