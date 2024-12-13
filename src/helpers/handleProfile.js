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


const { EmbedBuilder } = require("discord.js");
const ListA = require("../../Models/ListASchema");

 
async function handleProfile(interaction) {
  const discordId = interaction.options.getString("discord_id");

  try {
    // Fetch user data from the database
    const user = await ListA.findOne({ discordId });

    if (!user) {
      return interaction.reply({ content: "User not found", ephemeral: true });
    }

    // Construct the embed message
    const embed = new EmbedBuilder()
      .setColor("#5865F2") // Discord's native blurple color
      .setTitle(`📋 User Profile - ${user.newsletterName}`)
      .setThumbnail("https://cdn-icons-png.flaticon.com/512/888/888879.png")
      .addFields(
        { name: "Discord ID", value: user.discordId, inline: true },
        { name: "Newsletter Name", value: user.newsletterName, inline: true },
        { name: "Niche", value: user.niche, inline: false },
        { name: "Link", value: `[Visit Link](${user.link})`, inline: false },
        { name: "Subscribers", value: user.subscribers.toString(), inline: true },
        { name: "Unique Clicks", value: user.uniqueClicks.toString(), inline: true },
        { name: "Max Promotions Allowed", value: user.maxPromotionsAllowed.toString(), inline: true },
        { name: "Is Link Sent", value: user.isLinkSend ? "Yes" : "No", inline: true },
        { name: "Is Verified", value: user.isVerified ? "Yes" : "No", inline: true },
        { name: "Created At", value: user.createdAt.toISOString(), inline: false }
      )
      .setFooter({
        text: "User Data",
        iconURL: "https://cdn-icons-png.flaticon.com/512/888/888879.png",
      });

    // Send the embed message in the Discord channel
    await interaction.reply({ embeds: [embed] });
  } catch (error) {
    console.error("Error fetching profile:", error);
    return interaction.reply({
      content: "An error occurred while fetching the user profile.",
      ephemeral: true,
    });
  } 
}

module.exports = { handleProfile };
