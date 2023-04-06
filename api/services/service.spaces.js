import AWS from "aws-sdk";
import * as dotenv from 'dotenv'
dotenv.config()

const {
    DO_SPACES_ENDPOINT,
    DO_SPACES_KEY,
    DO_SPACES_SECRET,
    DATABASE,
    DO_SPACES_NAME,
    ASSET_DIRECTORY
} = process.env;

const spacesEndpoint = new AWS.Endpoint(DO_SPACES_ENDPOINT);

const s3 = new AWS.S3({
    endpoint: spacesEndpoint,
    accessKeyId: DO_SPACES_KEY,
    secretAccessKey: DO_SPACES_SECRET
});

export function createFile({ data = '', name = '', type = '', directory = '' } = {}) {
    return new Promise((resolve, reject) => {
        if (!data) reject("error - provide file data");
        if (!name) reject("error - provide file name");
        if (!type) reject("error - provide file type");
        if (!directory) reject("error - provide target directory");

        var params = {
            Body: data,
            Bucket: DO_SPACES_NAME,
            Key: `${ASSET_DIRECTORY}/${directory}/${name}`,
            ACL: "public-read",
            ContentEncoding: "base64",
            ContentType: type,
        };

        s3.putObject(params, function (err) {
            if (err) reject(err);
            resolve('successfully uploaded file!')
        });
    })

}

export function getFile(link = '') {
    return new Promise((resolve, reject) => {
        if (!link) reject("get file - provide link.");
        var params = {
            Bucket: DO_SPACES_NAME,
            Key: `${DATABASE}/${link}`,
        };

        s3.getObject(params, (err, data) => {
            if (err) reject(err);
            console.log(data)
            resolve('successfully deleted file!')
        });
    })

}

export function deleteFile(link = '') {
    return new Promise((resolve, reject) => {
        if (!link) reject("delete_file - provide key");
        var params = {
            Bucket: DO_SPACES_NAME,
            Key: `${DATABASE}/${link}`,
        };

        s3.deleteObject(params, function (err) {
            if (err) reject(err);
            resolve('successfully deleted file!')
        });
    })

}

