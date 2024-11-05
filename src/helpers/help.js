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

async function handleHelp(interaction) {
  const helpMessage = new EmbedBuilder()
    .setColor("#0062ff")
    .setTitle("Help - Available Commands")
    .setDescription("Here are the commands you can use:")
    .addFields(
      {
        name: "/register",
        value: "Register your newsletter details. Usage: `/register <details>`",
      },
      {
        name: "/cross-promote",
        value:
          "Generate a UTM link for cross-promotion. Usage: `/cross-promote`",
      },
      {
        name: "/feedback",
        value: "Send feedback about the bot. Usage: `/feedback <your message>`",
      },
      {
        name: "/guidelines",
        value: "View community guidelines. Usage: `/guidelines`",
      }
    )
    .setFooter({ text: "For more help, type `/guidelines`." }); // Updated line

  await interaction.reply({ embeds: [helpMessage] });
}

module.exports = { handleHelp };
