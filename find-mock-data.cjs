/**
 * Mock Data Finder Script
 * Scans the entire codebase for mock data patterns and generates a report
 */

const fs = require('fs');
const path = require('path');

// Patterns to search for mock data
const MOCK_PATTERNS = [
  /const\s+mock[A-Z][a-zA-Z]*\s*=/gi,
  /const\s+[a-zA-Z]+Mock\s*=/gi,
  /\/\/\s*mock\s+data/gi,
  /\/\*\*\s*mock/gi,
  /fake[A-Z][a-zA-Z]*/gi,
  /sample[A-Z][a-zA-Z]*/gi,
  /dummy[A-Z][a-zA-Z]*/gi,
  /placeholder[A-Z][a-zA-Z]*/gi,
  /hardcoded/gi,
  /TODO.*remove.*mock/gi,
  /\[\s*\{\s*id:\s*['"].*?['"]/g, // Array of objects with IDs (potential mock data)
];

// Directories to scan
const SCAN_DIRS = ['src/pages', 'src/components', 'src/services'];

// Files to exclude
const EXCLUDE_PATTERNS = [
  /node_modules/,
  /\.test\./,
  /\.spec\./,
  /\.stories\./,
  /find-mock-data\.js/,
  /\.git/
];

class MockDataFinder {
  constructor() {
    this.results = [];
    this.totalFiles = 0;
    this.filesWithMockData = 0;
  }

  /**
   * Check if file should be excluded
   */
  shouldExclude(filePath) {
    return EXCLUDE_PATTERNS.some(pattern => pattern.test(filePath));
  }

  /**
   * Scan a single file for mock data
   */
  scanFile(filePath) {
    this.totalFiles++;

    try {
      const content = fs.readFileSync(filePath, 'utf8');
      const lines = content.split('\n');
      const matches = [];

      lines.forEach((line, lineNumber) => {
        MOCK_PATTERNS.forEach(pattern => {
          const found = line.match(pattern);
          if (found) {
            matches.push({
              line: lineNumber + 1,
              pattern: pattern.source,
              code: line.trim(),
              match: found[0]
            });
          }
        });
      });

      if (matches.length > 0) {
        this.filesWithMockData++;
        this.results.push({
          file: filePath,
          matchCount: matches.length,
          matches
        });
      }
    } catch (error) {
      console.error(`Error scanning ${filePath}:`, error.message);
    }
  }

  /**
   * Recursively scan directory
   */
  scanDirectory(dirPath) {
    try {
      const entries = fs.readdirSync(dirPath, { withFileTypes: true });

      entries.forEach(entry => {
        const fullPath = path.join(dirPath, entry.name);

        if (this.shouldExclude(fullPath)) {
          return;
        }

        if (entry.isDirectory()) {
          this.scanDirectory(fullPath);
        } else if (entry.isFile() && /\.(ts|tsx|js|jsx)$/.test(entry.name)) {
          this.scanFile(fullPath);
        }
      });
    } catch (error) {
      console.error(`Error scanning directory ${dirPath}:`, error.message);
    }
  }

  /**
   * Run the scan
   */
  run() {
    console.log('🔍 Scanning for mock data...\n');

    SCAN_DIRS.forEach(dir => {
      const fullPath = path.join(process.cwd(), dir);
      if (fs.existsSync(fullPath)) {
        console.log(`Scanning: ${dir}`);
        this.scanDirectory(fullPath);
      } else {
        console.log(`Directory not found: ${dir}`);
      }
    });

    this.generateReport();
  }

  /**
   * Generate report
   */
  generateReport() {
    console.log('\n' + '='.repeat(80));
    console.log('📊 MOCK DATA SCAN REPORT');
    console.log('='.repeat(80) + '\n');

    console.log(`Total Files Scanned: ${this.totalFiles}`);
    console.log(`Files with Mock Data: ${this.filesWithMockData}`);
    console.log(`Total Matches Found: ${this.results.reduce((sum, r) => sum + r.matchCount, 0)}\n`);

    if (this.results.length === 0) {
      console.log('✅ No mock data found! Your codebase is clean.\n');
      return;
    }

    console.log('⚠️  Files with potential mock data:\n');

    // Sort by match count (descending)
    this.results.sort((a, b) => b.matchCount - a.matchCount);

    this.results.forEach((result, index) => {
      console.log(`\n${index + 1}. ${result.file}`);
      console.log(`   Matches: ${result.matchCount}`);
      
      result.matches.slice(0, 3).forEach(match => {
        console.log(`   Line ${match.line}: ${match.code.substring(0, 80)}${match.code.length > 80 ? '...' : ''}`);
      });

      if (result.matches.length > 3) {
        console.log(`   ... and ${result.matches.length - 3} more matches`);
      }
    });

    // Save detailed report to JSON
    const reportPath = path.join(process.cwd(), 'mock-data-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(this.results, null, 2));
    console.log(`\n\n📄 Detailed report saved to: ${reportPath}\n`);

    // Generate priority list
    console.log('\n' + '='.repeat(80));
    console.log('🎯 PRIORITY FILES TO CLEAN (sorted by match count):');
    console.log('='.repeat(80) + '\n');

    this.results.slice(0, 10).forEach((result, index) => {
      console.log(`${index + 1}. ${result.file} (${result.matchCount} matches)`);
    });

    console.log('\n');
  }
}

// Run the scanner
const finder = new MockDataFinder();
finder.run();
