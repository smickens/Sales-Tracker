import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { AddLifeComponent } from './add-life.component';

describe('AddLifeComponent', () => {
  let component: AddLifeComponent;
  let fixture: ComponentFixture<AddLifeComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ AddLifeComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(AddLifeComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
