import { ScheduleCourseForm } from './schedule-course-form';
import { ReadScheduleCourse } from '../interfaces/schedule-course';

describe('ScheduleClassForm', () => {
  it('should create an instance', () => {
    expect(new ScheduleCourseForm()).toBeTruthy();
  });

  describe('course number', () => {
    it('should keep a letter, in capitals like the subject code', () => {
      const form = new ScheduleCourseForm();

      form.courseNumberCtrl.setValue('221c');

      expect(form.scheduleClass.courseNumber).toBe('221C');
    });

    it('should show a number saved by an older version of the app', () => {
      const form = new ScheduleCourseForm({ courseNumber: 203 } as ReadScheduleCourse);

      expect(form.courseNumberCtrl.value).toBe('203');
    });

    it('should stay empty when there is no number', () => {
      expect(new ScheduleCourseForm().scheduleClass.courseNumber).toBeNull();
    });
  });
});
