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
    .setColor("#1ABC9C") // A soothing teal color for professionalism and calmness
    .setTitle("📜 Community Guidelines")
    .setDescription(
      "Please follow these guidelines to ensure a positive and inclusive experience for everyone:"
    )
    .setThumbnail(
      "https://cdn-icons-png.flaticon.com/512/1048/1048941.png" // Represents guidelines or community rules
    )
    .addFields(
      {
        name: "1️⃣ Respect Others",
        value: "Treat everyone with respect and courtesy while interacting.",
      },
      {
        name: "2️⃣ Use Commands Properly",
        value:
          "Ensure that commands are used appropriately to maintain a smooth operation for all users.",
      },
      {
        name: "3️⃣ Provide Constructive Feedback",
        value:
          "Submit constructive and actionable feedback using `/submit_feedback <your message>` to help improve the bot.",
      },
      {
        name: "4️⃣ Ask Questions",
        value:
          "If you have any questions, use the appropriate channels or type `/help` for assistance.",
      },
      {
        name: "5️⃣ Report Issues",
        value:
          "Report any problems with the bot using `/issue <your message>` so we can address them promptly.",
      }
    )
    .setFooter({
      text: "Your cooperation helps us build a great community.",
      iconURL: "https://cdn-icons-png.flaticon.com/512/190/190411.png", // Optional footer icon for extra polish
    });

  await interaction.reply({ embeds: [guidelinesMessage] });
}

module.exports = { handleGuidelines };


