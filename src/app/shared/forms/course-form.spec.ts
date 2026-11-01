import { CourseForm } from './course-form';
import { ReadCourse } from '../interfaces/course';

describe('CourseForm', () => {
  it('should create an instance', () => {
    expect(new CourseForm()).toBeTruthy();
  });

  describe('course number', () => {
    it('should keep a letter, in capitals like the subject code', () => {
      const form = new CourseForm();

      form.courseNumberCtrl.setValue('221c');

      expect(form.course.courseNumber).toBe('221C');
    });

    it('should show a number saved by an older version of the app', () => {
      const form = new CourseForm({ courseNumber: 203 } as ReadCourse);

      expect(form.courseNumberCtrl.value).toBe('203');
    });

    it('should stay empty when there is no number', () => {
      expect(new CourseForm().course.courseNumber).toBeNull();
    });
  });
});
