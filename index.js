import jimp from "jimp";
import { ScratchCloud } from "@errorgamer2000/scratch-cloud";
import * as fs from "node:fs";
import { encode, decode } from "stringstonumbers";

const config = JSON.parse(fs.readFileSync('config.json'))

const colorArray = [];
var chunkIdx = 0;
var packetChunkIdx = 0;

// helper functions!

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

    await cloud.login(config.username, config.password);

    const session = cloud.createSession(
        config.id,
        false
    ); // dont use turbowarp

    jimp.read("input.png", (err, img) => {
        if (err) throw err;

        // image initialization!
        // pixelSize - the size (in pixels) that each pixel on the scratch stage should be.
        // make sure the pixelSize variable in scratch matches the one here!
        // the higher the value, the lower quality the resulting image,
        // and the faster it renders!
        const pixelSize = 3
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
    });

    session.on("set", (name, value) => { // on cloud set
        name = name.slice(2, name.length);
        if (name == 'inputOrOutput') value = decode(value);
        else {
            console.log(`${name} was set to ${value}.`);
            return; // get input only.
        }
        console.log(`${name} was set to ${value}.`);
        const chunkLength = 252
        const packetChunks = chunkString(colorArray.toString(), (chunkLength * 9))
        const currentPacketChunk = packetChunks[packetChunkIdx]
        const chunkedPacket = chunkString(currentPacketChunk, chunkLength)

        switch (value) {
            case 'init':
                chunkIdx = 0;
                packetChunkIdx = 0;
                break;
            case 'waiting':
                range(0, 8).forEach((i) => {
                    session.set('output' + ((i % 9) + 1), chunkedPacket[i])
                    //console.log(chunkedPacket[i])
                });
                packetChunkIdx++;
                if (packetChunkIdx > (packetChunks.length) - 1) chunkIdx++;
                session.set('inputOrOutput', `${encode('sent')}`)
                break;
        }
    });

})();