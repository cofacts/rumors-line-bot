import fetch from 'node-fetch';
import { google } from 'googleapis';
import fs from 'fs';
import util from 'util';
import { exec as child_process_exec } from 'child_process';
import { getLineContentProxyURL } from './utils';
const exec = util.promisify(child_process_exec);

const OAuth2 = google.auth.OAuth2;
let drive = null;
const tmpDir = 'tmp_image_process/';

initGDrive();

function initGDrive() {
  if (!process.env.GOOGLE_DRIVE_IMAGE_FOLDER) {
    console.log('Google drive forder id not set, skip Gdrive initialization.');
    return;
  }

  if (!process.env.GOOGLE_CREDENTIALS) {
    console.log('Google credentials not set, skip Gdrive initialization.');
    return;
  }

  const { token, secrets } = JSON.parse(process.env.GOOGLE_CREDENTIALS);

  // Authorize a client with the loaded credentials, then call the
  // Drive API.
  const clientSecret = secrets.installed.client_secret;
  const clientId = secrets.installed.client_id;
  const redirectUrl = secrets.installed.redirect_uris[0];
  const oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);

  // Check if we have previously stored a token.
  oauth2Client.setCredentials(token);
  drive = google.drive({ version: 'v3', auth: oauth2Client });
}

export async function downloadFile(messageId) {
  //get line message file
  const LINE_API_URL = `https://api-data.line.me/v2/bot/message/${messageId}/content`;
  const options = {
    headers: {
      Authorization: `Bearer ${process.env.LINE_CHANNEL_TOKEN}`,
    },
    method: 'GET',
  };
  const res = await fetch(LINE_API_URL, options);
  return res;
}

export async function uploadImageFile(fetchResponse, messageId) {
  const fileMetadata = {
    name: `${messageId}.jpg`,
    mimeType: 'image/jpeg',
    parents: [process.env.GOOGLE_DRIVE_IMAGE_FOLDER],
  };

  uploadFile(fetchResponse, fileMetadata);
}

export async function uploadVideoFile(messageId) {
  const fileMetadata = {
    name: `${messageId}.mp4`,
    mimeType: 'video/mp4',
    parents: [process.env.GOOGLE_DRIVE_IMAGE_FOLDER],
  };

  uploadFile(messageId, fileMetadata);
}

export async function saveImageFile(fetchResponse, fileName) {
  fs.existsSync(tmpDir) || fs.mkdirSync(tmpDir);
  const filePath = tmpDir + fileName + '.jpg';
  const file = fs.createWriteStream(filePath);
  fetchResponse.body.pipe(file);
  file.on('finish', function() {
    file.close();
  });
}

export async function processImage(messageId) {
  console.log(`Image url:  ${getLineContentProxyURL(messageId)}`);

  const filePath = tmpDir + messageId;
  const command = `tesseract ${filePath}.jpg ${filePath} -l chi_tra`;
  await exec(command);
  // console.log('stdout:', stdout);
  // console.log('stderr:', stderr);

  // Convert fs.readFile into Promise version of same
  const readFile = fileName => util.promisify(fs.readFile)(fileName, 'utf8');
  const textFilePath = filePath + '.txt';
  const r = await readFile(textFilePath);
  // Remove jpg file after read
  fs.unlink(tmpDir + messageId + '.jpg', err => {
    if (err) {
      console.error(err);
    }
  });
  // Remove txt file after read
  fs.unlink(tmpDir + messageId + '.txt', err => {
    if (err) {
      console.error(err);
    }
  });
  // remove all spaces output from tesseract so that elasticsearch can have a better search result
  return r.replace(/\s+/g, '');
}

async function uploadFile(fetchResponse, fileMetadata) {
  if (!drive) {
    console.log('Gdrive is not initial, skip uploading data.');
    return;
  }

  const media = {
    mimeType: 'image/jpeg',
    body: fetchResponse.body,
  };
  //upload to google drive
  drive.files.create(
    {
      resource: fileMetadata,
      media: media,
      fields: 'id',
    },
    function(err, file) {
      if (err) {
        // Handle error
        console.error('Error: ', err);
      } else {
        console.log('Uploaded File Id: ', file.data.id);
      }
    }
  );
}
