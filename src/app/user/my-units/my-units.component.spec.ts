import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyUnitsComponent } from './my-units.component';

describe('MyUnitsComponent', () => {
  let component: MyUnitsComponent;
  let fixture: ComponentFixture<MyUnitsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyUnitsComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyUnitsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
