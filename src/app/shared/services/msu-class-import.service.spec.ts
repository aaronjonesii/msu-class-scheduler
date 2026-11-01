import { TestBed } from '@angular/core/testing';

import { FirestoreService } from './firestore.service';
import { LoggerService } from './logger.service';
import { MsuClassImportService } from './msu-class-import.service';
import { CourseStatus } from '../enums/course-status';
import { ReadCourse } from '../interfaces/course';
import { MsuClassPage, parseMsuClassPage } from '../utils/parse-msu-class-page';
import { ECE_203_PAGE, ECE_302_PAGE, ECE_331_PAGE, IAH_221C_PAGE } from '../utils/parse-msu-class-page.fixtures';

interface Write {
  op: 'set' | 'update',
  path: string,
  data: Record<string, unknown>,
}

describe('MsuClassImportService', () => {
  let service: MsuClassImportService;
  let writes: Write[];
  let planCourses: ReadCourse[];
  let existingSectionNames: string[];
  let nextId: number;
  let logger: jasmine.SpyObj<LoggerService>;

  const PLAN_ID = 'plan';
  const COURSES_PATH = `semester-plans/${PLAN_ID}/courses`;
  const parsed = (text: string) => parseMsuClassPage(text).page as MsuClassPage;
  const importAll = (page: MsuClassPage) => service.importClass(PLAN_ID, page, page.options);
  const idFrom = (write: Write) => write.path.split('/').pop();
  const writesTo = (pattern: RegExp) => writes.filter((w) => pattern.test(w.path));
  const sectionWrites = () => writesTo(/\/sections\//);
  const courseWrites = () => writesTo(/\/courses\/[^/]+$/);
  const planWrites = () => writesTo(/^semester-plans\/plan$/);

  beforeEach(() => {
    writes = [];
    planCourses = [];
    existingSectionNames = [];
    nextId = 0;
    logger = jasmine.createSpyObj<LoggerService>('LoggerService', ['error']);

    const batch = {
      set: (ref: { path: string }, data: Record<string, unknown>) => {
        writes.push({ op: 'set', path: ref.path, data });
      },
      update: (ref: { path: string }, ...fields: unknown[]) => {
        const data = (typeof fields[0] === 'string' ?
          { [fields[0]]: fields[1] } : fields[0]) as Record<string, unknown>;
        writes.push({ op: 'update', path: ref.path, data });
      },
    };

    /** Each path only answers with its own documents, so a wrong read finds nothing. */
    const documentsAt = (path: string) => {
      if (path === COURSES_PATH) {
        return planCourses.map(({ id, ...course }) => ({ id, data: () => course }));
      }

      return planCourses.some((c) => path === `${COURSES_PATH}/${c.id}/sections`) ?
        existingSectionNames.map((name) => ({ id: name, data: () => ({ name }) })) : [];
    };

    TestBed.configureTestingModule({
      providers: [
        { provide: LoggerService, useValue: logger },
        {
          provide: FirestoreService,
          useValue: {
            timestamp: 'server-time',
            get newDocumentID() { return `id-${nextId++}`; },
            doc: (path: string) => ({ path }),
            colSnap: async (path: string) => ({ docs: documentsAt(path) }),
            batch: async (run: (b: typeof batch) => Promise<void>) => run(batch),
          },
        },
      ],
    });

    service = TestBed.inject(MsuClassImportService);
  });

  it('should create the course and all its sections when the plan does not have it', async () => {
    const result = await importAll(parsed(ECE_203_PAGE));

    expect(result).toEqual({ added: 9, skipped: 0 });
    expect(sectionWrites().length).toBe(9);
    expect(courseWrites().length).toBe(1);
    expect(courseWrites()[0].op).toBe('set');
    expect(courseWrites()[0].data).toEqual(jasmine.objectContaining({
      name: 'Circuits Lab',
      subjectCode: 'ECE',
      courseNumber: '203',
      credits: 1,
      status: CourseStatus.OPEN,
      isNotMSUCourse: null,
    }));
  });

  it('should never leave an undefined field, which Firestore rejects', async () => {
    await importAll(parsed(ECE_331_PAGE));

    expect(writes.flatMap((w) => Object.values(w.data))).not.toContain(undefined);
  });

  it('should store sections under the new course with their meetings', async () => {
    const page = parsed(ECE_331_PAGE);

    await service.importClass(PLAN_ID, page, page.options.slice(0, 1));

    const [section] = sectionWrites();

    expect(section.path).toContain(`${COURSES_PATH}/${idFrom(courseWrites()[0])}/sections/`);
    expect(section.data['name']).toBe('001 + LEC1');
    expect(section.data['status']).toBe(CourseStatus.OPEN);
    expect((section.data['meetings'] as unknown[]).length).toBe(2);
  });

  it('should only save the options it was given', async () => {
    const page = parsed(ECE_203_PAGE);

    await service.importClass(PLAN_ID, page, page.options.slice(0, 2));

    expect(sectionWrites().map((w) => w.data['name'])).toEqual(['001', '002']);
  });

  it('should set the first open section as the default so schedules can be generated', async () => {
    const page = parsed(ECE_331_PAGE);
    const waitListFirst = [page.options[7], page.options[0]];

    await service.importClass(PLAN_ID, page, waitListFirst);

    const openSection = sectionWrites().find((w) => w.data['status'] === CourseStatus.OPEN) as Write;

    expect(courseWrites()[0].data['selectedSectionId']).toBe(idFrom(openSection));
  });

  it('should make the section in the shopping cart the default', async () => {
    await importAll(parsed(IAH_221C_PAGE));

    const cartSection = sectionWrites().find((w) => w.data['name'] === '730') as Write;

    expect(courseWrites()[0].data['selectedSectionId']).toBe(idFrom(cartSection));
  });

  it('should fall back to a wait list section when none are open', async () => {
    const page = parsed(ECE_331_PAGE);

    await service.importClass(PLAN_ID, page, [page.options[7]]);

    expect(courseWrites()[0].data['status']).toBe(CourseStatus.WAITlIST);
    expect(courseWrites()[0].data['selectedSectionId']).toBe(idFrom(sectionWrites()[0]));
  });

  it('should mark a course open when its only option has an unknown status', async () => {
    const page = parsed(ECE_203_PAGE);

    await service.importClass(PLAN_ID, page, [{ ...page.options[0], status: null }]);

    expect(courseWrites()[0].data['status']).toBe(CourseStatus.OPEN);
  });

  it('should keep the status of a wait list section', async () => {
    const page = parsed(ECE_331_PAGE);

    await service.importClass(PLAN_ID, page, [page.options[7]]);

    expect(sectionWrites()[0].data['status']).toBe(CourseStatus.WAITlIST);
  });

  it('should mark the plan as updated', async () => {
    await importAll(parsed(ECE_203_PAGE));

    expect(planWrites()).toEqual([{
      op: 'update', path: `semester-plans/${PLAN_ID}`, data: { updated: 'server-time' },
    }]);
  });

  it('should give a new course a color no other course in the plan uses', async () => {
    planCourses = [{ id: 'other', subjectCode: 'MTH', courseNumber: 132, color: 'Red' } as ReadCourse];

    await importAll(parsed(ECE_203_PAGE));

    expect(courseWrites()[0].data['color']).toBe('Green');
  });

  it('should report a failed save instead of throwing', async () => {
    spyOn(TestBed.inject(FirestoreService), 'batch').and.rejectWith(new Error('permission-denied'));

    const result = await importAll(parsed(ECE_203_PAGE));

    expect(result).toBeNull();
    expect(logger.error).toHaveBeenCalled();
  });

  it('should report a failed read instead of throwing', async () => {
    spyOn(TestBed.inject(FirestoreService), 'colSnap').and.rejectWith(new Error('unavailable'));

    const result = await importAll(parsed(ECE_203_PAGE));

    expect(result).toBeNull();
    expect(logger.error).toHaveBeenCalled();
  });

  describe('matching a course in the plan', () => {
    const expectNewCourse = (existingId: string) => {
      expect(courseWrites().length).toBe(1);
      expect(courseWrites()[0].op).toBe('set');
      expect(writes.some((w) => w.path.includes(`/${existingId}`))).toBeFalse();
    };

    it('should not treat another course in the same subject as the same course', async () => {
      planCourses = [{ id: 'ece203', subjectCode: 'ECE', courseNumber: 203 } as ReadCourse];
      existingSectionNames = ['001'];

      await importAll(parsed(ECE_302_PAGE));

      expectNewCourse('ece203');
    });

    it('should not treat the same number in another subject as the same course', async () => {
      planCourses = [{ id: 'mth203', subjectCode: 'MTH', courseNumber: 203 } as ReadCourse];

      await importAll(parsed(ECE_203_PAGE));

      expectNewCourse('mth203');
    });

    it('should save the whole course number, including its letter', async () => {
      await importAll(parsed(IAH_221C_PAGE));

      expect(courseWrites()[0].data['courseNumber']).toBe('221C');
    });

    it('should not merge courses that only differ by the letter in their number', async () => {
      planCourses = [{ id: 'iah221a', subjectCode: 'IAH', courseNumber: '221A' } as ReadCourse];

      await importAll(parsed(IAH_221C_PAGE));

      expectNewCourse('iah221a');
    });

    it('should find a course with a letter in its number', async () => {
      planCourses = [{ id: 'iah221c', subjectCode: 'IAH', courseNumber: '221C' } as ReadCourse];

      await importAll(parsed(IAH_221C_PAGE));

      expect(courseWrites()[0].op).toBe('update');
      expect(courseWrites()[0].path).toContain('/iah221c');
    });

    it('should find a course saved earlier with a plain number', async () => {
      planCourses = [{ id: 'ece203', subjectCode: 'ECE', courseNumber: 203 } as ReadCourse];

      await importAll(parsed(ECE_203_PAGE));

      expect(courseWrites()[0].op).toBe('update');
    });

    it('should match a course saved with a lowercase subject code', async () => {
      planCourses = [{ id: 'ece203', subjectCode: 'ece', courseNumber: 203 } as ReadCourse];

      await importAll(parsed(ECE_203_PAGE));

      expect(courseWrites()[0].op).toBe('update');
    });
  });

  describe('when the plan already has the course', () => {
    const existing = { id: 'ece203', subjectCode: 'ECE', courseNumber: 203 } as ReadCourse;

    beforeEach(() => {
      planCourses = [existing];
    });

    it('should only add sections it does not have', async () => {
      existingSectionNames = ['001', '002'];

      const result = await importAll(parsed(ECE_203_PAGE));

      expect(result).toEqual({ added: 7, skipped: 2 });
      expect(sectionWrites().map((w) => w.data['name'])).not.toContain('001');
      expect(sectionWrites().every((w) => w.path.includes('/ece203/'))).toBeTrue();
    });

    it('should write nothing when every section is already there', async () => {
      const page = parsed(ECE_203_PAGE);
      existingSectionNames = page.options.map((o) => o.sectionName);

      const result = await importAll(page);

      expect(result).toEqual({ added: 0, skipped: 9 });
      expect(writes).toEqual([]);
    });

    it('should leave the fields of the existing course alone', async () => {
      await importAll(parsed(ECE_203_PAGE));

      expect(courseWrites()[0].op).toBe('update');
      expect(Object.keys(courseWrites()[0].data).sort()).toEqual(['selectedSectionId', 'updated']);
    });

    it('should keep a default section the user already chose', async () => {
      planCourses = [{ ...existing, selectedSectionId: 'mine' }];

      await importAll(parsed(ECE_203_PAGE));

      expect(courseWrites()[0].data).toEqual({ updated: 'server-time' });
    });
  });
});
