import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Training {
  id: number;
  name: string;
  type: string;
  language: string;
}

@Component({
  selector: 'app-trainings-tab',
  imports: [CommonModule, FormsModule],
  templateUrl: './trainings-tab.component.html',
  styleUrl: './trainings-tab.component.css',
  standalone: true
})
export class TrainingsTabComponent implements OnInit {
  searchText: string = '';
  selectedTraining: Training | null = null;
  trainings: Training[] = [
    { id: 438, name: 'DEMO - Instruire telefonică 8 module', type: 'Instruire tip MODULE SCORM', language: 'ro/en' },
    { id: 436, name: 'Demo - instruire birou', type: 'Instruire tip MODULE SCORM', language: 'ro/en' },
    { id: 209, name: 'exemplu Instruire SSM-SU - presentare cu test', type: 'Instruire tip MODULE SCORM', language: 'ro/en' }
  ];
  filteredTrainings: Training[] = [];

  ngOnInit(): void {
    this.filteredTrainings = [...this.trainings];
  }

  onSearch(): void {
    if (!this.searchText.trim()) {
      this.filteredTrainings = [...this.trainings];
      return;
    }
    
    const search = this.searchText.toLowerCase();
    this.filteredTrainings = this.trainings.filter(training => 
      training.name.toLowerCase().includes(search) ||
      training.type.toLowerCase().includes(search) ||
      training.id.toString().includes(search)
    );
  }

  viewTraining(id: number): void {
    const training = this.trainings.find(t => t.id === id);
    if (training) {
      this.selectedTraining = training;
    }
  }

  closeModal(): void {
    this.selectedTraining = null;
  }

  startTraining(): void {
    console.log('Start training:', this.selectedTraining);
    this.closeModal();
  }

  startTest(): void {
    console.log('Start test:', this.selectedTraining);
    this.closeModal();
  }

  editTraining(id: number): void {
    console.log('Edit training:', id);
  }
}
