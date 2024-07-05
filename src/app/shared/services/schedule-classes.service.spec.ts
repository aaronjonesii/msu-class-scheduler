import { TestBed } from '@angular/core/testing';

import { ScheduleClassesService } from './schedule-classes.service';
import { Firestore } from "@angular/fire/firestore";

describe('ScheduleClassesService', () => {
  let service: ScheduleClassesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Firestore,
          useValue: {},
        },
      ],
    });
    service = TestBed.inject(ScheduleClassesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
