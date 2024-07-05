import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ClassFormDialogComponent } from './class-form-dialog.component';

describe('ClassFormDialogComponent', () => {
  let component: ClassFormDialogComponent;
  let fixture: ComponentFixture<ClassFormDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ClassFormDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ClassFormDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
