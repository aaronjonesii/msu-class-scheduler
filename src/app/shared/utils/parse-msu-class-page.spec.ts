import { CourseMeetingType } from '../enums/course-meeting-type';
import { CourseStatus } from '../enums/course-status';
import { Day } from '../enums/day';
import { SemesterTerm } from '../enums/semester-term';
import { MsuClassOption, MsuClassPage, parseMsuClassPage } from './parse-msu-class-page';
import {
  classRow, ECE_203_PAGE, ECE_302_PAGE, ECE_331_PAGE, pageWithRows,
} from './parse-msu-class-page.fixtures';

function parsed(text: string): MsuClassPage {
  const { page, error } = parseMsuClassPage(text);

  if (!page) throw new Error(`Expected a page but got: ${error}`);

  return page;
}

const optionFrom = (row: string): MsuClassOption => parsed(pageWithRows([row])).options[0];

describe('parseMsuClassPage', () => {
  describe('ECE 203 (one lab per option)', () => {
    const page = parsed(ECE_203_PAGE);

    it('should read the course details', () => {
      expect(page.courseCode).toBe('ECE 203');
      expect(page.subjectCode).toBe('ECE');
      expect(page.courseNumber).toBe(203);
      expect(page.name).toBe('Circuits Lab');
      expect(page.credits).toBe(1);
      expect(page.description).toContain('Electrical test equipment');
      expect(page.warnings).toEqual([]);
    });

    it('should read the term from the page', () => {
      expect(page.term).toBe(SemesterTerm.SPRING);
      expect(page.year).toBe(2027);
    });

    it('should read every option with its section, day and 24-hour times', () => {
      const summary = page.options.map((o) => {
        const { days, startTime, endTime } = o.meetings[0].meetingTimes[0];

        return `${o.sectionName} ${days.join('/')} ${startTime}-${endTime}`;
      });

      expect(summary).toEqual([
        '001 Thursday 08:00-10:50',
        '002 Thursday 11:30-14:20',
        '003 Thursday 15:00-17:50',
        '004 Thursday 19:00-21:50',
        '005 Wednesday 19:00-21:50',
        '006 Monday 19:00-21:50',
        '007 Monday 15:00-17:50',
        '008 Friday 15:00-17:50',
        '009 Monday 11:30-14:20',
      ]);
    });

    it('should read the room, type and seats, and leave an unannounced instructor empty', () => {
      const [option] = page.options;

      expect(option.status).toBe(CourseStatus.OPEN);
      expect(option.seats).toEqual(['Open Seats 4 of 15']);
      expect(option.meetings.length).toBe(1);
      expect(option.meetings[0].type).toBe(CourseMeetingType.LABORATORY);
      expect(option.meetings[0].location).toBe('Engineering Building 3225');
      expect(option.meetings[0].instructor).toBeNull();
    });

    it('should not flag any option', () => {
      expect(page.options.every((o) => o.warnings.length === 0 && !o.needsReview)).toBeTrue();
    });
  });

  describe('ECE 302 (one lecture, several days)', () => {
    const page = parsed(ECE_302_PAGE);

    it('should read the course details', () => {
      expect(page.courseNumber).toBe(302);
      expect(page.name).toBe('Electronic Circuits');
      expect(page.credits).toBe(3);
    });

    it('should not use the archive link as a description', () => {
      expect(page.description).toBeNull();
    });

    it('should read a truncated section line and all the days', () => {
      expect(page.options.length).toBe(1);

      const [option] = page.options;
      expect(option.sectionName).toBe('001');
      expect(option.warnings).toEqual([]);
      expect(option.meetings).toEqual([{
        type: CourseMeetingType.LECTURE,
        location: 'South Kedzie S105',
        instructor: 'Sergey Baryshev',
        meetingTimes: [{
          days: [Day.MONDAY, Day.WEDNESDAY, Day.FRIDAY],
          startTime: '09:10',
          endTime: '10:00',
        }],
      }]);
    });
  });

  describe('ECE 331 (a lab plus a lecture in each option)', () => {
    const page = parsed(ECE_331_PAGE);

    it('should read the course details', () => {
      expect(page.courseNumber).toBe(331);
      expect(page.name).toBe('Microprocessors & Digital Sys');
      expect(page.credits).toBe(4);
      expect(page.options.length).toBe(8);
    });

    it('should name each option after both of its sections', () => {
      expect(page.options.map((o) => o.sectionName)).toEqual([
        '001 + LEC1', '003 + LEC1', '004 + LEC1', '005 + LEC1',
        '006 + LEC1', '007 + LEC1', '008 + LEC1', '002 + LEC1',
      ]);
    });

    it('should pair each meeting with its own time, room and instructor', () => {
      expect(page.options[0].meetings).toEqual([
        {
          type: CourseMeetingType.LABORATORY,
          location: 'Engineering Building 3230',
          instructor: 'Matthew Meier',
          meetingTimes: [{ days: [Day.TUESDAY], startTime: '11:30', endTime: '14:20' }],
        },
        {
          type: CourseMeetingType.LECTURE,
          location: 'Wonders Hall C213',
          instructor: 'Matthew Meier',
          meetingTimes: [{
            days: [Day.MONDAY, Day.WEDNESDAY, Day.FRIDAY],
            startTime: '13:50',
            endTime: '14:40',
          }],
        },
      ]);
    });

    it('should mark the wait list option and keep the seats of both parts', () => {
      const waitList = page.options[7];

      expect(waitList.status).toBe(CourseStatus.WAITlIST);
      expect(waitList.seats).toEqual([
        'Waitlist Available Places 9999 of 9999',
        'Open Seats 74 of 104',
      ]);
    });

    it('should not flag any option', () => {
      expect(page.options.every((o) => o.warnings.length === 0 && !o.needsReview)).toBeTrue();
    });
  });

  describe('pages it cannot read', () => {
    it('should reject unrelated text', () => {
      const { page, error } = parseMsuClassPage('Grocery list\nmilk\neggs');

      expect(page).toBeNull();
      expect(error).toContain('does not look like an MSU class page');
    });

    it('should refuse two pages pasted together, rather than mixing their sections', () => {
      const { page, error } = parseMsuClassPage(ECE_203_PAGE + ECE_302_PAGE);

      expect(page).toBeNull();
      expect(error).toContain('paste one class page');
    });

    it('should ask for the class table when there are no options', () => {
      const { page, error } = parseMsuClassPage('Spring 2027\nECE 203\nCircuits Lab\nUnits1.00');

      expect(page).toBeNull();
      expect(error).toContain('Class Selection');
    });
  });

  describe('details the real pages do not show', () => {
    it('should convert noon and midnight', () => {
      const noon = optionFrom(classRow({ times: ['Tuesday', '12:00PM to 12:50PM'] }));
      const midnight = optionFrom(classRow({ times: ['Tuesday', '12:30AM to 1:20AM'] }));

      expect(noon.meetings[0].meetingTimes[0].startTime).toBe('12:00');
      expect(noon.meetings[0].meetingTimes[0].endTime).toBe('12:50');
      expect(midnight.meetings[0].meetingTimes[0].startTime).toBe('00:30');
    });

    it('should read a closed class', () => {
      expect(optionFrom(classRow({ status: 'Closed' })).status).toBe(CourseStatus.CLOSED);
    });

    it('should not guess an unknown status', () => {
      expect(optionFrom(classRow({ status: 'Reserved' })).status).toBeNull();
    });

    it('should warn that a letter in the course number cannot be saved', () => {
      const page = parsed(pageWithRows([classRow()], 'MTH 152H'));

      expect(page.courseCode).toBe('MTH 152H');
      expect(page.courseNumber).toBe(152);
      expect(page.warnings.join()).toContain('MTH 152H is saved as MTH 152');
    });

    it('should warn that a leading zero in the course number cannot be saved', () => {
      const page = parsed(pageWithRows([classRow()], 'ENG 090'));

      expect(page.courseNumber).toBe(90);
      expect(page.warnings.join()).toContain('ENG 090 is saved as ENG 90');
    });

    it('should not warn about an ordinary course number', () => {
      expect(parsed(pageWithRows([classRow()], 'ENG 190')).warnings).toEqual([]);
    });

    it('should warn when credits are missing', () => {
      const page = parsed(pageWithRows([classRow()], 'ABC 100', 'No units here'));

      expect(page.credits).toBe(0);
      expect(page.warnings.join()).toContain('Credits were not on the page');
    });

    it('should save a meeting type the app does not have as Lecture, with a warning', () => {
      const option = optionFrom(classRow({ components: ['Class Comp Seminar - Class Sect 001 -'] }));

      expect(option.meetings[0].type).toBe(CourseMeetingType.LECTURE);
      expect(option.warnings.join()).toContain('"Seminar" is not a meeting type');
    });

    it('should name an option by number when the 40-character limit cut off its section', () => {
      const option = optionFrom(classRow({
        optionNumber: 3,
        components: ['Class Comp Independent Study - Class Sec'],
      }));

      expect(option.sectionName).toBe('Option 3');
    });

    it('should not trust a section number the 40-character limit cut in half', () => {
      const option = optionFrom(classRow({
        components: ['Class Comp Field Studies - Class Sect 00'],
      }));

      expect(option.sectionName).toBe('Option 1');
    });

    it('should keep a full section number that only lost the text after it', () => {
      const option = optionFrom(classRow({
        components: ['Class Comp Recitation - Class Sect REC1 '],
      }));

      expect(option.sectionName).toBe('REC1');
    });

    it('should not start a new row at a room that is only a number', () => {
      const page = parsed(pageWithRows([
        classRow({ rooms: ['1234'] }),
        classRow({ optionNumber: 2, components: ['Class Comp Lecture - Class Sect 002 -'] }),
      ]));

      expect(page.options.map((o) => o.sectionName)).toEqual(['001', '002']);
      expect(page.options[0].meetings[0].location).toBe('1234');
    });
  });

  describe('rows that do not line up', () => {
    const lab = 'Class Comp Laboratory - Class Sect 001 -';
    const lecture = 'Class Comp Lecture - Class Sect LEC1 - C';
    const threeTimes = [
      'Monday', '9:10AM to 10:00AM',
      'Wednesday', '1:00PM to 2:50PM',
      'Friday', '3:00PM to 3:50PM',
    ];

    function expectFlagged(option: MsuClassOption) {
      expect(option.needsReview).toBeTrue();
      expect(option.warnings.join()).toContain('check it on MSU');
      expect(option.seats).toEqual([]);
    }

    it('should flag more times than parts, keeping every time', () => {
      const option = optionFrom(classRow({ components: [lab, lecture], times: threeTimes }));

      expectFlagged(option);
      expect(option.meetings.flatMap((m) => m.meetingTimes).length).toBe(3);
      expect(option.meetings.every((m) => m.location === null && m.instructor === null)).toBeTrue();
    });

    it('should flag a wrong number of times even when the other columns line up', () => {
      const option = optionFrom(classRow({
        components: [lab, lecture],
        times: threeTimes,
        rooms: ['Wells Hall A1', 'Wells Hall A2'],
        instructors: ['Ann Lee', 'Bo Park'],
        seats: ['Open Seats 1 of 9', 'Open Seats 2 of 9'],
      }));

      expectFlagged(option);
    });

    it('should flag a part with no meeting time', () => {
      const option = optionFrom(classRow({ times: ['To be Announced'] }));

      expectFlagged(option);
      expect(option.meetings[0].meetingTimes).toEqual([]);
    });

    it('should flag extra lines in the room, instructor or seats columns', () => {
      const option = optionFrom(classRow({ instructors: ['Ann Lee', 'Bo Park'] }));

      expectFlagged(option);
      expect(option.meetings[0].meetingTimes.length).toBe(1);
    });
  });
});
