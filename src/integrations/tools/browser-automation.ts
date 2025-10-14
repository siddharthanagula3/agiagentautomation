export interface AutomationResult {
  success: boolean;
  data?: unknown;
  screenshots?: string[];
  logs?: string[];
  error?: string;
}

export interface ToolResult {
  success: boolean;
  data?: AutomationResult;
  error?: string;
  cost?: number;
}

export interface BrowserAutomationParams {
  action: 'navigate' | 'click' | 'type' | 'screenshot' | 'extract' | 'wait';
  url?: string;
  selector?: string;
  text?: string;
  timeout?: number;
  waitFor?: string;
}

export class BrowserAutomationTool {
  private automationUrl: string = 'https://api.browserless.io/screenshot';
  private apiKey: string;

  constructor() {
    this.apiKey = import.meta.env.VITE_BROWSERLESS_API_KEY || '';
  }

  async execute(params: BrowserAutomationParams): Promise<ToolResult> {
    try {
      switch (params.action) {
        case 'navigate':
          return await this.navigate(params.url!);
        case 'click':
          return await this.click(params.selector!);
        case 'type':
          return await this.type(params.selector!, params.text!);
        case 'screenshot':
          return await this.takeScreenshot(params.url!);
        case 'extract':
          return await this.extractData(params.selector!);
        case 'wait':
          return await this.wait(params.waitFor!, params.timeout);
        default:
          return {
            success: false,
            error: 'Invalid action',
          };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async navigate(url: string): Promise<ToolResult> {
    try {
      // Simulate navigation in browser environment
      if (typeof window !== 'undefined') {
        window.open(url, '_blank');

        return {
          success: true,
          data: {
            success: true,
            data: { url },
            logs: [`Navigated to ${url}`],
          },
          cost: 0.001,
        };
      } else {
        return {
          success: false,
          error: 'Browser automation not available in this environment',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async click(selector: string): Promise<ToolResult> {
    try {
      if (typeof document !== 'undefined') {
        const element = document.querySelector(selector);
        if (element) {
          (element as HTMLElement).click();

          return {
            success: true,
            data: {
              success: true,
              data: { selector, clicked: true },
              logs: [`Clicked element: ${selector}`],
            },
            cost: 0.001,
          };
        } else {
          return {
            success: false,
            error: `Element not found: ${selector}`,
          };
        }
      } else {
        return {
          success: false,
          error: 'DOM not available',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async type(selector: string, text: string): Promise<ToolResult> {
    try {
      if (typeof document !== 'undefined') {
        const element = document.querySelector(selector) as HTMLInputElement;
        if (element) {
          element.value = text;
          element.dispatchEvent(new Event('input', { bubbles: true }));
          element.dispatchEvent(new Event('change', { bubbles: true }));

          return {
            success: true,
            data: {
              success: true,
              data: { selector, text, typed: true },
              logs: [`Typed "${text}" into ${selector}`],
            },
            cost: 0.001,
          };
        } else {
          return {
            success: false,
            error: `Input element not found: ${selector}`,
          };
        }
      } else {
        return {
          success: false,
          error: 'DOM not available',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async takeScreenshot(url: string): Promise<ToolResult> {
    try {
      if (this.apiKey && this.automationUrl) {
        const response = await fetch(this.automationUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${this.apiKey}`,
          },
          body: JSON.stringify({
            url: url,
            options: {
              fullPage: true,
              quality: 80,
            },
          }),
        });

        if (!response.ok) {
          throw new Error(`Screenshot API error: ${response.status}`);
        }

        const screenshot = await response.text();

        return {
          success: true,
          data: {
            success: true,
            data: { url, screenshot },
            screenshots: [screenshot],
            logs: [`Screenshot taken of ${url}`],
          },
          cost: 0.01,
        };
      } else {
        // Fallback: use browser's built-in screenshot capability
        if (typeof window !== 'undefined' && 'html2canvas' in window) {
          const html2canvas = (window as { html2canvas?: (element: HTMLElement) => Promise<HTMLCanvasElement> }).html2canvas;
          const canvas = await html2canvas(document.body);
          const screenshot = canvas.toDataURL('image/png');

          return {
            success: true,
            data: {
              success: true,
              data: { url: window.location.href, screenshot },
              screenshots: [screenshot],
              logs: ['Screenshot taken using html2canvas'],
            },
            cost: 0.001,
          };
        } else {
          return {
            success: false,
            error: 'Screenshot capability not available',
          };
        }
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async extractData(selector: string): Promise<ToolResult> {
    try {
      if (typeof document !== 'undefined') {
        const elements = document.querySelectorAll(selector);
        const data = Array.from(elements).map(el => ({
          text: el.textContent?.trim(),
          html: el.innerHTML,
          attributes: Array.from(el.attributes).reduce(
            (acc, attr) => {
              acc[attr.name] = attr.value;
              return acc;
            },
            {} as Record<string, string>
          ),
        }));

        return {
          success: true,
          data: {
            success: true,
            data: { selector, extracted: data },
            logs: [
              `Extracted data from ${elements.length} elements matching ${selector}`,
            ],
          },
          cost: 0.001,
        };
      } else {
        return {
          success: false,
          error: 'DOM not available',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async wait(selector: string, timeout: number = 5000): Promise<ToolResult> {
    try {
      if (typeof document !== 'undefined') {
        const startTime = Date.now();

        return new Promise(resolve => {
          const checkElement = () => {
            const element = document.querySelector(selector);
            if (element) {
              resolve({
                success: true,
                data: {
                  success: true,
                  data: {
                    selector,
                    found: true,
                    waitTime: Date.now() - startTime,
                  },
                  logs: [
                    `Element ${selector} found after ${Date.now() - startTime}ms`,
                  ],
                },
                cost: 0.001,
              });
            } else if (Date.now() - startTime > timeout) {
              resolve({
                success: false,
                error: `Element ${selector} not found within ${timeout}ms`,
              });
            } else {
              setTimeout(checkElement, 100);
            }
          };

          checkElement();
        });
      } else {
        return {
          success: false,
          error: 'DOM not available',
        };
      }
    } catch (error) {
      return {
        success: false,
        error: error.message,
      };
    }
  }

  async getSupportedActions(): Promise<string[]> {
    return ['navigate', 'click', 'type', 'screenshot', 'extract', 'wait'];
  }
}
