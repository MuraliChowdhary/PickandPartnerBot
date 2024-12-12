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

const REGISTRATION_NOTIFIER = process.env.REGISTRATION_NOTIFIER;

const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use("/api/admin", AdminRoutes);
app.use("/api/", listARoutes);
// app.use("/api/", listBRoutes);
app.use("/api/utm", utmRoutes);

// handleRegister function
async function handleRegister(interaction) {
  await interaction.reply("Please enter your newsletter name:");

  const filter = (response) => response.author.id === interaction.user.id;
  const collector = interaction.channel.createMessageCollector({
    filter,
    time: 60000,
  });

  let newsletterData = { discordId: interaction.user.id };

  collector.on("collect", async (collected) => {
    const userMessage = collected.content;

    if (!newsletterData.newsletterName) {
      newsletterData.newsletterName = userMessage;
      await interaction.followUp("Please enter your niche:");
    } else if (!newsletterData.niche) {
      newsletterData.niche = userMessage;
      await interaction.followUp("Please enter your number of subscribers:");
    } else if (!newsletterData.subscribers) {
      const subscriberCount = parseInt(userMessage, 10);
      if (isNaN(subscriberCount)) {
        await interaction.followUp("Please enter a valid number for subscribers:");
      } else {
        newsletterData.subscribers = subscriberCount;
        await interaction.followUp("Please provide a link to your newsletter:");
      }
    } else if (!newsletterData.link) {
      const urlPattern =
        /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)(:[0-9]{1,5})?(\/.*)?$/i;
      if (!urlPattern.test(userMessage)) {
        await interaction.followUp("Please provide a valid URL for your newsletter:");
      } else {
        newsletterData.link = userMessage;
        collector.stop();

        try {
          const response = await fetch("http://localhost:3030/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newsletterData),
          });

          if (response.ok) {
            await interaction.followUp({
              content: "Registration successful!",
            });

            // Verification triggering
            // db isVerified:true

            const webhookPayload = {
              embeds: [
                {
                  color: 0x00ff00, // Green color
                  title: "📋 Registration Notifier",
                  description: "Details of the new registration:",
                  fields: [
                    {
                      name: "User Details",
                      value: `- **Discord ID:** ${newsletterData.discordId}\n- **Newsletter Name:** ${newsletterData.newsletterName}`,
                    },
                    {
                      name: "Newsletter Info",
                      value: `- **Niche:** ${newsletterData.niche}\n- **Subscribers:** ${newsletterData.subscribers}\n- **Link:** [Visit Newsletter](${newsletterData.link})`,
                    },
                  ],
                  footer: {
                    text: "Notifier Bot",
                  },
                  timestamp: new Date().toISOString(),
                },
              ],
            };

            await fetch(REGISTRATION_NOTIFIER, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(webhookPayload),
            });
          } else {
            const errorData = await response.json();
            await interaction.followUp(`Error: ${errorData.message || "Failed to save your details. Please try again later."}`);
          }
        } catch (error) {
          await interaction.followUp("An unexpected error occurred. Please try again later.");
          console.error("Error in registration:", error);
        }
      }
    }
  });

  collector.on("end", (collected, reason) => {
    if (reason === "time") {
      interaction.followUp("Time out! Please use /register to start again.");
    }
  });
}


// Export the handleRegister function
module.exports = { handleRegister };
