import { monitoringService } from '../monitoring/monitoring-service';

interface AccessibilityIssue {
  type: 'error' | 'warning' | 'info';
  element: string;
  message: string;
  wcagLevel: 'A' | 'AA' | 'AAA';
  wcagGuideline: string;
  suggestion: string;
}

interface AccessibilityAuditResult {
  score: number;
  issues: AccessibilityIssue[];
  passed: number;
  failed: number;
  warnings: number;
}

class AccessibilityService {
  private isInitialized = false;
  private auditResults: AccessibilityAuditResult | null = null;

  /**
   * Initialize accessibility service
   */
  initialize(): void {
    if (this.isInitialized) return;

    // Set up keyboard navigation monitoring
    this.setupKeyboardNavigation();

    // Set up focus management
    this.setupFocusManagement();

    // Set up screen reader support
    this.setupScreenReaderSupport();

    // Set up color contrast monitoring
    this.setupColorContrastMonitoring();

    this.isInitialized = true;
    console.log('✅ Accessibility service initialized');
  }

  /**
   * Run comprehensive accessibility audit
   */
  async runAudit(): Promise<AccessibilityAuditResult> {
    const issues: AccessibilityIssue[] = [];

    // Check for missing alt text on images
    issues.push(...this.checkImageAltText());

    // Check for proper heading hierarchy
    issues.push(...this.checkHeadingHierarchy());

    // Check for proper form labels
    issues.push(...this.checkFormLabels());

    // Check for proper button labels
    issues.push(...this.checkButtonLabels());

    // Check for proper link text
    issues.push(...this.checkLinkText());

    // Check for color contrast
    issues.push(...this.checkColorContrast());

    // Check for keyboard navigation
    issues.push(...this.checkKeyboardNavigation());

    // Check for focus management
    issues.push(...this.checkFocusManagement());

    // Check for ARIA attributes
    issues.push(...this.checkAriaAttributes());

    // Check for semantic HTML
    issues.push(...this.checkSemanticHTML());

    const failed = issues.filter(issue => issue.type === 'error').length;
    const warnings = issues.filter(issue => issue.type === 'warning').length;
    const passed = this.getTotalElements() - failed - warnings;
    const score = Math.round((passed / this.getTotalElements()) * 100);

    this.auditResults = {
      score,
      issues,
      passed,
      failed,
      warnings,
    };

    // Track accessibility audit
    monitoringService.trackEvent('accessibility_audit', {
      score,
      totalIssues: issues.length,
      failed,
      warnings,
      passed,
    });

    return this.auditResults;
  }

  /**
   * Check for missing alt text on images
   */
  private checkImageAltText(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    const images = document.querySelectorAll('img');

    images.forEach((img, index) => {
      if (!img.alt && !img.getAttribute('aria-label')) {
        issues.push({
          type: 'error',
          element: `img[${index}]`,
          message: 'Image missing alt text',
          wcagLevel: 'A',
          wcagGuideline: '1.1.1 Non-text Content',
          suggestion: 'Add descriptive alt text or aria-label to the image',
        });
      } else if (img.alt === '' && !img.getAttribute('aria-label')) {
        issues.push({
          type: 'warning',
          element: `img[${index}]`,
          message: 'Image has empty alt text',
          wcagLevel: 'A',
          wcagGuideline: '1.1.1 Non-text Content',
          suggestion:
            'Add descriptive alt text or mark as decorative with aria-hidden="true"',
        });
      }
    });

    return issues;
  }

  /**
   * Check for proper heading hierarchy
   */
  private checkHeadingHierarchy(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    let previousLevel = 0;

    headings.forEach((heading, index) => {
      const currentLevel = parseInt(heading.tagName.charAt(1));

      if (currentLevel > previousLevel + 1) {
        issues.push({
          type: 'error',
          element: `${heading.tagName.toLowerCase()}[${index}]`,
          message: `Heading level ${currentLevel} skips level ${previousLevel + 1}`,
          wcagLevel: 'A',
          wcagGuideline: '1.3.1 Info and Relationships',
          suggestion: 'Use proper heading hierarchy (h1, h2, h3, etc.)',
        });
      }

      previousLevel = currentLevel;
    });

    return issues;
  }

