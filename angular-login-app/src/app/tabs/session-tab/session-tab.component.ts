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
  
  // COR Codes Modal
  showCorModal: boolean = false;
  availableCors: any[] = [];
  selectedCors: any[] = [];
  availableCorSelection: number[] = [];
  selectedCorSelection: number[] = [];
  filterAvailableCor: string = '';
  filterSelectedCor: string = '';
  
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
    this.initializeCorCodes();
  }

  initializeCorCodes(): void {
    // Initialize with fake COR codes data
    this.availableCors = [
      { id: 1, name: '11', position: 'Engineer', department: 'Production' },
      { id: 2, name: '22', position: 'Technician', department: 'Quality' },
      { id: 3, name: '33', position: 'Developer', department: 'Maintenance' },
      { id: 4, name: '44', position: 'Operator', department: 'Production' },
      { id: 5, name: '55', position: 'Engineer', department: 'Safety' },
      { id: 6, name: '66', position: 'Manager', department: 'HR' },
      { id: 7, name: '77', position: 'Technician', department: 'Production' },
      { id: 8, name: '88', position: 'Analyst', department: 'Quality' },
      { id: 9, name: '99', position: 'Operator', department: 'Production' },
      { id: 10, name: '1010', position: 'Coordinator', department: 'Safety' },
      { id: 11, name: '1111', position: 'Engineer', department: 'Maintenance' },
      { id: 12, name: '1212', position: 'Developer', department: 'Production' },
      { id: 13, name: '1313', position: 'Technician', department: 'Quality' },
      { id: 14, name: '1414', position: 'Operator', department: 'Production' },
      { id: 15, name: '1515', position: 'Manager', department: 'Production' }
    ];
  }

  initializeForm(): void {
    this.sessionForm = this.fb.group({
      signingOption: ['digitalSign'],
      instruire: ['', Validators.required],
      tipInitiere: ['', Validators.required],
      dataInceput: ['2025-12-02T13:43', Validators.required],
      termenLimita: ['', Validators.required],
      angajatiSelectati: [[]], // Array of selected employee IDs
      tipSesiune: ['angajare'] // 'angajare' or 'periodica' - default to 'angajare'
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

  openCorModal(): void {
    this.showCorModal = true;
  }

  closeCorModal(): void {
    this.showCorModal = false;
  }

  get filteredAvailableCors(): any[] {
    if (!this.filterAvailableCor) {
      return this.availableCors;
    }
    const filter = this.filterAvailableCor.toLowerCase();
    return this.availableCors.filter(cor => 
      cor.name.toLowerCase().includes(filter) ||
      cor.position.toLowerCase().includes(filter) ||
      cor.department.toLowerCase().includes(filter)
    );
  }

  get filteredSelectedCors(): any[] {
    if (!this.filterSelectedCor) {
      return this.selectedCors;
    }
    const filter = this.filterSelectedCor.toLowerCase();
    return this.selectedCors.filter(cor => 
      cor.name.toLowerCase().includes(filter) ||
      cor.position.toLowerCase().includes(filter) ||
      cor.department.toLowerCase().includes(filter)
    );
  }

  moveCorToSelected(): void {
    const corsToMove = this.availableCors.filter(cor => 
      this.availableCorSelection.includes(cor.id)
    );
    
    this.selectedCors = [...this.selectedCors, ...corsToMove];
    this.availableCors = this.availableCors.filter(cor => 
      !this.availableCorSelection.includes(cor.id)
    );
    
    this.availableCorSelection = [];
  }

  moveCorToAvailable(): void {
    const corsToMove = this.selectedCors.filter(cor => 
      this.selectedCorSelection.includes(cor.id)
    );
    
    this.availableCors = [...this.availableCors, ...corsToMove];
    this.selectedCors = this.selectedCors.filter(cor => 
      !this.selectedCorSelection.includes(cor.id)
    );
    
    this.selectedCorSelection = [];
  }

  moveAllCorsToSelected(): void {
    this.selectedCors = [...this.selectedCors, ...this.filteredAvailableCors];
    this.availableCors = this.availableCors.filter(cor => 
      !this.filteredAvailableCors.includes(cor)
    );
    this.availableCorSelection = [];
    this.filterAvailableCor = '';
  }

  moveAllCorsToAvailable(): void {
    this.availableCors = [...this.availableCors, ...this.filteredSelectedCors];
    this.selectedCors = this.selectedCors.filter(cor => 
      !this.filteredSelectedCors.includes(cor)
    );
    this.selectedCorSelection = [];
    this.filterSelectedCor = '';
  }

  onAvailableCorSelectionChange(corId: number, event: any): void {
    if (event.target.checked) {
      this.availableCorSelection = [...this.availableCorSelection, corId];
    } else {
      this.availableCorSelection = this.availableCorSelection.filter(id => id !== corId);
    }
  }

  onSelectedCorSelectionChange(corId: number, event: any): void {
    if (event.target.checked) {
      this.selectedCorSelection = [...this.selectedCorSelection, corId];
    } else {
      this.selectedCorSelection = this.selectedCorSelection.filter(id => id !== corId);
    }
  }

  isAvailableCorSelected(corId: number): boolean {
    return this.availableCorSelection.includes(corId);
  }

  isSelectedCorSelected(corId: number): boolean {
    return this.selectedCorSelection.includes(corId);
  }
}
