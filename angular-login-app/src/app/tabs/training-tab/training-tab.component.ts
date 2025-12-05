import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

declare global {
  interface Window {
    onYouTubeIframeAPIReady: () => void;
    YT: any;
  }
}

@Component({
  selector: 'app-training-tab',
  imports: [CommonModule],
  templateUrl: './training-tab.component.html',
  styleUrl: './training-tab.component.css',
  standalone: true
})
export class TrainingTabComponent implements OnInit {
  selectedVideo: string | null = null;
  videoStatus: { [key: string]: string } = {
    'workplace': 'not-started',
    'fire': 'not-started',
    'emergency': 'not-started'
  };
  private players: { [key: string]: any } = {};
  private apiLoaded = false;

  ngOnInit(): void {
    this.loadYouTubeAPI();
  }

  loadYouTubeAPI(): void {
    if (!this.apiLoaded) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag.parentNode?.insertBefore(tag, firstScriptTag);
      this.apiLoaded = true;

      (window as any).onYouTubeIframeAPIReady = () => {
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
        if (iframe && (window as any).YT && (window as any).YT.Player) {
          this.players[key] = new (window as any).YT.Player(videoIds[key], {
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
}
