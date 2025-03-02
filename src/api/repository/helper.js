'use strict'

const LOGGER = require('../../libs/log4js');
const AXIOS = require('axios');
const FS = require('fs');
const HTTPS = require('https');
const AGENT = new HTTPS.Agent({
  rejectUnauthorized: false,
});

const FILE_FETCH_TIMEOUT=90000;

exports.fetchFile = (url, file) => {
    return new Promise(function(resolve, reject) {
        LOGGER.module().info(`Fetching file from url ${url}...`);

        AXIOS.get(url, {
            httpsAgent: AGENT,
            responseType: 'stream',
            timeout: FILE_FETCH_TIMEOUT

        }).then(function(response) {
            LOGGER.module().info(`Fetch successful. Writing file ${file}...`);

            try {
                let writeStream = FS.createWriteStream(file);

                writeStream.on('error', (error) => {
                    LOGGER.module().error(`Error writing file: ${error}`);
                    resolve({error})
                });
    
                writeStream.on('finish', () => {
                    LOGGER.module().info(`File write complete: ${file}`);
                    resolve({error: null})
                });

                response.data.pipe(writeStream);
            }
            catch(error) {
                if (error.code === 'ECONNABORTED') {
                    console.error('Request timed out');
                }
                else {
                    LOGGER.module().error(`Error creating file in media storage: ${error}`);
                }
                resolve({error})
            }
        });
    });
}