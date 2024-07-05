import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal
} from '@angular/core';
import {
  MAT_DIALOG_DATA,
  MatDialogActions,
  MatDialogClose,
  MatDialogContent,
  MatDialogTitle
} from '@angular/material/dialog';
import { MatButton } from "@angular/material/button";

export interface ConfirmDialogContract {
  title?: string,
  description?: string,
  buttonText?: string,
}

@Component({
  selector: 'csb-confirm-dialog',
  templateUrl: './confirm-dialog.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
  standalone: true,
  imports: [
    MatButton,
    MatDialogClose,
    MatDialogTitle,
    MatDialogActions,
    MatDialogContent,
  ],
})
export class ConfirmDialogComponent implements OnInit {
  private contract = inject<ConfirmDialogContract>(MAT_DIALOG_DATA);

  title = signal<string | null>(null);

  description = signal('This action is irreversible, be careful.');

  buttonText = signal('Confirm');

  ngOnInit() {
    if (this.contract?.title) this.title.set(this.contract.title);
    if (this.contract?.description) this.description.set(this.contract.description);
    if (this.contract?.buttonText) this.buttonText.set(this.contract.buttonText);
  }
}
