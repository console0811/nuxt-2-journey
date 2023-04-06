import { resolve } from "path";
import { Readable } from "stream";
import { google } from "googleapis";

const KEY_FILE_PATH = resolve(__dirname, "./../services/service.account.cred.json")

const SCOPES = ['https://www.googleapis.com/auth/drive'];

const auth = new google.auth.GoogleAuth({ keyFile: KEY_FILE_PATH, scopes: SCOPES });

export function createAndUploadFile({ buffer = '', originalname = '', mimetype = '', folder = '' } = {}) {

    const stream = Readable.from(buffer)

    const driveService = google.drive({ version: 'v3', auth });

    let resource = {
        'name': originalname,
        'parents': [folder]
    };

    let media = {
        mimeType: mimetype,
        body: stream
    }

    return driveService.files.create({
        resource,
        media,
    })
        .then((data) => data)
        .catch(err => Promise.reject(`Failed to create file, ${err}`))
}