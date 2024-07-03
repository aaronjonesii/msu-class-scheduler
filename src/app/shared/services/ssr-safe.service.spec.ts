import { TestBed } from '@angular/core/testing';

import { SSRSafeService } from './ssr-safe.service';

describe('SSRSafeService', () => {
  let service: SSRSafeService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(SSRSafeService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
