require("dotenv").config();
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const cron = require("node-cron"); // Importing cron for scheduling tasks
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
const { trackUrlClicks, sendDailyDM } = require("../helpers/utmMonitor"); // Import trackUrlClicks and sendDailyDM
const { handleVerified } = require("../helpers/handleVerify");
const { handleLinkSend } = require("../helpers/handleLinkSend");
const {handleProfile} = require("../helpers/handleProfile")
const app = express();
app.use(cors());
app.use(express.json());

// Connect to both databases
Promise.all([mainDb.asPromise(), secondaryDb.asPromise()])
  .then(() => {
    console.log("Both databases connected successfully!");

    // Initialize the change stream and start monitoring for clicks
    trackUrlClicks(secondaryDb);

    // // Schedule the daily DM sending task (run every day at midnight)
    // cron.schedule('0 0 * * *', () => {
    //   console.log("Sending daily DMs to promotees...");
    //   sendDailyDM(); // Function that sends daily DMs
    // });

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


app.get('/health', (req, res) => {
  res.status(200).send('Bot is alive and running!');
});

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
  handleIssue,
} = require("../helpers/handleFeedback");
const { handleSendUtmLinks } = require("../helpers/utmtracking");
const {
  handleSendMessageToUser,
} = require("../helpers/handleSendMessageToUser");
const {handleAdmincmd} = require("../helpers/handleAdmincmd")
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
    restricted: true, // Admin only
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
    name: "submit_feedback",
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
    name: "issue",
    description: "Please enter the issue message you would like to report.",
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
    restricted: true, // Admin only
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
  {
    name: "verify",
    description: "Verify a user by entering their Discord ID.",
    restricted: true, // Admin only
    options: [
      {
        type: 3,
        name: "discord_id",
        description: "The Discord ID of the user to verify.",
        required: true,
      },
    ],
  },
  {
    name: "link",
    description: "Fetch the details of users whose links are not generated.",
    restricted: true, // Admin only
  },
  {
    name: "admincmd",
    description: "Get a list of available Admin commands.",
    restricted: true, // Admin only
  },
  {
    name: "profile",
    description: "Get details of the user",
    restricted: true, // Admin only
    options: [
      {
        type: 3,
        name: "discord_id",
        description: "The Discord ID of the user to verify.",
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
    content:
      `📋 **User Joined Notifier**\n` +
      `---------------------------\n` +
      `**User Details:**\n` +
      `Discord ID: ${member.user.id}\n` +
      `Username: ${member.user.username}\n` +
      `---------------------------\n`,
  };

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

  try {
    const welcomeChannel = member.guild.channels.cache.find(
      (channel) => channel.name === welcome - and - rules
    );
    console.log("channel:" + member.guild.channels.cache);

    if (welcomeChannel) {
      await welcomeChannel.send(
        `🎉 **Welcome to the Pick and Partner community, ${member.user.username}!** 🎉\n\n` +
          `We are thrilled to have you here! Make sure to read the rules and enjoy your stay!\n\n` +
          `Here are some quick commands to get started:\n` +
          `1️. **/register** - Register your details with us so we can match you with the best partners!\n` +
          `2️. **/cross-promote** - Promote other creators' newsletters and let others promote yours in return! 🤝\n\n` +
          `Feel free to ask questions or share ideas in the channels. Welcome aboard!`
      );
      console.log("Welcome message sent to the welcome-and-rules channel.");
    } else {
      console.warn(
        `Channel "${
          welcome - and - rules
        }" not found. Skipping welcome message.`
      );
    }
  } catch (error) {
    console.error(
      "Error sending welcome message to the channel:",
      error.message
    );
  }
});

// Bot interaction event
const adminIds = [process.env.ADMIN_DISCORD_ID]; // List of admin Discord IDs

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const userId = interaction.user.id;

  try {
    console.log(
      `Command received: ${interaction.commandName} by User ID: ${userId}`
    );

    // Check if the command is issued in a DM or in a channel
    const isInDM = interaction.channel.type === 1;
    console.log(interaction.channel.type);
    // For non-admin users, commands should only work in DMs
    if (!isInDM && !adminIds.includes(userId)) {
      await interaction.reply({
        content: `❌ This command cannot be used in server channels.\n\n**Please use this command in a DM with the bot.**\n\n💡 To send a DM:
        1. Click on the bot's name  in the member list or right-click its name in the server.
        2. Select "Message" to open a private DM window.
        3. Enter your command there.

Server channels are meant for discussions and idea sharing, not command interactions.`,
        ephemeral: true,
      });
      return;
    }

    // Command handling logic
    if (interaction.commandName === "register") {
      await handleRegister(interaction);
    } else if (interaction.commandName === "cross_promote") {
      await handleCrossPromote(interaction);
    } else if (interaction.commandName === "edit_profile") {
      console.log("Edit profile command triggered");
      await handleEditProfile(interaction);
    } else if (interaction.commandName === "send_utm_links") {
      // Admin-only check
      if (!adminIds.includes(userId)) {
        console.warn(
          `Unauthorized access attempt by User ID: ${userId} for admin-only command: send_utm_links`
        );
        await interaction.reply({
          content: "❌ You do not have permission to use this command.",
          ephemeral: true,
        });
        return;
      }
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
      // Admin-only check
      if (!adminIds.includes(userId)) {
        console.warn(
          `Unauthorized access attempt by User ID: ${userId} for admin-only command: send_message_to_user`
        );
        await interaction.reply({
          content: "❌ You do not have permission to use this command.",
          ephemeral: true,
        });
        return;
      }
      await handleSendMessageToUser(interaction, client);
    } else if (interaction.commandName === "issue") {
      await handleIssue(interaction);
    } else if (interaction.commandName === "verify") {
      if (!adminIds.includes(userId)) {
        console.warn(
          `Unauthorized access attempt by User ID: ${userId} for admin-only command: verify`
        );
        await interaction.reply({
          content: "❌ You do not have permission to use this command.",
          ephemeral: true,
        });
        return;
      }
      await handleVerified(interaction);
    } else if (interaction.commandName === "link") {
      if (!adminIds.includes(userId)) {
        console.warn(
          `Unauthorized access attempt by User ID: ${userId} for admin-only command: verify`
        );
        await interaction.reply({
          content: "❌ You do not have permission to use this command.",
          ephemeral: true,
        });
        return;
      }
      await handleLinkSend(interaction);
    } else if (interaction.commandName === "admincmd") {
      if (!adminIds.includes(userId)) {
        console.warn(
          `Unauthorized access attempt by User ID: ${userId} for admin-only command: admincmd`
        );
        await interaction.reply({
          content: "❌ You do not have permission to use this command.",
          ephemeral: true,
        });
        return;
      }
      await handleAdmincmd(interaction);
    } 

    else if (interaction.commandName === "profile") {
      if (!adminIds.includes(userId)) {
        console.warn(
          `Unauthorized access attempt by User ID: ${userId} for admin-only command: profile`
        );
        await interaction.reply({
          content: "❌ You do not have permission to use this command.",
          ephemeral: true,
        });
        return;
      }
      await handleProfile(interaction);
    } 
    
    
    else {
      console.log(`Unrecognized command: ${interaction.commandName}`);
      await interaction.reply({
        content: "❌ Command not recognized.",
        ephemeral: true,
      });
    }
  } catch (error) {
    console.error(`Error handling command: ${interaction.commandName}`, error);
    await interaction.reply({
      content: "❌ There was an error executing the command.",
      ephemeral: true,
    });
  }
});

client.login(process.env.DISCORDJS_BOT_TOKEN);
module.exports = {
  client,
};
