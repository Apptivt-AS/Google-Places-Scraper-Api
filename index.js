const express = require("express");
const app = express();
const port = process.env.PORT || 3000;

app.get("/scrape", async (req, res) => {
  try {
    const results = await scrapeGoogleMapsActivities();
    res.json(results);
  } catch (error) {
    console.error(error);
    res.status(500).send("An error occurred while scraping");
  }
});

app.listen(port, () => {
  console.log(`App listening at http://localhost:${port}`);
});
