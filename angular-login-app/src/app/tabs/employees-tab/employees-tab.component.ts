import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-employees-tab',
  imports: [CommonModule, FormsModule],
  templateUrl: './employees-tab.component.html',
  styleUrl: './employees-tab.component.css',
  standalone: true
})
export class EmployeesTabComponent implements OnInit {

  ngOnInit(): void {
  }
}
