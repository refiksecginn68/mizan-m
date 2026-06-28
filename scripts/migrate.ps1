# Supabase migration çalıştırıcı
# Kullanım:
#   .\scripts\migrate.ps1                          → tüm migration'ları sırayla çalıştırır
#   .\scripts\migrate.ps1 004_clients_uyap_fields.sql  → tek dosya

param([string]$File = "--all")

$env:SUPABASE_ACCESS_TOKEN = $env:SUPABASE_ACCESS_TOKEN  # .env.local'dan oku
$supabase = "$env:USERPROFILE\supabase-cli\supabase.exe"

if ($File -eq "--all") {
    $files = Get-ChildItem "supabase\migrations\*.sql" | Sort-Object Name
    foreach ($f in $files) {
        Write-Host "→ $($f.Name)" -ForegroundColor Cyan
        $result = & $supabase db query --linked -f $f.FullName -o json 2>&1
        if ($LASTEXITCODE -eq 0) {
            Write-Host "  ✓ Tamam" -ForegroundColor Green
        } else {
            $msg = $result | Out-String
            if ($msg -match "already exists") {
                Write-Host "  ⚠ Zaten mevcut, atlandı" -ForegroundColor Yellow
            } else {
                Write-Host "  ✗ Hata: $msg" -ForegroundColor Red
            }
        }
    }
} else {
    $path = "supabase\migrations\$File"
    Write-Host "→ $File" -ForegroundColor Cyan
    & $supabase db query --linked -f $path -o json 2>&1
    if ($LASTEXITCODE -eq 0) {
        Write-Host "✓ Tamam" -ForegroundColor Green
    }
}
