# PowerShell script to retrieve user's personal certificates
# Returns certificates with Client Authentication purpose from current user's Personal store

$currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
$userName = $currentUser.Split('\')[-1]

# Write informational messages to error stream so they don't interfere with JSON output
Write-Error "Searching certificates for user: $userName" -ErrorAction Continue

# Get certificates from Personal store
$certs = Get-ChildItem -Path Cert:\CurrentUser\My

$results = @()

foreach ($cert in $certs) {
    # Check if certificate has Client Authentication EKU (1.3.6.1.5.5.7.3.2)
    $hasClientAuth = $false
    
    foreach ($eku in $cert.EnhancedKeyUsageList) {
        if ($eku.ObjectId -eq "1.3.6.1.5.5.7.3.2") {
            $hasClientAuth = $true
            break
        }
    }
    
    # Include certificate if it has Client Authentication and a private key
    # All certificates in CurrentUser\My belong to the current user
    if ($hasClientAuth -and $cert.HasPrivateKey) {
        $certInfo = @{
            Thumbprint = $cert.Thumbprint
            Subject = $cert.Subject
            Issuer = $cert.Issuer
            NotBefore = $cert.NotBefore.ToString("yyyy-MM-dd")
            NotAfter = $cert.NotAfter.ToString("yyyy-MM-dd")
            FriendlyName = $cert.FriendlyName
            HasPrivateKey = $cert.HasPrivateKey
        }
        
        $results += $certInfo
    }
}

Write-Error "Found $($results.Count) certificate(s) with Client Authentication" -ErrorAction Continue

# Output as JSON for the Angular app to consume
$results | ConvertTo-Json
