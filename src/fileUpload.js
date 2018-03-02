import fetch from 'node-fetch';
import url from 'url';
import google from 'googleapis';

const OAuth2 = google.auth.OAuth2;
const fs = require('fs');
const SECRET_PATH = 'client_secret.json';
const TOKEN_PATH = '.gdrive_access_token';
let drive = null;

initGDrive();

function initGDrive() {
  if(!process.env.GOOGLE_DRIVE_IMAGE_FOLDER){
    console.log('Google drive forder id not set, skip Gdrive initialization.');
    return;
  }

  // Load client secrets from a local file.
  fs.readFile(SECRET_PATH, function processClientSecrets(err, content) {
    if (err) {
      console.log('Check client_secret file failed, skip Gdrive initialization.');
      return;
    }
    // Authorize a client with the loaded credentials, then call the
    // Drive API.
    const credentials = JSON.parse(content)
    const clientSecret = credentials.installed.client_secret;
    const clientId = credentials.installed.client_id;
    const redirectUrl = credentials.installed.redirect_uris[0];
    const oauth2Client = new OAuth2(clientId, clientSecret, redirectUrl);
    
    // Check if we have previously stored a token.
    fs.readFile(TOKEN_PATH, function processTokens(err, token) {
      if (err) {
        console.log('Check token file failed, skip Gdrive initialization.');
        return;
      } else {
        oauth2Client.setCredentials(JSON.parse(token));
        drive = google.drive({ version: 'v3', auth: oauth2Client });
      }
    });
  });
}

export async function uploadImageFile(messageId) {
  const fileMetadata = {
    name: `${messageId}.jpg`,
    mimeType: 'image/jpeg',
    parents: [process.env.GOOGLE_DRIVE_IMAGE_FOLDER]
  };
  
  uploadFile(messageId, fileMetadata);
}

export async function uploadVideoFile(messageId) {
  const fileMetadata = {
    name: `${messageId}.mp4`,
    mimeType: 'video/mp4',
    parents: [process.env.GOOGLE_DRIVE_IMAGE_FOLDER]
  };
  
  uploadFile(messageId, fileMetadata);
}


async function uploadFile(messageId, fileMetadata) {
  if(!drive){
    console.log('Gdrive is not initial, skip uploading data.');
    return ;
  }
  
  //get line message file
  const LINE_API_URL = `https://api.line.me/v2/bot/message/${messageId}/content`;
  const options = {
    headers:{
      Authorization: `Bearer ${process.env.LINE_CHANNEL_TOKEN}`
    },
    method: 'GET'
  };
  const res = await fetch(LINE_API_URL,options);
  
  const media = {
    mimeType: 'image/jpeg',
    body: res.body
  };
  //upload to google drive
  drive.files.create({
    resource: fileMetadata,
    media: media,
    fields: 'id'
  }, function (err, file) {
    if (err) {
      // Handle error
      console.error('Error: ',err);
    } else {
      console.log('Uploaded File Id: ', file.data.id);
    }
  });
}