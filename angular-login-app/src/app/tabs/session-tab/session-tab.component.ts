import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

@Component({
  selector: 'app-session-tab',
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './session-tab.component.html',
  styleUrl: './session-tab.component.css',
  standalone: true
})
export class SessionTabComponent implements OnInit {
  sessionForm!: FormGroup;

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  initializeForm(): void {
    this.sessionForm = this.fb.group({
      signingOption: ['noElectronicSign'],
      instruire: ['Demo - instruire birou', Validators.required],
      tipInitiere: ['', Validators.required],
      dataInceput: ['2025-12-02T13:43', Validators.required],
      numeSesiune: ['Demo - instruire birou', Validators.required],
      numeSesiuneEn: ['Demo - Office training', Validators.required],
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
      console.log('Session name (RO):', formData.numeSesiune);
      console.log('Session name (EN):', formData.numeSesiuneEn);
      console.log('Training:', formData.instruire);
      console.log('Signing option:', formData.signingOption);
    } else {
      console.log('Form is invalid');
    }
  }
}
