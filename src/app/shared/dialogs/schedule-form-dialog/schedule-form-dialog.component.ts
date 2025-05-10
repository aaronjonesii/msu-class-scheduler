import {
  ChangeDetectionStrategy,
  Component, computed, effect,
  inject, input, model, OnInit,
  signal
} from '@angular/core';
import { ReadSchedule } from "../../interfaces/schedule";
import {
  MAT_DIALOG_DATA, MatDialogActions, MatDialogClose,
  MatDialogContent, MatDialogRef,
  MatDialogTitle
} from "@angular/material/dialog";
import { MatButton, MatIconButton } from "@angular/material/button";
import { ScheduleForm } from "../../forms/schedule-form";
import {
  ScheduleFormComponent
} from "../../components/schedule-form/schedule-form.component";
import { CoursesCombination, ReadCourseWithSelectedSection } from "../../interfaces/course";
import {
  ScheduleGridViewComponent
} from "../../components/schedule-grid-view/schedule-grid-view.component";
import { MatIcon } from "@angular/material/icon";
import { scrollToElementId } from "../../utils/scroll-to-element";
import { ScheduleGeneratorService } from "../../services/schedule-generator.service";
import { ReadScheduleCourse } from "../../interfaces/schedule-course";
import { NgTemplateOutlet } from "@angular/common";

export interface ScheduleFormDialogContract {
  schedule?: ReadSchedule,
  userId: string,
  combinations?: ReadCourseWithSelectedSection[][]
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
    NgTemplateOutlet
  ],
  templateUrl: './schedule-form-dialog.component.html',
  styleUrl: './schedule-form-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScheduleFormDialogComponent implements OnInit {
  private scheduleGeneratorService = inject(ScheduleGeneratorService);
  private contract = inject<ScheduleFormDialogContract>(MAT_DIALOG_DATA);
  private dialogRef = inject(MatDialogRef<ScheduleFormDialogComponent>);

  protected readonly scrollToElementId = scrollToElementId;

  scheduleForm = signal(new ScheduleForm());

  combinations = signal<CoursesCombination[]>([]);

  editing = signal(false);

  selectedCombinationIndex = signal<number | null>(null);

  selectedCombination = computed(() => {
    const selectedCombinationIndex = this.selectedCombinationIndex();
    return selectedCombinationIndex !== null ? this.combinations()[selectedCombinationIndex] : [];
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

    if (this.contract.combinations?.length) {
      this.combinations.set(this.contract.combinations);
      this.selectedCombinationIndex.set(0);

      // update dialog to full screen
      this.dialogRef.updateSize('100%', '100%');
    }

    if (!this.contract.schedule) return;

    this.editing.set(true);

    this.scheduleForm.set(new ScheduleForm(this.contract.schedule));
  }

  previousCombination() {
    const currentIndex = this.selectedCombinationIndex();
    if (currentIndex !== null && currentIndex > 0) {
      this.selectedCombinationIndex.set(currentIndex - 1);
    }
  }

  nextCombination() {
    const currentIndex = this.selectedCombinationIndex();
    if (currentIndex !== null && currentIndex < this.combinations().length - 1) {
      this.selectedCombinationIndex.set(currentIndex + 1);
    }
  }
}
