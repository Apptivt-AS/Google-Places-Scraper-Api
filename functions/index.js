const functions = require("firebase-functions");
const admin = require("firebase-admin");
admin.initializeApp();
const express = require("express");
const cors = require("cors");
const axios = require("axios");
const app = express();

const db = admin.firestore();
app.use(cors({ origin: true }));

const apiKey = "AIzaSyATUCcXgflPYPqhI4D-QLdP4NpS6Xez_HI";
const { FieldValue } = require("firebase-admin").firestore;
app.get("/", async (req, res) => {
  try {
    const response = await axios.get(
      "https://maps.googleapis.com/maps/api/place/textsearch/json",
      {
        params: {
          query: "Beach Activities",
          key: apiKey,
          region: "no", // Add this line to limit the search to Norway
          radius: 10000,
        },
      }
    );
    const results = response.data.results.map((result) => ({
      name: result.name,
      rating: result.rating || "",
      address: result.formatted_address,
      status: "",
      coordinates: {
        lat: result.geometry.location.lat,
        lng: result.geometry.location.lng,
      },
      description: result.formatted_phone_number || "", // You can use 'formatted_phone_number' as a description if available
      imageSrc: result.photos
        ? `https://maps.googleapis.com/maps/api/place/photo?maxwidth=400&photoreference=${result.photos[0].photo_reference}&key=${apiKey}`
        : null,
    }));

    // Save activities to Firestore
    // Save activities to Firestore
    for (const activity of results) {
      const existingActivitySnapshot = await db
        .collection("Activities-mainDB")
        .where("title", "==", activity.name)
        .where("address", "==", activity.address)
        .get();

      // If the activity doesn't exist in Firestore, save it
      if (existingActivitySnapshot.empty) {
        // Get the counter document and increment the counter value
        const counterRef = db.collection("counters").doc("activityId");
        const counterSnapshot = await counterRef.get();
        const counterData = counterSnapshot.data();
        const newId = counterData.value + 1;

        // Update the counter value in Firestore
        await counterRef.update({ value: FieldValue.increment(1) });

        // Add the new activity with the unique numerical ID
        const activityRef = db.collection("Activities-mainDB").doc();
        await activityRef.set({
          id: newId,
          title: activity.name,
          description: "Main description",
          mainImage: activity.imageSrc,
          images: activity.imageSrc ? [activity.imageSrc] : [],
          coordinate: new admin.firestore.GeoPoint(
            activity.coordinates.lat,
            activity.coordinates.lng
          ),
          categories: ["2", "1"],
          price: {
            currency: "NOK",
            amount: 200,
          },
          remainingTickets: 5,
          duration: null,
          date: "2021-12-31",
          host: "",
          address: activity.address,
        });
      }
    }

    res
      .status(200)
      .send(JSON.stringify({ category: "skiing", activities: results }));
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
