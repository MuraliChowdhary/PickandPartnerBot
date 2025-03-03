// require("dotenv").config();
// const fetch = (...args) =>
//   import("node-fetch").then(({ default: fetch }) => fetch(...args));

// const express = require("express");
// const mongoose = require("mongoose");
// const cors = require("cors");
// const cron = require("node-cron"); // Importing cron for scheduling tasks
// const PORT = 3030;
// // Importing routes
// const listARoutes = require("../../Routes/listARoutes");
// const listBRoutes = require("../../Routes/listBRoutes");
// const utmRoutes = require("../../Routes/utmRoutes");
// const AdminRoutes = require("../../Routes/AdminRoutes");
// const WEBHOOK_URL = process.env.USER_NOTIFIER;
// const { mainDb, secondaryDb } = require("../../Models/db/db");

// const { handleRegister } = require("../helpers/registration");
// const { handleEditProfile } = require("../helpers/editProfile");
// const { handleCrossPromote } = require("../helpers/crosspromotion");
// const { handleHelp } = require("../helpers/help");
// const { trackUrlClicks, sendDailyDM } = require("../helpers/utmMonitor"); // Import trackUrlClicks and sendDailyDM
// const { handleVerified } = require("../helpers/handleVerify");
// const { handleLinkSend } = require("../helpers/handleLinkSend");
// const { handleProfile } = require("../helpers/handleProfile");
// const { handleGuidelines } = require("../helpers/guidelines");
// const app = express();
// app.use(cors());
// app.use(express.json());

// // Connect to both databases
// Promise.all([mainDb.asPromise(), secondaryDb.asPromise()])
//   .then(() => {
//     console.log("Both databases connected successfully!");

//     // Initialize the change stream and start monitoring for clicks
//     trackUrlClicks(secondaryDb);

//     // Schedule the daily DM sending task (run every day at midnight)
//     cron.schedule("0 0 * * *", () => {
//       console.log("Sending daily DMs to promotees...");
//       sendDailyDM();
//     });

//     app.listen(PORT, () => {
//       console.log(`Server is running on http://localhost:${PORT}`);
//     });
//   })
//   .catch((error) => {
//     console.error("Error connecting to databases:", error);
//     process.exit(1);
//   });

// // API routes
// app.use("/api/admin", AdminRoutes);
// app.use("/api/", listARoutes);
// app.use("/api/", listBRoutes);
// app.use("/api/utm", utmRoutes);

// app.get("/health", (req, res) => {
//   res.status(200).send("Bot is alive and running!");
// });

// // Discord Bot Setup
// const { REST } = require("@discordjs/rest");
// const { Routes } = require("discord-api-types/v9");
// const {
//   Client,
//   GatewayIntentBits,
//   Partials,
//   SlashCommandBuilder,
//   PermissionFlagsBits,
// } = require("discord.js");

// const {
//   handleSubmitFeedback,
//   handleIssue,
// } = require("../helpers/handleFeedback");
// const { handleSendUtmLinks } = require("../helpers/utmtracking");
// const {
//   handleSendMessageToUser,
// } = require("../helpers/handleSendMessageToUser");
// const dotenv = require("dotenv");
// dotenv.config();

// const client = new Client({
//   intents: [
//     GatewayIntentBits.Guilds,
//     GatewayIntentBits.GuildMessages,
//     GatewayIntentBits.MessageContent,
//     GatewayIntentBits.DirectMessages,
//     GatewayIntentBits.GuildMembers,
//   ],
//   partials: [Partials.Message, Partials.Channel, Partials.Reaction],
// });

// const GUILD_ID = "1258797130072457268";
// const ADMIN_IDS = [process.env.ADMIN_DISCORD_ID];
// const adminCommands = [
//   new SlashCommandBuilder()
//     .setName("send_utm_links")
//     .setDescription("Send UTM links to specific Discord IDs")
//     .addStringOption((option) =>
//       option
//         .setName("discord_id_1")
//         .setDescription("First Discord ID")
//         .setRequired(true)
//     )
//     .addStringOption((option) =>
//       option
//         .setName("discord_id_2")
//         .setDescription("Second Discord ID")
//         .setRequired(true)
//     )
//     .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

//   new SlashCommandBuilder()
//     .setName("send_message_to_user")
//     .setDescription("Send a message to a user")
//     .addStringOption((option) =>
//       option
//         .setName("discord_id")
//         .setDescription("User's Discord ID")
//         .setRequired(true)
//     )
//     .addStringOption((option) =>
//       option
//         .setName("message")
//         .setDescription("Message content")
//         .setRequired(true)
//     )
//     .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

