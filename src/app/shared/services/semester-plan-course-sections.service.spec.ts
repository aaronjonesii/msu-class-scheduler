import { TestBed } from '@angular/core/testing';

import { SemesterPlanCourseSectionsService } from './semester-plan-course-sections.service';

describe('SemesterPlanCourseSectionsService', () => {
  let service: SemesterPlanCourseSectionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SemesterPlanCourseSectionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
