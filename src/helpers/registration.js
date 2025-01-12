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
app.use("/api/utm", utmRoutes);

async function handleRegister(interaction) {
  try {
    // First, defer the reply to avoid interaction timeout
    await interaction.deferReply();

    const questions = [
      "Please enter your newsletter name:",
      "Please enter your niche:",
      "Please enter your number of subscribers:",
      "Please provide a link to your newsletter:",
      "Please provide the copy/promo text for your newsletter:"
    ];

    let newsletterData = { 
      discordId: interaction.user.id,
      responses: []
    };

    const urlPattern = /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)(:[0-9]{1,5})?(\/.*)?$/i;

    // Send the initial question
    await interaction.editReply(questions[0]);

    const filter = (response) => response.author.id === interaction.user.id;
    const collector = interaction.channel.createMessageCollector({
      filter,
      time: 1200000, // 30 minutes
    });

    let currentQuestion = 0;

    collector.on("collect", async (collected) => {
      const userMessage = collected.content;

      // Validate the current response
      let isValid = true;
      let errorMessage = "";

      switch(currentQuestion) {
        case 2: // Subscribers count
          const subscriberCount = parseInt(userMessage, 10);
          if (isNaN(subscriberCount)) {
            isValid = false;
            errorMessage = "Please enter a valid number for subscribers:";
          }
          break;
        case 3: // Newsletter link
          if (!urlPattern.test(userMessage)) {
            isValid = false;
            errorMessage = "Please provide a valid URL for your newsletter:";
          }
          break;
      }

      if (!isValid) {
        await interaction.followUp(errorMessage);
        return;
      }

      // Store the response
      newsletterData.responses.push(userMessage);
      currentQuestion++;

      // If there are more questions, ask the next one
      if (currentQuestion < questions.length) {
        await interaction.followUp(questions[currentQuestion]);
      } else {
        // All questions answered, process the data
        const formattedData = {
          discordId: newsletterData.discordId,
          newsletterName: newsletterData.responses[0],
          niche: newsletterData.responses[1],
          subscribers: parseInt(newsletterData.responses[2], 10),
          link: newsletterData.responses[3],
          copyText: newsletterData.responses[4]
        };

        collector.stop();
        await registerNewsletter(interaction, formattedData);
      }
    });

    collector.on("end", async (collected, reason) => {
      if (reason === "time") {
        await interaction.followUp("Time out! Please use /register to start again.");
      }
    });
  } catch (error) {
    console.error("Error in handleRegister:", error);
    await interaction.followUp("An unexpected error occurred. Please try again later.");
  }
}

async function registerNewsletter(interaction, newsletterData) {
  try {
    // Update the URL to use environment variable
    const apiUrl = process.env.API_URL || "http://localhost:3030";
    const response = await fetch(`${apiUrl}/api/register`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newsletterData),
    });

    if (response.ok) {
      await interaction.followUp(
        `Thanks! We are verifying your details.\n\n` +
        `Meanwhile, check out our [#resources](https://discord.com/channels/1258797130072457268/1258797130072457272) channel in Discord!\n\n`
      );

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
                value: newsletterData.copyText
                  ? `- **Content:** ${newsletterData.copyText}`
                  : "- **Content:** Not provided",
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
      await interaction.followUp(
        `Error: ${errorData.message || "Failed to save your details. Please try again later."}`
      );
    }
  } catch (error) {
    console.error("Error in registerNewsletter:", error);
    await interaction.followUp(
      "An unexpected error occurred while saving your details. Please try again later."
    );
  }
}

module.exports = { handleRegister };