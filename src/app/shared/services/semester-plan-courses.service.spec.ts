import { TestBed } from '@angular/core/testing';

import { SemesterPlanCoursesService } from './semester-plan-courses.service';

describe('SemesterPlanCoursesService', () => {
  let service: SemesterPlanCoursesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SemesterPlanCoursesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
