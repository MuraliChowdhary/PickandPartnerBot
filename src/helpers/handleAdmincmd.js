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

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/admin", AdminRoutes);
app.use("/api/", listARoutes);
app.use("/api/utm", utmRoutes);

const commands = [
    {
      name: "list",
      description:
        "List the users who are verified but haven't had cross-promotion links generated."
    },
    {
      name: "send_utm_links",
      description: "Generate short URLs for cross-promotion between two users. Usage: /send_utm_links <discordId1> <discordId2>."
    },
    {
      name: "send_message_to_user",
      description: "Send a direct message to a user. Usage: /send_message_to_user <discordId> <message>."
    },
    {
      name: "verify",
      description: "Mark a user as verified after registration. Usage: /verify <discordId>."
    },
    {
      name: "help",
      description: "Get a list of available commands."
    }
  ];
  
  async function handleAdmincmd(interaction) {
    const helpMessage = new EmbedBuilder()
      .setColor("#5865F2") // Discord's native blurple color for a professional look
      .setTitle("🛠️ Admin Commands - Help")
      .setDescription("Here are the admin commands you can use:")
      .setThumbnail(
        "https://cdn-icons-png.flaticon.com/512/5404/5404957.png" // Optional thumbnail icon for extra flair
      );
  
    // Dynamically add fields for each command
    commands.forEach((command) => {
      helpMessage.addFields({
        name: `/${command.name}`,
        value: command.description
      });
    });
  
    helpMessage.setFooter({
      text: "Need more assistance? Contact the admin team.",
      iconURL: "https://cdn-icons-png.flaticon.com/512/888/888879.png" // Optional footer icon
    });
  
    await interaction.reply({ embeds: [helpMessage] });
  }
  
  module.exports = { handleAdmincmd };