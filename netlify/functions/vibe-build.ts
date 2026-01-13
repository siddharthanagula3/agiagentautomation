import { Handler, HandlerEvent, HandlerContext } from '@netlify/functions';
import { transform } from 'esbuild';
import { withAuth } from './utils/auth-middleware';
import { withRateLimit } from './utils/rate-limiter';
import { getCorsHeaders } from './utils/cors';

/**
 * VIBE Build Service
 * Transpiles React/TypeScript code to bundled JavaScript for live preview
 * Uses esbuild for fast in-memory compilation
 */

interface BuildRequest {
  files: Record<string, string>; // { path: content }
  entryPoint?: string;
  projectType: 'react' | 'html' | 'typescript';
}

interface BuildResult {
  success: boolean;
  html?: string;
  error?: string;
  warnings?: string[];
  buildTime?: number;
}

// CDN URLs for common React dependencies
const CDN_IMPORTS: Record<string, string> = {
  react: 'https://esm.sh/react@18.2.0',
  'react-dom': 'https://esm.sh/react-dom@18.2.0',
  'react-dom/client': 'https://esm.sh/react-dom@18.2.0/client',
  'react/jsx-runtime': 'https://esm.sh/react@18.2.0/jsx-runtime',
};

/**
 * Transform import statements to use CDN URLs
 */
function transformImports(code: string): string {
  let transformed = code;

  // Replace bare imports with CDN URLs
  for (const [pkg, url] of Object.entries(CDN_IMPORTS)) {
    // Handle: import X from 'package'
    const defaultImportRegex = new RegExp(
      `import\\s+([\\w]+)\\s+from\\s+['"]${pkg.replace('/', '\\/')}['"]`,
      'g'
    );
    transformed = transformed.replace(
      defaultImportRegex,
      `import $1 from '${url}'`
    );

    // Handle: import { X } from 'package'
    const namedImportRegex = new RegExp(
      `import\\s+\\{([^}]+)\\}\\s+from\\s+['"]${pkg.replace('/', '\\/')}['"]`,
      'g'
    );
    transformed = transformed.replace(
      namedImportRegex,
      `import {$1} from '${url}'`
    );

    // Handle: import * as X from 'package'
    const starImportRegex = new RegExp(
      `import\\s+\\*\\s+as\\s+([\\w]+)\\s+from\\s+['"]${pkg.replace('/', '\\/')}['"]`,
      'g'
    );
    transformed = transformed.replace(
      starImportRegex,
      `import * as $1 from '${url}'`
    );
  }

  // Remove other imports (they would need to be bundled separately)
  // For now, comment them out with a warning
  transformed = transformed.replace(
    /import\s+.*\s+from\s+['"](?!https?:\/\/)([^'"]+)['"]/g,
    (match, pkg) => {
      if (!pkg.startsWith('.') && !pkg.startsWith('/')) {
        console.warn(`[Vibe Build] Unsupported import: ${pkg}`);
        return `// UNSUPPORTED: ${match}`;
      }
      return match;
    }
  );

  return transformed;
}

/**
 * Resolve a relative path from a base directory
 */
function resolvePath(basePath: string, relativePath: string): string {
  const parts = basePath.split('/').filter(Boolean);
  const relParts = relativePath.split('/');

  for (const part of relParts) {
    if (part === '..') {
      parts.pop();
    } else if (part !== '.') {
      parts.push(part);
    }
  }

  return parts.join('/');
}

/**
 * Resolve relative imports by mapping them to resolved file paths
 */
