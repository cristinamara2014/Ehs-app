import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

@Component({
  selector: 'app-main',
  imports: [CommonModule],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css'
})
export class MainComponent implements OnInit {
  username: string = '';
  selectedVideo: string | null = null;
  currentLanguage: string = 'en';
  videoStatus: { [key: string]: string } = {
    'workplace': 'not-started',
    'fire': 'not-started',
    'emergency': 'not-started'
  };
  private players: { [key: string]: any } = {};
  private apiLoaded = false;

  translations: { [key: string]: { [key: string]: string } } = {
    en: {
      'home': 'Home',
      'sesiune': 'Session',
      'instructaj': 'Training',
      'settings': 'Settings',
      'contact': 'Contact',
      'profile': 'Profile',
      'logout': 'Logout',
      'filme_instructaj': 'Training Videos',
      'training_player': 'Training Player',
      'select_video': 'Select a video to watch',
      'status': 'Status',
      'not_started': 'Not started',
      'in_progress': 'In progress',
      'finished': 'Finished',
      'workplace_culture': 'Workplace Culture & Environment',
      'teamwork': 'Teamwork & Collaboration',
      'communication': 'Professional Communication',
      'initiaza_sesiune': 'Start Session',
      'optiuni_semnare': 'Signing Options',
      'nu_semneaza': 'No electronic signature',
      'semneaza_digital': 'Digital signature',
      'instruire': 'Training',
      'selecteaza_angajati': 'Select Employees',
      'perioada_valabilitate': 'Session Validity Period',
      'nume_sesiune': 'Session Name',
      'filtreaza_angajati': 'Filter employees by hire date',
      'de_la': 'From',
      'pana_la': 'Until',
      'termen_limita': 'Deadline',
      'sesiune_introductiva': 'Introductory session',
      'tip_initiere': 'Type of initiation',
      'selecteaza': 'Select',
      'filtrati': 'filtered',
      'angajati_selectati': 'Selected employees',
      'selectati': 'selected',
      'setari': 'Settings',
      'initiaza_sesiune_btn': 'Start Session'
    },
    ro: {
      'home': 'Acasă',
      'sesiune': 'Sesiune',
      'instructaj': 'Instructaj',
      'settings': 'Setări',
      'contact': 'Contact',
      'profile': 'Profil',
      'logout': 'Deconectare',
      'filme_instructaj': 'Filme instructaj',
      'training_player': 'Player Instructaj',
      'select_video': 'Selectează un videoclip pentru a viziona',
      'status': 'Status',
      'not_started': 'Neînceput',
      'in_progress': 'În desfășurare',
      'finished': 'Finalizat',
      'workplace_culture': 'Cultura & Mediul de Lucru',
      'teamwork': 'Lucru în Echipă & Colaborare',
      'communication': 'Comunicare Profesională',
      'initiaza_sesiune': 'Initiaza sesiune',
      'optiuni_semnare': 'Optiuni semnare',
      'nu_semneaza': 'Nu se semneaza electronic',
      'semneaza_digital': 'Se semneaza digital',
      'instruire': 'Instruire',
      'selecteaza_angajati': 'Selecteaza angajati',
      'perioada_valabilitate': 'Perioada de valabilitate a sesiunii',
      'nume_sesiune': 'Nume sesiune',
      'filtreaza_angajati': 'Filtreaza angajatii dupa data angajarii',
      'de_la': 'De la',
      'pana_la': 'Pana la',
      'termen_limita': 'Termen limita',
      'sesiune_introductiva': 'Sesiune introductiva',
      'tip_initiere': 'Tip initiere',
      'selecteaza': 'Selecteaza',
      'filtrati': 'filtrati',
      'angajati_selectati': 'Angajati selectati',
      'selectati': 'selectati',
      'setari': 'Setari',
      'initiaza_sesiune_btn': 'Initiaza sesiune'
    }
  };

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
    } else {
      this.username = this.authService.getCurrentUser() || '';
    }
    // Set default language to English
    this.currentLanguage = 'en';
    this.loadYouTubeAPI();
  }

  loadYouTubeAPI(): void {
    if (!this.apiLoaded) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      this.apiLoaded = true;

      window.onYouTubeIframeAPIReady = () => {
        this.initializePlayers();
      };
    }
  }

  initializePlayers(): void {
    const videoIds: { [key: string]: string } = {
      'workplace': 'workplace-iframe',
      'fire': 'fire-iframe',
      'emergency': 'emergency-iframe'
    };

    Object.keys(videoIds).forEach(key => {
      setTimeout(() => {
        const iframe = document.getElementById(videoIds[key]);
        if (iframe && window.YT && window.YT.Player) {
          this.players[key] = new window.YT.Player(videoIds[key], {
            events: {
              'onStateChange': (event: any) => this.onPlayerStateChange(event, key)
            }
          });
        }
      }, 1000);
    });
  }

  onPlayerStateChange(event: any, videoId: string): void {
    // YT.PlayerState.ENDED = 0
    if (event.data === 0) {
      this.videoStatus[videoId] = 'finished';
    }
  }

  selectVideo(videoId: string): void {
    this.selectedVideo = videoId;
    if (this.videoStatus[videoId] === 'not-started') {
      this.videoStatus[videoId] = 'in-progress';
    }
    
    // Reinitialize player after view renders
    setTimeout(() => {
      this.initializePlayers();
    }, 500);
  }

  changeLanguage(lang: string): void {
    this.currentLanguage = lang;
  }

  translate(key: string): string {
    return this.translations[this.currentLanguage][key] || key;
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
