import { CourseSection } from '../interfaces/course-section';

export function sortSectionsByName<T extends CourseSection>(sections: T[]): T[] {
  return [...sections].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
}
