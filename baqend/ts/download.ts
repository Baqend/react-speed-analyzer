const http = require('http');
/**
 * Fetches a URL and saves it to a Baqend file.
 *
 * Usage example:
 * download = require('./download');
 * download.toFile(db, "http://...test.jpg", "/www/image.jpg", 0);
 *
 * @param db Baqend db to use
 * @param url the URL that should be downloaded
 * @param target the name of the target Baqend file
 * @param maxRetries number of retries if the response has a 4xx or 5xx status code
 * @returns {Promise} a Promise that resolves to the uploaded file
 */
function toFile(db, url, target, maxRetries = 10) {
    return new Promise((resolve, reject) => {
        http.get(url, (res) => {
            const file = new db.File({path: target});
            const size = res.headers['content-length'];
            const mimeType = res.headers['content-type'];

            //Retry on error
            if (res.statusCode >= 400 && res.statusCode < 600) {
                if(maxRetries <= 0) {
                    reject(new Error("Maximum number of retries reached without success"));
                } else {
                    setTimeout(() => resolve(toFile(db, url, target, maxRetries - 1)), 500);
                }
                return;
            }

            //Full response
            if (size) {
                resolve(file.upload({mimeType, size, type: 'stream', data: res}));
                return;
            }

            //Or chunked encoding
            const chunks = [];
            res.on('data', chunks.push.bind(chunks));
            res.on('end', () => {
                const buf = Buffer.concat(chunks);
                resolve(file.upload({mimeType, size: buf.length, type: 'buffer', data: buf, force: true}));
            });
        }).on('error', (e) => {
            reject(e);
        });
    });
}

exports.toFile = toFile;
