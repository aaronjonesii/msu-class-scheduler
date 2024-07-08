import { inject, Injectable } from '@angular/core';
import { SwUpdate } from '@angular/service-worker';
import { DOCUMENT } from '@angular/common';
import { LoggerService } from "./logger.service";

@Injectable({ providedIn: 'root' })
export class SwUpdateService {
  private swUpdate = inject(SwUpdate);
  private logger = inject(LoggerService);
  private document = inject(DOCUMENT);

  async checkForSwUpdate() {
    if (this.swUpdate.isEnabled) {
      await this.swUpdate.checkForUpdate()
        .then((updateAvailable) => {
          if (!updateAvailable) return;

          this.notifyUpdateAvailable();
        }).catch((error) => {
          this.logger.error(`Error checking for new website version`, error);
        });
    }
  }

  async notifyUpdateAvailable() {
    await this.logger.openSnackBar(
      `A new website version is available`,
      'Reload',
      { duration: 0 },
    ).onAction().forEach(() =>  this.document.location.reload());
  }
}
