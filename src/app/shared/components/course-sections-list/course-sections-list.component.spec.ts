import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CourseSectionsListComponent } from './course-sections-list.component';

describe('CourseSectionsListComponent', () => {
  let component: CourseSectionsListComponent;
  let fixture: ComponentFixture<CourseSectionsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CourseSectionsListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CourseSectionsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
