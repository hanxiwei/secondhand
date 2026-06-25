pipeline {
  agent {
    node {
      label ''
      customWorkspace 'D:\\python\\second-hand02'
    }
  }

  environment {
    PYTHON_EXE = 'D:\\immovable\\python313\\python.exe'
    FEISHU_WEBHOOK = credentials('FEISHU_WEBHOOK')
    FEISHU_SECRET = ''
    API_HEALTH_URL = 'http://127.0.0.1:3000/api/categories/tree'
    WEB_HEALTH_URL = 'http://127.0.0.1:5191/'
    REPORT_URL = ''
    AI_REPORT_URL = ''
  }

  triggers {
    cron('H 2 * * *')
  }

  stages {
    stage('Install Dependencies') {
      steps {
        bat 'if not exist qa\\reports mkdir qa\\reports'
        bat '"%PYTHON_EXE%" -m pip install -r qa/requirements.txt'
        bat '"%PYTHON_EXE%" -m playwright install chromium'
      }
    }

    stage('Start Services') {
      steps {
        powershell '''
          $serverUrl = $env:API_HEALTH_URL
          try {
            Invoke-WebRequest -UseBasicParsing -Uri $serverUrl -TimeoutSec 5 | Out-Null
            Write-Host "Backend is already running: $serverUrl"
          } catch {
            Write-Host "Backend is not running, starting Nest service..."
            Start-Process cmd.exe -ArgumentList '/c', 'npm run start > ..\\qa\\reports\\server.log 2>&1' -WorkingDirectory 'D:\\python\\second-hand02\\server' -WindowStyle Hidden
            $deadline = (Get-Date).AddMinutes(2)
            $ready = $false
            while ((Get-Date) -lt $deadline) {
              try {
                Invoke-WebRequest -UseBasicParsing -Uri $serverUrl -TimeoutSec 5 | Out-Null
                $ready = $true
                break
              } catch {
                Start-Sleep -Seconds 3
              }
            }
            if (-not $ready) {
              throw "Backend did not become ready: $serverUrl"
            }
          }

          $webUrl = $env:WEB_HEALTH_URL
          try {
            Invoke-WebRequest -UseBasicParsing -Uri $webUrl -TimeoutSec 5 | Out-Null
            Write-Host "Web frontend is already running: $webUrl"
          } catch {
            Write-Host "Web frontend is not running, starting Vite dev server..."
            Start-Process cmd.exe -ArgumentList '/c', 'npm run dev -- --host 127.0.0.1 --port 5191 > ..\\qa\\reports\\web.log 2>&1' -WorkingDirectory 'D:\\python\\second-hand02\\web' -WindowStyle Hidden
            $deadline = (Get-Date).AddMinutes(2)
            $ready = $false
            while ((Get-Date) -lt $deadline) {
              try {
                Invoke-WebRequest -UseBasicParsing -Uri $webUrl -TimeoutSec 5 | Out-Null
                $ready = $true
                break
              } catch {
                Start-Sleep -Seconds 3
              }
            }
            if (-not $ready) {
              throw "Web frontend did not become ready: $webUrl"
            }
          }
        '''
      }
    }

    stage('Run API Tests') {
      steps {
        bat '"%PYTHON_EXE%" qa/scripts/run_all_tests.py'
      }
    }

    stage('Generate Summary') {
      steps {
        script {
          env.REPORT_URL = "${env.BUILD_URL}allure/"
          env.AI_REPORT_URL = "${env.BUILD_URL}artifact/qa/reports/deepseek-report.md"
        }
        bat '"%PYTHON_EXE%" qa/scripts/ai_summary.py'
      }
    }

    stage('Quality Gate') {
      steps {
        bat '"%PYTHON_EXE%" qa/scripts/check_quality_gate.py'
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'qa/reports/summary.json', fingerprint: true, allowEmptyArchive: true
      archiveArtifacts artifacts: 'qa/reports/deepseek-report.md', fingerprint: true, allowEmptyArchive: true
      script {
        if (fileExists('allure-results')) {
          allure([
            commandline: 'allure',
            includeProperties: false,
            jdk: '',
            reportBuildPolicy: 'ALWAYS',
            results: [[path: 'allure-results']]
          ])
        }
      }
      bat(returnStatus: true, script: '"%PYTHON_EXE%" qa/scripts/notify_feishu.py')
      powershell '''
        if (Test-Path 'allure-results') {
          Remove-Item -Recurse -Force 'allure-results'
          Write-Host '已清理本地 allure-results 目录'
        }
      '''
    }
  }
}
