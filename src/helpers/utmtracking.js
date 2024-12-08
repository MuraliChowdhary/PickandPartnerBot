require("dotenv").config();
const fetch = (...args) => import("node-fetch").then(({ default: fetch }) => fetch(...args));

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const listARoutes = require("../../Routes/listARoutes");
const utmRoutes = require("../../Routes/utmRoutes");
const AdminRoutes = require("../../Routes/AdminRoutes");
const ListA = require('../../Models/ListASchema');
const { sendDM } = require("../helpers/sendDm");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/admin", AdminRoutes);
app.use("/api/", listARoutes);
app.use("/api/utm", utmRoutes);

async function getUsernameByDiscordId(discordId, client) {
    try {
        const user = await client.users.fetch(discordId);
        return user.username;
    } catch (error) {
        console.error(`Failed to fetch username for Discord ID ${discordId}:`, error);
        return null;
    }
}

function delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function handleSendUtmLinks(client, interaction) {
    try {
        await interaction.deferReply({ ephemeral: true });

        const discordId1 = interaction.options.getString("discord_id_1");
        const discordId2 = interaction.options.getString("discord_id_2");

        await interaction.editReply("Fetching user data from the database...");
        await delay(1000);

        const [user1, user2] = await Promise.all([
            ListA.findOne({ discordId: discordId1 }),
            ListA.findOne({ discordId: discordId2 })
        ]);

        if (!user1 || !user2) {
            await interaction.editReply("One or both Discord IDs not found in the database.");
            return;
        }

        const link1 = user1.link;
        const link2 = user2.link;

        await interaction.editReply("Fetching Discord usernames...");
        await delay(1000);

        const [username1, username2] = await Promise.all([
            getUsernameByDiscordId(discordId1, client),
            getUsernameByDiscordId(discordId2, client)
        ]);

        if (!username1 || !username2) {
            await interaction.editReply("Could not retrieve usernames for one or both Discord IDs.");
            return;
        }

        const utmLink1 = `${link1}/?utm_source=${discordId1}&utm_medium=pickandpartner&utm_campaign=crosspromotion`;
        const utmLink2 = `${link2}/?utm_source=${discordId2}&utm_medium=pickandpartner&utm_campaign=crosspromotion`;

        await interaction.editReply("Generating short URLs...");
        await delay(1000);

        async function getShortUrl(link) {
            try {
                const response = await fetch('http://localhost:3004/shorten', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ originalUrl: link, discordId1, discordId2 })
                });
                if (!response.ok) throw new Error("Failed to fetch short URL");
                const result = await response.json();
                return result.shortUrl;
            } catch (error) {
                console.error("Error generating short URL:", error);
                return null;
            }
        }

        const [shortUrl1, shortUrl2] = await Promise.all([
            getShortUrl(utmLink1),
            getShortUrl(utmLink2)
        ]);

        if (!shortUrl1 || !shortUrl2) {
            await interaction.editReply("Failed to generate short URLs.");
            return;
        }

        await interaction.editReply("Sending DMs with short URLs...");
        await delay(1000);

        const dmResults = await Promise.all([
            sendDM(client, discordId2, `Here is your Promotion Link: ${shortUrl1}`),
            sendDM(client, discordId1, `Here is your Promotion Link: ${shortUrl2}`)
        ]);

        const failedDms = dmResults.filter(result => result === false);
        if (failedDms.length) {
            await interaction.editReply("Process completed! Some DMs could not be sent.");
        } else {
            await interaction.editReply("Process completed! DMs sent with the short URLs.");
        }

    } catch (error) {
        console.error('Error processing Discord IDs and sending messages:', error);
        await interaction.editReply("An error occurred while processing the request.");
    }
}

module.exports = { handleSendUtmLinks };
