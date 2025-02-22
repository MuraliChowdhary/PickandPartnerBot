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
console.log(REGISTRATION_NOTIFIER);
const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/admin", AdminRoutes);
app.use("/api/", listARoutes);
app.use("/api/utm", utmRoutes);

async function handleRegister(interaction) {
  try {
    await interaction.deferReply({ ephemeral: true }); // Defer the reply to prevent timeouts

    await interaction.followUp("Please enter your newsletter name:");

    const filter = (response) => response.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({
      filter,
      time: 600000,
    });

    const newsletterData = { discordId: interaction.user.id };
    const urlPattern =
      /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)(:[0-9]{1,5})?(\/.*)?$/i;

    collector.on("collect", async (collected) => {
      const userMessage = collected.content;

      try {
        if (!newsletterData.newsletterName) {
          newsletterData.newsletterName = userMessage;
          await interaction.followUp("Please enter your niche:");
        } else if (!newsletterData.niche) {
          newsletterData.niche = userMessage;
          await interaction.followUp(
            "Please enter your number of subscribers:"
          );
        } else if (!newsletterData.subscribers) {
          const subscriberCount = parseInt(userMessage, 10);
          if (isNaN(subscriberCount)) {
            await interaction.followUp(
              "Please enter a valid number for subscribers:"
            );
          } else {
            newsletterData.subscribers = subscriberCount;
            await interaction.followUp(
              "Please provide a link to your newsletter:"
            );
          }
        } else if (!newsletterData.link) {
          if (!urlPattern.test(userMessage)) {
            await interaction.followUp(
              "Please provide a valid URL for your newsletter:"
            );
          } else {
            newsletterData.link = userMessage;
            await interaction.followUp(
              "Please provide the copy/promo text for your newsletter:"
            );
          }
        } else if (!newsletterData.copyText) {
          newsletterData.copyText = userMessage;
          collector.stop();
          await registerNewsletter(interaction, newsletterData);
        }
      } catch (error) {
        console.error("Error during collector handling:", error);
        await interaction.followUp("An error occurred. Please try again.");
        collector.stop();
      }
    });

    collector.on("end", async (_, reason) => {
      if (reason === "time") {
        await interaction.followUp({
          content: "Time out! Please use /register to start again.",
          ephemeral: true,
        });
      }
    });
  } catch (error) {
    console.error("Error in handleRegister:", error);
    if (!interaction.replied) {
      await interaction.followUp({
        content: "An unexpected error occurred. Please try again later.",
        ephemeral: true,
      });
    }
  }
}

async function registerNewsletter(interaction, newsletterData) {
  try {
    // Acknowledge the interaction and inform the user about the ongoing process
    //await interaction.deferReply({ ephemeral: true });
    await interaction.followUp({
      content: "Please wait, we are saving your details...",
    });

    // Send data to the backend
    const response = await fetch(
      "https://pickandpartnerbackend-titu.onrender.com/api/register",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newsletterData),
      }
    );

    if (response.ok) {
      // Notify the user of successful registration
      await interaction.followUp({
        content:
          "Thanks! We are verifying your details.\n\n" +
          "Meanwhile, check out our [#resources](https://discord.com/channels/1258797130072457268/1258797130072457272) channel!",
      });

      // Send a webhook notification
      const webhookPayload = {
        embeds: [
          {
            color: 0x00ff00,
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
              {
                name: "Ad Copy",
                value: newsletterData.copyText || "Not provided",
              },
            ],
            footer: { text: "Notifier Bot" },
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
      // Handle error from the backend
      const errorData = await response.json();
      await interaction.followUp({
        content: `Error: ${
          errorData.message ||
          "Failed to save your details. Please try again later."
        }`,
      });
    }
  } catch (error) {
    console.error("Error in registerNewsletter:", error);
    // Handle unexpected errors
    if (!interaction.replied) {
      await interaction.followUp({
        content:
          "An unexpected error occurred while saving your details. Please try again later.",
      });
    }
  }
}


module.exports = { handleRegister };
