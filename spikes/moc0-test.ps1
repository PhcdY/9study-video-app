# Moc 0 - bai thu runtime dong goi voi PATH sach (gia lap may CTV chua cai gi).
# Chay duoc tren may dev lan may ao sach. Thu muc goc chua: runtimes\, codex\ (tuy chon), va noi clone repo.
#
#   powershell -ExecutionPolicy Bypass -File moc0-test.ps1 [-Base D:\9StudyTest] [-Composition <id>] [-SkipInstall]
#
# Moi buoc in OK/LOI va thoi gian; ket qua ghi vao <Base>\moc0-ketqua.txt

param(
  [string]$Base = (Join-Path $PSScriptRoot 'output'),
  [string]$Composition = 'physics-showcase',
  [string]$Storyboard = 'tiem-can',
  [switch]$SkipInstall
)

$ErrorActionPreference = 'Continue'
$rt = Join-Path $Base 'runtimes'
$repo = Join-Path $Base 'video-repo'
$report = Join-Path $Base 'moc0-ketqua.txt'
"Moc 0 - $(Get-Date -Format s) - $env:COMPUTERNAME" | Out-File $report -Encoding utf8

# PATH sach: chi runtime dong goi + thu muc he thong cua Windows
$sys = $env:SystemRoot
$env:PATH = @(
  (Join-Path $rt 'bin'), (Join-Path $rt 'node'), (Join-Path $rt 'python'), (Join-Path $rt 'git\cmd'),
  "$sys\System32", $sys, "$sys\System32\Wbem", "$sys\System32\WindowsPowerShell\v1.0"
) -join ';'
# cache npm va TEMP vao thu muc khong dau (ten nguoi dung co the co dau)
$env:npm_config_cache = Join-Path $Base 'cache\npm'
$env:TEMP = Join-Path $Base 'cache\tmp'; $env:TMP = $env:TEMP
New-Item -ItemType Directory -Force $env:TEMP | Out-Null
$env:PYTHONUTF8 = '1'

function Step($name, [scriptblock]$body) {
  $sw = [Diagnostics.Stopwatch]::StartNew()
  Write-Host "`n=== $name" -ForegroundColor Cyan
  $out = & $body 2>&1 | Tee-Object -Variable lines
  $ok = $LASTEXITCODE -eq 0 -or $null -eq $LASTEXITCODE
  $t = [int]$sw.Elapsed.TotalSeconds
  $status = if ($ok) { 'OK ' } else { "LOI (exit $LASTEXITCODE)" }
  Write-Host "--> $status ${t}s" -ForegroundColor ($(if ($ok) { 'Green' } else { 'Red' }))
  "$status ${t}s  $name" | Out-File $report -Append -Encoding utf8
  if (-not $ok) { ($lines | Select-Object -Last 15) -join "`n" | Out-File $report -Append -Encoding utf8 }
  $global:LASTEXITCODE = 0
}

Step 'Lenh tro dung ban dong goi' {
  foreach ($c in 'node', 'npm', 'npx', 'py', 'python', 'git') { "$c -> $((Get-Command $c -ErrorAction SilentlyContinue).Source)" }
  node -v; py -V; git --version
}

if (-not (Test-Path (Join-Path $repo '.git'))) {
  Step 'Tai du an (clone main-codex)' {
    git -c core.longpaths=true clone --branch main-codex https://github.com/PhcdY/remotion_claudecode.git $repo
  }
}
Set-Location $repo
git config core.longpaths true

Step 'Chuyen sang ban phat hanh so lon nhat' {
  git fetch --tags --quiet
  $tag = git tag | Where-Object { $_ -match '^\d+$' } | Sort-Object { [int]$_ } | Select-Object -Last 1
  "ban lon nhat: $tag"
  git switch --detach "refs/tags/$tag"
}

if (-not $SkipInstall) {
  Step 'Cai thu vien (npm ci)' { npm ci --no-fund --no-audit }
}

Step 'Tai trinh duyet render (remotion browser ensure)' { npx remotion browser ensure }

Step 'Python: check_script.py' { py scripts/check_script.py dao-ham-tiep-tuyen; if ($LASTEXITCODE -eq 1) { 'exit 1 = kich ban co loi noi dung, script van chay duoc'; $global:LASTEXITCODE = 0 } }

# Khong dung 'remotion compositions': lenh nay loi ca repo khi co video chua co audio (public/audio khong commit).

if ($Storyboard) {
  # storyboard.mjs dung Chrome cai san neu co; may CTV khong co Chrome thi dung trinh duyet Remotion tai ve.
  Step "Storyboard nhap ($Storyboard)" { node scripts/storyboard.mjs $Storyboard --scale 0.3 }
}
if ($Composition) {
  Step "Render thu 2 giay ($Composition)" { npx remotion render $Composition (Join-Path $Base 'thu.mp4') --frames=0-59 }
}

Write-Host "`nKet qua: $report"
Get-Content $report
