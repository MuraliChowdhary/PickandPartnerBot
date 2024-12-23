const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const listARoutes = require("../../Routes/listARoutes");
const utmRoutes = require("../../Routes/utmRoutes");
const AdminRoutes = require("../../Routes/AdminRoutes");
const ListA = require("../../Models/ListASchema");
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
    console.error(
      `Failed to fetch username for Discord ID ${discordId}:`,
      error
    );
    return null;
  }
}

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function isUserVerified(discordId) {
  try {
    const response = await fetch(
      `http://localhost:3030/api/isVerify?discordId=${discordId}`
    );
    if (!response.ok) {
      throw new Error("Failed to check verification status");
    }
    const data = await response.json();
    return data.verified; // Assuming the response contains `isVerified` key
  } catch (error) {
    console.error("Error checking verification status:", error);
    return false;
  }
}

async function fetchAdCopy(discordId1, discordId2) {
    const url = `http://localhost:3030/api/copyAD?discordId1=${discordId1}&discordId2=${discordId2}`;
    
    try {
      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      });
  
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Failed to fetch ad copy.");
      }
  
      const data = await response.json();
      const { copyText1, copyText2 } = data;
  
      if (!copyText1 || !copyText2) {
        throw new Error("Incomplete response data received from the server.");
      }
  
      return { copyText1, copyText2 };
    } catch (error) {
      console.error("Error fetching ad copy:", error.message);
      throw error; // Re-throw the error for higher-level handling
    }
  }
  
  
  
async function handleSendUtmLinks(client, interaction) {
  try {
    await interaction.deferReply({ ephemeral: true });

    const discordId1 = interaction.options.getString("discord_id_1");
    const discordId2 = interaction.options.getString("discord_id_2");

    let statusMessage = "Fetching user data from the database...\n";
    await interaction.editReply(statusMessage);

    const [user1, user2] = await Promise.all([
      ListA.findOne({ discordId: discordId1 }),
      ListA.findOne({ discordId: discordId2 }),
    ]);

    if (!user1 || !user2) {
      await interaction.editReply(
        `${statusMessage}Error: One or both Discord IDs not found in the database.`
      );
      return;
    }

    statusMessage += "Fetching Discord usernames...\n";
    await interaction.editReply(statusMessage);

    const [username1, username2] = await Promise.all([
      getUsernameByDiscordId(discordId1, client),
      getUsernameByDiscordId(discordId2, client),
    ]);

    if (!username1 || !username2) {
      await interaction.editReply(
        `${statusMessage}Error: Could not retrieve usernames for one or both Discord IDs.`
      );
      return;
    }

    statusMessage += "Verifying users...\n";
    await interaction.editReply(statusMessage);

    const [isVerified1, isVerified2] = await Promise.all([
      isUserVerified(discordId1),
      isUserVerified(discordId2),
    ]);

    if (!isVerified1 || !isVerified2) {
      await interaction.editReply(
        `${statusMessage}Error: One or both users are not verified.`
      );
      return;
    }

    const utmLink1 = `${user2.link}/?utm_source=${discordId1}&utm_medium=pickandpartner&utm_campaign=crosspromotion&utm_content=${discordId2}`;
    const utmLink2 = `${user1.link}/?utm_source=${discordId2}&utm_medium=pickandpartner&utm_campaign=crosspromotion&utm_content=${discordId1}`;

    statusMessage += "Generating short URLs...\n";
    await interaction.editReply(statusMessage);

    async function getShortUrl(link) {
      try {
        const response = await fetch(
          "https://pickandpartner.onrender.com/shorten",
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ originalUrl: link }),
          }
        );
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
      getShortUrl(utmLink2),
    ]);

    if (!shortUrl1 || !shortUrl2) {
      await interaction.editReply(
        `${statusMessage}Error: Failed to generate short URLs.`
      );
      return;
    }
    statusMessage += "Fetching ad copy\n";
    await interaction.editReply(statusMessage);

    const { copyText1, copyText2 } = await fetchAdCopy(discordId1, discordId2);
    if(!copyText1 || !copyText2){
        await interaction.editReply(`${statusMessage}Error: Failed to fetch ad copy.`);
    }

    statusMessage += "Sending DMs...\n";
    await interaction.editReply(statusMessage);

    const message1 = `
    Found you a perfect match.
    
    This is a combined effort. They got your details.
    
    You promote them, they will promote you.
    
    Copy:
    ${copyText2}
    
    Unique Link: 
    ${shortUrl1}

    For any queries, use /talk_to_admin command\n\n
      `;

      const message2 = `
      Found you a perfect match.
      
      This is a combined effort. They got your details.
      
      You promote them, they will promote you.
      
      Copy:
      ${copyText1}
      
      Unique Link: 
      ${shortUrl2}

      For any queries, use /talk_to_admin command.\n\n

        `;

    const dmResults = await Promise.allSettled([
      sendDM(client, discordId1, `${message1} `),
      sendDM(client, discordId2, `${message2}`),
    ]);

    const failedDms = dmResults.filter(
      (result) => result.status === "rejected"
    );
    if (failedDms.length > 0) {
      statusMessage += "Some DMs could not be sent. ";
    } else {
      statusMessage += "DMs sent successfully. ";
    }

    statusMessage += "Verifying links...\n";
    await interaction.editReply(statusMessage);

    const response = await fetch("http://localhost:3030/api/linkverify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ discordId1, discordId2 }),
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.error("Error:", errorData);
      statusMessage += "Error verifying links.";
    } else {
      const data = await response.json();
      statusMessage += data.message;
    }

    await interaction.editReply(statusMessage);
  } catch (error) {
    console.error("Error processing Discord IDs and sending messages:", error);
    await interaction.editReply(
      "An error occurred while processing the request."
    );
  }
}

module.exports = { handleSendUtmLinks };
