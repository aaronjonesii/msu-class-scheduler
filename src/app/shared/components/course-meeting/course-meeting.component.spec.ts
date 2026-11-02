import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseMeetingComponent } from './course-meeting.component';
import { CourseMeetingType } from '../../enums/course-meeting-type';
import { Day } from '../../enums/day';
import { CourseMeeting } from '../../interfaces/course-meeting';

describe('CourseMeetingComponent', () => {
  let fixture: ComponentFixture<CourseMeetingComponent>;

  const THURSDAY_MORNING = { days: [Day.THURSDAY], startTime: '08:00', endTime: '10:50' };

  function render(meeting: Partial<CourseMeeting>, width?: string) {
    fixture = TestBed.createComponent(CourseMeetingComponent);
    if (width) element().style.width = width;
    fixture.componentRef.setInput('meeting', {
      type: CourseMeetingType.LABORATORY, location: null, instructor: null, meetingTimes: [], ...meeting,
    });
    fixture.detectChanges();
  }

  const element = () => fixture.nativeElement as HTMLElement;
  const text = () => element().textContent?.replace(/\s+/g, ' ').trim();
  const textOf = (selector: string) => element().querySelector(selector)?.textContent?.replace(/\s+/g, ' ').trim();

  beforeEach(async () => {
    await TestBed.configureTestingModule({ imports: [CourseMeetingComponent] }).compileComponents();
  });

  it('should show the days and the time', () => {
    render({ meetingTimes: [{ days: [Day.MONDAY, Day.FRIDAY], startTime: '13:50', endTime: '14:40' }] });

    expect(textOf('.days')).toBe('Mon Fri');
    expect(textOf('.times')).toContain('1:50 PM - 2:40 PM');
  });

  describe('a class that meets every weekday', () => {
    const EVERY_WEEKDAY = [Day.MONDAY, Day.TUESDAY, Day.WEDNESDAY, Day.THURSDAY, Day.FRIDAY];

    function heightOfTimes(days: Day[], width: string) {
      render({ meetingTimes: [{ days, startTime: '10:20', endTime: '11:40' }] }, width);

      return (element().querySelector('.times') as HTMLElement).getBoundingClientRect().height;
    }

    it('should stay on one line in a wide row', () => {
      expect(heightOfTimes(EVERY_WEEKDAY, '40rem')).toBe(heightOfTimes([Day.MONDAY], '40rem'));
    });

    it('should stay on one line on a phone', () => {
      expect(heightOfTimes(EVERY_WEEKDAY, '19.5rem')).toBe(heightOfTimes([Day.MONDAY], '19.5rem'));
    });
  });

  it('should show each meeting time', () => {
    render({ meetingTimes: [THURSDAY_MORNING, { days: [Day.FRIDAY], startTime: '15:00', endTime: '15:50' }] });

    expect(textOf('.times')).toContain('Thu');
    expect(textOf('.times')).toContain('8:00 AM - 10:50 AM');
    expect(textOf('.times')).toContain('Fri');
    expect(textOf('.times')).toContain('3:00 PM - 3:50 PM');
  });

  it('should show the type, room and instructor', () => {
    render({ meetingTimes: [THURSDAY_MORNING], location: 'Engineering Building 3225', instructor: 'Matthew Meier' });

    expect(textOf('.type')).toBe('Laboratory');
    expect(textOf('.place')).toContain('Engineering Building 3225');
    expect(textOf('.place')).toContain('Matthew Meier');
  });

  it('should show an online location once, in place of the time', () => {
    render({ location: 'Online Asynchronous' });

    expect(textOf('.times')).toBe('Online Asynchronous');
    expect(text()?.match(/Online Asynchronous/g)?.length).toBe(1);
  });

  it('should keep an online location on a meeting that has a time', () => {
    render({ meetingTimes: [THURSDAY_MORNING], location: 'Online Synchronous' });

    expect(textOf('.place')).toContain('Online Synchronous');
  });

  it('should say to be announced and keep the room when a meeting has no time', () => {
    render({ location: 'Wells Hall A1' });

    expect(textOf('.times')).toBe('To be announced');
    expect(textOf('.place')).toContain('Wells Hall A1');
  });

  it('should leave out an instructor that is not known', () => {
    render({ meetingTimes: [THURSDAY_MORNING], location: 'Wells Hall A1' });

    expect(element().querySelectorAll('.place span').length).toBe(1);
  });
});
