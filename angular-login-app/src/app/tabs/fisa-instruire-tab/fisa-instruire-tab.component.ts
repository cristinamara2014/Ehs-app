import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup } from '@angular/forms';
import { MainComponent } from '../../main/main.component';

interface TrainingSheet {
  employeeName: string;
  email: string;
  sessionName: string;
  completionDate: string;
}

@Component({
  selector: 'app-fisa-instruire-tab',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './fisa-instruire-tab.component.html',
  styleUrl: './fisa-instruire-tab.component.css',
  standalone: true
})
export class FisaInstruireTabComponent implements OnInit {
  searchForm!: FormGroup;
  trainingSheetsData: TrainingSheet[] = [];

  constructor(
    public mainComponent: MainComponent,
    private fb: FormBuilder
  ) {}

  ngOnInit(): void {
    // Initialize with empty data - will show "Nu exista date inregistrate."
    this.searchForm = this.fb.group({
      searchText: [''],
      statusFilter: [''],
      dateFrom: [''],
      dateTo: [''],
      searchType: ['employee']
    });
  }

  onSearch(): void {
    console.log('Search form values:', this.searchForm.value);
    // Add your search logic here
  }
}
