import fs from 'fs';
import path from 'path';
import { generateHTMLReport } from './reporters/html-reporter.js';

/**
 * Analyze test results and generate reports + todo list
 */
async function analyzeResults() {
  console.log('\n📊 Analyzing Test Results...\n');

  // Read test results
  const resultsPath = './tests/reports/test-results-categorized.json';

  if (!fs.existsSync(resultsPath)) {
    console.error('❌ No test results found. Run tests first with: npm run test:e2e');
    process.exit(1);
  }

  const results = JSON.parse(fs.readFileSync(resultsPath, 'utf8'));
  const { categorized, summary, tests } = results;

  // Generate HTML report
  console.log('📄 Generating HTML Report...');
  generateHTMLReport(results, './tests/reports/test-results.html');

  // Generate prioritized todo list
  console.log('\n📋 Generating Prioritized Todo List...\n');

  const todoList = [];

  // Critical issues
  if (categorized.critical.length > 0) {
    todoList.push({
      priority: 'CRITICAL',
      count: categorized.critical.length,
      items: categorized.critical.map(test => ({
        page: test.name,
        route: test.route,
        issues: extractIssues(test)
      }))
    });
  }

  // High priority issues
  if (categorized.high.length > 0) {
    todoList.push({
      priority: 'HIGH',
      count: categorized.high.length,
      items: categorized.high.map(test => ({
        page: test.name,
        route: test.route,
        issues: extractIssues(test)
      }))
    });
  }

  // Medium priority issues
  if (categorized.medium.length > 0) {
    todoList.push({
      priority: 'MEDIUM',
      count: categorized.medium.length,
      items: categorized.medium.map(test => ({
        page: test.name,
        route: test.route,
        issues: extractIssues(test)
      }))
    });
  }

  // Low priority issues
  if (categorized.low.length > 0) {
    todoList.push({
      priority: 'LOW',
      count: categorized.low.length,
      items: categorized.low.map(test => ({
        page: test.name,
        route: test.route,
        issues: extractIssues(test)
      }))
    });
  }

  // Save todo list
  fs.writeFileSync(
    './tests/reports/todo-list.json',
    JSON.stringify(todoList, null, 2)
  );

  // Print analysis
  printAnalysis(results, todoList);

  // Generate markdown todo list
  generateMarkdownTodo(todoList);

  console.log('\n✅ Analysis complete!');
  console.log(`\n📂 Reports generated:`);
  console.log(`   - HTML Report: tests/reports/test-results.html`);
  console.log(`   - JSON Report: tests/reports/test-results-categorized.json`);
  console.log(`   - Todo List: tests/reports/TODO.md`);
  console.log(`   - Raw Todo: tests/reports/todo-list.json`);
}

function extractIssues(test) {
  const issues = [];

  if (test.error) {
    issues.push({
      type: 'error',
      message: test.error
    });
  }

  if (test.errors?.consoleErrors?.length > 0) {
    issues.push({
      type: 'console-errors',
      count: test.errors.consoleErrors.length,
      samples: test.errors.consoleErrors.slice(0, 3).map(e => e.text || e.message)
    });
  }

  if (test.errors?.networkErrors?.length > 0) {
    issues.push({
      type: 'network-errors',
      count: test.errors.networkErrors.length,
      samples: test.errors.networkErrors.slice(0, 3).map(e => `${e.status}: ${e.url}`)
    });
  }

  if (test.checks?.images?.failed?.length > 0) {
    issues.push({
      type: 'failed-images',
      count: test.checks.images.failed.length,
      samples: test.checks.images.failed.slice(0, 3).map(img => img.src)
    });
  }

  if (test.checks?.buttons?.issues?.length > 0) {
    issues.push({
      type: 'button-issues',
      count: test.checks.buttons.issues.length
    });
  }

  if (test.checks?.seo && !test.checks.seo.hasSEO) {
    issues.push({
      type: 'missing-seo',
      missing: test.checks.seo.missing
    });
  }

  return issues;
}

