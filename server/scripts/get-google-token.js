const http = require('http');
const url = require('url');
const path = require('path');
const readline = require('readline');
const { google } = require('googleapis');
const { 
  generateAuthUrl, 
  exchangeCodeForTokens, 
  saveRefreshTokenToEnv,
  ENV_PATH 
} = require('../services/googleOAuthService');
const { uploadImageToDrive, deleteFileFromDrive, getDriveClient } = require('../services/googleDriveService');

require('dotenv').config({ path: ENV_PATH });
require('dotenv').config();

const PORT = 5123;
const DEFAULT_LOCAL_REDIRECT = `http://localhost:${PORT}/oauth2callback`;
const SERVER_REDIRECT = 'http://localhost:5001/api/auth/google/callback';

const effectiveRedirect = process.env.GOOGLE_REDIRECT_URI || DEFAULT_LOCAL_REDIRECT;

const clientId = process.env.GOOGLE_CLIENT_ID;
const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

if (!clientId || !clientSecret) {
  console.error(`
[Error] GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET are not set in:
${ENV_PATH}
Please add them first and try again.
`);
  process.exit(1);
}

// Generate the auth URL
const authUrl = generateAuthUrl(effectiveRedirect);

console.log(`
========================================================================
 Google OAuth 2.0 Authorization for House Finance
 Account: vijeshviswanv@gmail.com
========================================================================

STEP 1: Open the link below in your browser:

${authUrl}

STEP 2: Sign in with vijeshviswanv@gmail.com and click 'Continue' / 'Allow'.

------------------------------------------------------------------------
Listening for automatic redirect on: ${effectiveRedirect}
(Or if redirected elsewhere, you can paste the URL / code below)
========================================================================
`);

let serverClosed = false;

// Create temporary local listener
const server = http.createServer(async (req, res) => {
  try {
    const parsedUrl = url.parse(req.url, true);
    if (parsedUrl.pathname === '/oauth2callback' || parsedUrl.pathname === '/api/auth/google/callback') {
      const code = parsedUrl.query.code;
      if (!code) {
        res.writeHead(400, { 'Content-Type': 'text/html' });
        res.end('<h3>Error: No authorization code received from Google.</h3>');
        return;
      }

      await handleReceivedCode(code, effectiveRedirect);

      res.writeHead(200, { 'Content-Type': 'text/html' });
      res.end(`
        <div style="font-family: -apple-system, BlinkMacSystemFont, sans-serif; text-align: center; padding: 50px 20px; color: #1e293b;">
          <div style="font-size: 48px; margin-bottom: 12px;">🎉</div>
          <h1 style="color: #059669; margin: 0 0 10px 0;">Google Drive Connected!</h1>
          <p style="font-size: 16px; color: #64748b; max-width: 500px; margin: 0 auto 24px auto;">
            Your personal Google Drive (<strong>vijeshviswanv@gmail.com</strong>) has been successfully authorized.
            The refresh token has been saved to your <code>.env</code> file.
          </p>
          <p style="font-size: 14px; color: #94a3b8;">You can close this browser window and return to your terminal.</p>
        </div>
      `);

      cleanupAndExit(0);
    }
  } catch (err) {
    console.error('Error in callback server:', err.message);
    res.writeHead(500, { 'Content-Type': 'text/html' });
    res.end(`<h3>Error: ${err.message}</h3>`);
  }
});

server.listen(PORT, () => {
  // Setup readline for fallback manual code entry
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Paste the redirected URL or authorization code here (if not auto-caught): ', async (answer) => {
    if (!answer || !answer.trim()) return;
    try {
      let code = answer.trim();
      if (code.includes('code=')) {
        const u = new URL(code.startsWith('http') ? code : `http://dummy.com${code}`);
        code = u.searchParams.get('code') || code;
      }
      console.log('\nProcessing authorization code...');
      await handleReceivedCode(code, effectiveRedirect);
      rl.close();
      cleanupAndExit(0);
    } catch (err) {
      console.error('\n[Error exchanging code]:', err.message);
      rl.close();
      cleanupAndExit(1);
    }
  });
});

async function handleReceivedCode(code, redirectUri) {
  const tokens = await exchangeCodeForTokens(code, redirectUri);
  console.log('\n[SUCCESS] OAuth Tokens received from Google!');

  if (tokens.refresh_token) {
    console.log('[SUCCESS] GOOGLE_REFRESH_TOKEN saved to .env file.');
  } else if (process.env.GOOGLE_REFRESH_TOKEN) {
    console.log('[INFO] Using existing GOOGLE_REFRESH_TOKEN from .env.');
  }

  // Quick verification: test listing target folder
  try {
    const drive = getDriveClient();
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    console.log(`\nVerifying connection to Google Drive folder (${folderId})...`);
    const folderRes = await drive.files.get({
      fileId: folderId,
      fields: 'id, name, owners',
      supportsAllDrives: true
    });
    console.log(`[SUCCESS] Folder verified: "${folderRes.data.name}" (Owner: ${folderRes.data.owners?.[0]?.emailAddress || 'User'})`);
    console.log('\nAll set! House Finance is now ready to upload payment proofs directly to Google Drive without quota errors.\n');
  } catch (driveErr) {
    console.warn('[Warning] Could not verify folder immediately:', driveErr.message);
  }
}

function cleanupAndExit(code) {
  if (serverClosed) return;
  serverClosed = true;
  try { server.close(); } catch (e) {}
  setTimeout(() => process.exit(code), 1200);
}
