/**
 * Desktop Auto-Updater Endpoint
 * Returns the latest release manifest for the Tauri auto-updater.
 * Route: /api/releases/
 * Called by the AGI Workforce Desktop app (v1.1.5) to check for updates.
 */

import type { VercelRequest, VercelResponse } from '@vercel/node';

const LATEST_VERSION = '1.1.5';

const RELEASE_MANIFEST = {
  version: LATEST_VERSION,
  notes: 'Bug fixes and performance improvements.',
  pub_date: '2026-01-06T00:00:00Z',
  platforms: {
    'darwin-x86_64': {
      signature: '',
      url: `https://github.com/siddharthanagula3/agiworkforce-desktop-app/releases/download/v${LATEST_VERSION}/AGIWorkforce_${LATEST_VERSION}_x64.dmg`,
    },
    'darwin-aarch64': {
      signature: '',
      url: `https://github.com/siddharthanagula3/agiworkforce-desktop-app/releases/download/v${LATEST_VERSION}/AGIWorkforce_${LATEST_VERSION}_aarch64.dmg`,
    },
    'windows-x86_64': {
      signature: '',
      url: `https://github.com/siddharthanagula3/agiworkforce-desktop-app/releases/download/v${LATEST_VERSION}/AGIWorkforce_${LATEST_VERSION}_x64-setup.exe`,
    },
    'linux-x86_64': {
      signature: '',
      url: `https://github.com/siddharthanagula3/agiworkforce-desktop-app/releases/download/v${LATEST_VERSION}/agiworkforce_${LATEST_VERSION}_amd64.AppImage`,
    },
  },
};

export default function handler(req: VercelRequest, res: VercelResponse): void {
  const clientVersion = (req.query.version as string) || req.headers['x-tauri-version'] as string;

  // If client is on the latest version, respond with 204 No Content
  if (clientVersion && clientVersion === LATEST_VERSION) {
    res.status(204).end();
    return;
  }

  res.setHeader('Cache-Control', 'no-store');
  res.status(200).json(RELEASE_MANIFEST);
}
