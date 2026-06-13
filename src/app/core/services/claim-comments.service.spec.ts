import { TestBed } from '@angular/core/testing';

import { ClaimCommentsService } from './claim-comments.service';

describe('ClaimCommentsService', () => {
  let service: ClaimCommentsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ClaimCommentsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
