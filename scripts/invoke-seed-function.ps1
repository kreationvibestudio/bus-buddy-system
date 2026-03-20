# Script to invoke the comprehensive seed data function
# Requires service role key from Supabase Dashboard

param(
    [Parameter(Mandatory=$false)]
    [string]$ServiceRoleKey = ""
)

# Get project URL from .env.local
$envFile = ".env.local"
if (-not (Test-Path $envFile)) {
    Write-Host "Error: .env.local file not found" -ForegroundColor Red
    exit 1
}

$envContent = Get-Content $envFile
$supabaseUrl = ($envContent | Select-String "VITE_SUPABASE_URL=").ToString().Split("=")[1].Trim('"')

if ([string]::IsNullOrEmpty($supabaseUrl)) {
    Write-Host "Error: VITE_SUPABASE_URL not found in .env.local" -ForegroundColor Red
    exit 1
}

# If service role key not provided, prompt user
if ([string]::IsNullOrEmpty($ServiceRoleKey)) {
    Write-Host "Service Role Key is required to invoke the function." -ForegroundColor Yellow
    Write-Host "You can find it in: Supabase Dashboard > Settings > API > service_role key" -ForegroundColor Yellow
    $ServiceRoleKey = Read-Host "Enter your Service Role Key (or press Ctrl+C to cancel)"
}

$functionUrl = "$supabaseUrl/functions/v1/seed-comprehensive-data"

Write-Host "Invoking seed function at: $functionUrl" -ForegroundColor Cyan
Write-Host ""

try {
    $headers = @{
        "Authorization" = "Bearer $ServiceRoleKey"
        "Content-Type" = "application/json"
    }

    $response = Invoke-WebRequest -Uri $functionUrl -Method POST -Headers $headers -ErrorAction Stop

    Write-Host "✅ Function invoked successfully!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Response:" -ForegroundColor Cyan
    $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 10
} catch {
    Write-Host "❌ Error invoking function:" -ForegroundColor Red
    Write-Host $_.Exception.Message -ForegroundColor Red
    
    if ($_.Exception.Response) {
        $reader = New-Object System.IO.StreamReader($_.Exception.Response.GetResponseStream())
        $responseBody = $reader.ReadToEnd()
        Write-Host "Response body: $responseBody" -ForegroundColor Yellow
    }
}
