import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class CertificateService {

  constructor() { }

  async getCertificatesFromSystem(): Promise<any[]> {
    try {
      // Call the backend API to execute PowerShell script
      const response = await fetch('http://localhost:3000/api/certificates', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        throw new Error('Failed to fetch certificates');
      }

      const certificates = await response.json();
      return certificates;
    } catch (error) {
      console.error('Error fetching certificates:', error);
      throw error;
    }
  }

  async exportCertificate(thumbprint: string, password: string): Promise<any> {
    try {
      const response = await fetch('http://localhost:3000/api/certificates/export', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ thumbprint, password })
      });

      if (!response.ok) {
        throw new Error('Failed to export certificate');
      }

      const result = await response.json();
      return result;
    } catch (error) {
      console.error('Error exporting certificate:', error);
      throw error;
    }
  }
}
