import { TestBed } from '@angular/core/testing';

import { SemesterPlansService } from './semester-plans.service';

describe('SemesterPlansService', () => {
  let service: SemesterPlansService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SemesterPlansService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