//   new SlashCommandBuilder()
//     .setName("verify")
//     .setDescription("Verify a user")
//     .addStringOption((option) =>
//       option
//         .setName("discord_id")
//         .setDescription("User's Discord ID")
//         .setRequired(true)
//     )
//     .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
//   new SlashCommandBuilder()
//     .setName("profile")
//     .setDescription("Info of user")
//     .addStringOption((option) =>
//       option
//         .setName("discord_id")
//         .setDescription("User's Discord ID")
//         .setRequired(true)
//     )
//     .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

//   new SlashCommandBuilder()
//     .setName("link")
//     .setDescription("Fetch the details of users whose links are not generated")
//     .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
// ];

// const userCommands = [
//   new SlashCommandBuilder()
//     .setName("register")
//     .setDescription("Register your newsletter details."),
//   new SlashCommandBuilder()
//     .setName("edit_profile")
//     .setDescription("Edit your registration details."),
//   new SlashCommandBuilder()
//     .setName("guidelines")
//     .setDescription("View community guidelines."),
//   new SlashCommandBuilder()
//     .setName("cross_promote")
//     .setDescription("Cross promote your content."),
//   new SlashCommandBuilder()
//     .setName("talk_to_admin")
//     .setDescription("Send a message to an admin")
//     .addStringOption((option) =>
//       option
//         .setName("message")
//         .setDescription("Message content")
//         .setRequired(true)
//     ),
//   new SlashCommandBuilder()
//     .setName("help")
//     .setDescription("Get a list of available commands"),
//   new SlashCommandBuilder()
//     .setName("issue")
//     .setDescription("Please enter the issue message you would like to report.")
//     .addStringOption((option) =>
//       option
//         .setName("message")
//         .setDescription("Message content")
//         .setRequired(true)
//     ),
// ];

// client.once("ready", () => {
//   console.log("bot is online!");
// });

// client.on("guildMemberAdd", async (member) => {
//   console.log(`New member joined: ${member.user.username}`);
//   const webhook_payload = {
//     content:
//       `📋 **User Joined Notifier**\n` +
//       `---------------------------\n` +
//       `**User Details:**\n` +
//       `Discord ID: ${member.user.id}\n` +
//       `Username: ${member.user.username}\n` +
//       `---------------------------\n`,
//   };

//   async function sendUserjoined() {
//     try {
//       const response = await fetch(WEBHOOK_URL, {
//         method: "POST",
//         headers: {
//           "Content-Type": "application/json",
//         },
//         body: JSON.stringify({ content: webhook_payload.content }),
//       });
//       if (response.ok) {
//         console.log("User notification trigger sent");
//       } else {
//         console.error("Error sending user joined trigger");
//       }
//     } catch (error) {
//       console.error("Error with the webhook:", error.message);
//     }
//   }

//   try {
//     if (member.user.dmChannel) {
//       console.log("DM channel already exists"); // Log if DM channel exists
//     } else {
//       console.log("Creating a new DM channel..."); // Log if a new DM channel is being created
//     }

//     sendUserjoined();

//     await member.send(
//       `Glad to have you here\n\n` +
//         `We want to know more about you...  - to match you with the best creators\n` +
//         `Type  /register\n`
//     );
//     console.log("DM sent successfully!"); // Log when the DM is successfully sent
//   } catch (error) {
//     console.error("Error sending DM:", error.message); // Log any error while sending DM
//   }
// });

// // Combine all commands
// const commands = [...userCommands, ...adminCommands];

// async function registerCommands() {
//   const rest = new REST({ version: "10" }).setToken(
//     process.env.DISCORDJS_BOT_TOKEN
//   );

//   try {
//     console.log("Refreshing application (/) commands...");

//     // Separate admin and user commands
//     const adminCommandData = adminCommands.map((command) => command.toJSON());
//     const userCommandData = userCommands.map((command) => command.toJSON());

//     // Register commands for the guild
//     await rest.put(
//       Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, GUILD_ID),
//       {
//         body: [...userCommandData, ...adminCommandData],
//       }
//     );

//     console.log("Successfully reloaded commands.");
//   } catch (error) {
//     console.error("Error registering commands:", error);
//   }
// }

// client.on("interactionCreate", async (interaction) => {
//   if (!interaction.isCommand()) return;

