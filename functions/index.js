const functions = require("firebase-functions");
const puppeteer = require("puppeteer");
const express = require("express");
const cors = require("cors");
const debug = require("debug")("scrapeGoogleMapsActivities");
const app = express();

app.use(cors({ origin: true }));

const categories = [
  { id: 1, name: "Arts & Crafts", selected: true },
  // ... more categories here
  { id: 24, name: "Tennis", selected: true },
];
functions.timeout = 60000;
async function scrapeGoogleMapsActivities() {
  console.log("scrapeGoogleMapsActivities() called");
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = await browser.newPage();
  const results = [];

  for (const category of categories) {
    if (category.selected) {
      await page.goto(
        `https://www.google.com/maps/search/${encodeURIComponent(
          category.name
        )}`
      );

      const activityData = await page.evaluate(() => {
        const activityElements = Array.from(
          document.querySelectorAll(".section-result")
        );
        console.log("activityElements:", activityElements);
        return activityElements.map((element) => {
          const title = element.querySelector(
            ".section-result-title span"
          ).innerText;
          const address =
            element.querySelector(".section-result-location span")?.innerText ||
            "";
          const rating =
            element.querySelector(".section-result-rating")?.innerText || "";
          return {
            title,
            address,
            rating,
          };
        });
      });

      results.push({
        categoryId: category.id,
        categoryName: category.name,
        activities: activityData,
      });
      console.log("results:", results);
    } else {
      console.log(`Skipping category ${category.name}`);
    }
  }

  await browser.close();
  return results;
}

app.get("/", async (req, res) => {
  try {
    const results = await scrapeGoogleMapsActivities();
    res.status(200).send(results);
  } catch (error) {
    res
      .status(500)
      .send({ error, message: "An error occurred while scraping activities." });
  }
});

exports.scrapeGoogleMapsActivities = functions.https.onRequest(app);
