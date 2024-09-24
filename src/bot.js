require("dotenv").config();
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const listARoutes = require("../Routes/listARoutes");
const listBRoutes = require("../Routes/listBRoutes");
const utmRoutes = require("../Routes/utmRoutes");

// Set up Express app
const app = express();
app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose
  .connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Database Connected Successfully");
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });

// API routes
app.use("/api/", listARoutes);
app.use("/api/", listBRoutes);
app.use("/api/utm", utmRoutes);

// Start the Express server
app.listen(5000, () => {
  console.log("Server is running on port 5000");
});

// ----------------- Discord Bot Section -----------------
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const { Client, GatewayIntentBits, Partials } = require("discord.js");

// Set up the Discord client with the required intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMembers,
  ],
  partials: [Partials.Message, Partials.Channel, Partials.Reaction],
});

// Define the commands
const commands = [
  {
    name: "cross-promote",
    description: "Fetch a list of creators to promote and generate a UTM link",
  },
  {
    name: "collaborate",
    description: "Collaborate with another creator using their ID",
    options: [
      {
        name: "id",
        description: "The ID of the creator you want to collaborate with",
        type: 3, // String type for the creator ID
        required: true,
      },
    ],
  },
  {
    name: "register",
    description: "Register your newsletter details",
  },
];

// Register the commands with Discord's API
const rest = new REST({ version: "9" }).setToken(
  process.env.DISCORDJS_BOT_TOKEN
);

(async () => {
  try {
    await rest.put(Routes.applicationCommands(process.env.DISCORD_CLIENT_ID), {
      body: commands,
    });
    console.log("Successfully registered application commands globally.");
  } catch (error) {
    console.error("Error registering global commands:", error);
  }
})();

// Bot ready event
client.once("ready", () => {
  console.log("Bot is online!");
});

// Handle interactions
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand() && !interaction.isButton()) return;

  const { commandName } = interaction;

  if (commandName === "register") {
    // Registration process (simplified)
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
        const urlPattern =
          /^(https?:\/\/)?((([a-z\d]([a-z\d-]*[a-z\d])*)\.?)+[a-z]{2,}|((\d{1,3}\.){3}\d{1,3}))(:\d+)?(\/[-a-z\d%_.~+]*)*(\?[;&a-z\d%_.~+=-]*)?(#[a-z\d_]*)?$/i;
        if (!urlPattern.test(userMessage)) {
          await interaction.followUp(
            "Please provide a valid URL for your newsletter:"
          );
        } else {
          newsletterData.link = userMessage;
          collector.stop();

          const response = await fetch("http://localhost:5000/api/register", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(newsletterData),
          });

          if (response.ok) {
            await interaction.followUp({
              content: "Registration successful!",
              components: [
                {
                  type: 1, // Action row
                  components: [
                    {
                      type: 2, // Button
                      label: "Cross-Promote",
                      style: 1, // Primary
                      custom_id: "cross_promote",
                    },
                    {
                      type: 2, // Button
                      label: "Collaborate",
                      style: 1, // Primary
                      custom_id: "collaborate",
                    },
                  ],
                },
              ],
            });
          } else {
            await interaction.followUp(
              "Failed to save your details. Please try again later."
            );
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

  // Handle Button Clicks
  if (interaction.isButton()) {
    if (interaction.customId === "cross_promote") {
      // Fetch list of creators from backend
      const response = await fetch("http://localhost:5000/api/list");

      const creators = await response.json();
      console.log(creators);

      if (creators.length === 0) {
        await interaction.reply(
          "No creators available for cross-promotion at the moment."
        );
        return;
      }

      const creatorButtons = creators.map((creator) => ({
        type: 2, // Button
        label: `${creator.newsletterName} - ${creator.niche}`, // Combine newsletter name and niche
        style: 1, // Primary
        custom_id: `promote_${creator._id}`, // Unique custom ID for each button
      }));

      await interaction.reply({
        content: "Select a creator to cross-promote:",
        components: [{ type: 1, components: creatorButtons }],
      });
    } else if (interaction.customId.startsWith("promote_")) {
      const creatorId = interaction.customId.split("_")[1];

      // Fetch the creator's details to generate the UTM link
      const creatorResponse = await fetch(`http://localhost:5000/api/listA/${creatorId}`); // Adjust route if necessary
      const creator = await creatorResponse.json();

      const utmLink = `https://yourpromotedlink.com?utm_source=discord&utm_medium=button&utm_campaign=${creator.newsletterName}`;

      await interaction.reply(
        `Promotion successful! Here is your UTM link: ${utmLink}`
      );
    } else if (interaction.customId === "collaborate") {
      await interaction.reply(
        "Please provide the ID of the creator you want to collaborate with:"
      );

      const filter = (response) => response.author.id === interaction.user.id;
      const collaboratorCollector = interaction.channel.createMessageCollector({
        filter,
        time: 60000,
      });

      collaboratorCollector.on("collect", async (collected) => {
        const creatorId = collected.content;

        const response = await fetch(
          `http://localhost:5000/api/collaborate/${creatorId}`,
          { method: "POST" }
        );

        if (response.ok) {
          await interaction.followUp("Collaboration initiated successfully!");
        } else {
          await interaction.followUp(
            "Failed to initiate collaboration. Please try again."
          );
        }

        collaboratorCollector.stop();
      });

      collaboratorCollector.on("end", (collected, reason) => {
        if (reason === "time") {
          interaction.followUp(
            "Time out! Please use /collaborate to try again."
          );
        }
      });
    }
  }
});

// Login to Discord
client.login(process.env.DISCORDJS_BOT_TOKEN);
