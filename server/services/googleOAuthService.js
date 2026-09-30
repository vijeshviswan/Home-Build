const fs = require('fs');
const path = require('path');
const { google } = require('googleapis');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();

const ENV_PATH = path.resolve(__dirname, '../../.env');

const DEFAULT_SCOPES = [
  'https://www.googleapis.com/auth/drive',
  'https://www.googleapis.com/auth/drive.file'
];

/**
 * Returns an OAuth2 client initialized with client ID and secret
 * @param {string} [redirectUri]
 */
function getOAuth2Client(redirectUri) {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be configured in .env');
  }

  const effectiveRedirect = redirectUri || 
    process.env.GOOGLE_REDIRECT_URI || 
    'http://localhost:5001/api/auth/google/callback';

  return new google.auth.OAuth2(
    clientId,
    clientSecret,
    effectiveRedirect
  );
}

/**
 * Generates the Google OAuth consent URL for vijeshviswanv@gmail.com
 * @param {string} [redirectUri]
 */
function generateAuthUrl(redirectUri) {
  const oauth2Client = getOAuth2Client(redirectUri);

  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: DEFAULT_SCOPES,
    login_hint: 'vijeshviswanv@gmail.com'
  });
}

/**
 * Exchanges authorization code for tokens and persists refresh_token to .env
 * @param {string} code - The authorization code returned by Google
 * @param {string} [redirectUri]
 */
async function exchangeCodeForTokens(code, redirectUri) {
  if (!code) {
    throw new Error('Authorization code is required');
  }

  const oauth2Client = getOAuth2Client(redirectUri);
  const { tokens } = await oauth2Client.getToken(code.trim());

  if (tokens.refresh_token) {
    saveRefreshTokenToEnv(tokens.refresh_token);
  } else if (!process.env.GOOGLE_REFRESH_TOKEN) {
    console.warn('Warning: Google did not return a refresh_token. You may have already consented. Revoke app access in Google Account permissions to force a new refresh token.');
  }

  return tokens;
}

/**
 * Appends or updates GOOGLE_REFRESH_TOKEN in .env and updates process.env
 * @param {string} refreshToken
 */
function saveRefreshTokenToEnv(refreshToken) {
  if (!refreshToken) return;

  let envContent = '';
  if (fs.existsSync(ENV_PATH)) {
    envContent = fs.readFileSync(ENV_PATH, 'utf8');
  }

  const key = 'GOOGLE_REFRESH_TOKEN';
  const regex = new RegExp(`^${key}=.*$`, 'm');

  if (regex.test(envContent)) {
    envContent = envContent.replace(regex, `${key}=${refreshToken}`);
  } else {
    envContent = envContent.trim() + `\n${key}=${refreshToken}\n`;
  }

  fs.writeFileSync(ENV_PATH, envContent.trim() + '\n', 'utf8');
  process.env.GOOGLE_REFRESH_TOKEN = refreshToken;
  console.log(`[Google OAuth] Saved GOOGLE_REFRESH_TOKEN to ${ENV_PATH} and loaded into process.env.`);
}

/**
 * Checks if OAuth2 is currently configured with a valid refresh token
 */
function isOAuthReady() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID &&
    process.env.GOOGLE_CLIENT_SECRET &&
    process.env.GOOGLE_REFRESH_TOKEN
  );
}

module.exports = {
  getOAuth2Client,
  generateAuthUrl,
  exchangeCodeForTokens,
  saveRefreshTokenToEnv,
  isOAuthReady,
  ENV_PATH
};
