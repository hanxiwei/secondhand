pipeline {
  agent {
    node {
      label ''
      customWorkspace 'D:\\jenkins-workspace\\second-hand02'
    }
  }

  environment {
    PYTHON_EXE = 'D:\\immovable\\python313\\python.exe'
    REPO_URL = 'https://github.com/hanxiwei/secondhand.git'
    REPO_BRANCH = 'main'
    FEISHU_WEBHOOK = credentials('FEISHU_WEBHOOK')
    FEISHU_SECRET = ''
    API_HEALTH_URL = 'http://127.0.0.1:3000/api/categories/tree'
    WEB_HEALTH_URL = 'http://127.0.0.1:5191/'
    REPORT_URL = ''
    AI_REPORT_URL = ''
    TEST_EXIT_CODE = '0'
    GATE_EXIT_CODE = '0'
  }

  triggers {
    cron('H/5 * * * *')
  }

  stages {
    stage('Sync Code') {
      steps {
        powershell '''
          $repoUrl = $env:REPO_URL
          $branch = $env:REPO_BRANCH

          if (-not (Test-Path '.git')) {
            Write-Host "Workspace is not initialized, cloning $repoUrl ..."
            git clone --branch $branch --single-branch $repoUrl .
          } else {
            Write-Host "Fetching latest code from $repoUrl ..."
            git remote set-url origin $repoUrl
            git fetch origin $branch
            git checkout $branch
            git reset --hard origin/$branch
          }
        '''
      }
    }

    stage('Install Dependencies') {
      steps {
        bat 'if not exist qa\\reports mkdir qa\\reports'
        dir('server') {
          bat 'npm install'
        }
        dir('web') {
          bat 'npm install'
        }
        bat '"%PYTHON_EXE%" -m pip install -r qa/requirements.txt'
        bat '"%PYTHON_EXE%" -m playwright install chromium'
      }
    }

    stage('Start Services') {
      steps {
        powershell '''
          function Stop-ProcessByPort($port) {
            $connections = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue |
              Select-Object -ExpandProperty OwningProcess -Unique
            foreach ($processId in $connections) {
              if ($processId) {
                Write-Host "Stopping existing process on port ${port}: PID $processId"
                Stop-Process -Id $processId -Force -ErrorAction SilentlyContinue
              }
            }
          }

          Stop-ProcessByPort 3000
          Stop-ProcessByPort 5191

          $serverUrl = $env:API_HEALTH_URL
          Write-Host "Starting backend service from Jenkins workspace..."
          Start-Process cmd.exe -ArgumentList '/c', 'npm run start > ..\\qa\\reports\\server.log 2>&1' -WorkingDirectory "$env:WORKSPACE\\server" -WindowStyle Hidden
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

          $webUrl = $env:WEB_HEALTH_URL
          Write-Host "Starting frontend service from Jenkins workspace..."
          Start-Process cmd.exe -ArgumentList '/c', 'npm run dev -- --host 127.0.0.1 --port 5191 > ..\\qa\\reports\\web.log 2>&1' -WorkingDirectory "$env:WORKSPACE\\web" -WindowStyle Hidden
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
        '''
      }
    }

    stage('Run Automated Tests') {
      steps {
        script {
          env.TEST_EXIT_CODE = bat(
            returnStatus: true,
            script: '"%PYTHON_EXE%" qa/scripts/run_all_tests.py'
          ).toString()
          echo "自动化测试退出码: ${env.TEST_EXIT_CODE}"
        }
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
        script {
          env.GATE_EXIT_CODE = bat(
            returnStatus: true,
            script: '"%PYTHON_EXE%" qa/scripts/check_quality_gate.py'
          ).toString()
          echo "质量门禁退出码: ${env.GATE_EXIT_CODE}"
        }
      }
    }

    stage('Finalize Result') {
      steps {
        script {
          def testExitCode = env.TEST_EXIT_CODE as Integer
          def gateExitCode = env.GATE_EXIT_CODE as Integer
          if (testExitCode != 0 || gateExitCode != 0) {
            error("流水线未通过：自动化测试退出码=${testExitCode}，质量门禁退出码=${gateExitCode}")
          }
          echo '流水线通过：自动化测试与质量门禁均已通过。'
        }
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'qa/reports/summary.json', fingerprint: true, allowEmptyArchive: true
      archiveArtifacts artifacts: 'qa/reports/deepseek-report.md', fingerprint: true, allowEmptyArchive: true
      archiveArtifacts artifacts: 'qa/reports/*.log', fingerprint: false, allowEmptyArchive: true
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
