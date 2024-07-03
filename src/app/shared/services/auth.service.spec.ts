import { TestBed } from '@angular/core/testing';

import { AuthService } from './auth.service';
import { Auth } from "@angular/fire/auth";
import { LoggerService } from "./logger.service";
import { Router } from "@angular/router";

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        LoggerService, Router,
        {
          provide: Auth,
          useValue: {},
        },
      ],
    });
    service = TestBed.inject(AuthService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
