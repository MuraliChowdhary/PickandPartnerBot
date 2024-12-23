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
    name: "cross_promote",
    description:
      "Collaborate with other creators to expand your audience. Share your links and build connections through mutual promotions.",
  },
  {
    name: "register",
    description: "Register your newsletter details.",
  },
  {
    name: "edit_profile",
    description: "Edit your newsletter registration details.",
  },
  {
    name: "help",
    description: "Get a list of available commands.",
  },
  {
    name: "guidelines",
    description: "View community guidelines.",
  },
  
  {
    name: "talk_to_admin",
    description: "Submit your feedback about the bot.",
  },
  {
    name: "issue",
    description: "Report an issue. Usage: `/issue <your message>`",
  },
];

async function handleHelp(interaction) {
  const helpMessage = new EmbedBuilder()
    .setColor("#5865F2") // Discord's native blurple color for a professional look
    .setTitle("🛠️ Help - Available Commands")
    .setDescription("Here are the commands you can use:")
    .setThumbnail(
      "https://cdn-icons-png.flaticon.com/512/5404/5404957.png" // Optional thumbnail icon for extra flair
    );

  // Dynamically add fields for each command
  commands.forEach((command) => {
    helpMessage.addFields({
      name: `/${command.name}`,
      value: command.description,
    });
  });

  helpMessage.setFooter({
    text: "Need more assistance? Type `/guidelines` for detailed help.",
    iconURL: "https://cdn-icons-png.flaticon.com/512/888/888879.png", // Optional footer icon
  });

  await interaction.reply({ embeds: [helpMessage] });
}

module.exports = { handleHelp };
