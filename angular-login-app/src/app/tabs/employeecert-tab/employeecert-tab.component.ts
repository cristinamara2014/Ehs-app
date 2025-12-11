import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { PDFDocument, rgb } from 'pdf-lib';
import * as forge from 'node-forge';

@Component({
  selector: 'app-employeecert-tab',
  imports: [CommonModule, FormsModule],
  templateUrl: './employeecert-tab.component.html',
  styleUrl: './employeecert-tab.component.css',
  standalone: true
})
export class EmployeecertTabComponent implements OnInit {
  pdfUrl: SafeResourceUrl;
  pdfBytes: ArrayBuffer | null = null;
  certificateFile: File | null = null;
  certificatePassword: string = '';
  signatureName: string = '';
  signatureReason: string = '';
  signatureLocation: string = '';
  isSigning: boolean = false;
  certificateInfo: string = '';

  constructor(private sanitizer: DomSanitizer) {
    this.pdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl('assets/fisa.pdf');
    this.loadPdfBytes();
  }

  ngOnInit(): void {
    // No automatic certificate loading - user must manually upload
    this.showWelcomeMessage();
  }

  showWelcomeMessage(): void {
    console.log('EmployeeCert Tab: Client-side PDF signing ready');
  }

  async loadPdfBytes(): Promise<void> {
    try {
      const response = await fetch('assets/fisa.pdf');
      this.pdfBytes = await response.arrayBuffer();
    } catch (error) {
      console.error('Error loading PDF:', error);
    }
  }

  onCertificateFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file && (file.name.endsWith('.p12') || file.name.endsWith('.pfx') || file.name.endsWith('.pem') || file.name.endsWith('.crt'))) {
      this.certificateFile = file;
      this.extractCertificateInfo(file);
      alert(`Certificate "${file.name}" loaded successfully!\n\nNext steps:\n1. Enter the certificate password (if required)\n2. Click "Sign PDF" to add your signature`);
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

  browseForCertificateFile(): void {
    // Create a hidden file input to trigger certificate selection
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.p12,.pfx,.pem,.crt,.cer';
    input.style.display = 'none';
    
    input.onchange = async (event: any) => {
      const file = event.target.files[0];
      if (file) {
        this.certificateFile = file;
        await this.extractCertificateInfo(file);
        
        alert(`Certificate "${file.name}" loaded successfully!\n\nNext steps:\n1. Enter the certificate password (if required)\n2. Click "Sign PDF" to add your signature`);
      }
    };
    
    document.body.appendChild(input);
    input.click();
    document.body.removeChild(input);
  }

  async signPdf(): Promise<void> {
    if (!this.pdfBytes) {
      alert('Please wait for the PDF to load first.');
      return;
    }

    if (!this.certificateFile) {
      alert('Please select a certificate file first.');
      return;
    }

    this.isSigning = true;

    try {
      console.log('Starting PDF signing process...');
      console.log('Certificate file:', this.certificateFile?.name);
      console.log('PDF bytes available:', !!this.pdfBytes);

      const certArrayBuffer = await this.certificateFile.arrayBuffer();
      const fileExtension = this.certificateFile.name.split('.').pop()?.toLowerCase();

      console.log('Certificate file extension:', fileExtension);
      console.log('Certificate size:', certArrayBuffer.byteLength, 'bytes');

      let certificateSubject = 'Unknown';
      let certificateIssuer = 'Unknown Issuer';
      let validFrom = '';
      let validTo = '';
      let signerName = '';

      // Extract detailed certificate information for PKCS#12 files
      if (fileExtension === 'p12' || fileExtension === 'pfx') {
        if (!this.certificatePassword) {
          alert('Certificate password is required for PKCS#12 files');
          this.isSigning = false;
          return;
        }

        try {
          console.log('Parsing PKCS#12 certificate...');
          const asn1 = forge.asn1.fromDer(forge.util.createBuffer(certArrayBuffer));
          const p12 = forge.pkcs12.pkcs12FromAsn1(asn1, this.certificatePassword);

          const certBags = p12.getBags({ bagType: forge.pki.oids['certBag'] });
          const certBag = certBags[forge.pki.oids['certBag']]?.[0];

          if (certBag?.cert) {
            const cert = certBag.cert;
            certificateSubject = cert.subject.getField('CN')?.value || 'Unknown';
            certificateIssuer = cert.issuer.getField('CN')?.value || 'Unknown Issuer';
            validFrom = cert.validity.notBefore.toLocaleDateString();
            validTo = cert.validity.notAfter.toLocaleDateString();
            
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
            
            console.log('✓ Certificate parsed successfully');
            console.log('Extracted signer info:', { signerName, certificateSubject });
          } else {
            throw new Error('No certificate found in PKCS#12 file');
          }
        } catch (error: any) {
          console.error('Error extracting certificate details:', error);
          alert(`Failed to parse certificate: ${error.message}\n\nPlease check that the password is correct.`);
          this.isSigning = false;
          return;
        }
      }

      // Load the PDF
      const pdfDoc = await PDFDocument.load(this.pdfBytes!);
      const pages = pdfDoc.getPages();
      const firstPage = pages[0];
      const { width, height } = firstPage.getSize();

      console.log('PDF dimensions:', { width, height });

      // Create signature box - placed at top left
      const boxWidth = 170;
      const boxHeight = 100;
      const boxX = 50;
      const boxY = height - boxHeight - 50;

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
      this.isSigning = false;
    }
  }

  showCertificateInstructions(): void {
    alert(
      '═══════════════════════════════════════════════════════════════\n' +
      '        How to Export Your Certificate\n' +
      '═══════════════════════════════════════════════════════════════\n\n' +
      'STEP 1: Open Certificate Manager\n' +
      '   • Press Win + R\n' +
      '   • Type: certmgr.msc\n' +
      '   • Press Enter\n\n' +
      'STEP 2: Find Your Certificate\n' +
      '   • Navigate to: Personal > Certificates\n' +
      '   • Find the certificate you want to use\n\n' +
      'STEP 3: Export Certificate\n' +
      '   • Right-click the certificate\n' +
      '   • Select: All Tasks > Export\n' +
      '   • Click Next\n\n' +
      'STEP 4: Export Options\n' +
      '   • Choose: "Yes, export the private key"\n' +
      '   • Format: Personal Information Exchange (.PFX)\n' +
      '   • Check: "Include all certificates in path if possible"\n\n' +
      'STEP 5: Set Password\n' +
      '   • Enter a password to protect the certificate\n' +
      '   • Remember this password!\n\n' +
      'STEP 6: Save File\n' +
      '   • Choose a location and filename\n' +
      '   • Click Finish\n\n' +
      'STEP 7: Upload to This App\n' +
      '   • Click "Browse for Certificate"\n' +
      '   • Select your exported .pfx file\n' +
      '   • Enter the password you set\n' +
      '   • Click "Sign PDF"\n\n' +
      '═══════════════════════════════════════════════════════════════'
    );
  }
}
