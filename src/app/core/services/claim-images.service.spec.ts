import { TestBed } from '@angular/core/testing';

import { ClaimImagesService } from './claim-images.service';

describe('ClaimImagesService', () => {
  let service: ClaimImagesService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClaimImagesService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
