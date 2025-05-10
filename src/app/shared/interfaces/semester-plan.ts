import { DateTime, ReadDateTime, WriteDateTime } from "./date-time";
import { SemesterTerm } from "../enums/semester-term";
import { Course, ReadCourse, ReadCourseWithSections } from "./course";

export interface SemesterPlan {
  id?: string,
  userId?: string,
  name: string,
  description: string | null,
  year: number,
  term: SemesterTerm,
  courses?: Course[],
  created?: DateTime,
  updated?: DateTime,
}

export interface WriteSemesterPlan extends SemesterPlan {
  userId: string,
  created?: WriteDateTime,
  updated?: WriteDateTime,
}

export interface ReadSemesterPlan extends SemesterPlan {
  id: string,
  userId: string,
  created?: ReadDateTime,
  updated?: ReadDateTime,
}

export interface ReadSemesterPlanWithCourses extends ReadSemesterPlan {
  courses: ReadCourse[],
}

export interface ReadSemesterPlanWithCoursesAndSections extends ReadSemesterPlan {
  courses: ReadCourseWithSections[]
}