  /**
   * Check for proper form labels
   */
  private checkFormLabels(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    const inputs = document.querySelectorAll('input, textarea, select');

    inputs.forEach((input, index) => {
      const id = input.getAttribute('id');
      const ariaLabel = input.getAttribute('aria-label');
      const ariaLabelledBy = input.getAttribute('aria-labelledby');
      const label = id ? document.querySelector(`label[for="${id}"]`) : null;

      if (!label && !ariaLabel && !ariaLabelledBy) {
        issues.push({
          type: 'error',
          element: `${input.tagName.toLowerCase()}[${index}]`,
          message: 'Form control missing label',
          wcagLevel: 'A',
          wcagGuideline: '1.3.1 Info and Relationships',
          suggestion: 'Add a label element or aria-label attribute',
        });
      }
    });

    return issues;
  }

  /**
   * Check for proper button labels
   */
  private checkButtonLabels(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    const buttons = document.querySelectorAll('button');

    buttons.forEach((button, index) => {
      const textContent = button.textContent?.trim();
      const ariaLabel = button.getAttribute('aria-label');
      const ariaLabelledBy = button.getAttribute('aria-labelledby');

      if (!textContent && !ariaLabel && !ariaLabelledBy) {
        issues.push({
          type: 'error',
          element: `button[${index}]`,
          message: 'Button missing accessible name',
          wcagLevel: 'A',
          wcagGuideline: '4.1.2 Name, Role, Value',
          suggestion: 'Add text content or aria-label to the button',
        });
      }
    });

    return issues;
  }

  /**
   * Check for proper link text
   */
  private checkLinkText(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    const links = document.querySelectorAll('a[href]');

    links.forEach((link, index) => {
      const textContent = link.textContent?.trim();
      const ariaLabel = link.getAttribute('aria-label');

      if (!textContent && !ariaLabel) {
        issues.push({
          type: 'error',
          element: `a[${index}]`,
          message: 'Link missing accessible name',
          wcagLevel: 'A',
          wcagGuideline: '2.4.4 Link Purpose',
          suggestion: 'Add descriptive text content or aria-label to the link',
        });
      } else if (
        textContent &&
        ['click here', 'read more', 'here', 'more'].includes(
          textContent.toLowerCase()
        )
      ) {
        issues.push({
          type: 'warning',
          element: `a[${index}]`,
          message: 'Link text is not descriptive',
          wcagLevel: 'A',
          wcagGuideline: '2.4.4 Link Purpose',
          suggestion: 'Use descriptive link text that explains the destination',
        });
      }
    });

    return issues;
  }

  /**
   * Check for color contrast
   */
  private checkColorContrast(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    // This is a simplified check - in a real implementation, you'd use a library like color-contrast
    const elements = document.querySelectorAll('*');

    elements.forEach((element, index) => {
      const computedStyle = window.getComputedStyle(element);
      const color = computedStyle.color;
      const backgroundColor = computedStyle.backgroundColor;

      // Check if colors are set and not transparent
      if (
        color !== 'rgba(0, 0, 0, 0)' &&
        backgroundColor !== 'rgba(0, 0, 0, 0)'
      ) {
        // In a real implementation, you'd calculate the contrast ratio here
        // For now, we'll just check for common problematic patterns
        if (color === backgroundColor) {
          issues.push({
            type: 'error',
            element: `${element.tagName.toLowerCase()}[${index}]`,
            message: 'Text and background colors are the same',
            wcagLevel: 'AA',
            wcagGuideline: '1.4.3 Contrast (Minimum)',
            suggestion:
              'Ensure sufficient color contrast between text and background',
          });
        }
      }
    });

    return issues;
  }

