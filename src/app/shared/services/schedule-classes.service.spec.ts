import { TestBed } from '@angular/core/testing';

import { ScheduleClassesService } from './schedule-classes.service';

describe('ScheduleClassesService', () => {
  let service: ScheduleClassesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ScheduleClassesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
