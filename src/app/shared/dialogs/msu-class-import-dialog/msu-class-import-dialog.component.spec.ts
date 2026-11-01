import { ComponentFixture, TestBed } from '@angular/core/testing';
import { MAT_DIALOG_DATA, MatDialogRef } from '@angular/material/dialog';
import { provideNoopAnimations } from '@angular/platform-browser/animations';
import { SemesterTerm } from '../../enums/semester-term';
import {
  classRow, ECE_203_PAGE, ECE_302_PAGE, ECE_331_PAGE, IAH_221C_PAGE, pageWithRows,
} from '../../utils/parse-msu-class-page.fixtures';
import {
  MsuClassImportDialogComponent,
  MsuClassImportDialogContract,
  MsuClassImportDialogResult,
} from './msu-class-import-dialog.component';

const SPRING_2027: MsuClassImportDialogContract = { term: SemesterTerm.SPRING, year: 2027 };

describe('MsuClassImportDialogComponent', () => {
  let fixture: ComponentFixture<MsuClassImportDialogComponent>;
  let dialogRef: jasmine.SpyObj<MatDialogRef<MsuClassImportDialogComponent>>;

  const element = () => fixture.nativeElement as HTMLElement;
  const dialogText = () => element().textContent;
  const checkboxes = () => Array.from(element().querySelectorAll<HTMLInputElement>('input[type="checkbox"]'));
  const checkedCount = () => checkboxes().filter((box) => box.checked).length;
  const statusLabels = () => Array.from(element().querySelectorAll('.status')).map((s) => s.textContent);
  const importButton = () => element().querySelector('button[mat-flat-button]') as HTMLButtonElement;

  function setUp(contract = SPRING_2027) {
    dialogRef = jasmine.createSpyObj('MatDialogRef', ['close']);

    TestBed.configureTestingModule({
      imports: [MsuClassImportDialogComponent],
      providers: [
        provideNoopAnimations(),
        { provide: MatDialogRef, useValue: dialogRef },
        { provide: MAT_DIALOG_DATA, useValue: contract },
      ],
    });

    fixture = TestBed.createComponent(MsuClassImportDialogComponent);
    fixture.detectChanges();
  }

  function paste(text: string) {
    const box = element().querySelector('textarea') as HTMLTextAreaElement;

    box.value = text;
    box.dispatchEvent(new Event('input', { bubbles: true }));
    fixture.detectChanges();
  }

  function clickCheckbox(index: number) {
    checkboxes()[index].click();
    fixture.detectChanges();
  }

  function importedResult(): MsuClassImportDialogResult {
    importButton().click();

    return dialogRef.close.calls.mostRecent().args[0] as MsuClassImportDialogResult;
  }

  it('should wait for a paste before allowing an import', () => {
    setUp();

    expect(checkboxes().length).toBe(0);
    expect(importButton().disabled).toBeTrue();
  });

  it('should show the course from the page', () => {
    setUp();
    paste(ECE_203_PAGE);

    expect(dialogText()).toContain('ECE 203 - Circuits Lab');
  });

  it('should check every open option and say how many will be imported', () => {
    setUp();
    paste(ECE_203_PAGE);

    expect(checkedCount()).toBe(9);
    expect(importButton().textContent).toContain('Import 9 sections');
    expect(importButton().disabled).toBeFalse();
  });

  it('should say "section" for a single option', () => {
    setUp();
    paste(ECE_302_PAGE);

    expect(importButton().textContent).toContain('Import 1 section');
    expect(importButton().textContent).not.toContain('sections');
  });

  it('should leave a wait list option unchecked and label it', () => {
    setUp();
    paste(ECE_331_PAGE);

    expect(checkedCount()).toBe(7);
    expect(checkboxes()[7].checked).toBeFalse();
    expect(statusLabels()).toEqual(['Waitlist']);
  });

  describe('a page with online sections and the shopping cart', () => {
    const options = () => Array.from(element().querySelectorAll('.section'));

    it('should check the online sections along with the others', () => {
      setUp();
      paste(IAH_221C_PAGE);

      expect(checkedCount()).toBe(5);
      expect(statusLabels()).toEqual([]);
    });

    it('should mark only the option in the shopping cart', () => {
      setUp();
      paste(IAH_221C_PAGE);

      expect(options().map((o) => o.querySelector('.in-cart')?.textContent ?? null))
        .toEqual([null, null, null, 'In shopping cart', null]);
    });

    it('should describe an online section by where it meets', () => {
      setUp();
      paste(IAH_221C_PAGE);

      expect(options()[3].textContent).toContain('Lecture: (Online Asynchronous)');
      expect(options()[3].textContent).toContain('William Johnsen');
    });
  });

  it('should not label open options', () => {
    setUp();
    paste(ECE_203_PAGE);

    expect(statusLabels()).toEqual([]);
  });

  it('should label an option whose status could not be read', () => {
    setUp();
    paste(pageWithRows([classRow({ status: 'Reserved' })]));

    expect(checkedCount()).toBe(0);
    expect(statusLabels()).toEqual(['Unknown status']);
  });

  it('should leave a row that needs review unchecked and show why', () => {
    setUp();
    paste(pageWithRows([classRow({ instructors: ['Ann Lee', 'Bo Park'] })]));

    expect(checkedCount()).toBe(0);
    expect(importButton().disabled).toBeTrue();
    expect(dialogText()).toContain('check it on MSU');
  });

  it('should show a warning about the page itself', () => {
    setUp();
    paste(pageWithRows([classRow()], 'ABC 100', 'No units here'));

    expect(dialogText()).toContain('Credits were not on the page');
  });

  it('should show why a paste could not be read', () => {
    setUp();
    paste('not a class page');

    expect(dialogText()).toContain('does not look like an MSU class page');
    expect(importButton().disabled).toBeTrue();
  });

  it('should clear the preview when the box is emptied', () => {
    setUp();
    paste(ECE_203_PAGE);
    paste('');

    expect(checkboxes().length).toBe(0);
    expect(dialogText()).not.toContain('Circuits Lab');
  });

  describe('term warning', () => {
    const warningFor = 'This page is for Spring 2027, but this plan is';

    it('should warn when the term differs', () => {
      setUp({ term: SemesterTerm.FALL, year: 2027 });
      paste(ECE_203_PAGE);

      expect(dialogText()).toContain(`${warningFor} Fall 2027.`);
    });

    it('should warn when only the year differs', () => {
      setUp({ term: SemesterTerm.SPRING, year: 2026 });
      paste(ECE_203_PAGE);

      expect(dialogText()).toContain(`${warningFor} Spring 2026.`);
    });

    it('should not warn when the term and year match', () => {
      setUp();
      paste(ECE_203_PAGE);

      expect(dialogText()).not.toContain('but this plan is');
    });
  });

  it('should show the room and instructor of each part without repeating them', () => {
    setUp();
    paste(ECE_331_PAGE);

    expect(dialogText()).toContain('Engineering Building 3230 · Matthew Meier · Wonders Hall C213');
  });

  describe('importing', () => {
    it('should close with the page and the checked options', () => {
      setUp();
      paste(ECE_331_PAGE);

      const { page, options } = importedResult();

      expect(page.courseCode).toBe('ECE 331');
      expect(options.length).toBe(7);
      expect(options.map((o) => o.sectionName)).not.toContain('002 + LEC1');
    });

    it('should include an option the user checked', () => {
      setUp();
      paste(ECE_331_PAGE);

      clickCheckbox(7);

      expect(importedResult().options.map((o) => o.sectionName)).toContain('002 + LEC1');
    });

    it('should leave out an option the user unchecked', () => {
      setUp();
      paste(ECE_331_PAGE);

      clickCheckbox(0);

      expect(importedResult().options.map((o) => o.sectionName)).not.toContain('001 + LEC1');
    });
  });
});
