import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ErrorComponent } from './error.component';
import { ActivatedRoute } from '@angular/router';

describe('ErrorComponent', () => {
  let fixture: ComponentFixture<ErrorComponent>;
  let component: ErrorComponent;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ErrorComponent],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {},
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(ErrorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create the component', () => {
    expect(component).toBeTruthy();
  });
});
