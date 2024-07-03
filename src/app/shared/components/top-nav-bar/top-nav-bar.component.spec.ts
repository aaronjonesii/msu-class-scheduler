import { ComponentFixture, TestBed } from '@angular/core/testing';

import { TopNavBarComponent } from './top-nav-bar.component';
import { ActivatedRoute } from "@angular/router";
import { AuthService } from "../../services/auth.service";

xdescribe('TopNavBarComponent', () => {
  let component: TopNavBarComponent;
  let fixture: ComponentFixture<TopNavBarComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [
        TopNavBarComponent,
      ],
      providers: [
        {
          provide: ActivatedRoute,
          useValue: {},
        },
        {
          provide: AuthService,
          useValue: {},
        },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(TopNavBarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
