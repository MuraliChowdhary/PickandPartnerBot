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
    await interaction.reply({
      content: "Please enter your newsletter name:",
      ephemeral: true,
    });

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

      if (!newsletterData.newsletterName) {
        newsletterData.newsletterName = userMessage;
        await interaction.followUp({
          content: "Please enter your niche:",
          ephemeral: true,
        });
      } else if (!newsletterData.niche) {
        newsletterData.niche = userMessage;
        await interaction.followUp({
          content: "Please enter your number of subscribers:",
          ephemeral: true,
        });
      } else if (!newsletterData.subscribers) {
        const subscriberCount = parseInt(userMessage, 10);
        if (isNaN(subscriberCount)) {

          await interaction.followUp({
            content: "Please enter a valid number for subscribers:",
            ephemeral: true,
          });

          await interaction.followUp("Please enter a valid number for subscribers:");

        } else {
          newsletterData.subscribers = subscriberCount;
          await interaction.followUp({
            content: "Please provide a link to your newsletter:",
            ephemeral: true,
          });
        }
      } else if (!newsletterData.link) {
        if (!urlPattern.test(userMessage)) {

          await interaction.followUp({
            content: "Please provide a valid URL for your newsletter:",
            ephemeral: true,
          });

          await interaction.followUp("Please provide a valid URL for your newsletter:");

        } else {
          newsletterData.link = userMessage;
          await interaction.followUp({
            content: "Please provide the copy/promo text for your newsletter:",
            ephemeral: true,
          });
        }
      } else if (!newsletterData.copyText) {
        newsletterData.copyText = userMessage;
        collector.stop();
        await registerNewsletter(interaction, newsletterData);
        //await interaction.followUp("Your newsletter registration has been completed successfully!");
      }
    });

    collector.on("end", (collected, reason) => {
      if (reason === "time") {

        await interaction.followUp({
          content: "Time out! Please use /register to start again.",
          ephemeral: true,
        });

        interaction.followUp("The registration process timed out. Please start again if you'd like to register.");

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

    await interaction.followUp("An error occurred while processing your request. Please try again later.");
  }
}


// Helper function to register a newsletter

async function registerNewsletter(interaction, newsletterData) {
  try {
    const response = await fetch(
      "https://pickandpartnerbackend.onrender.com/api/register",
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newsletterData),
      }
    );

    if (response.ok) {
      await interaction.followUp({
        content:
          "Thanks! We are verifying your details.\n\n" +
          "Meanwhile, check out our [#resources](https://discord.com/channels/1258797130072457268/1258797130072457272) channel!",
        ephemeral: true,
      });

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
      const errorData = await response.json();
      await interaction.followUp({
        content: `Error: ${
          errorData.message ||
          "Failed to save your details. Please try again later."
        }`,
        ephemeral: true,
      });
    }
  } catch (error) {
    console.error("Error in registerNewsletter:", error);
    if (!interaction.replied) {
      await interaction.followUp({
        content:
          "An unexpected error occurred while saving your details. Please try again later.",
        ephemeral: true,
      });
    }
  }
}

module.exports = { handleRegister };
