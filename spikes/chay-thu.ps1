# Moc 0 - chay toan bo bai thu tren may ao sach. Bam dup chay-thu.cmd (file nay duoc goi tu do).
# Ket qua ghi vao ketqua-may-ao.txt canh file nay: gui file do lai la du.

$ErrorActionPreference = 'Continue'
Set-Location $PSScriptRoot
$out = Join-Path $PSScriptRoot 'ketqua-may-ao.txt'
Start-Transcript -Path $out -Force | Out-Null

$rt = Join-Path $PSScriptRoot 'output\runtimes'
$sys = $env:SystemRoot
$env:PATH = @((Join-Path $rt 'bin'), (Join-Path $rt 'node'), (Join-Path $rt 'python'), (Join-Path $rt 'git\cmd'),
  "$sys\System32", $sys, "$sys\System32\Wbem", "$sys\System32\WindowsPowerShell\v1.0") -join ';'
$node = Join-Path $rt 'node\node.exe'
$prompt = 'Run exactly this in the project folder: py scripts/check_script.py dao-ham-tiep-tuyen . Then run: git status --short . Then summarize the results in at most 3 lines, in Vietnamese. Do not edit any file and do not read any skill.'

Write-Host "`n##### May: $env:COMPUTERNAME, Windows $([Environment]::OSVersion.Version), nguoi dung: co dau? $($env:USERNAME -match '[^\x00-\x7F]')"
Write-Host "##### O trong: $([math]::Round((Get-PSDrive ($PSScriptRoot.Substring(0,1))).Free/1GB,1)) GB"

Write-Host "`n##### 1/5 Runtime, tai du an, cai thu vien, storyboard, render" -ForegroundColor Yellow
powershell -NoProfile -ExecutionPolicy Bypass -File (Join-Path $PSScriptRoot 'moc0-test.ps1')

Write-Host "`n##### 2/5 Bat va tat Remotion Studio" -ForegroundColor Yellow
& $node studio-probe.mjs

Write-Host "`n##### 3/5 Dang nhap ChatGPT: trinh duyet se mo, ban dang nhap roi bam Tiep tuc" -ForegroundColor Yellow
& $node codex-probe.mjs login

Write-Host "`n##### 4/5 Sandbox CHUA chuan bi: thu mot luot AI (dem so lan xin quyen)" -ForegroundColor Yellow
& $node codex-probe.mjs status
& $node codex-probe.mjs turn $prompt

Write-Host "`n##### 5/5 Chuan bi sandbox (khong can quyen admin), roi thu lai" -ForegroundColor Yellow
Write-Host "Neu Windows hien hop thoai hoi quyen, chup man hinh lai roi bam Co/Yes." -ForegroundColor Yellow
& $node codex-probe.mjs sandbox-setup unelevated
& $node codex-probe.mjs turn $prompt

Stop-Transcript | Out-Null
Write-Host "`nXONG. Gui file nay: $out" -ForegroundColor Green
Read-Host 'Bam Enter de dong'
