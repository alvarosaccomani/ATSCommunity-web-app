import { TestBed } from '@angular/core/testing';

import { UserUnitsService } from './user-units.service';

describe('UserUnitsService', () => {
  let service: UserUnitsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserUnitsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
