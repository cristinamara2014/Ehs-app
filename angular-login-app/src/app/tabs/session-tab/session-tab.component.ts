import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { TrainingService, Training } from '../../services/training.service';

@Component({
  selector: 'app-session-tab',
  imports: [CommonModule, ReactiveFormsModule, FormsModule],
  templateUrl: './session-tab.component.html',
  styleUrl: './session-tab.component.css',
  standalone: true
})
export class SessionTabComponent implements OnInit {
  sessionForm!: FormGroup;
  trainings: Training[] = [];
  showAddModal: boolean = false;
  availableTrainings: Training[] = [];
  selectedTrainingId: number | null = null;

  constructor(private fb: FormBuilder, private trainingService: TrainingService) {}

  ngOnInit(): void {
    this.trainings = this.trainingService.getTrainings();
    this.initializeForm();
  }

  initializeForm(): void {
    this.sessionForm = this.fb.group({
      signingOption: ['noElectronicSign'],
      instruire: ['', Validators.required],
      tipInitiere: ['', Validators.required],
      dataInceput: ['2025-12-02T13:43', Validators.required],
      dataDe: ['2025-12-04', Validators.required],
      dataPana: ['2025-12-10', Validators.required],
      termenLimita: ['', Validators.required],
      sesiuneIntroductiva: [false]
    });
  }

  getFormValue(controlName: string): any {
    return this.sessionForm.get(controlName)?.value;
  }

  getAllFormValues(): any {
    return this.sessionForm.value;
  }

  onSubmit(): void {
    if (this.sessionForm.valid) {
      console.log('Form Values:', this.sessionForm.value);
      const formData = this.getAllFormValues();
      console.log('Training ID:', formData.instruire);
      console.log('Signing option:', formData.signingOption);
    } else {
      console.log('Form is invalid');
    }
  }

  openAddModal(): void {
    this.showAddModal = true;
    this.availableTrainings = this.trainingService.getTrainings();
    this.selectedTrainingId = null;
  }

  closeAddModal(): void {
    this.showAddModal = false;
    this.selectedTrainingId = null;
  }

  selectTraining(trainingId: number): void {
    this.selectedTrainingId = trainingId;
  }

  addSelectedTraining(): void {
    if (this.selectedTrainingId !== null) {
      this.sessionForm.patchValue({ instruire: this.selectedTrainingId });
      this.closeAddModal();
    }
  }

  removeSelectedTraining(): void {
    const currentValue = this.sessionForm.get('instruire')?.value;
    if (currentValue) {
      if (confirm('Are you sure you want to remove this training from selection?')) {
        this.sessionForm.patchValue({ instruire: '' });
      }
    }
  }
}
