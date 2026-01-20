import express from "express";
import cors from "cors";
import { chromium } from "playwright";

const app = express();
app.use(cors());

const TARGET_URL = "https://salaty.yzz.me/push/tokens.json";

app.get("/tokens", async (req, res) => {
  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  try {
    await page.goto(TARGET_URL, { waitUntil: "networkidle" });

    const bodyText = await page.evaluate(() => {
      return document.body.innerText;
    });

    res.setHeader("Content-Type", "application/json");
    res.send(bodyText);
  } catch (err) {
    console.error(err);
    res.sendStatus(500);
  } finally {
    await browser.close();
  }
});

app.listen(3000, () => {
  console.log("🔥 Playwright proxy live → http://localhost:3000/tokens");
});

