const path = require('path');
const { google } = require('googleapis');
const { Readable } = require('stream');
require('dotenv').config({ path: path.resolve(__dirname, '../../.env') });
require('dotenv').config();

/**
 * Initializes and returns an authorized Google Drive API client using OAuth 2.0
 * with GOOGLE_CLIENT_ID, GOOGLE_CLIENT_SECRET, and GOOGLE_REFRESH_TOKEN.
 * Uses your personal Google Drive quota (vijeshviswanv@gmail.com) without any Service Account limitations.
 */
function getDriveClient() {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const refreshToken = process.env.GOOGLE_REFRESH_TOKEN;

  if (!clientId || !clientSecret) {
    throw new Error('GOOGLE_CLIENT_ID and GOOGLE_CLIENT_SECRET must be configured in .env');
  }

  if (!refreshToken) {
    throw new Error(
      'GOOGLE_REFRESH_TOKEN is missing in .env. ' +
      'Please authorize your account by opening http://localhost:5001/api/auth/google/url?redirect=true ' +
      'or running "npm run auth:google".'
    );
  }

  const oauth2Client = new google.auth.OAuth2(clientId, clientSecret);
  oauth2Client.setCredentials({
    refresh_token: refreshToken
  });

  return google.drive({ version: 'v3', auth: oauth2Client });
}

/**
 * Uploads an image buffer directly to the Google Drive folder via OAuth 2.0
 * @param {Buffer} fileBuffer - The binary image buffer
 * @param {string} originalName - Original filename from client
 * @param {string} mimeType - MIME type (e.g. image/jpeg, image/png)
 * @returns {Promise<{fileId: string, proofUrl: string, webViewLink: string, webContentLink: string}>}
 */
async function uploadImageToDrive(fileBuffer, originalName = 'proof.jpg', mimeType = 'image/jpeg') {
  const drive = getDriveClient();
  const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

  if (!folderId) {
    throw new Error('GOOGLE_DRIVE_FOLDER_ID environment variable is missing.');
  }

  const cleanName = path.basename(originalName).replace(/[^a-zA-Z0-9.-]/g, '_');
  const filename = `proof-${Date.now()}-${cleanName}`;

  const fileMetadata = {
    name: filename,
    parents: [folderId]
  };

  const media = {
    mimeType: mimeType || 'image/jpeg',
    body: Readable.from(fileBuffer)
  };

  // Upload file directly to personal Google Drive
  const response = await drive.files.create({
    requestBody: fileMetadata,
    media: media,
    supportsAllDrives: true,
    fields: 'id, name, webViewLink, webContentLink'
  });

  const fileId = response.data.id;
  const webViewLink = response.data.webViewLink;
  const webContentLink = response.data.webContentLink;

  // Make file viewable to anyone with the link
  try {
    await drive.permissions.create({
      fileId: fileId,
      supportsAllDrives: true,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });
  } catch (permErr) {
    console.warn(`Could not set public permission on Drive file ${fileId}:`, permErr.message);
  }

  // Construct direct image view URL suitable for <img> embedding and opening
  const proofUrl = `https://drive.google.com/uc?export=view&id=${fileId}`;

  return {
    fileId,
    proofUrl,
    webViewLink,
    webContentLink
  };
}

/**
 * Deletes a file from Google Drive by its file ID
 * @param {string} fileId
 */
async function deleteFileFromDrive(fileId) {
  if (!fileId) return;
  try {
    const drive = getDriveClient();
    await drive.files.delete({
      fileId: fileId,
      supportsAllDrives: true
    });
    console.log(`Successfully deleted Google Drive file: ${fileId}`);
  } catch (err) {
    console.warn(`Could not delete Google Drive file ${fileId}:`, err.message);
  }
}

module.exports = {
  getDriveClient,
  uploadImageToDrive,
  deleteFileFromDrive
};
