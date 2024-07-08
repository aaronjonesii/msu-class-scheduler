import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SchedulesListComponent } from './schedules-list.component';
import { SchedulesService } from "../../services/schedules.service";

describe('SchedulesListComponent', () => {
  let component: SchedulesListComponent;
  let fixture: ComponentFixture<SchedulesListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchedulesListComponent],
      providers: [
        {
          provide: SchedulesService,
          useValue: {},
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(SchedulesListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
