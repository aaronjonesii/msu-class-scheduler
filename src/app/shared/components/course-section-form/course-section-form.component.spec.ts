import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseSectionFormComponent } from './course-section-form.component';

describe('CourseSectionFormComponent', () => {
  let component: CourseSectionFormComponent;
  let fixture: ComponentFixture<CourseSectionFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseSectionFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourseSectionFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
