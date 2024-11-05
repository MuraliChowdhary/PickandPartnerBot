require("dotenv").config();
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const PORT=3030
// Importing routes
const listARoutes = require("../../Routes/listARoutes");
const listBRoutes = require("../../Routes/listBRoutes");
const utmRoutes = require("../../Routes/utmRoutes");
const AdminRoutes = require("../../Routes/AdminRoutes");
const WEBHOOK_URL = process.env.USER_NOTIFIER;
const { mainDb, secondaryDb } = require('../../Models/db/db');

const { handleRegister } = require("../helpers/registration");
const { handleEditProfile } = require("../helpers/editProfile");
const { handleCrossPromote } = require("../helpers/crosspromotion");
const { handleHelp } = require("../helpers/help");
 
const app = express();
app.use(cors());
app.use(express.json());

Promise.all([
  mainDb.asPromise(),
  secondaryDb.asPromise()
])
.then(() => {
  console.log('Both databases connected successfully!');
  app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
  });
})
.catch(error => {
  console.error('Error connecting to databases:', error);
  process.exit(1); // Exit the process if database connections fail
});


// API routes
app.use("/api/admin", AdminRoutes);
app.use("/api/", listARoutes);
// app.use("/api/", listBRoutes);
app.use("/api/utm", utmRoutes);

 

const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const {
  Client,
  GatewayIntentBits,
  Partials,
  ButtonBuilder,
  ActionRowBuilder,
  ButtonStyle,
  SlashCommandBuilder,
} = require("discord.js");
const { handleGuidelines } = require("../helpers/guidelines");
const {
  handleFeedback,
  handleSubmitFeedback,
} = require("../helpers/handleFeedback");
const {handleSendUtmLinks}=require("../helpers/utmtracking")
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

const commands = [
  {
    name: "cross_promote",
    description: "Fetch a list of creators to promote and generate a UTM link",
  },
  {
    name: "register",
    description: "Register your newsletter details",
  },
  {
    name: "edit_profile",
    description: "Edit your newsletter registration details",
  },
  {
    name: "send_utm_links",
    description: "Send UTM links to specified Discord IDs",
    options: [
      {
        type: 3, // STRING type
        name: "discord_id_1",
        description: "The first Discord ID to send a UTM link to.",
        required: true,
      },
      {
        type: 3, // STRING type
        name: "discord_id_2",
        description: "The second Discord ID to send a UTM link to.",
        required: true,
      },
    ],
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
    name: "feedback",
    description: "Show feedback details and usage instructions.",
  },
  {
    name: "submit_feedback",
    description: "Submit your feedback about the bot.",
    options: [
      {
        type: 3, // STRING type
        name: "message",
        description: "Your feedback message or issue details.",
        required: true,
      },
    ],
  },
];



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

client.on("guildCreate", (guild) => {
  const guildName = guild.name;
  const guildId = guild.id;

  console.log(`Bot added to a new server: ${guildName} (ID: ${guildId})`);

  // Create the message to be sent to the admin
  const message = `The bot has been added to a new server: **${guildName}** (ID: ${guildId})`;

  // Send a POST request to the webhook URL
  fetch(WEBHOOK_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      content: message, // The message you want to send to the Discord channel
    }),
  })
    .then((response) => {
      // Check if the response is OK
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response.text(); // Only parse the response if it's OK
    })
    .then((data) => {
      console.log("Webhook successfully triggered:", data);
    })
    .catch((error) => {
      console.error("Error triggering webhook:", error.message); // Log the error message
    });
});

client.on("guildCreate", async (guild) => {
  console.log(`Bot added to a new server: ${guild.name}`);

  // Try to find the existing 'general' channel
  const generalChannel = guild.channels.cache.find(
    (channel) => channel.name === "general" && channel.type === 0 // GUILD_TEXT
  );

  // If the general channel exists, send a welcome message
  if (generalChannel) {
    generalChannel.send(
      `Welcome to the Pick and Partner community, 🎉\n` +
        `Here, you can connect, collaborate, and cross-promote your newsletter with a diverse group of creators.\n` +
        `Before you join, please tell us more about yourself so we can find the perfect match for you.\n` +
        `Here are our commands: \n` +
        `/register - for registration, please provide your details.\n` +
        `/cross-promote - for cross promotion (available after verification).\n` +
        `If you have any questions, feel free to ask.\n`
    );
  } else {
    console.log(`No general channel found in ${guild.name}.`);
  }
});

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === "register") {
    await handleRegister(interaction);
  } else if (interaction.commandName === "cross-promote") {
    await handleCrossPromote(interaction);
  } else if (interaction.commandName === "edit-profile") {
    await handleEditProfile(interaction);
  } else if (interaction.commandName === "send_utm_links") {
    await handleSendUtmLinks(client,interaction); // New command handling function
  } else if (interaction.commandName === "help") {
    await handleHelp(interaction);
  } else if (interaction.commandName === "guidelines") {
    await handleGuidelines(interaction);
  } else if (interaction.commandName === "feedback") {
    await handleFeedback(interaction);
  } else if (interaction.commandName === "submit-feedback") {
    await handleSubmitFeedback(interaction);
  }
});


 


client.login(process.env.DISCORDJS_BOT_TOKEN);
module.exports={
  client
  
}