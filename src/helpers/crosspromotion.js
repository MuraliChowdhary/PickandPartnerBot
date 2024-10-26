require("dotenv").config();
const fetch = (...args) =>
import("node-fetch").then(({ default: fetch }) => fetch(...args));

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Importing routes
const listARoutes = require("../../Routes/listARoutes");
const listBRoutes = require("../../Routes/listBRoutes");
const utmRoutes = require("../../Routes/utmRoutes");
const AdminRoutes = require("../../Routes/AdminRoutes")

const ADMIN_USER_ID = process.env.ADMIN_USER_ID
const API  ="http://localhost:3030/api/admin"
const WEBHOOK_URL = process.env.USER_NOTIFIER
const CROSSPROMOTION_TRIGGER = process.env.WEBHOOK_URL_CROSSPROMOTION

 
// Set up Express app
const app = express();
app.use(cors());
app.use(express.json());


mongoose
  .connect(process.env.MONGODB_URI, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Database Connected Successfully");
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });

// API routes
app.use("/api/admin",AdminRoutes)
app.use("/api/", listARoutes);
// app.use("/api/", listBRoutes);
app.use("/api/utm", utmRoutes);



async function handleCrossPromote(interaction) {
    try {
        // Extract necessary details from the interaction object
        const discordId = interaction.user.id;
        const username = interaction.user.username;

        console.log(discordId)
        console.log(username)
        // Fetch the user's registration data
        const responseData = await fetch(`http://localhost:3030/api/profile?discordId=${discordId}`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
            },
        });

        // Ensure the response is OK
        if (!responseData.ok) {
            throw new Error(`Error fetching registration data: ${responseData.statusText}`);
        }

        // Parse the response data
        const dataMess = await responseData.json();
        console.log(dataMess)

        // Extract necessary information
        const niche = dataMess.niche;
        const subscribers = dataMess.subscribers;
        const newsLetterName = dataMess.newsletterName;
        const link = dataMess.link;

        // Construct the payload for the webhook
        const webhookPayload = {
            content: `🔗 **Cross Promotion Request** 📢\n` +
                     `---\n` +
                     `**User Details**:\n` +
                     `**Discord ID:** ${discordId}\n` +
                     `**Username:** ${username}\n` +
                     `---\n` +
                     `**Newsletter Info**:\n` +
                     `**Niche:** ${niche}\n` +
                     `**Subscribers:** ${subscribers}\n` +
                     `**Newsletter Name:** ${newsLetterName}\n` +
                     `**Link:** [Visit Newsletter](${link})\n` +
                     `---\n` +
                     `*This request was made at ${new Date().toLocaleString()}*`
        };
        
        

        // Send the webhook
        const response = await fetch(CROSSPROMOTION_TRIGGER, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify(webhookPayload),
        });

        // Check the response status
        if (!response.ok) {
            throw new Error(`Error sending webhook: ${response.statusText}`);
        }

        const data = await response.text();
        console.log(data);

        // Optionally send a response back to the user
        await interaction.reply("✅ **Your cross-promotion request has been submitted!**\n\nOur team will contact you shortly. Thank you! 🚀");

    } catch (error) {
        console.error("Error in handleCrossPromote:", error);
        await interaction.reply("There was an error processing your request. Please try again later.");
    }
}

module.exports = { handleCrossPromote };
