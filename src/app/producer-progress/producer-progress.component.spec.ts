import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProducerProgressComponent } from './producer-progress.component';

describe('ProducerProgressComponent', () => {
  let component: ProducerProgressComponent;
  let fixture: ComponentFixture<ProducerProgressComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProducerProgressComponent ]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(ProducerProgressComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
