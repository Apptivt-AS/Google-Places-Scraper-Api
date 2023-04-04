const functions = require("firebase-functions");
const express = require("express");
const cors = require("cors");
const axios = require("axios");

const app = express();
app.use(cors({ origin: true }));

const apiKey = "AIzaSyATUCcXgflPYPqhI4D-QLdP4NpS6Xez_HI";

app.get("/", async (req, res) => {
  try {
    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/place/textsearch/json",
      {
        params: {
          query: "boxing",
          type: "gym",
          key: apiKey,
        },
      }
    );

    const results = response.data.results.map((result) => ({
      name: result.name,
      rating: result.rating || "",
      address: result.formatted_address,
      status: "",
      imageSrc: result.photos
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${result.photos[0].photo_reference}&key=${apiKey}`
        : null,
    }));

    res
      .status(200)
      .send(JSON.stringify({ category: "Boxing", activities: results }));
  } catch (error) {
    res.status(500).send({
      error,
      message: "An error occurred while fetching activities.",
      req,
    });
  }
});

exports.scrapeGoogleMapsActivities = functions
  .region("europe-west3")
  .https.onRequest(app);
