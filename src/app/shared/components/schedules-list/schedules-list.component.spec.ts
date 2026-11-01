import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';

import { SchedulesListComponent } from './schedules-list.component';
import { ReadScheduleWithCourses } from "../../interfaces/schedule";
import { SchedulesService } from "../../services/schedules.service";

describe('SchedulesListComponent', () => {
  let component: SchedulesListComponent;
  let fixture: ComponentFixture<SchedulesListComponent>;

  const list = () => fixture.nativeElement as HTMLElement;
  const credits = () => Array.from(list().querySelectorAll('mat-card span'))
    .find((span) => /\d credits?$/.test(span.textContent?.trim() ?? '')) as HTMLElement;

  async function render(schedule: Partial<ReadScheduleWithCourses>, width?: string) {
    if (width) list().style.width = width;
    fixture.componentRef.setInput('schedules', [{ id: 'schedule', courses: [], ...schedule }]);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
  }

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SchedulesListComponent],
      providers: [
        provideRouter([]),
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

  it('should add up the credits of the courses', async () => {
    await render({ courses: [{ credits: 4 }, { credits: 3 }] as ReadScheduleWithCourses['courses'] });

    expect(credits().textContent?.trim()).toBe('7 credits');
  });

  it('should say credit for one', async () => {
    await render({ courses: [{ credits: 1 }] as ReadScheduleWithCourses['courses'] });

    expect(credits().textContent?.trim()).toBe('1 credit');
  });

  it('should never put the credits on top of a long name', async () => {
    await render({ name: 'A schedule with quite a long name for one line' }, '311px');

    const title = (list().querySelector('mat-card-title') as HTMLElement).getBoundingClientRect();

    expect(title.right).toBeLessThanOrEqual(credits().getBoundingClientRect().left);
  });
});
