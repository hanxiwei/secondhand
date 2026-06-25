pipeline {
  agent {
    node {
      label ''
      customWorkspace 'D:\\python\\second-hand02'
    }
  }

  options {
    disableConcurrentBuilds()
  }

  parameters {
    booleanParam(name: 'RUN_FUNCTIONAL_TESTS', defaultValue: true, description: '是否执行接口 + UI 自动化测试')
    booleanParam(name: 'RUN_PERF_TESTS', defaultValue: false, description: '是否执行 Locust 性能压测')
    string(name: 'PERF_USERS', defaultValue: '10', description: '性能压测并发用户数')
    string(name: 'PERF_SPAWN_RATE', defaultValue: '2', description: '性能压测每秒启动用户数')
    string(name: 'PERF_RUN_TIME', defaultValue: '1m', description: '性能压测持续时间，例如 1m / 3m')
  }

  environment {
    PYTHON_EXE = 'D:\\immovable\\python313\\python.exe'
    FEISHU_WEBHOOK = credentials('FEISHU_WEBHOOK')
    FEISHU_SECRET = ''
    API_HEALTH_URL = 'http://127.0.0.1:3000/api/categories/tree'
    WEB_HEALTH_URL = 'http://127.0.0.1:5191/'
    REPORT_URL = ''
    AI_REPORT_URL = ''
    TEST_EXIT_CODE = '0'
    GATE_EXIT_CODE = '0'
    PERF_EXIT_CODE = '0'
  }

  stages {
    stage('Prepare Workspace') {
      steps {
        powershell '''
          $paths = @(
            'qa\\reports\\summary.json',
            'qa\\reports\\deepseek-report.md',
            'qa\\reports\\perf'
          )
          foreach ($path in $paths) {
            if (Test-Path $path) {
              Remove-Item -Recurse -Force $path
              Write-Host "已清理旧产物: $path"
            }
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
          Write-Host "Starting backend service from local workspace..."
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

          $webUrl = $env:WEB_HEALTH_URL
          Write-Host "Starting frontend service from local workspace..."
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
        '''
      }
    }

    stage('Run Automated Tests') {
      when {
        expression { return params.RUN_FUNCTIONAL_TESTS }
      }
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

    stage('Run Performance Tests') {
      when {
        expression { return params.RUN_PERF_TESTS }
      }
      steps {
        script {
          env.PERF_EXIT_CODE = bat(
            returnStatus: true,
            script: """
              set PERF_USERS=${params.PERF_USERS}
              set PERF_SPAWN_RATE=${params.PERF_SPAWN_RATE}
              set PERF_RUN_TIME=${params.PERF_RUN_TIME}
              "%PYTHON_EXE%" qa/scripts/run_perf_tests.py
            """.stripIndent()
          ).toString()
          echo "性能压测退出码: ${env.PERF_EXIT_CODE}"
        }
      }
    }

    stage('Generate Summary') {
      when {
        expression { return params.RUN_FUNCTIONAL_TESTS }
      }
      steps {
        script {
          env.REPORT_URL = "${env.BUILD_URL}allure/"
          env.AI_REPORT_URL = "${env.BUILD_URL}artifact/qa/reports/deepseek-report.md"
        }
        bat '"%PYTHON_EXE%" qa/scripts/ai_summary.py'
      }
    }

    stage('Quality Gate') {
      when {
        expression { return params.RUN_FUNCTIONAL_TESTS }
      }
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
          def perfExitCode = env.PERF_EXIT_CODE as Integer
          if (testExitCode != 0 || gateExitCode != 0 || perfExitCode != 0) {
            error("流水线未通过：自动化测试退出码=${testExitCode}，质量门禁退出码=${gateExitCode}，性能压测退出码=${perfExitCode}")
          }
          echo '流水线通过：功能自动化、质量门禁与性能压测任务均已完成。'
        }
      }
    }
  }

  post {
    always {
      archiveArtifacts artifacts: 'qa/reports/summary.json', fingerprint: true, allowEmptyArchive: true
      archiveArtifacts artifacts: 'qa/reports/deepseek-report.md', fingerprint: true, allowEmptyArchive: true
      archiveArtifacts artifacts: 'qa/reports/*.log', fingerprint: false, allowEmptyArchive: true
      archiveArtifacts artifacts: 'qa/reports/perf/*', fingerprint: false, allowEmptyArchive: true
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
      script {
        if (fileExists('qa/reports/summary.json')) {
          bat(returnStatus: true, script: '"%PYTHON_EXE%" qa/scripts/notify_feishu.py')
        }
      }
      powershell '''
        if (Test-Path 'allure-results') {
          Remove-Item -Recurse -Force 'allure-results'
          Write-Host '已清理本地 allure-results 目录'
        }
      '''
    }
  }
}
