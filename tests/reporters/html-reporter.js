import fs from 'fs';
import path from 'path';

/**
 * Generate HTML report from test results
 */
export function generateHTMLReport(results, outputPath) {
  const { tests, summary, categorized } = results;

  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>E2E Test Results - AGI Agent Automation</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      background: #0f172a;
      color: #e2e8f0;
      padding: 20px;
    }
    .container { max-width: 1400px; margin: 0 auto; }
    h1 { font-size: 2.5rem; margin-bottom: 10px; background: linear-gradient(to right, #3b82f6, #8b5cf6); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
    .subtitle { color: #94a3b8; margin-bottom: 30px; }
    .summary {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
      gap: 20px;
      margin-bottom: 40px;
    }
    .stat-card {
      background: #1e293b;
      padding: 20px;
      border-radius: 12px;
      border: 1px solid #334155;
    }
    .stat-label { color: #94a3b8; font-size: 0.875rem; margin-bottom: 8px; }
    .stat-value { font-size: 2rem; font-weight: bold; }
    .stat-passed { color: #10b981; }
    .stat-failed { color: #ef4444; }
    .stat-total { color: #3b82f6; }
    .tabs {
      display: flex;
      gap: 10px;
      margin-bottom: 20px;
      border-bottom: 2px solid #334155;
    }
    .tab {
      padding: 12px 24px;
      background: transparent;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      border-bottom: 2px solid transparent;
      margin-bottom: -2px;
      transition: all 0.2s;
    }
    .tab:hover { color: #e2e8f0; }
    .tab.active {
      color: #3b82f6;
      border-bottom-color: #3b82f6;
    }
    .tab-content { display: none; }
    .tab-content.active { display: block; }
    .test-grid {
      display: grid;
      gap: 20px;
    }
    .test-card {
      background: #1e293b;
      border-radius: 12px;
      border: 1px solid #334155;
      overflow: hidden;
    }
    .test-card.passed { border-left: 4px solid #10b981; }
    .test-card.failed { border-left: 4px solid #ef4444; }
    .test-card.critical { border-left: 4px solid #dc2626; box-shadow: 0 0 20px rgba(220, 38, 38, 0.3); }
    .test-header {
      padding: 20px;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }
    .test-title { font-size: 1.125rem; font-weight: 600; }
    .test-status {
      padding: 6px 12px;
      border-radius: 6px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
    }
    .status-passed { background: #065f46; color: #10b981; }
    .status-failed { background: #7f1d1d; color: #ef4444; }
    .status-critical { background: #991b1b; color: #fca5a5; }
    .test-body {
      padding: 0 20px 20px 20px;
      border-top: 1px solid #334155;
    }
    .test-info {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 15px;
      margin: 15px 0;
    }
    .info-item { }
    .info-label { color: #94a3b8; font-size: 0.75rem; margin-bottom: 4px; }
    .info-value { color: #e2e8f0; font-size: 0.875rem; }
    .errors-section {
      background: #7f1d1d;
      padding: 15px;
      border-radius: 8px;
      margin: 15px 0;
    }
    .error-title { color: #fca5a5; font-weight: 600; margin-bottom: 10px; }
    .error-list { list-style: none; }
    .error-item {
      padding: 8px 0;
      border-bottom: 1px solid rgba(252, 165, 165, 0.1);
      font-size: 0.875rem;
      font-family: 'Courier New', monospace;
    }
    .error-item:last-child { border-bottom: none; }
    .screenshot {
      margin: 15px 0;
      border-radius: 8px;
      overflow: hidden;
      border: 1px solid #334155;
    }
    .screenshot img {
      width: 100%;
      height: auto;
      display: block;
    }
    .badge {
      display: inline-block;
      padding: 4px 8px;
      border-radius: 4px;
      font-size: 0.75rem;
      font-weight: 600;
      margin-right: 8px;
    }
    .badge-critical { background: #dc2626; color: white; }
    .badge-high { background: #f59e0b; color: white; }
    .badge-medium { background: #3b82f6; color: white; }
    .badge-low { background: #6b7280; color: white; }
  </style>
</head>
<body>
  <div class="container">
    <h1>🧪 E2E Test Results</h1>
    <p class="subtitle">AGI Agent Automation - Comprehensive Testing Report</p>

    <div class="summary">
      <div class="stat-card">
        <div class="stat-label">Total Tests</div>
        <div class="stat-value stat-total">${summary.total}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Passed</div>
        <div class="stat-value stat-passed">${summary.passed}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Failed</div>
        <div class="stat-value stat-failed">${summary.failed}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Duration</div>
        <div class="stat-value">${(summary.duration / 1000).toFixed(2)}s</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">Critical Issues</div>
        <div class="stat-value stat-failed">${categorized.critical.length}</div>
      </div>
      <div class="stat-card">
        <div class="stat-label">High Priority</div>
        <div class="stat-value" style="color: #f59e0b;">${categorized.high.length}</div>
      </div>
    </div>

    <div class="tabs">
      <button class="tab active" onclick="showTab('all')">All Tests (${tests.length})</button>
      <button class="tab" onclick="showTab('critical')">Critical (${categorized.critical.length})</button>
      <button class="tab" onclick="showTab('high')">High (${categorized.high.length})</button>
      <button class="tab" onclick="showTab('medium')">Medium (${categorized.medium.length})</button>
      <button class="tab" onclick="showTab('low')">Low (${categorized.low.length})</button>
      <button class="tab" onclick="showTab('passed')">Passed (${categorized.passed.length})</button>
    </div>

    <div id="tab-all" class="tab-content active">
      <div class="test-grid">
        ${tests.map(test => generateTestCard(test)).join('')}
      </div>
    </div>

    <div id="tab-critical" class="tab-content">
      <div class="test-grid">
        ${categorized.critical.map(test => generateTestCard(test)).join('') || '<p style="color: #94a3b8;">No critical issues found ✅</p>'}
      </div>
    </div>

    <div id="tab-high" class="tab-content">
      <div class="test-grid">
        ${categorized.high.map(test => generateTestCard(test)).join('') || '<p style="color: #94a3b8;">No high priority issues found ✅</p>'}
      </div>
    </div>

    <div id="tab-medium" class="tab-content">
      <div class="test-grid">
        ${categorized.medium.map(test => generateTestCard(test)).join('') || '<p style="color: #94a3b8;">No medium priority issues found ✅</p>'}
      </div>
    </div>

    <div id="tab-low" class="tab-content">
      <div class="test-grid">
        ${categorized.low.map(test => generateTestCard(test)).join('') || '<p style="color: #94a3b8;">No low priority issues found ✅</p>'}
      </div>
    </div>

    <div id="tab-passed" class="tab-content">
      <div class="test-grid">
        ${categorized.passed.map(test => generateTestCard(test)).join('')}
      </div>
    </div>
  </div>

  <script>
    function showTab(tabName) {
      // Hide all tabs
      document.querySelectorAll('.tab-content').forEach(content => {
        content.classList.remove('active');
      });
      document.querySelectorAll('.tab').forEach(tab => {
        tab.classList.remove('active');
      });

      // Show selected tab
      document.getElementById('tab-' + tabName).classList.add('active');
      event.target.classList.add('active');
    }
  </script>
</body>
</html>`;

  const dir = path.dirname(outputPath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true});
  }

  fs.writeFileSync(outputPath, html);
  console.log(`✅ HTML report generated: ${outputPath}`);
}

function generateTestCard(test) {
  const statusClass = test.success ? 'passed' : (test.critical ? 'critical' : 'failed');
  const statusText = test.success ? 'Passed' : 'Failed';
  const statusBadgeClass = test.success ? 'status-passed' : (test.critical ? 'status-critical' : 'status-failed');

  const hasErrors = test.errors?.consoleErrors?.length > 0 || test.errors?.networkErrors?.length > 0;

  return `
    <div class="test-card ${statusClass}">
      <div class="test-header">
        <div>
          <div class="test-title">${test.name}</div>
          <div style="color: #64748b; font-size: 0.875rem; margin-top: 4px;">${test.route}</div>
        </div>
        <div class="test-status ${statusBadgeClass}">${statusText}</div>
      </div>
      <div class="test-body">
        <div class="test-info">
          <div class="info-item">
            <div class="info-label">Duration</div>
            <div class="info-value">${test.duration ? (test.duration / 1000).toFixed(2) + 's' : 'N/A'}</div>
          </div>
          ${test.critical ? '<div class="info-item"><div class="info-label">Priority</div><div class="info-value"><span class="badge badge-critical">CRITICAL</span></div></div>' : ''}
          ${test.checks?.seo ? `
          <div class="info-item">
            <div class="info-label">SEO Tags</div>
            <div class="info-value">${test.checks.seo.hasSEO ? '✅ Present' : '⚠️ Missing'}</div>
          </div>` : ''}
          ${test.checks?.images ? `
          <div class="info-item">
            <div class="info-label">Images</div>
            <div class="info-value">${test.checks.images.total} total, ${test.checks.images.failed.length} failed</div>
          </div>` : ''}
        </div>

        ${hasErrors ? `
        <div class="errors-section">
          <div class="error-title">❌ Errors Detected</div>
          <ul class="error-list">
            ${test.errors.consoleErrors?.slice(0, 5).map(err =>
              `<li class="error-item">${err.type}: ${err.text || err.message}</li>`
            ).join('') || ''}
            ${test.errors.networkErrors?.slice(0, 5).map(err =>
              `<li class="error-item">HTTP ${err.status}: ${err.url}</li>`
            ).join('') || ''}
          </ul>
        </div>` : ''}

        ${test.error ? `
        <div class="errors-section">
          <div class="error-title">❌ Test Error</div>
          <div class="error-item">${test.error}</div>
        </div>` : ''}
      </div>
    </div>
  `;
}
