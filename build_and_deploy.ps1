# ═══════════════════════════════════════════════════════════════════════════════
# build_and_deploy.ps1
# Room2Scan 전체 빌드 자동화
#   1. Unity Android Export  (CLI batchmode)
#   2. Gradle assembleDebug
#   3. 에뮬레이터 APK 설치
# ═══════════════════════════════════════════════════════════════════════════════

param(
    [switch]$SkipUnity,    # Unity export 건너뜀 (C# 코드 변경 없을 때)
    [switch]$SkipGradle,   # Gradle 빌드 건너뜀 (APK 재설치만 할 때)
    [switch]$SkipInstall   # APK 설치 건너뜀
)

$ErrorActionPreference = "Stop"

$UNITY_EXE     = "C:\Program Files\Unity\Hub\Editor\6000.3.11f1\Editor\Unity.exe"
$UNITY_PROJECT = "E:\unity\room2scan_unity"
$UNITY_OUTPUT  = "E:\unity\room2scan_unity_android"
$UNITY_METHOD  = "Room2Scan.Bridge.Editor.AndroidExportBuilder.ExportAndroidUnityLibraryFromCommandLine"
$UNITY_LOG     = "E:\unity\room2scan_app\unity_build.log"

$GRADLE_DIR    = "E:\unity\room2scan_app\android"
$APK_PATH      = "E:\unity\room2scan_app\android\app\build\outputs\apk\debug\app-debug.apk"
$PACKAGE_NAME  = "com.scan2room.app"

$STEP = 0

function Log-Step($msg) {
    $global:STEP++
    Write-Host ""
    Write-Host "[$global:STEP] $msg" -ForegroundColor Cyan
    Write-Host ("─" * 60) -ForegroundColor DarkGray
}

function Log-OK($msg)   { Write-Host "  ✅ $msg" -ForegroundColor Green }
function Log-WARN($msg) { Write-Host "  ⚠️  $msg" -ForegroundColor Yellow }
function Log-ERR($msg)  { Write-Host "  ❌ $msg" -ForegroundColor Red }

# ────────────────────────────────────────────────────────────────────────────────
# STEP 1: Unity Android Export
# ────────────────────────────────────────────────────────────────────────────────
if (-not $SkipUnity) {
    Log-Step "Unity Android Export"

    if (-not (Test-Path $UNITY_EXE)) {
        Log-ERR "Unity not found at: $UNITY_EXE"
        exit 1
    }

    Write-Host "  Unity: $UNITY_EXE"
    Write-Host "  Project: $UNITY_PROJECT"
    Write-Host "  Output: $UNITY_OUTPUT"
    Write-Host "  Log: $UNITY_LOG"
    Write-Host ""
    Write-Host "  (Unity batchmode — this takes ~5-10 minutes)" -ForegroundColor Yellow

    $unityArgs = @(
        "-batchmode",
        "-quit",
        "-nographics",
        "-projectPath", $UNITY_PROJECT,
        "-executeMethod", $UNITY_METHOD,
        "-room2scanOutput", $UNITY_OUTPUT,
        "-logFile", $UNITY_LOG
    )

    $proc = Start-Process -FilePath $UNITY_EXE -ArgumentList $unityArgs -Wait -PassThru -NoNewWindow
    if ($proc.ExitCode -ne 0) {
        Log-ERR "Unity export failed (exit code $($proc.ExitCode))"
        Write-Host "  See log: $UNITY_LOG" -ForegroundColor Yellow
        # Print last 30 lines of log for quick diagnosis
        if (Test-Path $UNITY_LOG) {
            Write-Host ""
            Write-Host "  ── Last 30 lines of Unity log ──" -ForegroundColor DarkGray
            Get-Content $UNITY_LOG | Select-Object -Last 30 | ForEach-Object { Write-Host "  $_" -ForegroundColor DarkGray }
        }
        exit 1
    }

    Log-OK "Unity export complete"
} else {
    Log-Step "Unity Export — SKIPPED (--SkipUnity)"
    Log-WARN "Using existing unityLibrary at $UNITY_OUTPUT"
}

