# PowerShell script to export a certificate by thumbprint
# Usage: .\export-certificate.ps1 -Thumbprint "..." -OutputPath "..." -Password "..."

param(
    [Parameter(Mandatory=$true)]
    [string]$Thumbprint,
    
    [Parameter(Mandatory=$true)]
    [string]$OutputPath,
    
    [Parameter(Mandatory=$true)]
    [string]$Password
)

try {
    # Get the certificate from the Personal store
    $cert = Get-ChildItem -Path Cert:\CurrentUser\My\$Thumbprint -ErrorAction Stop
    
    if (-not $cert) {
        Write-Error "Certificate not found with thumbprint: $Thumbprint"
        exit 1
    }
    
    if (-not $cert.HasPrivateKey) {
        Write-Error "Certificate does not have a private key"
        exit 1
    }
    
    # Convert password to secure string
    $securePassword = ConvertTo-SecureString -String $Password -Force -AsPlainText
    
    # Export certificate with private key as PFX
    $certBytes = $cert.Export([System.Security.Cryptography.X509Certificates.X509ContentType]::Pfx, $securePassword)
    [System.IO.File]::WriteAllBytes($OutputPath, $certBytes)
    
    Write-Host "Certificate exported successfully to: $OutputPath"
    
    # Return certificate info as JSON
    $certInfo = @{
        Success = $true
        Thumbprint = $cert.Thumbprint
        Subject = $cert.Subject
        Issuer = $cert.Issuer
        FilePath = $OutputPath
    }
    
    $certInfo | ConvertTo-Json
    
} catch {
    Write-Error "Error exporting certificate: $_"
    
    $error = @{
        Success = $false
        Error = $_.Exception.Message
    }
    
    $error | ConvertTo-Json
    exit 1
}