  /**
   * Check for keyboard navigation
   */
  private checkKeyboardNavigation(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];
    const interactiveElements = document.querySelectorAll(
      'button, a, input, textarea, select, [tabindex]'
    );

    interactiveElements.forEach((element, index) => {
      const tabIndex = element.getAttribute('tabindex');

      if (tabIndex === '-1' && element.getAttribute('aria-hidden') !== 'true') {
        issues.push({
          type: 'warning',
          element: `${element.tagName.toLowerCase()}[${index}]`,
          message: 'Interactive element is not keyboard accessible',
          wcagLevel: 'A',
          wcagGuideline: '2.1.1 Keyboard',
          suggestion: 'Ensure all interactive elements are keyboard accessible',
        });
      }
    });

    return issues;
  }

  /**
   * Check for focus management
   */
  private checkFocusManagement(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];

    // Check for focus indicators
    const interactiveElements = document.querySelectorAll(
      'button, a, input, textarea, select'
    );

    interactiveElements.forEach((element, index) => {
      const computedStyle = window.getComputedStyle(element, ':focus');
      const outline = computedStyle.outline;
      const boxShadow = computedStyle.boxShadow;

      if (outline === 'none' && !boxShadow.includes('rgb')) {
        issues.push({
          type: 'warning',
          element: `${element.tagName.toLowerCase()}[${index}]`,
          message: 'Element lacks visible focus indicator',
          wcagLevel: 'AA',
          wcagGuideline: '2.4.7 Focus Visible',
          suggestion: 'Add visible focus indicators for keyboard navigation',
        });
      }
    });

    return issues;
  }

  /**
   * Check for ARIA attributes
   */
  private checkAriaAttributes(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];

    // Check for missing ARIA labels on custom controls
    const customControls = document.querySelectorAll(
      '[role="button"], [role="link"], [role="tab"]'
    );

    customControls.forEach((element, index) => {
      const ariaLabel = element.getAttribute('aria-label');
      const ariaLabelledBy = element.getAttribute('aria-labelledby');
      const textContent = element.textContent?.trim();

      if (!ariaLabel && !ariaLabelledBy && !textContent) {
        issues.push({
          type: 'error',
          element: `${element.tagName.toLowerCase()}[${index}]`,
          message: 'Custom control missing accessible name',
          wcagLevel: 'A',
          wcagGuideline: '4.1.2 Name, Role, Value',
          suggestion: 'Add aria-label or aria-labelledby to the custom control',
        });
      }
    });

    return issues;
  }

  /**
   * Check for semantic HTML
   */
  private checkSemanticHTML(): AccessibilityIssue[] {
    const issues: AccessibilityIssue[] = [];

    // Check for proper use of semantic elements
    const divs = document.querySelectorAll('div');

    divs.forEach((div, index) => {
      const role = div.getAttribute('role');
      const className = div.className;

      // Check if div should be a semantic element
      if (className.includes('header') && !role) {
        issues.push({
          type: 'warning',
          element: `div[${index}]`,
          message: 'Consider using semantic header element',
          wcagLevel: 'A',
          wcagGuideline: '1.3.1 Info and Relationships',
          suggestion: 'Use <header> element instead of <div> for page headers',
        });
      }

      if (className.includes('nav') && !role) {
        issues.push({
          type: 'warning',
          element: `div[${index}]`,
          message: 'Consider using semantic nav element',
          wcagLevel: 'A',
          wcagGuideline: '1.3.1 Info and Relationships',
          suggestion: 'Use <nav> element instead of <div> for navigation',
        });
      }
    });

    return issues;
  }

  /**
   * Set up keyboard navigation monitoring
   */
  private setupKeyboardNavigation(): void {
    document.addEventListener('keydown', event => {
      // Track keyboard usage for analytics
      monitoringService.trackEvent('keyboard_navigation', {
        key: event.key,
        code: event.code,
        target: event.target?.tagName,
      });
    });
  }

  /**
   * Set up focus management
   */
  private setupFocusManagement(): void {
    // Track focus changes
    document.addEventListener('focusin', event => {
      monitoringService.trackEvent('focus_change', {
        target: event.target?.tagName,
        targetId: (event.target as Element)?.id,
        targetClass: (event.target as Element)?.className,
      });
    });
  }

  /**
   * Set up screen reader support
   */
  private setupScreenReaderSupport(): void {
    // Add live region for announcements
    const liveRegion = document.createElement('div');
    liveRegion.setAttribute('aria-live', 'polite');
    liveRegion.setAttribute('aria-atomic', 'true');
    liveRegion.className = 'sr-only';
    liveRegion.id = 'accessibility-announcements';
    document.body.appendChild(liveRegion);
  }

  /**
   * Set up color contrast monitoring
   */
  private setupColorContrastMonitoring(): void {
    // Monitor theme changes for contrast issues
    const observer = new MutationObserver(mutations => {
      mutations.forEach(mutation => {
        if (
          mutation.type === 'attributes' &&
          mutation.attributeName === 'class'
        ) {
          // Re-run contrast check when theme changes
          setTimeout(() => {
            this.checkColorContrast();
          }, 100);
        }
      });
    });

    observer.observe(document.documentElement, {
      attributes: true,
      attributeFilter: ['class'],
    });
  }

  /**
   * Announce message to screen readers
   */
  announce(message: string): void {
    const liveRegion = document.getElementById('accessibility-announcements');
    if (liveRegion) {
      liveRegion.textContent = message;
      setTimeout(() => {
        liveRegion.textContent = '';
      }, 1000);
    }
  }

  /**
   * Get total number of elements to check
   */
  private getTotalElements(): number {
    return document.querySelectorAll(
      'img, h1, h2, h3, h4, h5, h6, input, textarea, select, button, a'
    ).length;
  }

  /**
   * Get current audit results
   */
  getAuditResults(): AccessibilityAuditResult | null {
    return this.auditResults;
  }

  /**
   * Generate accessibility report
   */
  generateReport(): string {
    if (!this.auditResults) {
      return 'No audit results available. Run an audit first.';
    }

    const { score, issues, passed, failed, warnings } = this.auditResults;

    let report = `# Accessibility Audit Report\n\n`;
    report += `**Overall Score: ${score}%**\n\n`;
    report += `- ✅ Passed: ${passed}\n`;
    report += `- ❌ Failed: ${failed}\n`;
    report += `- ⚠️ Warnings: ${warnings}\n\n`;

    if (issues.length > 0) {
      report += `## Issues Found\n\n`;

      const errors = issues.filter(issue => issue.type === 'error');
      const warnings = issues.filter(issue => issue.type === 'warning');

      if (errors.length > 0) {
        report += `### Errors (${errors.length})\n\n`;
        errors.forEach((issue, index) => {
          report += `${index + 1}. **${issue.element}** - ${issue.message}\n`;
          report += `   - WCAG Level: ${issue.wcagLevel}\n`;
          report += `   - Guideline: ${issue.wcagGuideline}\n`;
          report += `   - Suggestion: ${issue.suggestion}\n\n`;
        });
      }

      if (warnings.length > 0) {
        report += `### Warnings (${warnings.length})\n\n`;
        warnings.forEach((issue, index) => {
          report += `${index + 1}. **${issue.element}** - ${issue.message}\n`;
          report += `   - WCAG Level: ${issue.wcagLevel}\n`;
          report += `   - Guideline: ${issue.wcagGuideline}\n`;
          report += `   - Suggestion: ${issue.suggestion}\n\n`;
        });
      }
    }

    return report;
  }
}

// Export singleton instance
export const accessibilityService = new AccessibilityService();
