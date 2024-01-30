import { ComponentFixture, TestBed } from '@angular/core/testing';
import {JointComponent} from "./joint.component";

describe('JointComponent', () => {
  let component: JointComponent;
  let fixture: ComponentFixture<JointComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JointComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(JointComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
