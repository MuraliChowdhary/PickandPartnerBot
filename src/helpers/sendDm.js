require("dotenv").config();
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Importing routes
const listARoutes = require("../../Routes/listARoutes");
const utmRoutes = require("../../Routes/utmRoutes");
const AdminRoutes = require("../../Routes/AdminRoutes");
const CROSSPROMOTION_TRIGGER = process.env.WEBHOOK_URL_CROSSPROMOTION;

// Set up Express app
const app = express();
app.use(cors());
app.use(express.json());

 
// API routes
app.use("/api/admin", AdminRoutes);
app.use("/api/", listARoutes);
// app.use("/api/", listBRoutes);
app.use("/api/utm", utmRoutes);


// temp.js
async function sendDM(client, discordId, message) {
    try {
        const user = await client.users.fetch(discordId);
        await user.send(message);
        //totalPromotionsGiven++
        console.log(`DM sent to ${discordId}`);
    } catch (error) {
        console.error(`Error sending DM to ${discordId}:`, error);
    }
}


module.exports = { sendDM };
