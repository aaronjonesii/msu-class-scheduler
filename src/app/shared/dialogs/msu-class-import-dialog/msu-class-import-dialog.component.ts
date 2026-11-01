import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { MatButton } from "@angular/material/button";
import { MatCheckbox } from "@angular/material/checkbox";
import {
  MAT_DIALOG_DATA,
  MatDialogActions, MatDialogClose,
  MatDialogContent,
  MatDialogTitle
} from "@angular/material/dialog";
import { MatFormField, MatLabel } from "@angular/material/form-field";
import { MatInput } from "@angular/material/input";
import { CourseStatus } from "../../enums/course-status";
import { ReadSemesterPlan } from "../../interfaces/semester-plan";
import { formatCourseMeetings } from "../../utils/format-course-meetings";
import {
  MsuClassOption,
  MsuClassPage,
  MsuClassPageResult,
  parseMsuClassPage
} from "../../utils/parse-msu-class-page";

export type MsuClassImportDialogContract = Pick<ReadSemesterPlan, 'term' | 'year'>;

export interface MsuClassImportDialogResult {
  page: MsuClassPage,
  options: MsuClassOption[],
}

@Component({
  selector: 'csb-msu-class-import-dialog',
  standalone: true,
  imports: [
    MatDialogTitle,
    MatDialogContent,
    MatDialogActions,
    MatDialogClose,
    MatButton,
    MatCheckbox,
    MatFormField,
    MatLabel,
    MatInput,
  ],
  templateUrl: './msu-class-import-dialog.component.html',
  styleUrl: './msu-class-import-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MsuClassImportDialogComponent {
  private plan = inject<MsuClassImportDialogContract>(MAT_DIALOG_DATA);

  protected readonly CourseStatus = CourseStatus;
  protected readonly formatCourseMeetings = formatCourseMeetings;

  result = signal<MsuClassPageResult | null>(null);

  selectedOptionNumbers = signal<ReadonlySet<number>>(new Set());

  page = computed(() => this.result()?.page ?? null);

  error = computed(() => this.result()?.error ?? null);

  termMismatch = computed(() => {
    const page = this.page();
    const { term, year } = this.plan;

    if (!page?.term || (page.term === term && page.year === year)) return null;

    return `This page is for ${page.term} ${page.year}, but this plan is ${term} ${year}.`;
  });

  selectedOptions = computed(() => {
    const selected = this.selectedOptionNumbers();

    return this.page()?.options.filter((o) => selected.has(o.optionNumber)) ?? [];
  });

  importResult = computed<MsuClassImportDialogResult | undefined>(() => {
    const page = this.page();

    return page ? { page, options: this.selectedOptions() } : undefined;
  });

  onTextChange(text: string) {
    const result = text.trim() ? parseMsuClassPage(text) : null;
    const options = result?.page?.options ?? [];

    this.result.set(result);

    // Open options start checked. Anything full or unclear is the user's call.
    this.selectedOptionNumbers.set(new Set(
      options
        .filter((o) => o.status === CourseStatus.OPEN && !o.needsReview)
        .map((o) => o.optionNumber),
    ));
  }

  toggleOption(optionNumber: number, checked: boolean) {
    const selected = new Set(this.selectedOptionNumbers());

    if (checked) selected.add(optionNumber);
    else selected.delete(optionNumber);

    this.selectedOptionNumbers.set(selected);
  }

  meetingDetails(option: MsuClassOption): string {
    const details = option.meetings.flatMap((m) => [m.location, m.instructor]);

    return [...new Set(details.filter((detail) => !!detail))].join(' · ');
  }
}
