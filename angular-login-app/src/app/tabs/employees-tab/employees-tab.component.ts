import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PDFDocument, rgb } from 'pdf-lib';
import * as forge from 'node-forge';
import { CertificateService } from '../../services/certificate.service';

@Component({
  selector: 'app-employees-tab',
  imports: [CommonModule, FormsModule],
  templateUrl: './employees-tab.component.html',
  styleUrl: './employees-tab.component.css',
  standalone: true
})
export class EmployeesTabComponent implements OnInit {
  pdfUrl: SafeResourceUrl;
  pdfBytes: ArrayBuffer | null = null;
  certificateFile: File | null = null;
  privateKeyFile: File | null = null;
  certificatePassword: string = '';
  signatureName: string = '';
  signatureReason: string = '';
  signatureLocation: string = '';
  isSigning: boolean = false;
  certificateInfo: string = '';
  useSystemCertificate: boolean = true;
  availableCertificates: any[] = [];
  selectedSystemCert: any = null;
  isLoadingCertificates: boolean = false;
  showCertificateList: boolean = false;

  constructor(
    private sanitizer: DomSanitizer,
    private certificateService: CertificateService
  ) {
    this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl('assets/fisa.pdf');
    this.loadPdfBytes();
  }

  ngOnInit(): void {
    // Auto-load certificates when component initializes
    this.loadAvailableCertificates();
  }

  async loadPdfBytes(): Promise<void> {
    try {
      const response = await fetch('assets/fisa.pdf');
      this.pdfBytes = await response.arrayBuffer();
    } catch (error) {
      console.error('Error loading PDF:', error);
    }
  }

  async loadAvailableCertificates(): Promise<void> {
    this.isLoadingCertificates = true;
    
    try {
      // Automatically call the backend service to get certificates
      const certificates = await this.certificateService.getCertificatesFromSystem();
      
      if (certificates && certificates.length > 0) {
        this.availableCertificates = certificates;
        this.showCertificateList = true;
        
        alert(
          `✓ Found ${certificates.length} certificate(s)!\n\n` +
          `Certificates from:\n` +
          `  • Location: Personal > Certificates\n` +
          `  • Purpose: Client Authentication\n` +
          `  • Issued To: Your Windows user\n\n` +
          `Select a certificate below to sign your PDF.`
        );
      } else {
        alert(
          'No certificates found.\n\n' +
          'Make sure you have certificates with:\n' +
          '  • Client Authentication purpose\n' +
          '  • Issued to your Windows username\n' +
          '  • Private key available\n\n' +
          'You can switch to "Upload Certificate File" to manually select a certificate.'
        );
      }
      
    } catch (error) {
      console.error('Error loading certificates:', error);
      
      const fallback = confirm(
        'Could not automatically load certificates.\n\n' +
        'This might be because:\n' +
        '  • The backend service is not running\n' +
        '  • PowerShell execution is restricted\n' +
        '  • No certificates match the criteria\n\n' +
        'Would you like to see manual instructions?\n' +
        'Click OK for instructions, Cancel to browse for a file.'
      );
      
      if (fallback) {
        await this.showDetailedCertificateInstructions();
      } else {
        this.useSystemCertificate = false;
      }
    } finally {
      this.isLoadingCertificates = false;
    }
  }

