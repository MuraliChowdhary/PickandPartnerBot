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
// app.use("/api/", listBRoutes);
app.use("/api/utm", utmRoutes);

// mongoose
//   .connect(process.env.MONGODB_URI, {
//     // useNewUrlParser: true,
//     // useUnifiedTopology: true,
//   })
//   .then(() => {
//     console.log("Database Connected Successfully");
//   })
//   .catch((err) => {
//     console.error("Database connection error:", err);
//   });

// API routes
app.use("/api/admin", AdminRoutes);
app.use("/api/", listARoutes);
// app.use("/api/", listBRoutes);
app.use("/api/utm", utmRoutes);

async function handleGuidelines(interaction) {
  const guidelinesMessage = new EmbedBuilder()
    .setColor("#0099ff") // Standard blue color
    .setTitle("Community Guidelines")
    .setDescription(
      "Please follow these guidelines to ensure a positive experience:"
    )
    .addFields(
      {
        name: "1.Respect Others",
        value: "Be respectful and courteous when interacting with others.",
      },
      {
        name: "2.Use Commands Properly",
        value:
          "Avoid misuse of commands to ensure smooth operation for everyone.",
      },
      {
        name: "3.Provide Constructive Feedback",
        value:
          "Feedback should be constructive, relevant, and aimed at improving the bot.",
      },
      {
        name: "4.Ask Questions",
        value:
          "If you have questions, ask in the designated channels or use `/help`.",
      },
      {
        name: "5.Report Issues",
        value:
          "Report any issues with `/feedback` to help us maintain a great experience.",
      }
    )
    .setFooter({
      text: "Thank you for helping us maintain a positive community.",
    });

  await interaction.reply({ embeds: [guidelinesMessage] });
}

module.exports = { handleGuidelines };
