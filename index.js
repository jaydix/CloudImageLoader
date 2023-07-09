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
    Array.prototype.toString = function () { // no commas
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
    //session.set('output1', '0xFFFFFF0xFFFFFF')

    jimp.read("test.png", (err, img) => { // images!
        if (err) throw err;

        const pixelSize = 3
        const width = 480/pixelSize
        const height = 360/pixelSize
        var imgRes = img.resize(width, height) // resized
        imgRes.write('./2.png')

        for (var y = 0; y < height; y++) {
            for (var x = 0; x < width; x++) { // one row
                var colors = jimp.intToRGBA(imgRes.getPixelColor(x, y))
                colors = `${pad(colors.r, 3)}${pad(colors.g, 3)}${pad(colors.b, 3)}`;// rgb
                // colors = parseInt(colors)//.toString(16) //hex
                // colors = pad(colors, 6); // leading 0s
                //colors = colors.substring(0, 6); // theres... a leading number in some colors
                colorArray.push(colors) // actual hex to push
            }
        }
        fs.writeFileSync('test.json', JSON.stringify(colorArray));
        fs.writeFileSync('test.txt', colorArray.toString());
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
        //console.log(packetChunkIdx,currentPacketChunk)
        const chunkedPacket = chunkString(currentPacketChunk, chunkLength)
        //console.log(chunkedPacket)
        fs.writeFileSync('chunks.json', JSON.stringify(packetChunks))

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
                if(packetChunkIdx > (packetChunks.length)-1) chunkIdx++;
                session.set('inputOrOutput', `${encode('sent')}`)
                break;
        }
    });

})();