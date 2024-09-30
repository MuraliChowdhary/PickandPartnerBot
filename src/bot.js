require("dotenv").config();
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Importing routes  
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
// app.use("/api/", listBRoutes);
app.use("/api/utm", utmRoutes);

// Start the Express server
app.listen(3030, () => {
  console.log("Server is running on port 3030");
});

// ----------------- Discord Bot Section -----------------
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
    name: "cross-promote",
    description: "Fetch a list of creators to promote and generate a UTM link",
  },
  {
    name: "collaborate",
    description: "Collaborate with another creator using their ID",
  },
  {
    name: "register",
    description: "Register your newsletter details",
  },
];

const collaborateCommand = new SlashCommandBuilder()
  .setName("collaborate")
  .setDescription("Collaborate with a creator by ID")
  .addStringOption((option) =>
    option
      .setName("id")
      .setDescription("The ID of the creator you want to collaborate with")
      .setRequired(true)
  );

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
  if (interaction.isCommand()) {
    if (interaction.commandName === "register") {
      await handleRegister(interaction);
    } else if (interaction.commandName === "cross-promote") {
      await handleCrossPromote(interaction);
    }
  } else if (interaction.commandName === "collaborate") {
    const creatorId = interaction.options.getString("id");
    await handleCollaborate(interaction, creatorId);
  }
});

// Handle the registration process
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
        await interaction.followUp(
          "Please enter a valid number for subscribers:"
        );
      } else {
        newsletterData.subscribers = subscriberCount;
        await interaction.followUp("Please provide a link to your newsletter:");
      }
    } else if (!newsletterData.link) {
      const urlPattern =
        /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)(:[0-9]{1,5})?(\/.*)?$/i;
      if (!urlPattern.test(userMessage)) {
        await interaction.followUp(
          "Please provide a valid URL for your newsletter:"
        );
      } else {
        newsletterData.link = userMessage;
        collector.stop();

        const response = await fetch("http://localhost:3030/api/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(newsletterData),
        });

        if (response.ok) {
          await interaction.followUp({
            content: "Registration successful!",
            components: [
              new ActionRowBuilder().addComponents(
                new ButtonBuilder()
                  .setCustomId("cross_promote")
                  .setLabel("Cross-Promote")
                  .setStyle(ButtonStyle.Primary),
                new ButtonBuilder()
                  .setCustomId("collaborate")
                  .setLabel("Collaborate")
                  .setStyle(ButtonStyle.Primary)
              ),
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

// Handle the cross-promote interaction
async function handleCrossPromote(interaction) {
  try {
    const response = await fetch("http://localhost:3030/api/list", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    const creators = await response.json();

    if (creators.length === 0) {
      await interaction.reply("No creators available for this action.");
      return;
    }

    await interaction.reply({
      content: `Here are the available creators:\n${creators
        .map((creator, index) => `${index + 1}. ${creator.newsletterName} - ${creator.niche}`)
        .join("\n")}\n\nPlease type the number of the creator you want to promote or collaborate with.`,
      ephemeral: true, // Optional: keep it private to the user
    });

    const filter = (response) => response.author.id === interaction.user.id;

    const collector = interaction.channel.createMessageCollector({
      filter,
      time: 60000,
    });

    collector.on("collect", async (collected) => {
      const creatorIndex = parseInt(collected.content.trim(), 10) - 1;

      if (isNaN(creatorIndex) || creatorIndex < 0 || creatorIndex >= creators.length) {
        await interaction.followUp("Invalid number. Please try again.");
        return;
      }

      const selectedCreator = creators[creatorIndex];
      const creatorId = selectedCreator._id; // Get the creator's ID
        console.log(creatorId)
      // Proceed to send creatorId to the backend
      await handleCollaborate(interaction, creatorId); 
      collector.stop(); // Stop collecting once valid selection is made
    });

    collector.on("end", (collected, reason) => {
      if (reason === "time") {
        interaction.followUp("Time out! Please use the command again.");
      }
    });
  } catch (error) {
    console.error("Error fetching creators:", error);
    await interaction.reply("Failed to fetch creators. Please try again later.");
  }
}

// Handle the collaborate command and fetch the UTM link
async function handleCollaborate(interaction, creatorId) {
  try {
    const response = await fetch(`http://localhost:3030/api/link?creatorId=${creatorId}`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });

    if (!response.ok) {
      await interaction.reply("Failed to fetch the link. Please try again.");
      return;
    }
  
    const data = await response.text();
    console.log(data)
    const dataurl = data.replace(/"/g, '');
    console.log(dataurl)
 
    const utmLink = `${dataurl}/signup?utm_source=${interaction.user.id}&utm_medium=murali&utm_campaign=cross_promotion`



    await interaction.followUp(`Here is your UTM link: ${utmLink}`);
  } catch (error) {
    console.error("Error during collaboration:", error);
    await interaction.reply("Failed to generate a UTM link. Please try again later.");
  }
}
client.login(process.env.DISCORDJS_BOT_TOKEN); 