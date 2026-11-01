<#
.SYNOPSIS
    Runs the Firebase CLI with a real JDK first on PATH, so emulators shut down.

.DESCRIPTION
    On Windows, `java` on PATH can be Oracle's javapath launcher stub, which starts
    the real JVM as a child process. The Firebase CLI stops the Firestore emulator
    by killing the process it spawned, so it kills the stub and the JVM keeps
    running, holding ports 8080 and 9150 until it is killed by hand. Running the
    real java.exe directly gives the CLI the JVM itself to stop.

.EXAMPLE
    .\scripts\firebase-dev.ps1 emulators:exec --only auth,firestore --import=seed "npm run start:development"
#>

$jdkHomes = @()
if ($env:JAVA_HOME) { $jdkHomes += $env:JAVA_HOME }
$jdkHomes += Get-ChildItem 'C:\Program Files\Java\jdk-*' -Directory -ErrorAction SilentlyContinue |
    Sort-Object Name -Descending |
    ForEach-Object { $_.FullName }

$jdkBin = $jdkHomes |
    ForEach-Object { Join-Path $_ 'bin' } |
    Where-Object { Test-Path (Join-Path $_ 'java.exe') } |
    Select-Object -First 1

if (-not $jdkBin) {
    Write-Error 'No JDK found. Set JAVA_HOME or install a JDK under C:\Program Files\Java.'
    exit 1
}

$env:PATH = "$jdkBin;$env:PATH"
Write-Host "Using Java from $jdkBin"

firebase @args
exit $LASTEXITCODE
