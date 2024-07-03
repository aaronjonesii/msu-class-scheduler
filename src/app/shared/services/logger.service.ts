import { inject, Injectable, isDevMode } from '@angular/core';
import {
  MatSnackBar,
  MatSnackBarConfig,
  MatSnackBarRef, TextOnlySnackBar
} from "@angular/material/snack-bar";

@Injectable({ providedIn: 'root' })
export class LoggerService {
  private snackBar = inject(MatSnackBar);

  isInDevelopmentMode = () => isDevMode();

  debug(value: string, ...restOfDebug: unknown[]): void {
    if (!this.isInDevelopmentMode()) return;

    console.debug(`${value}: `, restOfDebug);
  }

  info(value: string, ...restOfInfo: unknown[]): void {
    console.info(`${value}: `, restOfInfo);

    this.openSnackBar(value, 'OK', { duration: 5000, panelClass: 'info' });
  }

  log(value: string, ...restOfLog: unknown[]): void {
    console.log(`${value}: `, restOfLog);

    this.openSnackBar(value, 'OK', { duration: 5000, panelClass: 'log' });
  }

  warn(value: string, ...restOfWarn: unknown[]): void {
    console.warn(`${value}: `, restOfWarn);

    this.openSnackBar(value, 'OK', { duration: 10000, panelClass: 'warn' });
  }

  error(message: string, ...restOfError: unknown[]): void {
    let errorIndex: number | null = null;

    for (let i = 0; i < restOfError.length; i++) {
      if (restOfError[i] instanceof Error) errorIndex = i;
    }

    if (typeof errorIndex === 'number') {
      const error = restOfError[errorIndex] as Error;

      restOfError.splice(errorIndex, 1);

      console.error(`${message}: `, error.stack, restOfError);
    } else {
      const errorPattern = /^Error /;

      if (errorPattern.test(message)) {
        message = message.replace(errorPattern, '');
      }
      const error = new Error(message);

      console.error(error, restOfError);
    }

    this.openSnackBar(message, 'OK', { duration: 0, panelClass: 'error' });
  }

  openSnackBar(
    message: string,
    action: string | undefined,
    config: MatSnackBarConfig | undefined,
  ): MatSnackBarRef<TextOnlySnackBar> {
    return this.snackBar.open(message, action, config);
  }
}
