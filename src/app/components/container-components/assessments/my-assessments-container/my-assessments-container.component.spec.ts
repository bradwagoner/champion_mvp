import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyAssessmentsContainerComponent } from './my-assessments-container.component';

describe('MyAssessmentsContainerComponent', () => {
  let component: MyAssessmentsContainerComponent;
  let fixture: ComponentFixture<MyAssessmentsContainerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyAssessmentsContainerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(MyAssessmentsContainerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
