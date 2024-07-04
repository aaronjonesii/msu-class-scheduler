import { TestBed } from '@angular/core/testing';

import { SchedulesService } from './schedules.service';
import { Firestore } from "@angular/fire/firestore";

describe('SchedulesService', () => {
  let service: SchedulesService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        {
          provide: Firestore,
          useValue: {},
        },
      ],
    });
    service = TestBed.inject(SchedulesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
