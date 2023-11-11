import WebSocket, { WebSocketServer } from "ws";
import { scratchify } from "./scratchify";
import jimp from "jimp";
import puppeteer from "puppeteer";

(async () => {
  const wss = new WebSocketServer({ port: 8080 });
  const browser = await puppeteer.launch({ headless: "new" });
  const page = await browser.newPage();
  await page.setViewport({ width: 480, height: 360 });

  wss.on("connection", (ws:WebSocket) => {
    console.log('HEY');
    ws.on("error", console.error);
    ws.on("message", async (m:any) => {
      m = m.toString();
      const d = JSON.parse(m);
      switch (d.action) {
        case "goToUrl":
          await page.goto(d.url);
      }
    });
  });
})();