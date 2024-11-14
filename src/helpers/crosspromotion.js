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

async function handleCrossPromote(interaction) {
  console.log("Hello");
  const requiredRoleId = process.env.REQUIRED_ROLE_ID;
  const member = interaction.member;

  // // Uncomment if you want to restrict access based on role
  // if (!member.roles.cache.has(requiredRoleId)) {
  //   await interaction.reply({
  //     content:
  //       "Sorry, you don't have access to this feature yet. Try one of the following:\n" +
  //       "1. Recheck your registration details\n" +
  //       "2. Wait for an admin to approve your registration",
  //     ephemeral: true,
  //   });
  //   return;
  // }
   

  //fetch info of the user from db check the isVerified variable ? true =>> access :false sorry dont have permission

  //isverified:crosspromotion: isEligible if false then make true
  //***if isEligible is true: send message saying to wait***

  


  try {
    await interaction.deferReply(); // Acknowledge interaction before processing

    const discordId = interaction.user.id;
    const username = interaction.user.username;

    // Fetch registration data
    const responseData = await fetch(
      `http://localhost:3030/api/profile?discordId=${discordId}`,
      {
        method: "GET",
        headers: {
          "Content-Type": "application/json",
        },
      }
    );

    if (!responseData.ok) {
      throw new Error(`Error fetching registration data: ${responseData.statusText}`);
    }

    const dataMess = await responseData.json();
    const { niche, subscribers, newsletterName, link } = dataMess;
    const additionalInfo = "Your additional info here"; // Set any additional info if needed

    // Construct the webhook payload including additional information
    const webhookPayload = {
      content:
        `🔗 **Cross Promotion Request** 📢\n` +
        `---\n` +
        `**User Details**:\n` +
        `**Discord ID:** ${discordId}\n` +
        `**Username:** ${username}\n` +
        `---\n` +
        `**Newsletter Info**:\n` +
        `**Niche:** ${niche}\n` +
        `**Subscribers:** ${subscribers}\n` +
        `**Newsletter Name:** ${newsletterName}\n` +
        `**Link:** [Visit Newsletter](${link})\n` +
        `**Additional Information:** ${additionalInfo}\n` +
        `---\n` +
        `*This request was made at ${new Date().toLocaleString()}*`,
    };

    // Send the webhook
    const response2 = await fetch(CROSSPROMOTION_TRIGGER, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(webhookPayload),
    });

    if (!response2.ok) {
      throw new Error(`Error sending webhook: ${response2.statusText}`);
    }

    // Confirmation message to the user
    await interaction.followUp(
      "✅ **Your cross-promotion request has been submitted!**\n\nOur team will contact you shortly. Thank you! 🚀"
    );
  } catch (error) {
    console.error("Error in handleCrossPromote:", error);
    await interaction.followUp(
      "There was an error processing your request. Please try again later."
    );
  }
}


module.exports = { handleCrossPromote };
