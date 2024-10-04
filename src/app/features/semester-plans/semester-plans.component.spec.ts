import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SemesterPlansComponent } from './semester-plans.component';

describe('SemesterPlansComponent', () => {
  let component: SemesterPlansComponent;
  let fixture: ComponentFixture<SemesterPlansComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SemesterPlansComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SemesterPlansComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