# ────────────────────────────────────────────────────────────────────────────────
# STEP 2: Gradle assembleDebug
# ────────────────────────────────────────────────────────────────────────────────
if (-not $SkipGradle) {
    Log-Step "Gradle assembleDebug"

    if (-not (Test-Path "$GRADLE_DIR\gradlew.bat")) {
        Log-ERR "gradlew.bat not found in $GRADLE_DIR"
        exit 1
    }

    Write-Host "  Working dir: $GRADLE_DIR"
    Write-Host "  (Gradle build — this takes ~5-20 minutes)" -ForegroundColor Yellow

    Push-Location $GRADLE_DIR
    try {
        & ".\gradlew.bat" assembleDebug
        if ($LASTEXITCODE -ne 0) {
            Log-ERR "Gradle build failed (exit code $LASTEXITCODE)"
            exit 1
        }
    } finally {
        Pop-Location
    }

    if (-not (Test-Path $APK_PATH)) {
        Log-ERR "APK not found after build: $APK_PATH"
        exit 1
    }

    $apkSize = [math]::Round((Get-Item $APK_PATH).Length / 1MB, 1)
    Log-OK "APK built: $APK_PATH ($apkSize MB)"
} else {
    Log-Step "Gradle Build — SKIPPED (--SkipGradle)"
    if (Test-Path $APK_PATH) {
        $apkSize = [math]::Round((Get-Item $APK_PATH).Length / 1MB, 1)
        Log-WARN "Using existing APK ($apkSize MB)"
    } else {
        Log-ERR "APK not found: $APK_PATH"
        exit 1
    }
}

# ────────────────────────────────────────────────────────────────────────────────
# STEP 3: APK install to emulator
# ────────────────────────────────────────────────────────────────────────────────
if (-not $SkipInstall) {
    Log-Step "APK Install"

    # Check ADB
    $adbPath = (Get-Command adb -ErrorAction SilentlyContinue)?.Source
    if (-not $adbPath) {
        Log-ERR "adb not found in PATH"
        exit 1
    }

    # Check device/emulator
    $devices = adb devices 2>&1 | Select-String "emulator|device" | Where-Object { $_ -notmatch "List of" }
    if (-not $devices) {
        Log-WARN "No device/emulator detected — attempting to launch room2scan_pixel AVD"
        $emulatorExe = "$env:LOCALAPPDATA\Android\Sdk\emulator\emulator.exe"
        if (Test-Path $emulatorExe) {
            Start-Process -FilePath $emulatorExe -ArgumentList @("-avd", "room2scan_pixel", "-no-snapshot-load") -WindowStyle Normal
            Write-Host "  Waiting for emulator to boot (up to 90s)..." -ForegroundColor Yellow
            $waited = 0
            while ($waited -lt 90) {
                Start-Sleep -Seconds 5; $waited += 5
                $d = adb devices 2>&1 | Select-String "emulator-\d+\s+device"
                if ($d) {
                    $anim = adb shell getprop init.svc.bootanim 2>&1
                    if ($anim -match "stopped") { break }
                }
                Write-Host "  ...${waited}s" -ForegroundColor DarkGray
            }
        } else {
            Log-ERR "Android emulator not found at $emulatorExe"
            exit 1
        }
    }

    Write-Host "  Uninstalling old APK..."
    adb shell pm uninstall $PACKAGE_NAME 2>&1 | Out-Null

    Write-Host "  Installing new APK..."
    $result = adb install -r $APK_PATH 2>&1
    if ($result -match "Success") {
        Log-OK "APK installed: $PACKAGE_NAME"
    } else {
        Log-ERR "adb install failed: $result"
        exit 1
    }

    Write-Host "  Launching app..."
    adb shell monkey -p $PACKAGE_NAME -c android.intent.category.LAUNCHER 1 | Out-Null
    Log-OK "App launched"
} else {
    Log-Step "APK Install — SKIPPED (--SkipInstall)"
}

# ────────────────────────────────────────────────────────────────────────────────
# Summary
# ────────────────────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "═" * 60 -ForegroundColor Green
Write-Host "  BUILD & DEPLOY COMPLETE" -ForegroundColor Green
Write-Host "═" * 60 -ForegroundColor Green
Write-Host ""
