import { Injectable } from '@angular/core';

export interface Training {
  id: number;
  name: string;
  type: string;
  language: string;
}

@Injectable({
  providedIn: 'root'
})
export class TrainingService {
  private trainings: Training[] = [
    { id: 438, name: 'DEMO - Instruire telefonică 8 module', type: 'Instruire tip MODULE SCORM', language: 'ro/en' },
    { id: 436, name: 'Demo - instruire birou', type: 'Instruire tip MODULE SCORM', language: 'ro/en' },
    { id: 209, name: 'exemplu Instruire SSM-SU - presentare cu test', type: 'Instruire tip MODULE SCORM', language: 'ro/en' }
  ];

  getTrainings(): Training[] {
    return this.trainings;
  }

  addTraining(name: string, type: string = 'Instruire tip MODULE SCORM', language: string = 'ro/en'): Training {
    const newId = Math.max(...this.trainings.map(t => t.id), 0) + 1;
    const newTraining: Training = {
      id: newId,
      name: name,
      type: type,
      language: language
    };
    this.trainings.push(newTraining);
    return newTraining;
  }

  getTrainingById(id: number): Training | undefined {
    return this.trainings.find(t => t.id === id);
  }
}
