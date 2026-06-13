import { TestBed } from '@angular/core/testing';

import { TenderOptionsService } from './tender-options.service';

describe('TenderOptionsService', () => {
  let service: TenderOptionsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TenderOptionsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
