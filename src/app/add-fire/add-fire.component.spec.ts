import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddFireComponent } from './add-fire.component';

describe('AddFireComponent', () => {
  let component: AddFireComponent;
  let fixture: ComponentFixture<AddFireComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddFireComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddFireComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
