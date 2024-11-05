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
const ListA = require('../../Models/ListASchema'); // Adjust path as needed
const {sendDM}= require("../helpers/sendDm")
const REGISTRATION_NOTIFIER = process.env.REGISTRATION_NOTIFIER;
 
const app = express();
app.use(cors());
app.use(express.json());
 
app.use("/api/admin", AdminRoutes);
app.use("/api/", listARoutes); 
app.use("/api/utm", utmRoutes);


 
async function handleSendUtmLinks(client, interaction) {
    try {
        const discordId1 = interaction.options.getString("discord_id_1");
        const discordId2 = interaction.options.getString("discord_id_2");

        console.log(discordId1, discordId2);

        // Fetch documents for both Discord IDs
        const [user1, user2] = await Promise.all([
            ListA.findOne({ discordId: discordId1 }),
            ListA.findOne({ discordId: discordId2 })
        ]);

        // Check if both users exist in the database
        if (!user1 || !user2) {
            console.log('One or both Discord IDs not found in the database.');
            return;
        }

        // Extract links from the fetched documents
        const link1 = user1.link;
        const link2 = user2.link;

        console.log(link1 + " " + link2);

        // Function to get a short URL from the Render server
        async function getShortUrl(link) {
            const response = await fetch('https://pickandpartner.onrender.com/shorten', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ originalUrl: link })
            });
            const result = await response.json();
            console.log(result);
            return result.shortUrl;
        }

        // Get short URLs for both links
        const [shortUrl1, shortUrl2] = await Promise.all([
            getShortUrl(link1),
            getShortUrl(link2)
        ]);

        // Send DMs with the short URLs using the imported sendDM function
        await Promise.all([
            sendDM(client, discordId1, `Here is your short URL: ${shortUrl1}`),
            sendDM(client, discordId2, `Here is your short URL: ${shortUrl2}`)
        ]);

    } catch (error) {
        console.error('Error processing Discord IDs and sending messages:', error);
    }
}

module.exports = { handleSendUtmLinks };


 