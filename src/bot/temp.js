require("dotenv").config();
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const PORT = 3030;
// Importing routes
const listARoutes = require("../../Routes/listARoutes");
const listBRoutes = require("../../Routes/listBRoutes");
const utmRoutes = require("../../Routes/utmRoutes");
const AdminRoutes = require("../../Routes/AdminRoutes");
const WEBHOOK_URL = process.env.USER_NOTIFIER;
const { mainDb, secondaryDb } = require("../../Models/db/db");

const { handleRegister } = require("../helpers/registration");
const { handleEditProfile } = require("../helpers/editProfile");
const { handleCrossPromote } = require("../helpers/crosspromotion");
const { handleHelp } = require("../helpers/help");

const app = express();
app.use(cors());
app.use(express.json());

Promise.all([mainDb.asPromise(), secondaryDb.asPromise()])
  .then(() => {
    console.log("Both databases connected successfully!");
    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to databases:", error);
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
const { handleSendUtmLinks } = require("../helpers/utmtracking");
const {
  handleSendMessageToUser,
} = require("../helpers/handleSendMessageToUser");
// Set up the Discord client with the required intents
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
    GatewayIntentBits.DirectMessages,
    GatewayIntentBits.GuildMembers, // To listen for new members joining
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
        type: 3,
        name: "discord_id_1",
        description: "The first Discord ID to send a UTM link to.",
        required: true,
      },
      {
        type: 3,
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
    name: "submit_feedback", // Changed from submit-feedback to submit_feedback
    description: "Submit your feedback about the bot.",
    options: [
      {
        type: 3,
        name: "message",
        description: "Your feedback message or issue details.",
        required: true,
      },
    ],
  },
  {
    name: "send_message_to_user",
    description: "Send a custom message to a specific user by their Discord ID",
    options: [
      {
        type: 3,
        name: "discord_id",
        description:
          "The Discord ID of the user you want to send a message to.",
        required: true,
      },
      {
        type: 3,
        name: "message",
        description: "The message to send to the user.",
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

client.on("guildMemberAdd", async (member) => {
  console.log(`New member joined: ${member.user.username}`);
  const webhook_payload = {
     content: `📋 **User Joined Notifier**\n` +
    `---------------------------\n` +
    `**User Details:**\n` +
    `Discord ID: ${member.user.id}\n` +  
    `Username: ${member.user.username}\n` +  
    `---------------------------\n` 
  }

  async function sendUserjoined() {
    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ content: webhook_payload.content }),
      });
      if (response.ok) {
        console.log("User notification trigger sent");
      } else {
        console.error("Error sending user joined trigger");
      }
    } catch (error) {
      console.error("Error with the webhook:", error.message);
    }
  }
  
  try {
    if (member.user.dmChannel) {
      console.log("DM channel already exists"); // Log if DM channel exists
    } else {
      console.log("Creating a new DM channel..."); // Log if a new DM channel is being created
    }

    sendUserjoined();

    await member.send(
      `🎉 **Welcome to the Pick and Partner community, ${member.user.username}!** 🎉\n\n` +
        `We are thrilled to have you on board! Please check out these awesome commands to get started:\n\n` +
        `1️. **/register** - Register your details with us so we can match you with the best partners!\n\n` +
        `2️. **/cross-promote** -  Promote other creators' newsletters and let others promote yours in return! 🤝\n\n` +
        `If you have any questions or need help, feel free to reach out! \n`
    );
    console.log("DM sent successfully!"); // Log when the DM is successfully sent
  } catch (error) {
    console.error("Error sending DM:", error.message); // Log any error while sending DM
  }
});

// Bot interaction event
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  if (interaction.commandName === "register") {
    await handleRegister(interaction);
  } else if (interaction.commandName === "cross_promote") {
    await handleCrossPromote(interaction);
  } else if (interaction.commandName === "edit_profile") {
    console.log("Edit profile command triggered");
    await handleEditProfile(interaction);
  } else if (interaction.commandName === "send_utm_links") {
    await handleSendUtmLinks(client, interaction);
  } else if (interaction.commandName === "help") {
    await handleHelp(interaction);
  } else if (interaction.commandName === "guidelines") {
    await handleGuidelines(interaction);
  } else if (interaction.commandName === "feedback") {
    await handleFeedback(interaction);
  } else if (interaction.commandName === "submit_feedback") {
    await handleSubmitFeedback(interaction);
  } else if (interaction.commandName === "send_message_to_user") {
    await handleSendMessageToUser(interaction, client);
  }
});

client.login(process.env.DISCORDJS_BOT_TOKEN);
module.exports = {
  client,
};
