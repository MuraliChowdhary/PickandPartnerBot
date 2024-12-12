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

async function handleSendMessageToUser(interaction, client) {
  const discordId = interaction.options.getString("discord_id"); // Get the Discord ID from options
  const message = interaction.options.getString("message"); // Get the message from options

  try {
    // Fetch the user by their Discord ID
    const user = await client.users.fetch(discordId);

    // Create a rich embed message
    const embedMessage = new EmbedBuilder()
      .setColor(0x00ff00) // Green color for positive feedback
      .setTitle("📝 **Message from Admin**") // Title of the message
      .setDescription(message) // The actual content of the message
      .setFooter({ text: "If you have any questions, feel free to ask!" }) // Footer message
      .setTimestamp(); // Timestamp to show when the message was sent

    // Send the embed message to the user
    await user.send({ embeds: [embedMessage] });

    // Acknowledge the interaction with a success message
    await interaction.reply({
      content: `Message successfully sent to <@${discordId}>!`,
      ephemeral: true,
    });
  } catch (error) {
    console.error("Error sending message:", error);
    // Send an error message if something goes wrong
    await interaction.reply({
      content: `Failed to send message to <@${discordId}>. Please check the Discord ID and try again.`,
      ephemeral: true,
    });
  }
}

module.exports = {
  handleSendMessageToUser,
};

 