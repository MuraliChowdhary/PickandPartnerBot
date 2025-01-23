require("dotenv").config();
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const { EmbedBuilder } = require("discord.js");

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Importing routes
const listARoutes = require("../../Routes/listARoutes");
const utmRoutes = require("../../Routes/utmRoutes");
const AdminRoutes = require("../../Routes/AdminRoutes");
const CROSSPROMOTION_TRIGGER = process.env.WEBHOOK_URL_CROSSPROMOTION;

const listA = require("../../Models/ListASchema");
// Set up Express app
const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use("/api/admin", AdminRoutes);
app.use("/api/", listARoutes);
// app.use("/api/", listBRoutes);
app.use("/api/utm", utmRoutes);

async function handleCrossPromote(interaction) {
  try {
    // Fetch user verification status
    const discordId = interaction.user.id;
    const response = await fetch(
      `https://pickandpartnerbackend-titu.onrender.com/api/isVerify?discordId=${discordId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
        
      }
    );

    const textResponse = await response.json(); 
    console.log(textResponse) 

    if (!response.ok) {
      console.error("Error response:", textResponse.message);   
 
      await interaction.reply({
        content:
          "Sorry, you are not registered in the cross-promotion program. Please try /register for registration",
        ephemeral: true,
      });
      return;
    }

     
    const  verified = await textResponse.verified;

    if (!verified) {
      await interaction.reply({
        content:
          "Sorry, you don't have access to this feature yet. Try one of the following:\n" +
          "1. Recheck your registration details\n" +
          "2. Wait for an admin to approve your registration\n\n", 
        ephemeral: true,
      });
      return;
    }

    // If verified, proceed to fetch user details
    await interaction.deferReply();  // Defer the reply to allow followUp

    const responseData = await fetch(
      `https://pickandpartnerbackend-titu.onrender.com/api/profile?discordId=${discordId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!responseData.ok) {
      throw new Error(
        `Error fetching profile data: ${responseData.statusText}`
      );
    }

    const dataMess = await responseData.json();
    const { niche, subscribers, newsletterName, link } = dataMess;
    const additionalInfo = "Your additional info here";

    // Construct the webhook payload
    const webhookPayload = {
      embeds: [
        new EmbedBuilder()
          .setColor(0x00b0f4) // Blue color for professionalism
          .setTitle("🔗 **Cross Promotion Request** 📢")
          .setDescription(
            `**User Details**:\n` +
            `**Discord ID:** ${discordId}\n` +
            `**Username:** ${interaction.user.username}\n` +
            `---\n` +
            `**Newsletter Info**:\n` +
            `**Niche:** ${niche}\n` +
            `**Subscribers:** ${subscribers}\n` +
            `**Newsletter Name:** ${newsletterName}\n` +
            `**Link:** [Visit Newsletter](${link})\n` +
            `**Additional Information:** ${additionalInfo}\n` +
            `---\n` +
            `*This request was made at ${new Date().toLocaleString()}*`
          )
          .setFooter({
            text: "Please review the request and take necessary action.",
          })
          .setTimestamp(),
      ],
    };

    // Send the webhook
    const webhookResponse = await fetch(CROSSPROMOTION_TRIGGER, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookPayload),
    });

    if (!webhookResponse.ok) {
      throw new Error(`Error sending webhook: ${webhookResponse.statusText}`);
    }

    // Confirmation message
    await interaction.followUp(
      "Finding you the best match\n\n"+

      "We will send you the promotion details\n\n"
    );
  } catch (error) {
    console.error("Error in handleCrossPromote:", error);
    await interaction.followUp(
      "There was an error processing your request. Please try again later."
    );
  }
}



module.exports = { handleCrossPromote };
