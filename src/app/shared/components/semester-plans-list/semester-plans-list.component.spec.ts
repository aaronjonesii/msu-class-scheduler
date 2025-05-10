import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SemesterPlansListComponent } from './semester-plans-list.component';

describe('SemesterPlansListComponent', () => {
  let component: SemesterPlansListComponent;
  let fixture: ComponentFixture<SemesterPlansListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SemesterPlansListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SemesterPlansListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
