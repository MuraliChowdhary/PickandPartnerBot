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
const { sendDM } = require("../helpers/sendDm");
const REGISTRATION_NOTIFIER = process.env.REGISTRATION_NOTIFIER;

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/admin", AdminRoutes);
app.use("/api/", listARoutes);
app.use("/api/utm", utmRoutes);

// Helper function to fetch a Discord user's username
async function getUsernameByDiscordId(discordId, client) {
    try {
        const user = await client.users.fetch(discordId);
        return user.username;
    } catch (error) {
        console.error(`Failed to fetch username for Discord ID ${discordId}:`, error);
        return null;
    }
}

// Delay function
function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function handleSendUtmLinks(client, interaction) {
    try {
        // Initial reply to avoid timeout
        await interaction.reply("Processing your request...");

        const discordId1 = interaction.options.getString("discord_id_1");
        const discordId2 = interaction.options.getString("discord_id_2");

        // Update: Inform the admin about ID fetching process
        await interaction.editReply("Fetching user data from the database...");
        await delay(1000);  // Add delay to simulate processing time

        const [user1, user2] = await Promise.all([
            ListA.findOne({ discordId: discordId1 }),
            ListA.findOne({ discordId: discordId2 })
        ]);

        if (!user1 || !user2) {
            await interaction.editReply("One or both Discord IDs not found in the database.");
            return;
        }

        // Extract links from the fetched documents
        const link1 = user1.link;
        const link2 = user2.link;

        // Update: Inform about username fetching
        await interaction.editReply("Fetching Discord usernames...");
        await delay(1000);

        // Retrieve usernames from Discord using the provided Discord IDs
        const [username1, username2] = await Promise.all([
            getUsernameByDiscordId(discordId1, client),
            getUsernameByDiscordId(discordId2, client)
        ]);

        if (!username1 || !username2) {
            await interaction.editReply("Could not retrieve usernames for one or both Discord IDs.");
            return;
        }

        // Generate UTM links with each user's username as the utm_source
        const utmLink1 = `${link1}/?utm_source=${username1}&utm_medium=pickandpartner&utm_campaign=crosspromotion`;
        const utmLink2 = `${link2}/?utm_source=${username2}&utm_medium=pickandpartner&utm_campaign=crosspromotion`;

        // Update: Inform about short URL generation
        await interaction.editReply("Generating short URLs...");
        await delay(1000);

        // Function to get a short URL from the Render server
        async function getShortUrl(link) {
            const response = await fetch('https://pickandpartner.onrender.com/shorten', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ originalUrl: link })
            });
            const result = await response.json();
            return result.shortUrl;
        }

        // Get short URLs for both UTM links
        const [shortUrl1, shortUrl2] = await Promise.all([
            getShortUrl(utmLink1),
            getShortUrl(utmLink2)
        ]);

        // Update: Inform about DM sending
        await interaction.editReply("Sending DMs with short URLs...");
        await delay(1000);

        // Send DMs with the short URLs using the imported sendDM function
        await Promise.all([
            sendDM(client, discordId1, `Here is your Promotion Link: ${shortUrl1}`),
            sendDM(client, discordId2, `Here is your Promotion Link: ${shortUrl2}`)
        ]);

        // Final update: Inform the admin that the process is completed
        await interaction.editReply("Process completed! DMs sent with the short URLs.");

    } catch (error) {
        console.error('Error processing Discord IDs and sending messages:', error);
        await interaction.editReply("An error occurred while processing the request.");
    }
}

module.exports = { handleSendUtmLinks };