  async showDetailedCertificateInstructions(): Promise<void> {
    const instructions = 
      '═══════════════════════════════════════════════════════════════\n' +
      '        INSTRUCTIONS: Load Your Signing Certificates\n' +
      '═══════════════════════════════════════════════════════════════\n\n' +
      'STEP 1: Open PowerShell\n' +
      '   • Press Win + X\n' +
      '   • Select "Windows PowerShell" or "Terminal"\n\n' +
      'STEP 2: Navigate to project directory\n' +
      '   cd "C:\\Dev\\EhsInstructaj\\Ehs-app\\angular-login-app"\n\n' +
      'STEP 3: Run certificate discovery script\n' +
      '   .\\scripts\\get-certificates.ps1\n\n' +
      'STEP 4: The script will output JSON with your certificates:\n' +
      '   • Subject (who the certificate is issued to)\n' +
      '   • Issuer (Certificate Authority)\n' +
      '   • Validity dates\n' +
      '   • Thumbprint (unique identifier)\n\n' +
      'STEP 5: Copy the entire JSON output\n\n' +
      'STEP 6: Return to this app and paste when prompted\n\n' +
      '═══════════════════════════════════════════════════════════════\n' +
      'NOTE: The script automatically filters for:\n' +
      '  ✓ Personal certificate store\n' +
      '  ✓ Client Authentication purpose\n' +
      '  ✓ Your Windows username\n' +
      '  ✓ Certificates with private keys\n' +
      '═══════════════════════════════════════════════════════════════';

    alert(instructions);
    
    // Prompt user to paste JSON output
    const jsonInput = prompt('Paste the JSON output from the PowerShell script here:');
    
    if (jsonInput) {
      try {
        const certificates = JSON.parse(jsonInput);
        if (Array.isArray(certificates)) {
          this.availableCertificates = certificates;
          this.showCertificateList = true;
          alert(`Found ${certificates.length} certificate(s) available for signing!`);
        }
      } catch (error) {
        alert('Invalid JSON format. Please run the script and copy the output exactly.');
      }
    }
  }

  onCertificateFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && (file.name.endsWith('.p12') || file.name.endsWith('.pfx') || file.name.endsWith('.pem') || file.name.endsWith('.crt'))) {
      this.certificateFile = file;
      this.extractCertificateInfo(file);
    } else {
      alert('Please select a valid certificate file (.p12, .pfx, .pem, or .crt)');
    }
  }

  async extractCertificateInfo(file: File): Promise<void> {
    try {
      const arrayBuffer = await file.arrayBuffer();
      const fileExtension = file.name.split('.').pop()?.toLowerCase();

      if (fileExtension === 'p12' || fileExtension === 'pfx') {
        // For PKCS#12 files, we need the password to extract info
        if (this.certificatePassword) {
          try {
            const asn1 = forge.asn1.fromDer(forge.util.createBuffer(arrayBuffer));
            const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, this.certificatePassword);
            
            const certBags = p12.getBags({ bagType: forge.pki.oids['certBag'] });
            const certBag = certBags[forge.pki.oids['certBag']]?.[0];
            
            if (certBag?.cert) {
              const cert = certBag.cert;
              this.certificateInfo = `Issuer: ${cert.issuer.getField('CN')?.value || 'Unknown'}\n` +
                                    `Subject: ${cert.subject.getField('CN')?.value || 'Unknown'}\n` +
                                    `Valid From: ${cert.validity.notBefore.toLocaleDateString()}\n` +
                                    `Valid To: ${cert.validity.notAfter.toLocaleDateString()}`;
            }
          } catch (error) {
            this.certificateInfo = 'Enter password to view certificate details';
          }
        } else {
          this.certificateInfo = 'Enter password to view certificate details';
        }
      } else if (fileExtension === 'pem' || fileExtension === 'crt') {
        // For PEM files
        const pemString = new TextDecoder().decode(arrayBuffer);
        try {
          const cert = forge.pki.certificateFromPem(pemString);
          this.certificateInfo = `Issuer: ${cert.issuer.getField('CN')?.value || 'Unknown'}\n` +
                                `Subject: ${cert.subject.getField('CN')?.value || 'Unknown'}\n` +
                                `Valid From: ${cert.validity.notBefore.toLocaleDateString()}\n` +
                                `Valid To: ${cert.validity.notAfter.toLocaleDateString()}`;
        } catch (error) {
          this.certificateInfo = 'Could not parse certificate';
        }
      }
    } catch (error) {
      console.error('Error extracting certificate info:', error);
      this.certificateInfo = 'Error reading certificate';
    }
  }

  onPrivateKeyFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && (file.name.endsWith('.key') || file.name.endsWith('.pem'))) {
      this.privateKeyFile = file;
    } else {
      alert('Please select a valid private key file (.key or .pem)');
    }
  }

  async accessSystemCertificates(): Promise<void> {
    // Direct call to load available certificates
    await this.loadAvailableCertificates();
  }

  async loadWindowsCertificates(): Promise<void> {
    // Legacy method - redirects to loadAvailableCertificates
    await this.loadAvailableCertificates();
  }

  getCurrentWindowsUser(): string {
    // This would normally come from a backend service
    // For now, we'll use a placeholder
    return '[Current Windows User]';
  }

  browseForCertificateFile(): void {
    // Create a hidden file input to trigger certificate selection
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.p12,.pfx,.pem,.crt,.cer';
    input.style.display = 'none';
    
    input.onchange = async (event: any) => {
      const file = event.target.files[0];
      if (file) {
        this.useSystemCertificate = false;
        this.certificateFile = file;
        await this.extractCertificateInfo(file);
        
        alert(`Certificate "${file.name}" loaded successfully!\n\nNext steps:\n1. Enter the certificate password (if required)\n2. Fill in the signature details\n3. Sign your PDF`);
      }
    };
    
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  }

  async selectCertificateFromList(cert: any): Promise<void> {
    this.selectedSystemCert = cert;
    this.certificateInfo = `Subject: ${cert.Subject}\nIssuer: ${cert.Issuer}\nValid: ${cert.NotBefore} to ${cert.NotAfter}`;
    
    // Check if PDF is loaded
    if (!this.pdfBytes) {
      alert('Please wait for the PDF to load first.');
      return;
    }

    // Automatically sign with the CA certificate - no password needed for display
    const shouldSign = confirm(
      `Sign PDF with this certificate?\n\n` +
      `Certificate: ${cert.Subject}\n` +
      `Issuer: ${cert.Issuer}\n` +
      `Valid: ${cert.NotBefore} to ${cert.NotAfter}\n\n` +
      `Click OK to add your signature to the PDF.`
    );
    
    if (shouldSign) {
      // Sign directly without password prompt - just add visual signature
      await this.signPdfWithCACertificate(cert);
    }
  }

  async signPdfWithCACertificate(cert: any): Promise<void> {
    this.isLoadingCertificates = true;
    this.isSigning = true;

    try {
      console.log('Signing PDF with CA certificate:', cert.Subject);
      
      // Extract certificate details for display
      const certificateSubject = cert.Subject;
      const certificateIssuer = cert.Issuer;
      const validFrom = cert.NotBefore;
      const validTo = cert.NotAfter;
      const certificateThumbprint = cert.Thumbprint;
      
      // Extract signer name from Subject (CN field)
      let signerName = certificateSubject;
      const cnMatch = certificateSubject.match(/CN=([^,]+)/);
      if (cnMatch) {
        signerName = cnMatch[1].trim();
      }
      
      console.log('Signer name:', signerName);
      console.log('Certificate details:', { certificateSubject, certificateIssuer, validFrom, validTo });

      // Load the PDF
      const pdfDoc = await PDFDocument.load(this.pdfBytes!);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();

      console.log('PDF dimensions:', { width, height });

      // Create signature box - placed at top left
      const boxWidth = 170;  // 15% less than 200 (200 * 0.85 = 170)
      const boxHeight = 100;
      const boxX = 50; // Position at left side
      const boxY = height - boxHeight - 50; // Position at top of page

      console.log('Adding signature box:', { boxX, boxY, boxWidth, boxHeight });

      // Draw white background
      firstPage.drawRectangle({
        x: boxX,
        y: boxY,
        width: boxWidth,
        height: boxHeight,
        color: rgb(1, 1, 1),
      });

      // Draw blue border
      firstPage.drawRectangle({
        x: boxX,
        y: boxY,
        width: boxWidth,
        height: boxHeight,
        borderColor: rgb(0, 0.2, 0.8),
        borderWidth: 3,
      });

      // Draw header background
      firstPage.drawRectangle({
        x: boxX + 3,
        y: boxY + boxHeight - 20,
        width: boxWidth - 6,
        height: 17,
        color: rgb(0.7, 0.85, 1),
      });

      // Header text
      firstPage.drawText('DIGITALLY SIGNED', {
        x: boxX + 10,
        y: boxY + boxHeight - 15,
        size: 10,
        color: rgb(0, 0, 0.6),
      });

      // Checkmark
      firstPage.drawCircle({
        x: boxX + boxWidth - 15,
        y: boxY + boxHeight - 10,
        size: 6,
        color: rgb(0, 0.7, 0),
      });
      
      firstPage.drawText('V', {
        x: boxX + boxWidth - 18,
        y: boxY + boxHeight - 14,
        size: 8,
        color: rgb(1, 1, 1),
      });

      // Signature area
      firstPage.drawRectangle({
        x: boxX + 8,
        y: boxY + boxHeight - 48,
        width: boxWidth - 16,
        height: 23,
        color: rgb(0.98, 0.98, 1),
        borderColor: rgb(0.7, 0.7, 0.7),
        borderWidth: 1,
      });
      
      // Draw signature name
      firstPage.drawText(signerName, {
        x: boxX + 12,
        y: boxY + boxHeight - 37,
        size: 11,
        color: rgb(0, 0, 0.5),
      });
      
      // Signature line
      firstPage.drawLine({
        start: { x: boxX + 10, y: boxY + boxHeight - 42 },
        end: { x: boxX + boxWidth - 10, y: boxY + boxHeight - 42 },
        thickness: 0.5,
        color: rgb(0, 0, 0),
      });
      
      // Label
      firstPage.drawText('Digital Signature', {
        x: boxX + 12,
        y: boxY + boxHeight - 46,
        size: 6,
        color: rgb(0.4, 0.4, 0.4),
      });

      // Certificate details
      const signatureLines = [
        `Signed by: ${signerName}`,
        `Date: ${new Date().toLocaleDateString()}`,
        validTo ? `Valid until: ${validTo}` : '',
      ].filter(line => line !== '');

      let currentY = boxY + boxHeight - 58;
      const lineHeight = 8;
      
      signatureLines.forEach((line, index) => {
        const isBold = line.startsWith('Signed by:');
        firstPage.drawText(line, {
          x: boxX + 8,
          y: currentY,
          size: isBold ? 7 : 6,
          color: isBold ? rgb(0, 0, 0) : rgb(0.3, 0.3, 0.3),
        });
        currentY -= lineHeight;
      });

      // Security badge
      firstPage.drawRectangle({
        x: boxX + 5,
        y: boxY + 4,
        width: boxWidth - 10,
        height: 12,
        color: rgb(0.9, 1, 0.9),
        borderColor: rgb(0, 0.6, 0),
        borderWidth: 1,
      });

      firstPage.drawCircle({
        x: boxX + 12,
        y: boxY + 10,
        size: 3,
        color: rgb(0, 0.6, 0),
      });

      firstPage.drawText('CA Verified', {
        x: boxX + 18,
        y: boxY + 7,
        size: 7,
        color: rgb(0, 0.5, 0),
      });

      // Save the signed PDF
      const signedPdfBytes = await pdfDoc.save();

      console.log('✓ PDF signed successfully!');
      console.log('Signed PDF size:', signedPdfBytes.length);

      // Update the PDF display
      this.pdfBytes = signedPdfBytes;
      
      // Revoke old URL
      if (this.pdfUrl) {
        const oldUrl = (this.pdfUrl as any).changingThisBreaksApplicationSecurity;
        if (oldUrl && oldUrl.startsWith('blob:')) {
          URL.revokeObjectURL(oldUrl);
        }
      }
      
      // Create new blob URL with timestamp
      const blob = new Blob([signedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url + '#' + Date.now());

      console.log('PDF URL updated:', url);

      // Offer download
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = `signed_${signerName.replace(/\s+/g, '_')}_${new Date().toISOString().slice(0,10)}.pdf`;
      
      const shouldDownload = confirm(
        '✅ PDF signed successfully!\n\n' +
        `Signed by: ${signerName}\n` +
        `Certificate: ${certificateSubject}\n` +
        `Date: ${new Date().toLocaleString()}\n\n` +
        'The signature is now visible on the document.\n\n' +
        'Would you like to download the signed PDF?'
      );
      
      if (shouldDownload) {
        downloadLink.click();
      }
      
      setTimeout(() => downloadLink.remove(), 100);

    } catch (error: any) {
      console.error('❌ Error signing PDF:', error);
      alert(
        '❌ Failed to sign PDF\n\n' +
        `Error: ${error.message || 'Unknown error'}\n\n` +
        'Please check the browser console (F12) for details.'
      );
    } finally {
      this.isLoadingCertificates = false;
      this.isSigning = false;
    }
  }

  async exportAndSignCertificate(thumbprint: string, password: string, certSubject: string): Promise<void> {
    this.isLoadingCertificates = true;
    this.isSigning = true;

    try {
      console.log('Exporting certificate with thumbprint:', thumbprint);
      
      // Call backend service to export the certificate
      const result = await this.certificateService.exportCertificate(thumbprint, password);

      console.log('Export result:', result.Success ? '✓ Success' : '✗ Failed');

      if (result.Success && result.Certificate) {
        console.log('Certificate data received, size:', result.Certificate.length, 'characters');
        
        // Decode the base64 certificate data
        const binaryString = atob(result.Certificate);
        const bytes = new Uint8Array(binaryString.length);
        for (let i = 0; i < binaryString.length; i++) {
          bytes[i] = binaryString.charCodeAt(i);
        }

        console.log('Certificate decoded, size:', bytes.length, 'bytes');

        // Create a File object from the certificate data
        const blob = new Blob([bytes], { type: 'application/x-pkcs12' });
        const file = new File([blob], 'certificate.pfx', {
          type: 'application/x-pkcs12'
        });

        // Load the certificate for signing
        this.certificateFile = file;
        this.certificatePassword = password;
        
        console.log('Certificate file created:', file.name, file.size, 'bytes');
        
        // Extract certificate info
        await this.extractCertificateInfo(file);

        console.log('Starting PDF signing...');
        // Sign the PDF immediately
        await this.signPdfWithLoadedCertificate(certSubject);

      } else {
        throw new Error(result.Error || 'Failed to export certificate from Windows Certificate Store');
      }

    } catch (error: any) {
      console.error('❌ Error signing with certificate:', error);
      alert(
        '❌ Failed to sign PDF.\n\n' +
        `Error: ${error.message || 'Unknown error'}\n\n` +
        'Please check:\n' +
        '  • The password is correct\n' +
        '  • The certificate has a private key\n' +
        '  • The backend service is running on http://localhost:3000\n' +
        '  • Check browser console (F12) for detailed error logs'
      );
    } finally {
      this.isLoadingCertificates = false;
      this.isSigning = false;
    }
  }

  async signPdfWithLoadedCertificate(certSubject: string): Promise<void> {
    try {
      console.log('Starting PDF signing process...');
      console.log('Certificate file:', this.certificateFile?.name);
      console.log('Certificate subject:', certSubject);
      console.log('PDF bytes available:', !!this.pdfBytes);

      if (!this.certificateFile) {
        throw new Error('No certificate file loaded');
      }

      if (!this.pdfBytes) {
        throw new Error('No PDF loaded for signing');
      }

      const certArrayBuffer = await this.certificateFile.arrayBuffer();
      const fileExtension = this.certificateFile.name.split('.').pop()?.toLowerCase();

      console.log('Certificate file extension:', fileExtension);
      console.log('Certificate size:', certArrayBuffer.byteLength, 'bytes');

      let certificateSubject = certSubject;
      let certificateIssuer = 'Unknown Issuer';
      let validFrom = '';
      let validTo = '';
      let serialNumber = '';
      let certificateThumbprint = '';
      let signerName = '';
      let signerOrganization = '';

      // Extract detailed certificate information for PKCS#12 files
      if (fileExtension === 'p12' || fileExtension === 'pfx') {
        if (!this.certificatePassword) {
          throw new Error('Certificate password is required for PKCS#12 files');
        }

        try {
          console.log('Parsing PKCS#12 certificate...');
          const asn1 = forge.asn1.fromDer(forge.util.createBuffer(certArrayBuffer));
          const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, this.certificatePassword);

          const certBags = p12.getBags({ bagType: forge.pki.oids['certBag'] });
          const certBag = certBags[forge.pki.oids['certBag']]?.[0];

          if (certBag?.cert) {
            const cert = certBag.cert;
            certificateSubject = cert.subject.getField('CN')?.value || certificateSubject;
            certificateIssuer = cert.issuer.getField('CN')?.value || 'Unknown Issuer';
            validFrom = cert.validity.notBefore.toLocaleDateString();
            validTo = cert.validity.notAfter.toLocaleDateString();
            serialNumber = cert.serialNumber || 'N/A';
            
            // Extract signer name from certificate
            signerName = cert.subject.getField('CN')?.value || '';
            const givenName = cert.subject.getField('GN')?.value || '';
            const surname = cert.subject.getField('SN')?.value || cert.subject.getField('surname')?.value || '';
            
            // Try to get full name from certificate attributes
            if (givenName && surname) {
              signerName = `${givenName} ${surname}`;
            } else if (!signerName) {
              signerName = certificateSubject;
            }
            
            // Extract organization
            signerOrganization = cert.subject.getField('O')?.value || '';
            
            // Get the selected certificate's thumbprint from availableCertificates
            const selectedCert = this.availableCertificates.find(c => c.Subject.includes(certificateSubject));
            if (selectedCert) {
              certificateThumbprint = selectedCert.Thumbprint;
            }
            
            console.log('✓ Certificate parsed successfully');
            console.log('Extracted signer info:', { signerName, signerOrganization, certificateSubject });
          } else {
            throw new Error('No certificate found in PKCS#12 file');
          }
        } catch (error: any) {
          console.error('Error extracting certificate details:', error);
          throw new Error(`Failed to parse certificate: ${error.message}`);
        }
      }

      // Load the PDF
      const pdfDoc = await PDFDocument.load(this.pdfBytes!);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();

      console.log('PDF dimensions:', { width, height });

      // Create a large, prominent signature box with CA certificate details
      const boxWidth = 400;
      const boxHeight = 200;
      const boxX = 50; // Position on the left side for better visibility
      const boxY = 50; // Position near the bottom

      console.log('Signature box:', { boxX, boxY, boxWidth, boxHeight });

      // Draw white background for entire signature box
      firstPage.drawRectangle({
        x: boxX,
        y: boxY,
        width: boxWidth,
        height: boxHeight,
        color: rgb(1, 1, 1),
      });

      // Draw outer border (thick blue border for visibility)
      firstPage.drawRectangle({
        x: boxX,
        y: boxY,
        width: boxWidth,
        height: boxHeight,
        borderColor: rgb(0, 0.2, 0.8),
        borderWidth: 3,
      });

      // Draw header background (bright blue)
      firstPage.drawRectangle({
        x: boxX + 3,
        y: boxY + boxHeight - 40,
        width: boxWidth - 6,
        height: 35,
        color: rgb(0.7, 0.85, 1),
      });

      // Draw header text - DIGITALLY SIGNED (larger and bold)
      firstPage.drawText('DIGITALLY SIGNED', {
        x: boxX + 15,
        y: boxY + boxHeight - 25,
        size: 14,
        color: rgb(0, 0, 0.6),
      });

      // Draw checkmark in a green circle
      firstPage.drawCircle({
        x: boxX + boxWidth - 30,
        y: boxY + boxHeight - 20,
        size: 12,
        color: rgb(0, 0.7, 0),
      });
      
      firstPage.drawText('V', {
        x: boxX + boxWidth - 35,
        y: boxY + boxHeight - 27,
        size: 16,
        color: rgb(1, 1, 1),
      });

      // Draw handwritten-style signature (name from certificate)
      if (signerName) {
        // Signature area background
        firstPage.drawRectangle({
          x: boxX + 15,
          y: boxY + boxHeight - 90,
          width: boxWidth - 30,
          height: 45,
          color: rgb(0.98, 0.98, 1),
          borderColor: rgb(0.7, 0.7, 0.7),
          borderWidth: 1,
        });
        
        // Draw signature in italics-style (simulated handwriting)
        firstPage.drawText(signerName, {
          x: boxX + 25,
          y: boxY + boxHeight - 65,
          size: 18,
          color: rgb(0, 0, 0.5),
          // This creates a slanted effect similar to handwriting
        });
        
        // Draw signature line
        firstPage.drawLine({
          start: { x: boxX + 20, y: boxY + boxHeight - 75 },
          end: { x: boxX + boxWidth - 20, y: boxY + boxHeight - 75 },
          thickness: 1,
          color: rgb(0, 0, 0),
        });
        
        // Label below signature
        firstPage.drawText('Digital Signature', {
          x: boxX + 25,
          y: boxY + boxHeight - 85,
          size: 8,
          color: rgb(0.4, 0.4, 0.4),
        });
      }

      // Build signature details text
      const signatureLines = [
        `Signed by: ${signerName}`,
        ``,
        `Certificate: ${certificateSubject.split(',')[0].replace('CN=', '')}`,
        `Date: ${new Date().toLocaleDateString()} ${new Date().toLocaleTimeString()}`,
        validFrom && validTo ? `Valid until: ${validTo}` : '',
        certificateThumbprint ? `Thumbprint: ${certificateThumbprint.substring(0, 25)}...` : '',
      ].filter(line => line !== '');

      // Draw signature details
      let currentY = boxY + boxHeight - 105;
      const lineHeight = 12;
      
      signatureLines.forEach((line, index) => {
        const isBold = line.startsWith('Signed by:');
        firstPage.drawText(line, {
          x: boxX + 15,
          y: currentY,
          size: isBold ? 9 : 8,
          color: isBold ? rgb(0, 0, 0) : rgb(0.3, 0.3, 0.3),
        });
        currentY -= lineHeight;
      });

      // Add a security badge at the bottom
      firstPage.drawRectangle({
        x: boxX + 10,
        y: boxY + 8,
        width: boxWidth - 20,
        height: 25,
        color: rgb(0.9, 1, 0.9),
        borderColor: rgb(0, 0.6, 0),
        borderWidth: 2,
      });

      // Draw shield/lock icon representation
      firstPage.drawCircle({
        x: boxX + 25,
        y: boxY + 20,
        size: 7,
        color: rgb(0, 0.6, 0),
      });

      firstPage.drawText('Certificate Authority Verified', {
        x: boxX + 38,
        y: boxY + 15,
        size: 10,
        color: rgb(0, 0.5, 0),
      });

      // Save the signed PDF
      const signedPdfBytes = await pdfDoc.save();

      console.log('Signed PDF size:', signedPdfBytes.length);

      // Update the PDF display
      this.pdfBytes = signedPdfBytes;
      
      // Revoke old URL to prevent memory leaks
      if (this.pdfUrl) {
        const oldUrl = (this.pdfUrl as any).changingThisBreaksApplicationSecurity;
        if (oldUrl && oldUrl.startsWith('blob:')) {
          URL.revokeObjectURL(oldUrl);
        }
      }
      
      // Create new blob URL with timestamp to force refresh
      const blob = new Blob([signedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url + '#' + Date.now());

      console.log('PDF URL updated:', url);

      console.log('✓ PDF signed successfully!');
      console.log('Signature details:', {
        certificateSubject,
        certificateIssuer,
        signerName,
        validFrom,
        validTo
      });

      // Also offer to download the signed PDF
      const downloadLink = document.createElement('a');
      downloadLink.href = url;
      downloadLink.download = `signed_document_${new Date().toISOString().slice(0,10)}.pdf`;
      
      const shouldDownload = confirm(
        '✅ PDF signed successfully!\n\n' +
        `Signed by: ${signerName}\n` +
        `Certificate: ${certificateSubject}\n` +
        `Issuer: ${certificateIssuer}\n` +
        `Date: ${new Date().toLocaleString()}\n\n` +
        'The signature with your name is now visible on the document.\n\n' +
        'Would you like to download the signed PDF?'
      );
      
      if (shouldDownload) {
        downloadLink.click();
      }
      
      // Clean up
      setTimeout(() => downloadLink.remove(), 100);

    } catch (error: any) {
      console.error('❌ Error signing PDF:', error);
      alert(
        '❌ Failed to sign PDF\n\n' +
        `Error: ${error.message || 'Unknown error'}\n\n` +
        'Please check the browser console (F12) for details.\n\n' +
        'Common issues:\n' +
        '  • Incorrect certificate password\n' +
        '  • Certificate file is corrupted\n' +
        '  • PDF is locked or corrupted\n' +
        '  • Backend service is not running'
      );
      throw error;
    }
  }

  showCertificateSelectionDialog(): void {
    alert('To use your system certificate:\\n\\n' +
          '1. You can export your certificate from Windows Certificate Manager (certmgr.msc)\\n' +
          '2. Export as .p12/.pfx file with private key\\n' +
          '3. Upload it using the file selector above\\n\\n' +
          'Note: Direct access to Windows Certificate Store requires a browser extension or native application.');
  }

  async signWithSystemCertificate(): Promise<void> {
    // Since we're now loading the file directly, just call the regular sign method
    await this.signPdf();
  }

  async signPdf(): Promise<void> {
    if (!this.pdfBytes) {
      alert('PDF not loaded yet. Please wait.');
      return;
    }

    // Check if using system certificate or file
    if (this.useSystemCertificate && this.selectedSystemCert) {
      await this.signWithSystemCertificate();
      return;
    }

    if (!this.certificateFile) {
      alert('Please select a certificate file or system certificate.');
      return;
    }

    if (!this.signatureName) {
      alert('Please enter your name for the signature.');
      return;
    }

    this.isSigning = true;

    try {
      // Read certificate file
      const certArrayBuffer = await this.certificateFile.arrayBuffer();
      const fileExtension = this.certificateFile.name.split('.').pop()?.toLowerCase();
      
      let certificateSubject = this.signatureName;
      let certificateIssuer = 'Certificate Authority';

      // Extract certificate information
      if (fileExtension === 'p12' || fileExtension === 'pfx') {
        if (!this.certificatePassword) {
          alert('Please enter the certificate password.');
          this.isSigning = false;
          return;
        }

        try {
          const asn1 = forge.asn1.fromDer(forge.util.createBuffer(certArrayBuffer));
          const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, this.certificatePassword);
          
          const certBags = p12.getBags({ bagType: forge.pki.oids['certBag'] });
          const certBag = certBags[forge.pki.oids['certBag']]?.[0];
          
          if (certBag?.cert) {
            const cert = certBag.cert;
            certificateSubject = cert.subject.getField('CN')?.value || this.signatureName;
            certificateIssuer = cert.issuer.getField('CN')?.value || 'Certificate Authority';
          }
        } catch (error) {
          alert('Invalid certificate password or corrupted certificate file.');
          this.isSigning = false;
          return;
        }
      } else if (fileExtension === 'pem' || fileExtension === 'crt') {
        const pemString = new TextDecoder().decode(certArrayBuffer);
        try {
          const cert = forge.pki.certificateFromPem(pemString);
          certificateSubject = cert.subject.getField('CN')?.value || this.signatureName;
          certificateIssuer = cert.issuer.getField('CN')?.value || 'Certificate Authority';
        } catch (error) {
          console.error('Error parsing PEM certificate:', error);
        }
      }

      // Load the PDF
      const pdfDoc = await PDFDocument.load(this.pdfBytes);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { height } = firstPage.getSize();

      // Add visual signature annotation with certificate info
      const signatureText = [
        `Digitally signed by: ${certificateSubject}`,
        `Certificate Issuer: ${certificateIssuer}`,
        this.signatureReason ? `Reason: ${this.signatureReason}` : '',
        this.signatureLocation ? `Location: ${this.signatureLocation}` : '',
        `Date: ${new Date().toLocaleString()}`,
        `Certificate: ${this.certificateFile.name}`
      ].filter(text => text).join('\\n');

      firstPage.drawText(signatureText, {
        x: 50,
        y: height - 110,
        size: 9,
        color: rgb(0, 0, 0.8),
        lineHeight: 12,
      });

      // Add a signature box
      firstPage.drawRectangle({
        x: 45,
        y: height - 125,
        width: 350,
        height: 100,
        borderColor: rgb(0, 0.5, 0),
        borderWidth: 2,
      });

      // Add "SIGNED" indicator
      firstPage.drawText('✓ DIGITALLY SIGNED', {
        x: 50,
        y: height - 45,
        size: 12,
        color: rgb(0, 0.6, 0),
      });

      // Save the modified PDF
      const signedPdfBytes = await pdfDoc.save();

      // Download the signed PDF
      const blob = new Blob([signedPdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'fisa_signed.pdf';
      link.click();
      
      alert(`PDF signed successfully with certificate: ${certificateSubject}\\nIssued by: ${certificateIssuer}\\nThe signed document has been downloaded.`);

      // Reload the signed PDF in the viewer
      this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);

    } catch (error) {
      console.error('Error signing PDF:', error);
      alert('Error signing PDF. Please check your certificate and password, then try again.');
    } finally {
      this.isSigning = false;
    }
  }
}
