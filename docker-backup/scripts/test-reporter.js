#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

/**
 * Test Results Reporter
 * 테스트 결과를 수집하고 통합 리포트를 생성합니다.
 */

class TestReporter {
  constructor() {
    this.resultsDir = '/app/results';
    this.reportFile = path.join(this.resultsDir, 'test-report.json');
    this.htmlReportFile = path.join(this.resultsDir, 'test-report.html');
    this.results = {
      timestamp: new Date().toISOString(),
      summary: {
        total: 0,
        passed: 0,
        failed: 0,
        skipped: 0,
        coverage: 0
      },
      services: {},
      errors: []
    };
  }

  /**
   * 테스트 결과 수집
   */
  async collectResults() {
    console.log('📊 테스트 결과 수집 중...');

    try {
      // 각 서비스별 테스트 결과 수집
      await this.collectBackendResults();
      await this.collectAIEngineResults();
      await this.collectFrontendResults();
      await this.collectStudentAppResults();
      await this.collectIntegrationResults();

      // 전체 요약 계산
      this.calculateSummary();

      console.log('✅ 테스트 결과 수집 완료');
    } catch (error) {
      console.error('❌ 테스트 결과 수집 실패:', error.message);
      this.results.errors.push({
        service: 'reporter',
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }
  }

  /**
   * 백엔드 테스트 결과 수집
   */
  async collectBackendResults() {
    try {
      const jestResults = this.readJSONFile('/app/results/backend-jest-results.json');
      const coverageResults = this.readJSONFile('/app/results/backend-coverage.json');

      this.results.services.backend = {
        framework: 'Jest',
        tests: {
          total: jestResults?.numTotalTests || 0,
          passed: jestResults?.numPassedTests || 0,
          failed: jestResults?.numFailedTests || 0,
          skipped: jestResults?.numPendingTests || 0
        },
        coverage: {
          lines: coverageResults?.total?.lines?.pct || 0,
          functions: coverageResults?.total?.functions?.pct || 0,
          branches: coverageResults?.total?.branches?.pct || 0,
          statements: coverageResults?.total?.statements?.pct || 0
        },
        duration: jestResults?.testResults?.reduce((acc, test) => acc + (test.perfStats?.end - test.perfStats?.start || 0), 0) || 0,
        status: jestResults?.success ? 'passed' : 'failed'
      };

      console.log('✅ 백엔드 테스트 결과 수집 완료');
    } catch (error) {
      console.error('❌ 백엔드 테스트 결과 수집 실패:', error.message);
      this.results.services.backend = { status: 'error', error: error.message };
    }
  }

  /**
   * AI 엔진 테스트 결과 수집
   */
  async collectAIEngineResults() {
    try {
      const pytestResults = this.readJSONFile('/app/results/ai-engine-pytest-results.json');
      const coverageXML = this.readFile('/app/results/ai-engine-coverage.xml');

      // pytest 결과 파싱
      const tests = pytestResults?.tests || [];
      const passed = tests.filter(t => t.outcome === 'passed').length;
      const failed = tests.filter(t => t.outcome === 'failed').length;
      const skipped = tests.filter(t => t.outcome === 'skipped').length;

      // 커버리지 파싱 (간단한 XML 파싱)
      const coverageMatch = coverageXML?.match(/line-rate="([0-9.]+)"/);
      const coverage = coverageMatch ? parseFloat(coverageMatch[1]) * 100 : 0;

      this.results.services.aiEngine = {
        framework: 'pytest',
        tests: {
          total: tests.length,
          passed,
          failed,
          skipped
        },
        coverage: {
          lines: coverage,
          functions: coverage,
          branches: coverage,
          statements: coverage
        },
        duration: pytestResults?.duration || 0,
        status: failed === 0 ? 'passed' : 'failed'
      };

      console.log('✅ AI 엔진 테스트 결과 수집 완료');
    } catch (error) {
      console.error('❌ AI 엔진 테스트 결과 수집 실패:', error.message);
      this.results.services.aiEngine = { status: 'error', error: error.message };
    }
  }

  /**
   * 프론트엔드 테스트 결과 수집
   */
  async collectFrontendResults() {
    try {
      const jestResults = this.readJSONFile('/app/results/dashboard-jest-results.json');
      const coverageResults = this.readJSONFile('/app/results/dashboard-coverage.json');

      this.results.services.dashboard = {
        framework: 'Jest + React Testing Library',
        tests: {
          total: jestResults?.numTotalTests || 0,
          passed: jestResults?.numPassedTests || 0,
          failed: jestResults?.numFailedTests || 0,
          skipped: jestResults?.numPendingTests || 0
        },
        coverage: {
          lines: coverageResults?.total?.lines?.pct || 0,
          functions: coverageResults?.total?.functions?.pct || 0,
          branches: coverageResults?.total?.branches?.pct || 0,
          statements: coverageResults?.total?.statements?.pct || 0
        },
        duration: jestResults?.testResults?.reduce((acc, test) => acc + (test.perfStats?.end - test.perfStats?.start || 0), 0) || 0,
        status: jestResults?.success ? 'passed' : 'failed'
      };

      console.log('✅ 대시보드 테스트 결과 수집 완료');
    } catch (error) {
      console.error('❌ 대시보드 테스트 결과 수집 실패:', error.message);
      this.results.services.dashboard = { status: 'error', error: error.message };
    }
  }

  /**
   * 학생 앱 테스트 결과 수집
   */
  async collectStudentAppResults() {
    try {
      const jestResults = this.readJSONFile('/app/results/student-app-jest-results.json');
      const coverageResults = this.readJSONFile('/app/results/student-app-coverage.json');

      this.results.services.studentApp = {
        framework: 'Jest + React Native Testing Library',
        tests: {
          total: jestResults?.numTotalTests || 0,
          passed: jestResults?.numPassedTests || 0,
          failed: jestResults?.numFailedTests || 0,
          skipped: jestResults?.numPendingTests || 0
        },
        coverage: {
          lines: coverageResults?.total?.lines?.pct || 0,
          functions: coverageResults?.total?.functions?.pct || 0,
          branches: coverageResults?.total?.branches?.pct || 0,
          statements: coverageResults?.total?.statements?.pct || 0
        },
        duration: jestResults?.testResults?.reduce((acc, test) => acc + (test.perfStats?.end - test.perfStats?.start || 0), 0) || 0,
        status: jestResults?.success ? 'passed' : 'failed'
      };

      console.log('✅ 학생 앱 테스트 결과 수집 완료');
    } catch (error) {
      console.error('❌ 학생 앱 테스트 결과 수집 실패:', error.message);
      this.results.services.studentApp = { status: 'error', error: error.message };
    }
  }

  /**
   * 통합 테스트 결과 수집
   */
  async collectIntegrationResults() {
    try {
      const integrationResults = this.readJSONFile('/app/results/integration-test-results.json');

      this.results.services.integration = {
        framework: 'Custom Integration Tests',
        tests: {
          total: integrationResults?.total || 0,
          passed: integrationResults?.passed || 0,
          failed: integrationResults?.failed || 0,
          skipped: integrationResults?.skipped || 0
        },
        scenarios: integrationResults?.scenarios || [],
        duration: integrationResults?.duration || 0,
        status: integrationResults?.status || 'unknown'
      };

      console.log('✅ 통합 테스트 결과 수집 완료');
    } catch (error) {
      console.error('❌ 통합 테스트 결과 수집 실패:', error.message);
      this.results.services.integration = { status: 'error', error: error.message };
    }
  }

  /**
   * 전체 요약 계산
   */
  calculateSummary() {
    const services = Object.values(this.results.services);
    
    this.results.summary = {
      total: services.reduce((acc, service) => acc + (service.tests?.total || 0), 0),
      passed: services.reduce((acc, service) => acc + (service.tests?.passed || 0), 0),
      failed: services.reduce((acc, service) => acc + (service.tests?.failed || 0), 0),
      skipped: services.reduce((acc, service) => acc + (service.tests?.skipped || 0), 0),
      coverage: services.reduce((acc, service) => {
        const coverage = service.coverage?.lines || 0;
        return acc + coverage;
      }, 0) / services.filter(s => s.coverage).length || 0,
      duration: services.reduce((acc, service) => acc + (service.duration || 0), 0),
      status: services.every(s => s.status === 'passed') ? 'passed' : 'failed'
    };
  }

  /**
   * 리포트 생성
   */
  async generateReports() {
    console.log('📝 테스트 리포트 생성 중...');

    try {
      // JSON 리포트 생성
      await this.generateJSONReport();
      
      // HTML 리포트 생성
      await this.generateHTMLReport();
      
      // 콘솔 리포트 출력
      this.printConsoleReport();

      console.log('✅ 테스트 리포트 생성 완료');
    } catch (error) {
      console.error('❌ 테스트 리포트 생성 실패:', error.message);
    }
  }

  /**
   * JSON 리포트 생성
   */
  async generateJSONReport() {
    if (!fs.existsSync(this.resultsDir)) {
      fs.mkdirSync(this.resultsDir, { recursive: true });
    }

    fs.writeFileSync(this.reportFile, JSON.stringify(this.results, null, 2));
    console.log(`📄 JSON 리포트 생성: ${this.reportFile}`);
  }

  /**
   * HTML 리포트 생성
   */
  async generateHTMLReport() {
    const html = this.generateHTMLContent();
    fs.writeFileSync(this.htmlReportFile, html);
    console.log(`🌐 HTML 리포트 생성: ${this.htmlReportFile}`);
  }

  /**
   * HTML 콘텐츠 생성
   */
  generateHTMLContent() {
    const { summary, services } = this.results;
    
    return `
<!DOCTYPE html>
<html lang="ko">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>MiraClass 테스트 리포트</title>
    <style>
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
        .container { max-width: 1200px; margin: 0 auto; background: white; border-radius: 8px; box-shadow: 0 2px 10px rgba(0,0,0,0.1); }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 8px 8px 0 0; }
        .summary { display: grid; grid-template-columns: repeat(auto-fit, minmax(200px, 1fr)); gap: 20px; padding: 30px; }
        .metric { text-align: center; padding: 20px; background: #f8f9fa; border-radius: 8px; }
        .metric-value { font-size: 2em; font-weight: bold; margin-bottom: 5px; }
        .metric-label { color: #666; font-size: 0.9em; }
        .services { padding: 0 30px 30px; }
        .service { margin-bottom: 20px; border: 1px solid #e9ecef; border-radius: 8px; overflow: hidden; }
        .service-header { background: #f8f9fa; padding: 15px; font-weight: bold; }
        .service-content { padding: 15px; }
        .status-passed { color: #28a745; }
        .status-failed { color: #dc3545; }
        .status-error { color: #fd7e14; }
        .progress-bar { width: 100%; height: 20px; background: #e9ecef; border-radius: 10px; overflow: hidden; margin: 10px 0; }
        .progress-fill { height: 100%; background: linear-gradient(90deg, #28a745, #20c997); transition: width 0.3s ease; }
    </style>
</head>
<body>
    <div class="container">
        <div class="header">
            <h1>🧪 MiraClass 테스트 리포트</h1>
            <p>생성 시간: ${new Date(this.results.timestamp).toLocaleString('ko-KR')}</p>
        </div>
        
        <div class="summary">
            <div class="metric">
                <div class="metric-value status-${summary.status}">${summary.total}</div>
                <div class="metric-label">총 테스트</div>
            </div>
            <div class="metric">
                <div class="metric-value status-passed">${summary.passed}</div>
                <div class="metric-label">성공</div>
            </div>
            <div class="metric">
                <div class="metric-value status-failed">${summary.failed}</div>
                <div class="metric-label">실패</div>
            </div>
            <div class="metric">
                <div class="metric-value">${summary.coverage.toFixed(1)}%</div>
                <div class="metric-label">커버리지</div>
            </div>
            <div class="metric">
                <div class="metric-value">${(summary.duration / 1000).toFixed(1)}s</div>
                <div class="metric-label">실행 시간</div>
            </div>
        </div>
        
        <div class="services">
            <h2>서비스별 테스트 결과</h2>
            ${Object.entries(services).map(([name, service]) => `
                <div class="service">
                    <div class="service-header">
                        <span class="status-${service.status}">${name.toUpperCase()}</span>
                        <span style="float: right;">${service.framework || 'Unknown'}</span>
                    </div>
                    <div class="service-content">
                        ${service.tests ? `
                            <p><strong>테스트:</strong> ${service.tests.passed}/${service.tests.total} 성공</p>
                            <div class="progress-bar">
                                <div class="progress-fill" style="width: ${(service.tests.passed / service.tests.total * 100) || 0}%"></div>
                            </div>
                        ` : ''}
                        ${service.coverage ? `
                            <p><strong>커버리지:</strong> ${service.coverage.lines.toFixed(1)}% (라인)</p>
                        ` : ''}
                        ${service.duration ? `
                            <p><strong>실행 시간:</strong> ${(service.duration / 1000).toFixed(1)}초</p>
                        ` : ''}
                        ${service.error ? `
                            <p class="status-error"><strong>오류:</strong> ${service.error}</p>
                        ` : ''}
                    </div>
                </div>
            `).join('')}
        </div>
    </div>
</body>
</html>
    `;
  }

  /**
   * 콘솔 리포트 출력
   */
  printConsoleReport() {
    const { summary } = this.results;
    
    console.log('\n' + '='.repeat(60));
    console.log('🧪 MIRACLASS 테스트 리포트');
    console.log('='.repeat(60));
    console.log(`📊 총 테스트: ${summary.total}`);
    console.log(`✅ 성공: ${summary.passed}`);
    console.log(`❌ 실패: ${summary.failed}`);
    console.log(`⏭️  건너뜀: ${summary.skipped}`);
    console.log(`📈 커버리지: ${summary.coverage.toFixed(1)}%`);
    console.log(`⏱️  실행 시간: ${(summary.duration / 1000).toFixed(1)}초`);
    console.log(`🎯 전체 상태: ${summary.status.toUpperCase()}`);
    console.log('='.repeat(60));
    
    // 서비스별 상태
    Object.entries(this.results.services).forEach(([name, service]) => {
      const status = service.status === 'passed' ? '✅' : service.status === 'failed' ? '❌' : '⚠️';
      console.log(`${status} ${name.toUpperCase()}: ${service.status}`);
    });
    
    console.log('='.repeat(60) + '\n');
  }

  /**
   * 파일 읽기 헬퍼
   */
  readFile(filePath) {
    try {
      return fs.readFileSync(filePath, 'utf8');
    } catch (error) {
      console.warn(`⚠️  파일을 읽을 수 없습니다: ${filePath}`);
      return null;
    }
  }

  /**
   * JSON 파일 읽기 헬퍼
   */
  readJSONFile(filePath) {
    try {
      const content = this.readFile(filePath);
      return content ? JSON.parse(content) : null;
    } catch (error) {
      console.warn(`⚠️  JSON 파일을 파싱할 수 없습니다: ${filePath}`);
      return null;
    }
  }
}

/**
 * 메인 실행 함수
 */
async function main() {
  console.log('🚀 MiraClass 테스트 리포터 시작');
  
  const reporter = new TestReporter();
  
  try {
    await reporter.collectResults();
    await reporter.generateReports();
    
    // 테스트 실패 시 exit code 1로 종료
    if (reporter.results.summary.status === 'failed') {
      console.log('❌ 일부 테스트가 실패했습니다.');
      process.exit(1);
    }
    
    console.log('✅ 모든 테스트가 성공했습니다!');
    process.exit(0);
  } catch (error) {
    console.error('💥 테스트 리포터 실행 중 오류 발생:', error);
    process.exit(1);
  }
}

// 스크립트가 직접 실행될 때만 main 함수 호출
if (require.main === module) {
  main();
}

module.exports = TestReporter;