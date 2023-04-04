const functions = require("firebase-functions");
const puppeteer = require("puppeteer");
const express = require("express");
const cors = require("cors");
const debug = require("debug")("scrapeGoogleMapsActivities");
const app = express();
const addProxyTo = require("puppeteer-page-proxy");
app.use(cors({ origin: true }));

const categories = [
  { id: 1, name: "Boxing", selected: true },
  // ... more categories here
  { id: 24, name: "Tennis", selected: true },
];

async function scrapeGoogleMapsActivities() {
  console.log("scrapeGoogleMapsActivities() called");
  try {
    const browser = await puppeteer.launch({
      headless: true,
      args: [
        "--no-sandbox",
        "--disable-setuid-sandbox",
        "--disable-web-security",
      ],
    });
    const page = await browser.newPage();

    // Add a proxy to fetch the page content
    await addProxyTo(page, "http://localhost:8080/");

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
            document.querySelectorAll(".bfdHYd.Ppzolf.OFBs3e")
          );
          console.log("activityElements:", activityElements);
          return activityElements.map((element) => {
            const name = element.querySelector(".qBF1Pd").innerText;
            const rating = element.querySelector(".ZkP5Je").innerText;
            const address = element.querySelectorAll(".W4Efsd")[0].innerText;
            const status = element.querySelectorAll(".W4Efsd")[1].innerText;

            const img = element.querySelector("img");
            const imageSrc = img ? img.getAttribute("src") : null;

            return {
              name,
              rating,
              address,
              status,
              imageSrc,
            };
          });
        });

        results.push({
          category: category.name,
          activities: activityData,
        });
        console.log("results:", results);
      } else {
        console.log(`Skipping category ${category.name}`);
      }
    }

    await browser.close();
    return results;
  } catch (error) {
    console.error("Error occurred:", error);
  }
}

app.get("/", async (req, res) => {
  try {
    const seen = [];
    const results = await scrapeGoogleMapsActivities();
    const response = JSON.stringify(results, (key, value) => {
      if (typeof value === "object" && value !== null) {
        if (seen.indexOf(value) !== -1) {
          return;
        }
        seen.push(value);
      }
      return value;
    });
    res.status(200).send(response);
  } catch (error) {
    res.status(500).send({
      error,
      message: "An error occurred while scraping activities.",
      req,
    });
  }
});

exports.scrapeGoogleMapsActivities = functions
  .region("europe-west3")
  .https.onRequest(app);
