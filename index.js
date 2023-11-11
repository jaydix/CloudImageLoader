import jimp from "jimp";
import { ScratchCloud } from "@errorgamer2000/scratch-cloud";
import * as fs from "node:fs";
import { encode, decode } from "stringstonumbers";

const config = JSON.parse(fs.readFileSync('config.json'))

const colorArray = [];
// current packet chunk
var packetChunkIdx = 0;
// self explanatory. i recommend leaving it at 252
const chunkLength = 252
// packetChunks - the image, split into chunks. image is read later from input.png
var packetChunks = []
// pixelSize - the size (in pixels) that each pixel on the scratch stage should be.
// the higher the value, the lower quality the resulting image,
// and the faster it renders!
// make sure the pixelSize variable in scratch matches the one here!
// 6 is usually a good resolution if you want to balance quality and speed
const pixelSize = 3

// helper functions!

async function sleep(ms) { // im pretty sure you can figure this one out
    return new Promise(resolve => setTimeout(resolve, ms));
}

function pad(num, size) { // adds leading zeros. num = number, size = the length you want
    num = num.toString();
    while (num.length < size) num = "0" + num;
    return num;
}

function chunkString(str, length) { // slices [str] into chunks every [length] characters
    var toReturn = ''
    try {
        toReturn = str.match(new RegExp('.{1,' + length + '}', 'g'));
    }
    catch (e) {
        console.log(e)
    }
    return toReturn;
}
function range(min, max) { // makes an array of numbers between min and max
    var len = max - min + 1;
    var arr = new Array(len);
    for (var i = 0; i < len; i++) {
        arr[i] = min + i;
    }
    return arr;
}

(async function () {
    // This is a function I created to convert an array to a string. It returns a string containing every single-
    // - entry in the array, without anything separating them.
    Array.prototype.toString = function () {
        var toReturn = '';
        Array.from(this.entries()).forEach((v) => {
            toReturn += v[1];
        })
        return toReturn;
    }
    const cloud = new ScratchCloud();

    await cloud.login(config.username, new Buffer(config.password, 'base64').toString('utf8'));

    const session = cloud.createSession(
        config.id,
        false
    ); // dont use turbowarp
    console.log('Server up')

    jimp.read("input.png", async (err, img) => {
        if (err) throw err;

        // image initialization!
        const width = 480 / pixelSize
        const height = 360 / pixelSize
        var imgRes = img.resize(width, height) // resized

        // Adding colors to the array
        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) { // one row
                var colors = jimp.intToRGBA(imgRes.getPixelColor(x, y))
                colors = `${pad(colors.r, 3)}${pad(colors.g, 3)}${pad(colors.b, 3)}`;// rgb
                colorArray.push(colors) // actual rgb to push
            }
        }
        console.log('Reading complete')
        packetChunks = chunkString(colorArray.toString(), (chunkLength * 9))
        await sleep(250);
        session.set('inputOrOutput', encode('ch|' + packetChunks.length)) // send chunks over
    });

    session.on("set", async (name, value) => { // on cloud set
        name = name.slice(2, name.length);
        if (name == 'inputOrOutput') value = decode(value); // so we can read the values
        else {
            console.log(`${name} was set to ${value}.`);
            return; // get input only.
        }
        console.log(`${name} was set to ${value}.`);

        // chunk handling!
        // currentPacketChunk - a single packet chunk; contains enough characters to fill 9 -
        // - cloud variables, or 1 chunk
        const currentPacketChunk = packetChunks[packetChunkIdx]
        if (packetChunkIdx > (packetChunks.length) - 1) {

        }
        switch (value) {
            case 'init':
                packetChunkIdx = 0;
                await sleep(250);
                session.set('inputOrOutput', encode('ch|' + packetChunks.length))
                break;
            case 'waiting':
                // waiting for packets

                // chunkedPacket - the chunk split into 9 packets  
                const chunkedPacket = chunkString(currentPacketChunk, chunkLength)
                // we're finished when we've got an empty array
                if (chunkedPacket.length < 1) {
                    await session.set('inputOrOutput', `${encode('finished')}`)
                    return;
                }
                range(0, 8).forEach((i) => {
                    // send each packet
                    session.set('output' + ((i % 9) + 1), chunkedPacket[i])
                });
                // finished if we're over our chunk limit
                if (packetChunkIdx > (packetChunks.length) - 1) {
                    session.set('inputOrOutput', `${encode('finished')}`)
                } else {
                    session.set('inputOrOutput', `${encode('sent')}`)
                }
                packetChunkIdx++;
                break;
            case 'buffer':
                // just to make sure we don't time out
                session.set('inputOrOutput', `${encode('sent')}`)
                break;
        }
    });

})();
