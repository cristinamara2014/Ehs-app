import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormsModule } from '@angular/forms';
import { TrainingService, Training } from '../../services/training.service';
import { MainComponent } from '../../main/main.component';

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
  
  // Mock employees data - replace with actual data from service
  allEmployees: any[] = [];
  filteredEmployees: any[] = [];

  constructor(
    private fb: FormBuilder, 
    private trainingService: TrainingService,
    public mainComponent: MainComponent
  ) {}

  ngOnInit(): void {
    this.trainings = this.trainingService.getTrainings();
    this.initializeForm();
  }

  initializeForm(): void {
    this.sessionForm = this.fb.group({
      signingOption: ['digitalSign'],
      instruire: ['', Validators.required],
      tipInitiere: ['', Validators.required],
      dataInceput: ['2025-12-02T13:43', Validators.required],
      termenLimita: ['', Validators.required],
      angajatiSelectati: [[]], // Array of selected employee IDs
      tipSesiune: [''] // 'angajare' or 'periodica'
    });
  }

  getFormValue(controlName: string): any {
    return this.sessionForm.get(controlName)?.value;
  }

  getAllFormValues(): any {
    return this.sessionForm.value;
  }

  onSubmit(): void {
    console.log('=== Session Form Submission ===');
    console.log('Form Valid:', this.sessionForm.valid);
    console.log('All Form Values:', this.sessionForm.value);
    console.log('Individual Values:');
    console.log('  - Signing Option:', this.sessionForm.get('signingOption')?.value);
    console.log('  - Training ID:', this.sessionForm.get('instruire')?.value);
    console.log('  - Type Initiation:', this.sessionForm.get('tipInitiere')?.value);
    console.log('  - Start Date:', this.sessionForm.get('dataInceput')?.value);
    console.log('  - Deadline:', this.sessionForm.get('termenLimita')?.value);
    console.log('  - Selected Employees:', this.sessionForm.get('angajatiSelectati')?.value);
    console.log('  - Session Type:', this.sessionForm.get('tipSesiune')?.value);
    
    if (this.sessionForm.valid) {
      console.log('✓ Form is valid - ready to submit');
    } else {
      console.log('✗ Form is invalid - please fill required fields');
      Object.keys(this.sessionForm.controls).forEach(key => {
        const control = this.sessionForm.get(key);
        if (control?.invalid) {
          console.log(`  - ${key}: invalid`);
        }
      });
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

  get selectedEmployeesCount(): number {
    return this.sessionForm.get('angajatiSelectati')?.value?.length || 0;
  }

  get filteredEmployeesCount(): number {
    return this.filteredEmployees.length;
  }

  saveCOR(): void {
    const corValue = this.sessionForm.get('tipInitiere')?.value;
    console.log('Saving COR:', corValue);
    // Add your save logic here
  }
}
