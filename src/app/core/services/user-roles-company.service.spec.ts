import { TestBed } from '@angular/core/testing';

import { UserRolesCompanyService } from './user-roles-company.service';

describe('UserRolesCompanyService', () => {
  let service: UserRolesCompanyService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(UserRolesCompanyService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
