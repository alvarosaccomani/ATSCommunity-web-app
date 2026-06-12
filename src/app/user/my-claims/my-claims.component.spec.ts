import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyClaimsComponent } from './my-claims.component';

describe('MyClaimsComponent', () => {
  let component: MyClaimsComponent;
  let fixture: ComponentFixture<MyClaimsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyClaimsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyClaimsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