//   const { commandName, user, member } = interaction;

//   try {
//     // Check if the command is admin-only
//     const isAdminCommand = adminCommands.some(
//       (cmd) => cmd.name === commandName
//     );

//     // If it's an admin command, verify if the user is an admin
//     if (isAdminCommand) {
//       if (!ADMIN_IDS.includes(user.id)) {
//         await interaction.reply({
//           content:
//             "You do not have the required permissions (MANAGE_SERVER) to execute this command.",
//           ephemeral: true,
//         });
//         return;
//       }
//     }

//     // Handle commands
//     switch (commandName) {
//       case "register":
//         await handleRegister(interaction);
//         break;
//       case "edit_profile":
//         await handleEditProfile(interaction);
//         break;
//       case "help":
//         await handleHelp(interaction);
//         break;
//       case "talk_to_admin":
//         await handleSubmitFeedback(interaction);
//         break;
//       // case "cross_promote":
//       //   await handleCrossPromote(interaction);
//       //   break;
//       case "guidelines":
//         await handleGuidelines(interaction);
//         break;
//       case "send_utm_links":
//         await handleSendUtmLinks(client, interaction);
//         break;
//       case "send_message_to_user":
//         await handleSendMessageToUser(interaction,client);
//         break;
//       case "verify":
//         await handleVerified(interaction);
//         break;
//       case "link":
//         await handleLinkSend(interaction);
//         break;
//       case "profile":
//         await handleProfile(interaction);
//         break;
//       case "issue":
//         await handleIssue(interaction);
//         break;
//       default:
//         await interaction.reply({
//           content: "Command not implemented yet.",
//           ephemeral: true,
//         });
//     }
//   } catch (error) {
//     console.error(`Error handling command ${commandName}:`, error);
//     await interaction.reply({
//       content: "An error occurred while executing this command.",
//       ephemeral: true,
//     });
//   }
// });

// client.login(process.env.DISCORDJS_BOT_TOKEN);
// registerCommands();

require("dotenv").config();
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
// const { Client, GatewayIntentBits, Partials } = require("discord.js");

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
const { handleProfile } = require("../helpers/handleProfile");
const { handleGuidelines } = require("../helpers/guidelines");
const {handleIssue,handleSubmitFeedback}=require("../helpers/handleFeedback")
const {handleSendMessageToUser}=require("../helpers/handleSendMessageToUser")
const {handleSendUtmLinks}=require("../helpers/utmtracking")
const app = express();
app.use(cors());
app.use(express.json());

// Connect to both databases
Promise.all([mainDb.asPromise(), secondaryDb.asPromise()])
  .then(() => {
    console.log("Both databases connected successfully!");

    // Initialize the change stream and start monitoring for clicks
    trackUrlClicks(secondaryDb);

    // Schedule the daily DM sending task (run every day at midnight)
    cron.schedule("0 0 * * *", () => {
      console.log("Sending daily DMs to promotees...");
      sendDailyDM();
    });

    app.listen(PORT, () => {
      console.log(`Server is running on http://localhost:${PORT}`);
    });
  })
  .catch((error) => {
    console.error("Error connecting to databases:", error);
    process.exit(1);
  });

// API routes
app.use("/api/admin", AdminRoutes);
app.use("/api/", listARoutes);
app.use("/api/", listBRoutes);
app.use("/api/utm", utmRoutes);

app.get("/health", (req, res) => {
  res.status(200).send("Bot is alive and running!");
});

// Discord Bot Setup
const { REST } = require("@discordjs/rest");
const { Routes } = require("discord-api-types/v9");
const {
  Client,
  GatewayIntentBits,
  Partials,
  SlashCommandBuilder,
  PermissionFlagsBits,
} = require("discord.js");

// Discord Bot Setup
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

