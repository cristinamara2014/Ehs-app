import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../auth.service';
import { CommonModule } from '@angular/common';
import { HomeTabComponent } from '../tabs/home-tab/home-tab.component';
import { SessionTabComponent } from '../tabs/session-tab/session-tab.component';
import { EmployeesTabComponent } from '../tabs/employees-tab/employees-tab.component';
import { EmployeecertTabComponent } from '../tabs/employeecert-tab/employeecert-tab.component';
import { TrainingsTabComponent } from '../tabs/trainings-tab/trainings-tab.component';
import { FisaInstruireTabComponent } from '../tabs/fisa-instruire-tab/fisa-instruire-tab.component';

@Component({
  selector: 'app-main',
  imports: [CommonModule, HomeTabComponent, SessionTabComponent, EmployeesTabComponent, EmployeecertTabComponent, TrainingsTabComponent, FisaInstruireTabComponent],
  templateUrl: './main.component.html',
  styleUrl: './main.component.css'
})
export class MainComponent implements OnInit {
  username: string = '';
  currentLanguage: string = 'en';

  translations: { [key: string]: { [key: string]: string } } = {
    en: {
      'home': 'Home',
      'sesiune': 'Session',
      'instructaj': 'Training',
      'settings': 'Settings',
      'employees': 'Employees',
      'employees_cert': 'Certificate Sign',
      'contact': 'Contact',
      'trainings': 'Trainings',
      'fisa_instruire': 'Training Sheet',
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
      'selecteaza_cor': 'Select COR',
      'save': 'Save',
      'perioada_valabilitate': 'Session Validity Period',
      'nume_sesiune': 'Session Name',
      'filtreaza_angajati': 'Filter employees by hire date',
      'de_la': 'From',
      'pana_la': 'Until',
      'termen_limita': 'Deadline',
      'sesiuni_cor_salvate': 'Saved COR Sessions',
      'sesiune_angajare': 'Hiring session',
      'sesiune_periodica': 'Periodic session',
      'tip_initiere': 'Type of initiation',
      'selecteaza': 'Select',
      'filtrati': 'filtered',
      'angajati_selectati': 'Selected employees',
      'selectati': 'selected',
      'setari': 'Settings',
      'initiaza_sesiune_btn': 'Start Session',
      'add': 'Add',
      'remove': 'Remove',
      'fise_instruire': 'Training Sheets',
      'cauta': 'Search',
      'status_fise': 'Sheet Status',
      'toate': 'All',
      'finalizat': 'Completed',
      'nefinalizat': 'Incomplete',
      'cauta_dupa_angajat': 'Search by employee',
      'cauta_dupa_sesiune': 'Search by session',
      'nume_angajat': 'Employee Name',
      'email': 'Email',
      'data_finalizare_instruire': 'Training Completion Date',
      'nu_exista_date': 'No data recorded.'
    },
    ro: {
      'home': 'Acasă',
      'sesiune': 'Sesiune',
      'instructaj': 'Instructaj',
      'settings': 'Setări',
      'employees': 'Angajati',
      'employees_cert': 'Semnare Certificat',
      'contact': 'Contact',
      'trainings': 'Cursuri',
      'fisa_instruire': 'Fisa de Instruire',
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
      'selecteaza_cor': 'Selecteaza COR',
      'save': 'Salveaza',
      'perioada_valabilitate': 'Perioada de valabilitate a sesiunii',
      'nume_sesiune': 'Nume sesiune',
      'filtreaza_angajati': 'Filtreaza angajatii dupa data angajarii',
      'de_la': 'De la',
      'pana_la': 'Pana la',
      'termen_limita': 'Termen limita',
      'sesiuni_cor_salvate': 'Sesiuni COR salvate',
      'sesiune_angajare': 'Sesiune angajare',
      'sesiune_periodica': 'Sesiune periodica',
      'tip_initiere': 'Tip initiere',
      'selecteaza': 'Selecteaza',
      'filtrati': 'filtrati',
      'angajati_selectati': 'Angajati selectati',
      'selectati': 'selectati',
      'setari': 'Setari',
      'initiaza_sesiune_btn': 'Initiaza sesiune',
      'add': 'Adauga',
      'remove': 'Sterge',
      'fise_instruire': 'Fise de instruire',
      'cauta': 'Cauta',
      'status_fise': 'Status fise',
      'toate': 'Toate',
      'finalizat': 'Finalizat',
      'nefinalizat': 'Nefinalizat',
      'cauta_dupa_angajat': 'Cauta dupa angajat',
      'cauta_dupa_sesiune': 'Cauta dupa sesiune',
      'nume_angajat': 'Nume angajat',
      'email': 'Email',
      'data_finalizare_instruire': 'Data finalizare instruire',
      'nu_exista_date': 'Nu exista date inregistrate.'
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
