import {
  ChangeDetectionStrategy,
  Component, computed, effect,
  inject, OnInit,
  signal
} from '@angular/core';
import { ReadSchedule } from "../../interfaces/schedule";
import {
  MAT_DIALOG_DATA, MatDialogActions, MatDialogClose,
  MatDialogContent,
  MatDialogTitle
} from "@angular/material/dialog";
import { MatButton, MatIconButton } from "@angular/material/button";
import { ScheduleForm } from "../../forms/schedule-form";
import {
  ScheduleFormComponent
} from "../../components/schedule-form/schedule-form.component";
import { CoursesCombination, ReadCourseWithSections } from "../../interfaces/course";
import {
  ScheduleGridViewComponent
} from "../../components/schedule-grid-view/schedule-grid-view.component";
import { MatIcon } from "@angular/material/icon";
import { scrollToElementId } from "../../utils/scroll-to-element";
import { ScheduleGeneratorService } from "../../services/schedule-generator.service";
import { ReadScheduleCourse } from "../../interfaces/schedule-course";
import { NgTemplateOutlet } from "@angular/common";
import { SectionPickerComponent } from "../../components/section-picker/section-picker.component";

export interface ScheduleFormDialogContract {
  schedule?: ReadSchedule,
  userId: string,
  courses?: ReadCourseWithSections[]
}

@Component({
  selector: 'csb-schedule-form-dialog',
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatButton,
    MatDialogClose,
    ScheduleFormComponent,
    ScheduleGridViewComponent,
    MatIconButton,
    MatIcon,
    NgTemplateOutlet,
    SectionPickerComponent
  ],
  templateUrl: './schedule-form-dialog.component.html',
  styleUrl: './schedule-form-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleFormDialogComponent implements OnInit {
  private scheduleGeneratorService = inject(ScheduleGeneratorService);
  private contract = inject<ScheduleFormDialogContract>(MAT_DIALOG_DATA);

  protected readonly scrollToElementId = scrollToElementId;

  scheduleForm = signal(new ScheduleForm());

  /** The plan's courses when generating. Creating or editing by hand has none. */
  courses = this.contract?.courses ?? [];

  pickedSectionIds = signal<ReadonlySet<string>>(
    new Set(this.courses.flatMap((course) => course.sections.map((section) => section.id))),
  );

  combinations = computed(() => {
    return this.scheduleGeneratorService.fittingCombinations(this.courses, this.pickedSectionIds());
  });

  noScheduleFits = computed(() => this.courses.length > 0 && this.combinations().length === 0);

  editing = signal(false);

  selectedCombinationIndex = signal(0);

  selectedCombination = computed(() => this.combinations()[this.selectedCombinationIndex()] ?? [], {
    // A pick rebuilds the list, but the same sections on screen are still the same schedule.
    equal: (a, b) => {
      return a.length === b.length && a.every((course, index) => course.selectedSectionId === b[index].selectedSectionId);
    },
  });

  selectedCombinationScheduleCourses = computed<ReadScheduleCourse[]>(() => {
    return this.selectedCombination().map(c => this.scheduleGeneratorService.courseToScheduleCourse(c) as ReadScheduleCourse);
  });

  scheduleCoursesEffect = effect(() => {
    const courseIds = this.selectedCombinationScheduleCourses()?.map((c) => c.id);

    return this.shownCourses.set(courseIds || []);
  }, { allowSignalWrites: true });

  shownCourses = signal<string[]>([]);

  ngOnInit() {
    if (!this.contract) return;

    if (this.contract.userId) {
      this.scheduleForm().userId = this.contract.userId;
    }

    if (!this.contract.schedule) return;

    this.editing.set(true);

    this.scheduleForm.set(new ScheduleForm(this.contract.schedule));
  }

  /** The schedule to save, with the courses of the combination on screen. */
  scheduleToSave(): ReadSchedule {
    return { ...this.scheduleForm().schedule, courses: this.selectedCombinationScheduleCourses() };
  }

  /** Numbers change with the picks, so this stays as close to the schedule on screen as it can. */
  onPicksChange(pickedSectionIds: ReadonlySet<string>) {
    const onScreen = this.selectedCombination().map((course) => course.selectedSectionId);
    const sectionsKept = (combination: CoursesCombination) => {
      return combination.filter((course) => onScreen.includes(course.selectedSectionId)).length;
    };

    this.pickedSectionIds.set(pickedSectionIds);

    this.selectedCombinationIndex.set(this.combinations().reduce((closest, combination, index, combinations) => {
      return sectionsKept(combination) > sectionsKept(combinations[closest]) ? index : closest;
    }, 0));
  }

  previousCombination() {
    this.goToCombination(this.selectedCombinationIndex() - 1);
  }

  nextCombination() {
    this.goToCombination(this.selectedCombinationIndex() + 1);
  }

  goToTypedNumber(numberBox: HTMLInputElement) {
    const typedNumber = Math.trunc(numberBox.valueAsNumber);

    if (!Number.isNaN(typedNumber)) this.goToCombination(typedNumber - 1);

    // The binding can't correct the box when the schedule stays the same, like 99 on the last one.
    numberBox.value = `${this.selectedCombinationIndex() + 1}`;
  }

  private goToCombination(index: number) {
    this.selectedCombinationIndex.set(Math.min(Math.max(index, 0), this.combinations().length - 1));
  }
}