const GUILD_ID = "1258797130072457268";
const ADMIN_IDS = [process.env.ADMIN_DISCORD_ID];
const adminCommands = [
  new SlashCommandBuilder()
    .setName("send_utm_links")
    .setDescription("Send UTM links to specific Discord IDs")
    .addStringOption((option) =>
      option
        .setName("discord_id_1")
        .setDescription("First Discord ID")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("discord_id_2")
        .setDescription("Second Discord ID")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("send_message_to_user")
    .setDescription("Send a message to a user")
    .addStringOption((option) =>
      option
        .setName("discord_id")
        .setDescription("User's Discord ID")
        .setRequired(true)
    )
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("Message content")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("verify")
    .setDescription("Verify a user")
    .addStringOption((option) =>
      option
        .setName("discord_id")
        .setDescription("User's Discord ID")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
  new SlashCommandBuilder()
    .setName("profile")
    .setDescription("Info of user")
    .addStringOption((option) =>
      option
        .setName("discord_id")
        .setDescription("User's Discord ID")
        .setRequired(true)
    )
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

  new SlashCommandBuilder()
    .setName("link")
    .setDescription("Fetch the details of users whose links are not generated")
    .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),
];

const userCommands = [
  new SlashCommandBuilder()
    .setName("register")
    .setDescription("Register your newsletter details."),
  new SlashCommandBuilder()
    .setName("edit_profile")
    .setDescription("Edit your registration details."),
  new SlashCommandBuilder()
    .setName("guidelines")
    .setDescription("View community guidelines."),
  new SlashCommandBuilder()
    .setName("cross_promote")
    .setDescription("Cross promote your content."),
  new SlashCommandBuilder()
    .setName("talk_to_admin")
    .setDescription("Send a message to an admin")
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("Message content")
        .setRequired(true)
    ),
  new SlashCommandBuilder()
    .setName("help")
    .setDescription("Get a list of available commands"),
  new SlashCommandBuilder()
    .setName("issue")
    .setDescription("Please enter the issue message you would like to report.")
    .addStringOption((option) =>
      option
        .setName("message")
        .setDescription("Message content")
        .setRequired(true)
    ),
];

// Event handling for guild members
client.on("guildMemberAdd", async (member) => {
  console.log(`New member joined: ${member.user.username}`);
  const webhook_payload = {
    content:
      `📋 **User Joined Notifier**\n` +
      `Discord ID: ${member.user.id}\n` +
      `Username: ${member.user.username}\n`,
  };

  try {
    const response = await fetch(WEBHOOK_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ content: webhook_payload.content }),
    });
    if (!response.ok) {
      throw new Error("Error sending user joined trigger");
    }
    console.log("User notification trigger sent");

    await member.send(
            `Glad to have you here\n\n` +
              `We want to know more about you...  - to match you with the best creators\n` +
              `Type  /register\n`
          );
    console.log("DM sent successfully!");
  } catch (error) {
    console.error("Error during guildMemberAdd event:", error.message);
  }
});

// Command registration
const commands = [...userCommands, ...adminCommands];
async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(
    process.env.DISCORDJS_BOT_TOKEN
  );

  try {
    console.log("Refreshing application (/) commands...");
    await rest.put(
      Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, GUILD_ID),
      {
        body: commands.map((cmd) => cmd.toJSON()),
      }
    );
    console.log("Successfully reloaded commands.");
  } catch (error) {
    console.error("Error registering commands:", error);
  }
}

// Interaction handling
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName, user } = interaction;

  try {
    const isAdminCommand = adminCommands.some((cmd) => cmd.name === commandName);
    if (isAdminCommand && !ADMIN_IDS.includes(user.id)) {
      await interaction.reply({
        content: "You do not have the required permissions (MANAGE_SERVER) to execute this command.",
        ephemeral: true,
      });
      return;
    }

    switch (commandName) {
      case "register":    
        //await interaction.deferReply();
        await handleRegister(interaction);
        break;
      case "edit_profile":
        await handleEditProfile(interaction);
        break;
      case "help":
        await handleHelp(interaction);
        break;
      case "talk_to_admin":
        await handleSubmitFeedback(interaction);
        break;
      case "guidelines":
        await handleGuidelines(interaction);
        break;
      case "send_utm_links":
       
        await handleSendUtmLinks(client,interaction);
        break;
      case "send_message_to_user":
        await handleSendMessageToUser(interaction,client);
        break;
      case "verify":
        await handleVerified(interaction);
        break;
      case "link":
        await handleLinkSend(interaction);
        break;
      case "profile":
        await handleProfile(interaction);
        break;
      case "issue":
        await handleIssue(interaction);
        break;
      default:
        await interaction.reply({
          content: "Command not implemented yet.",
          ephemeral: true,
        });
    }
  } catch (error) {
    console.error("Error during interaction:", error.message);
    await interaction.reply({
      content: "An error occurred while processing your request.",
      ephemeral: true,
    });
  }
});

// Bot initialization
client.once("ready", () => {
  console.log(`Logged in as ${client.user.username}`);
  registerCommands();
});

client.login(process.env.DISCORDJS_BOT_TOKEN);






