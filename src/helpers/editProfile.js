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

// Set up Express app
const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
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

async function handleEditProfile(interaction) {
  console.log("hello");
  const discordId = interaction.user.id;
  let profile;

  // Function to fetch profile
  async function fetchProfile() {
    const response = await fetch(
      `https://pickandpartnerbackend.onrender.com/api/profile?discordId=${discordId}`,
      {
        method: "GET",
        headers: { "Content-Type": "application/json" },
      }
    );
    if (!response.ok) throw new Error("Failed to fetch profile");
    return await response.json();
  }

  // Function to update profile
  async function updateProfile(field, value) {
    const response = await fetch(
      "https://pickandpartnerbackend.onrender.com/api/update-profile",
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ discordId, [field]: value }),
      }
    );
    if (!response.ok) throw new Error("Failed to update profile");
    return await response.json();
  }

  // Function to display profile
  async function displayProfile() {
    const fields = [
      { name: "Newsletter Name", value: profile.newsletterName },
      { name: "Niche", value: profile.niche },
      { name: "Subscribers", value: profile.subscribers },
      { name: "Link", value: profile.link },
    ];

    let message = "Your current profile:\n\n";
    fields.forEach((field, index) => {
      message += `${index + 1}. ${field.name}: ${field.value}\n`;
    });
    message +=
      "5. Exit\n\nWhich field would you like to edit? (Enter the number)";

    await interaction.followUp(message);
  }

  try {
    profile = await fetchProfile();

    // Send the initial reply to the interaction
    await interaction.reply({
      content: "Loading your profile...",
      ephemeral: true, // Optional: hides the message from others
    });

    await displayProfile(); // Display profile

    const filter = (response) => response.author.id === interaction.user.id;

    while (true) {
      const fieldResponses = await interaction.channel.awaitMessages({
        filter,
        max: 1,
        time: 300000,
        errors: ["time"],
      });

      const fieldChoice = parseInt(fieldResponses.first().content);

      if (isNaN(fieldChoice) || fieldChoice < 1 || fieldChoice > 5) {
        await interaction.followUp(
          "Invalid choice. Please enter a number between 1 and 5."
        );
        continue;
      }

      if (fieldChoice === 5) {
        await interaction.followUp("Profile editing completed.");
        break;
      }

      const fieldNames = ["newsletterName", "niche", "subscribers", "link"];
      const fieldToUpdate = fieldNames[fieldChoice - 1];

      await interaction.followUp(
        `Please enter the new value for ${fieldNames[fieldChoice - 1]}:`
      );

      const valueResponses = await interaction.channel.awaitMessages({
        filter,
        max: 1,
        time: 300000,
        errors: ["time"],
      });

      let newValue = valueResponses.first().content;

      if (fieldToUpdate === "subscribers") {
        newValue = parseInt(newValue, 10);
        if (isNaN(newValue)) {
          await interaction.followUp("Invalid number. Please try again.");
          continue;
        }
      } else if (fieldToUpdate === "link") {
        const urlPattern =
          /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)(:[0-9]{1,5})?(\/.*)?$/i;
        if (!urlPattern.test(newValue)) {
          await interaction.followUp("Invalid URL. Please try again.");
          continue;
        }
      }

      try {
        const updatedProfile = await updateProfile(fieldToUpdate, newValue);
        profile = updatedProfile.updatedProfile;
        await interaction.followUp("Profile updated successfully!");
        await displayProfile(); // Show updated profile
      } catch (error) {
        await interaction.followUp(
          "Failed to update profile. Please try again."
        );
      }
    }
  } catch (error) {
    console.error("Error in handleEditProfile:", error);
    if (error.name === "Error [INTERACTION_ALREADY_REPLIED]") {
      await interaction.followUp(
        "An error occurred while editing your profile. Please try again later."
      );
    } else {
      await interaction.reply(
        "An error occurred while fetching your profile. Please try again later."
      );
    }
  }
}

module.exports = { handleEditProfile };
