import jimp from "jimp";

function pad(num: number, size: number): string {
  let s = num.toString();
  while (s.length < size) {
    s = "0" + s;
  }
  return s;
}

async function scratchify(
  buf: Buffer,
  pixelSize: number = 1,
  url: string = ""
): Promise<string[]> {
  const colorArray: string[] = [];

  try {
    var img = null;
    if (url !== "") {
      img = await jimp.read(url);
    } else {
      img = await jimp.read(buf);
    }

    const width = 480 / pixelSize;
    const height = 360 / pixelSize;
    const imgRes = img.resize(width, height).quality(70);

    for (let y = 0; y < height; y++) {
      for (let x = 0; x < width; x++) {
        const colorObj = jimp.intToRGBA(imgRes.getPixelColor(x, y));
        const colors: string = `${pad(colorObj.r, 3)}${pad(colorObj.g, 3)}${pad(
          colorObj.b,
          3
        )}`;
        colorArray.push(colors);
      }
    }
    colorArray.pop(); // Remove the last newline

    //  const toSend = colorArray.join('\n');

    // Optionally, write the result to a file
    //const fileName = `output_${Date.now()}.txt`;
    // fs.writeFileSync(fileName, toSend);

    console.log("Processing complete");
    return colorArray;
  } catch (error) {
    console.error("Error:", error);
    throw error;
  }
}

export { scratchify };
