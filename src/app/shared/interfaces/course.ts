import { DateTime, ReadDateTime, WriteDateTime } from "./date-time";
import { Color } from "../enums/color";
import { CourseStatus } from "../enums/course-status";
import { CourseSection, ReadCourseSection } from "./course-section";
import { SemesterTerm } from "../enums/semester-term";

export interface Course {
  name: string,
  status: CourseStatus,
  sections?: CourseSection[],
  id?: string | null,
  subjectCode?: string | null,
  courseNumber?: number | null,
  description?: string | null,
  term?: SemesterTerm | null,
  credits?: number | null,
  startDate?: DateTime | null,
  endDate?: DateTime | null,
  notes?: string | null,
  created?: DateTime | null,
  updated?: DateTime | null,
  color?: Color | null,
  isNotMSUCourse: boolean | null,
  selectedSectionId?: string | null,
}

export interface ReadCourse extends Course {
  id: string,
  sections?: ReadCourseSection[],
  startDate?: ReadDateTime | null,
  endDate?: ReadDateTime | null,
  created?: ReadDateTime | null,
  updated?: ReadDateTime | null,
}

export interface WriteCourse extends Course {
  startDate?: WriteDateTime | null,
  endDate?: WriteDateTime | null,
  created?: WriteDateTime | null,
  updated?: WriteDateTime | null,
}

export interface ReadCourseWithSections extends ReadCourse {
  sections: ReadCourseSection[],
}

export interface ReadCourseWithSelectedSection extends ReadCourseWithSections {
  selectedSectionId: string,
}

export type CoursesCombination = ReadCourseWithSelectedSection[];
