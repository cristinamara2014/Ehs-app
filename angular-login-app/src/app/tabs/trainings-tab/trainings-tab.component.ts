import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TrainingService, Training } from '../../services/training.service';

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
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
  showTrainingModal: boolean = false;
  selectedTrainingVideo: string | null = null;
  trainingVideoStatus: { [key: string]: string } = {
    'workplace': 'not-started',
    'fire': 'not-started',
    'emergency': 'not-started'
  };
  private trainingPlayers: { [key: string]: any } = {};
  private trainingApiLoaded = false;
  
  // Pagination
  currentPage: number = 1;
  itemsPerPage: number = 5;
  totalPages: number = 1;
  
  trainings: Training[] = [];
  filteredTrainings: Training[] = [];

  constructor(private trainingService: TrainingService) {}

  ngOnInit(): void {
    this.trainings = this.trainingService.getTrainings();
    this.filteredTrainings = [...this.trainings];
    this.updatePagination();
  }

  updatePagination(): void {
    this.totalPages = Math.ceil(this.filteredTrainings.length / this.itemsPerPage);
    if (this.currentPage > this.totalPages) {
      this.currentPage = 1;
    }
  }

  get paginatedTrainings(): Training[] {
    const startIndex = (this.currentPage - 1) * this.itemsPerPage;
    const endIndex = startIndex + this.itemsPerPage;
    return this.filteredTrainings.slice(startIndex, endIndex);
  }

  get pageNumbers(): number[] {
    return Array.from({ length: this.totalPages }, (_, i) => i + 1);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages) {
      this.currentPage = page;
    }
  }

  previousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage(): void {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  onSearch(): void {
    if (!this.searchText.trim()) {
      this.filteredTrainings = [...this.trainings];
    } else {
      const search = this.searchText.toLowerCase();
      this.filteredTrainings = this.trainings.filter(training => 
        training.name.toLowerCase().includes(search) ||
        training.type.toLowerCase().includes(search) ||
        training.id.toString().includes(search)
      );
    }
    this.currentPage = 1;
    this.updatePagination();
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
    this.showTrainingModal = true;
    this.closeModal();
    setTimeout(() => {
      this.loadTrainingYouTubeAPI();
    }, 100);
  }

  closeTrainingModal(): void {
    this.showTrainingModal = false;
    this.selectedTrainingVideo = null;
  }

  loadTrainingYouTubeAPI(): void {
    if (!this.trainingApiLoaded) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      this.trainingApiLoaded = true;

      (window as any).onYouTubeIframeAPIReady = () => {
        this.initializeTrainingPlayers();
      };
    }
  }

  initializeTrainingPlayers(): void {
    const videoIds: { [key: string]: string } = {
      'workplace': 'training-workplace-iframe',
      'fire': 'training-fire-iframe',
      'emergency': 'training-emergency-iframe'
    };

    Object.keys(videoIds).forEach(key => {
      setTimeout(() => {
        const iframe = document.getElementById(videoIds[key]);
        if (iframe && (window as any).YT && (window as any).YT.Player) {
          this.trainingPlayers[key] = new (window as any).YT.Player(videoIds[key], {
            events: {
              'onStateChange': (event: any) => this.onTrainingPlayerStateChange(event, key)
            }
          });
        }
      }, 1000);
    });
  }

  onTrainingPlayerStateChange(event: any, videoId: string): void {
    if (event.data === 0) {
      this.trainingVideoStatus[videoId] = 'finished';
    }
  }

  selectTrainingVideo(videoId: string): void {
    this.selectedTrainingVideo = videoId;
    if (this.trainingVideoStatus[videoId] === 'not-started') {
      this.trainingVideoStatus[videoId] = 'in-progress';
    }
    
    setTimeout(() => {
      this.initializeTrainingPlayers();
    }, 500);
  }

  startTest(): void {
    console.log('Start test:', this.selectedTraining);
    this.closeModal();
  }

  editTraining(id: number): void {
    console.log('Edit training:', id);
  }
}
