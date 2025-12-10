const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    service: 'Certificate Management Service',
    version: '1.0.0',
    status: 'running',
    endpoints: [
      { method: 'GET', path: '/api/certificates', description: 'Get user certificates from Windows Certificate Store' },
      { method: 'POST', path: '/api/certificates/export', description: 'Export certificate as PFX' },
      { method: 'GET', path: '/health', description: 'Health check endpoint' }
    ]
  });
});

// API endpoint to get certificates
app.get('/api/certificates', (req, res) => {
  const scriptPath = path.join(__dirname, '../scripts/get-certificates.ps1');
  
  // Execute PowerShell script
  exec(`powershell.exe -ExecutionPolicy Bypass -File "${scriptPath}"`, (error, stdout, stderr) => {
    if (error) {
      console.error('Error executing script:', error);
      return res.status(500).json({ error: 'Failed to execute certificate script', details: error.message });
    }

    if (stderr) {
      console.error('Script stderr:', stderr);
    }

    try {
      // Parse JSON output from PowerShell script
      const certificates = JSON.parse(stdout);
      res.json(certificates);
    } catch (parseError) {
      console.error('Error parsing JSON:', parseError);
      console.log('Script output:', stdout);
      res.status(500).json({ error: 'Failed to parse certificate data', output: stdout });
    }
  });
});

// API endpoint to export certificate
app.post('/api/certificates/export', (req, res) => {
  const { thumbprint, password } = req.body;

  if (!thumbprint || !password) {
    return res.status(400).json({ error: 'Thumbprint and password are required' });
  }

  const scriptPath = path.join(__dirname, '../scripts/export-certificate.ps1');
  const outputPath = path.join(require('os').tmpdir(), `cert_${Date.now()}.pfx`);

  const command = `powershell.exe -ExecutionPolicy Bypass -File "${scriptPath}" -Thumbprint "${thumbprint}" -OutputPath "${outputPath}" -Password "${password}"`;

  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error('Error exporting certificate:', error);
      return res.status(500).json({ 
        Success: false,
        Error: 'Failed to export certificate', 
        details: error.message 
      });
    }

    if (stderr) {
      console.error('Export stderr:', stderr);
    }

    try {
      // Check if file was created
      if (fs.existsSync(outputPath)) {
        // Read the certificate file
        const certData = fs.readFileSync(outputPath);
        const base64Cert = certData.toString('base64');

        // Delete the temporary file
        fs.unlinkSync(outputPath);

        res.json({
          Success: true,
          Certificate: base64Cert,
          message: 'Certificate exported successfully'
        });
      } else {
        res.status(500).json({ 
          Success: false,
          Error: 'Certificate file was not created' 
        });
      }
    } catch (fileError) {
      console.error('Error handling certificate file:', fileError);
      res.status(500).json({ 
        Success: false,
        Error: 'Failed to read certificate file', 
        details: fileError.message 
      });
    }
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', message: 'Certificate service is running' });
});

app.listen(PORT, () => {
  console.log(`Certificate service running on http://localhost:${PORT}`);
  console.log(`Available endpoints:`);
  console.log(`  GET  /api/certificates - Get user certificates`);
  console.log(`  POST /api/certificates/export - Export certificate`);
  console.log(`  GET  /health - Health check`);
});
