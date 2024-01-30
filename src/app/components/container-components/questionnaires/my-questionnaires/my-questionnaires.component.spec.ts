import { ComponentFixture, TestBed } from '@angular/core/testing';

import { MyQuestionnairesComponent } from './my-questionnaires.component';

describe('MyQuestionnairesComponent', () => {
  let component: MyQuestionnairesComponent;
  let fixture: ComponentFixture<MyQuestionnairesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [MyQuestionnairesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(MyQuestionnairesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