function printAnalysis(results, todoList) {
  console.log('\n═══════════════════════════════════════════');
  console.log('           TEST ANALYSIS REPORT            ');
  console.log('═══════════════════════════════════════════\n');

  console.log(`📊 Overall Results:`);
  console.log(`   Total Tests: ${results.summary.total}`);
  console.log(`   ✅ Passed: ${results.summary.passed} (${((results.summary.passed / results.summary.total) * 100).toFixed(1)}%)`);
  console.log(`   ❌ Failed: ${results.summary.failed} (${((results.summary.failed / results.summary.total) * 100).toFixed(1)}%)`);
  console.log(`   ⏱️  Duration: ${(results.summary.duration / 1000).toFixed(2)}s\n`);

  console.log(`🎯 Issues by Priority:`);
  todoList.forEach(category => {
    const icon = category.priority === 'CRITICAL' ? '🔥' :
                 category.priority === 'HIGH' ? '⚠️' :
                 category.priority === 'MEDIUM' ? '⚡' : '📝';
    console.log(`   ${icon} ${category.priority}: ${category.count} pages`);
  });

  console.log('\n📋 Action Items:\n');

  todoList.forEach(category => {
    console.log(`\n${category.priority} PRIORITY (${category.count} items):`);
    console.log('─'.repeat(50));

    category.items.forEach((item, index) => {
      console.log(`\n${index + 1}. ${item.page} (${item.route})`);
      item.issues.forEach(issue => {
        if (issue.type === 'error') {
          console.log(`   ❌ Error: ${issue.message}`);
        } else if (issue.type === 'console-errors') {
          console.log(`   🐛 ${issue.count} console errors`);
          issue.samples.forEach(s => console.log(`      - ${s.substring(0, 80)}...`));
        } else if (issue.type === 'network-errors') {
          console.log(`   🌐 ${issue.count} network errors`);
          issue.samples.forEach(s => console.log(`      - ${s}`));
        } else if (issue.type === 'failed-images') {
          console.log(`   🖼️  ${issue.count} images failed to load`);
        } else if (issue.type === 'button-issues') {
          console.log(`   🔘 ${issue.count} button issues`);
        } else if (issue.type === 'missing-seo') {
          console.log(`   🔍 Missing SEO tags: ${issue.missing.join(', ')}`);
        }
      });
    });
  });
}

function generateMarkdownTodo(todoList) {
  let markdown = `# E2E Test Fixes - Todo List\n\n`;
  markdown += `Generated: ${new Date().toISOString()}\n\n`;
  markdown += `## Summary\n\n`;

  todoList.forEach(category => {
    const icon = category.priority === 'CRITICAL' ? '🔥' :
                 category.priority === 'HIGH' ? '⚠️' :
                 category.priority === 'MEDIUM' ? '⚡' : '📝';
    markdown += `- ${icon} **${category.priority}**: ${category.count} pages\n`;
  });

  markdown += `\n---\n\n`;

  todoList.forEach(category => {
    markdown += `## ${category.priority} Priority (${category.count} items)\n\n`;

    category.items.forEach((item, index) => {
      markdown += `### ${index + 1}. ${item.page}\n\n`;
      markdown += `**Route**: \`${item.route}\`\n\n`;
      markdown += `**Issues**:\n\n`;

      item.issues.forEach(issue => {
        if (issue.type === 'error') {
          markdown += `- ❌ **Error**: ${issue.message}\n`;
        } else if (issue.type === 'console-errors') {
          markdown += `- 🐛 **Console Errors**: ${issue.count} errors\n`;
          issue.samples.forEach(s => markdown += `  - \`${s.substring(0, 100)}\`\n`);
        } else if (issue.type === 'network-errors') {
          markdown += `- 🌐 **Network Errors**: ${issue.count} errors\n`;
          issue.samples.forEach(s => markdown += `  - \`${s}\`\n`);
        } else if (issue.type === 'failed-images') {
          markdown += `- 🖼️ **Failed Images**: ${issue.count} images\n`;
        } else if (issue.type === 'button-issues') {
          markdown += `- 🔘 **Button Issues**: ${issue.count} buttons\n`;
        } else if (issue.type === 'missing-seo') {
          markdown += `- 🔍 **Missing SEO**: ${issue.missing.join(', ')}\n`;
        }
      });

      markdown += `\n`;
    });

    markdown += `\n---\n\n`;
  });

  fs.writeFileSync('./tests/reports/TODO.md', markdown);
  console.log(`\n📝 Markdown TODO generated: tests/reports/TODO.md`);
}

// Run analysis
analyzeResults().catch(error => {
  console.error('❌ Analysis failed:', error);
  process.exit(1);
});