function resolveRelativeImports(
  code: string,
  currentPath: string,
  files: Record<string, string>
): string {
  let resolved = code;

  // Find all relative imports - match various import syntaxes
  // SECURITY NOTE: This regex is safe from ReDoS because all quantified groups use
  // character class exclusions ([^}]*, [^'"]+) which prevent backtracking
  /* eslint-disable security/detect-unsafe-regex */
  const importRegex = /import\s+(?:(?:\{[^}]*\}|\*\s+as\s+\w+|\w+)(?:\s*,\s*(?:\{[^}]*\}|\*\s+as\s+\w+|\w+))*\s+from\s+)?['"](\.[^'"]+)['"]/g;
  /* eslint-enable security/detect-unsafe-regex */

  // Collect all matches first to avoid regex state issues during replacement
  const matches: Array<{ fullMatch: string; importPath: string }> = [];
  let match;

  while ((match = importRegex.exec(code)) !== null) {
    matches.push({ fullMatch: match[0], importPath: match[1] });
  }

  // Process each match
  for (const { fullMatch, importPath } of matches) {
    // Get the directory of the current file
    const currentDir = currentPath.substring(0, currentPath.lastIndexOf('/'));

    // Resolve the relative path
    const resolvedPath = resolvePath(currentDir, importPath);

    // Try to find the file with various extensions
    const possibleExtensions = ['', '.tsx', '.ts', '.jsx', '.js', '.css'];
    let foundPath: string | null = null;

    for (const ext of possibleExtensions) {
      const fullPath = resolvedPath + ext;
      // Check both with and without leading slash
      if (files[fullPath] || files['/' + fullPath] || files[fullPath.replace(/^\//, '')]) {
        foundPath = fullPath;
        break;
      }
      // Also check for index files in directories
      const indexPath = `${resolvedPath}/index${ext}`;
      if (files[indexPath] || files['/' + indexPath] || files[indexPath.replace(/^\//, '')]) {
        foundPath = indexPath;
        break;
      }
    }

    if (foundPath) {
      // Replace the import path with the resolved path
      // This helps track which files are being imported
      const newImport = fullMatch.replace(importPath, './' + foundPath.replace(/^\//, ''));
      resolved = resolved.replace(fullMatch, newImport);
    }
  }

  return resolved;
}

/**
 * Transpile a single file using esbuild
 */
async function transpileFile(
  content: string,
  filename: string
): Promise<{ code: string; warnings: string[] }> {
  const ext = filename.split('.').pop() || 'js';
  const warnings: string[] = [];

  // Determine loader based on extension
  const loaderMap: Record<string, 'tsx' | 'ts' | 'jsx' | 'js' | 'css'> = {
    tsx: 'tsx',
    ts: 'ts',
    jsx: 'jsx',
    js: 'js',
    css: 'css',
  };

  const loader = loaderMap[ext] || 'js';

  try {
    const result = await transform(content, {
      loader,
      format: 'esm',
      target: 'es2020',
      jsx: 'automatic',
      jsxImportSource: 'react',
      minify: false,
      sourcemap: false,
    });

    if (result.warnings.length > 0) {
      warnings.push(...result.warnings.map((w) => w.text));
    }

    return { code: result.code, warnings };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`Failed to transpile ${filename}: ${errorMessage}`);
  }
}

/**
 * Build a complete HTML page with bundled code
 */
async function buildProject(request: BuildRequest): Promise<BuildResult> {
  const startTime = Date.now();
  const warnings: string[] = [];

  try {
    const { files, projectType, entryPoint } = request;

    // For HTML projects, just return the HTML with injected CSS/JS
    if (projectType === 'html') {
      let html = files['index.html'] || files['/index.html'] || '';

      // Inject CSS files
      const cssFiles = Object.entries(files).filter(([path]) =>
        path.endsWith('.css')
      );
      const cssContent = cssFiles.map(([, content]) => content).join('\n');

      // Inject JS files
      const jsFiles = Object.entries(files).filter(([path]) =>
        path.endsWith('.js')
      );
      const jsContent = jsFiles.map(([, content]) => content).join('\n');

      // Inject into HTML
      if (cssContent) {
        html = html.replace(
          '</head>',
          `<style>\n${cssContent}\n</style>\n</head>`
        );
      }
      if (jsContent) {
        html = html.replace(
          '</body>',
          `<script>\n${jsContent}\n</script>\n</body>`
        );
      }

      return {
        success: true,
        html,
        warnings,
        buildTime: Date.now() - startTime,
      };
    }

    // For React/TypeScript projects
    // Find entry point
    const entry =
      entryPoint ||
      files['src/main.tsx'] ||
      files['src/index.tsx'] ||
      files['src/App.tsx'] ||
      files['main.tsx'] ||
      files['index.tsx'] ||
      files['App.tsx'];

    if (!entry) {
      // Try to find any .tsx or .jsx file as entry
      const entryFile = Object.keys(files).find(
        (path) => path.endsWith('.tsx') || path.endsWith('.jsx')
      );
      if (!entryFile) {
        throw new Error('No entry point found. Create a main.tsx or App.tsx file.');
      }
    }

    // Transpile all TypeScript/JSX files
    const transpiledFiles: Record<string, string> = {};

    for (const [path, content] of Object.entries(files)) {
      if (path.match(/\.(tsx?|jsx?)$/)) {
        // First resolve relative imports to normalized paths
        const resolvedContent = resolveRelativeImports(content, path, files);
        const { code, warnings: fileWarnings } = await transpileFile(
          resolvedContent,
          path
        );
        const transformedCode = transformImports(code);
        transpiledFiles[path] = transformedCode;
        warnings.push(...fileWarnings);
      } else if (path.endsWith('.css')) {
        transpiledFiles[path] = content;
      }
    }

    // Collect all CSS
    const cssContent = Object.entries(transpiledFiles)
      .filter(([path]) => path.endsWith('.css'))
      .map(([, content]) => content)
      .join('\n');

    // Get the main entry point code
    const entryPath = Object.keys(transpiledFiles).find(
      (path) =>
        path.includes('main.') ||
        path.includes('index.') ||
        path.includes('App.')
    );

    if (!entryPath) {
      throw new Error('Could not find entry point after transpilation');
    }

    // Bundle all JS into a single module
    const allJsCode = Object.entries(transpiledFiles)
      .filter(([path]) => path.match(/\.(js|jsx|ts|tsx)$/))
      .map(([path, code]) => `// ${path}\n${code}`)
      .join('\n\n');

    // Generate HTML
    const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>VIBE Preview</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; }
    #root { min-height: 100vh; }
    ${cssContent}
  </style>
</head>
<body>
  <div id="root"></div>
  <script type="module">
    // HTML escape function to prevent XSS
    function escapeHtml(text) {
      if (text === null || text === undefined) return '';
      return String(text)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#039;');
    }

    // Error boundary for better debugging
    window.onerror = function(message, source, lineno, colno, error) {
      const root = document.getElementById('root');
      root.innerHTML = '<div style="padding: 20px; color: red; font-family: monospace;">' +
        '<h2>Build Error</h2>' +
        '<pre>' + escapeHtml(message) + '</pre>' +
        '<p>Line: ' + escapeHtml(lineno) + ', Column: ' + escapeHtml(colno) + '</p>' +
        '</div>';
      return true;
    };

    ${allJsCode}
  </script>
</body>
</html>`;

    return {
      success: true,
      html,
      warnings,
      buildTime: Date.now() - startTime,
    };
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown build error';
    return {
      success: false,
      error: errorMessage,
      warnings,
      buildTime: Date.now() - startTime,
    };
  }
}

/**
 * Main handler
 */
const vibeBuildHandler: Handler = async (
  event: HandlerEvent,
  _context: HandlerContext
) => {
  // Get CORS headers with proper origin validation (no wildcard)
  const origin = event.headers.origin || event.headers.Origin;
  const corsHeaders = getCorsHeaders(origin);
  const headers = {
    ...corsHeaders,
    'Content-Type': 'application/json',
  };

  // Handle preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers, body: '' };
  }

  // Only allow POST
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers,
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    const body = JSON.parse(event.body || '{}') as BuildRequest;

    if (!body.files || Object.keys(body.files).length === 0) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'No files provided' }),
      };
    }

    // Detect project type if not specified
    const projectType =
      body.projectType ||
      (Object.keys(body.files).some((f) => f.match(/\.(tsx|jsx)$/))
        ? 'react'
        : Object.keys(body.files).some((f) => f.endsWith('.ts'))
          ? 'typescript'
          : 'html');

    const result = await buildProject({
      ...body,
      projectType,
    });

    return {
      statusCode: result.success ? 200 : 400,
      headers,
      body: JSON.stringify(result),
    };
  } catch (error) {
    console.error('[Vibe Build] Error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
      }),
    };
  }
};

export const handler = withAuth(withRateLimit(vibeBuildHandler));
