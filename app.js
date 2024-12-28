require("dotenv").config();
const express = require("express");
const path = require("path");
const mongoose = require("mongoose");
const { Builder, By, until } = require("selenium-webdriver");
const firefox = require("selenium-webdriver/firefox");
const TrendingTopic = require("./models/Trending");
const dns = require("dns");
const cors = require("cors");

const app = express();
app.use(cors());

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("Connected to MongoDB");
  })
  .catch((err) => {
    console.error("MongoDB connection error:", err);
  });

function getProxyServerIP() {
  return new Promise((resolve, reject) => {
    const proxyHost = "open.proxymesh.com";
    dns.lookup(proxyHost, (err, address, family) => {
      if (err) {
        reject(`Error fetching IP address: ${err}`);
      } else {
        resolve(address);
      }
    });
  });
}

async function getTrendingTopics() {
  const geckodriverPath = process.env.GECHODRIVER_PATH;
  const username = process.env.PROXYMESH_USER;
  const password = process.env.PROXYMESH_PASS;
  const proxy = `http://${username}:${password}@open.proxymesh.com:31280`;

  const proxyIP = await getProxyServerIP().catch((err) => console.error(err));

  const options = new firefox.Options();
  options.addArguments("-headless");
  options.addArguments(`--proxy-server=${proxy}`);

  const driver = await new Builder()
    .forBrowser("firefox")
    .setFirefoxOptions(options)
    .setFirefoxService(new firefox.ServiceBuilder(geckodriverPath))
    .build();

  const trendingTopics = [];

  try {
    await driver.get(process.env.WEBSITE_URL);

    const button = await driver.wait(
      until.elementLocated(By.id("tab-link-table")),
      5000
    );
    await button.click();

    await driver.wait(
      until.elementLocated(By.xpath(".//tbody[@class='list']")),
      5000
    );

    const rows = await driver.findElements(
      By.xpath(".//tbody[@class='list']/tr")
    );

    for (let i = 0; i < Math.min(5, rows.length); i++) {
      const row = rows[i];

      try {
        const rank = await row
          .findElement(By.xpath(".//td[@class='rank']"))
          .getText();
        const topic = await row
          .findElement(By.xpath(".//td[@class='topic']/a"))
          .getText();
        const count = await row
          .findElement(By.xpath(".//td[@class='count']"))
          .getText();
        const duration = await row
          .findElement(By.xpath(".//td[@class='duration']"))
          .getText();

        trendingTopics.push({
          rank: parseInt(rank),
          topic,
          count,
          duration,
          proxyIP,
        });
      } catch (err) {
        console.error(`Error processing row: ${err}`);
      }
    }
  } catch (err) {
    console.error(`Error: ${err}`);
  } finally {
    await driver.quit();
  }
  const endTime = new Date();

  const trendingData = new TrendingTopic({
    endTime: endTime,
    topics: trendingTopics,
  });

  await trendingData
    .save()
    .then(() =>
      console.log("Top 5 trending topics and proxy IP saved to MongoDB")
    )
    .catch((err) => console.error("Error saving to MongoDB:", err));

  return trendingTopics;
}

app.get("/get_trending", async (req, res) => {
  try {
    const trendingTopics = await getTrendingTopics();
    res.json(trendingTopics);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
