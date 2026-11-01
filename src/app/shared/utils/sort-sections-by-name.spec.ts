import { CourseSection } from '../interfaces/course-section';
import { sortSectionsByName } from './sort-sections-by-name';

const names = (sections: CourseSection[]) => sections.map((s) => s.name);
const section = (name: string): CourseSection => ({ name, meetings: [] });

describe('sortSectionsByName', () => {
  it('should put section numbers in order', () => {
    const sorted = sortSectionsByName([section('007'), section('001'), section('003')]);

    expect(names(sorted)).toEqual(['001', '003', '007']);
  });

  it('should compare numbers by value, not character by character', () => {
    const sorted = sortSectionsByName([section('10'), section('9')]);

    expect(names(sorted)).toEqual(['9', '10']);
  });

  it('should keep combined sections together in lab order', () => {
    const sorted = sortSectionsByName([section('003 + LEC1'), section('001 + LEC1')]);

    expect(names(sorted)).toEqual(['001 + LEC1', '003 + LEC1']);
  });

  it('should not change the list it was given', () => {
    const sections = [section('2'), section('1')];

    sortSectionsByName(sections);

    expect(names(sections)).toEqual(['2', '1']);
  });
});
