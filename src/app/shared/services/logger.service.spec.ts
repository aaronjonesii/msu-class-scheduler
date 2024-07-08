import { LoggerService } from "./logger.service";
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { TestBed } from '@angular/core/testing';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ChangeDetectionStrategy, Component } from '@angular/core';
import { TestbedHarnessEnvironment } from '@angular/cdk/testing/testbed';
import { MatSnackBarHarness } from '@angular/material/snack-bar/testing';

@Component({
  selector: 'csb-test-logger',
  template: undefined,
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
class TestConsoleLoggerComponent {}

describe('LoggerService', () => {
  let service: LoggerService;
  let snackBar: MatSnackBar;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        MatSnackBarModule,
        BrowserAnimationsModule,
      ],
      providers: [LoggerService],
    }).compileComponents();

    service = TestBed.inject(LoggerService);
    snackBar = TestBed.inject(MatSnackBar);
  });

  it('should create the service', () => {
    expect(service).toBeTruthy();
  });

  describe('debug', () => {
    it('should call console.debug in development mode', () => {
      spyOn(service, 'isInDevelopmentMode').and.callFake(() => true);
      spyOn(console, 'debug');

      service.debug('test');

      expect(console.debug).toHaveBeenCalledWith('test: ', []);
    });

    it('should not call console.debug in production mode', () => {
      spyOn(service, 'isInDevelopmentMode').and.callFake(() => false);
      spyOn(console, 'debug');

      service.debug('test');

      expect(console.debug).not.toHaveBeenCalled();
    });
  });

  describe('info', () => {
    it('should call console.info', () => {
      spyOn(console, 'info');

      service.info('test');

      expect(console.info).toHaveBeenCalledWith('test: ', []);
    });

    it('should call openSnackBar', () => {
      spyOn(service, 'openSnackBar');
      service.info('test');

      expect(service.openSnackBar).toHaveBeenCalledWith(
        'test',
        'OK',
        { duration: 5000, panelClass: 'info' },
      );
    });
  });

  describe('log', () => {
    it('should call console.log', () => {
      spyOn(console, 'log');

      service.log('test');

      expect(console.log).toHaveBeenCalledWith('test: ', []);
    });

    it('should call openSnackBar', () => {
      spyOn(service, 'openSnackBar');

      service.log('test');

      expect(service.openSnackBar).toHaveBeenCalledWith(
        'test',
        'OK',
        { duration: 5000, panelClass: 'log' },
      );
    });
  });

  describe('warn', () => {
    it('should call console.warn', () => {
      spyOn(console, 'warn');

      service.warn('test');

      expect(console.warn).toHaveBeenCalledWith('test: ', []);
    });

    it('should call openSnackBar', () => {
      spyOn(service, 'openSnackBar');

      service.warn('test');

      expect(service.openSnackBar).toHaveBeenCalledWith(
        'test',
        'OK',
        { duration: 10000, panelClass: 'warn' },
      );
    });
  });

  describe('error', () => {
    it('should call console.error', () => {
      spyOn(console, 'error');

      service.error('test');

      const testError = new Error('test');

      expect(console.error).toHaveBeenCalledWith(testError, []);
    });

    it('should call openSnackBar', () => {
      spyOn(service, 'openSnackBar');

      service.error('test');

      expect(service.openSnackBar).toHaveBeenCalledWith(
        'test',
        'OK',
        { duration: 0, panelClass: 'error' },
      );
    });
  });

  describe('openSnackBar', () => {
    it('should call snackBar.open with provided parameters', () => {
      spyOn(snackBar, 'open');

      service.openSnackBar('test-message', 'test-action', {});

      expect(snackBar.open)
        .toHaveBeenCalledWith('test-message', 'test-action', {});
    });

    it('should show snackbar with message', async () => {
      const fixture = TestBed.createComponent(TestConsoleLoggerComponent);
      const loader = TestbedHarnessEnvironment.documentRootLoader(fixture);

      service.openSnackBar('test-message', 'test-action', {});

      const snackbar = await loader.getHarness(MatSnackBarHarness);

      expect(await snackbar.getMessage()).toBe('test-message');
      expect(await snackbar.getActionDescription()).toBe('test-action');
    });
  });
});
