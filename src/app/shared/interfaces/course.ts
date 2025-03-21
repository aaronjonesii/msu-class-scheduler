import { DateTime } from "./date-time";
import { FieldValue, Timestamp } from "@angular/fire/firestore";
import { Color } from "../enums/color";
import { CourseStatus } from "../enums/course-status";
import { CourseSection, ReadCourseSection } from "./course-section";
import { SemesterTerm } from "../enums/semester-term";

export interface Course {
  name: string,
  status: CourseStatus,
  sections: CourseSection[],
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
  sections: ReadCourseSection[],
  startDate?: Timestamp | null,
  endDate?: Timestamp | null,
  created?: Timestamp | null,
  updated?: Timestamp | null,
}

export interface WriteCourse extends Course {
  startDate?: FieldValue | null,
  endDate?: FieldValue | null,
  created?: FieldValue | null,
  updated?: FieldValue | null,
}
