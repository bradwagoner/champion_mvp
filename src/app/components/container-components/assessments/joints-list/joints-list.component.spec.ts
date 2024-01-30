import { ComponentFixture, TestBed } from '@angular/core/testing';

import { JointsListComponent } from './joints-list.component';

describe('JointsListComponent', () => {
  let component: JointsListComponent;
  let fixture: ComponentFixture<JointsListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [JointsListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(JointsListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
