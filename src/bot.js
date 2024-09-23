require("dotenv").config();
const fetch = (...args) => import('node-fetch').then(({default: fetch}) => fetch(...args));

const { v4: uuidv4 } = require("uuid");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const listARoutes = require("../Routes/listARoutes");
const listBRoutes = require("../Routes/listBRoutes");
const utmRoutes = require("../Routes/utmRoutes");

// Import fetch for Node.js

const app = express();

mongoose.connect(process.env.MONGODB_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true, 
  }).then(() => {
    console.log("Database Connected Successfully");
  }).catch(err => {
    console.error("Database connection error:", err);
  });
app.use(cors());
app.use(express.json());

app.use("/api/", listARoutes);
// app.use('/api/', listBRoutes);
app.use("/api/utm", utmRoutes);

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

// Define the /register command
const commands = [
  {
    name: "register",
    description: "Register your newsletter details",
  },
];

// Register the commands with Discord's API
const rest = new REST({ version: "9" }).setToken(process.env.DISCORDJS_BOT_TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationGuildCommands(process.env.DISCORD_CLIENT_ID, process.env.GUILD_ID),
      { body: commands }
    );
    console.log("Successfully registered application commands.");
  } catch (error) {
    console.error("Error registering commands:", error);
  }
})();

// Bot ready event
client.once("ready", () => {
  console.log("Bot is online!");
});

client.on("interactionCreate", async (interaction) => {
    if (!interaction.isCommand()) return;
  
    const { commandName } = interaction;
  
    if (commandName === "register") {
      await interaction.reply("Please enter your newsletter name:");
  
      // Set up a message collector to gather input from the creator
      const filter = (response) => response.author.id === interaction.user.id;
      const collector = interaction.channel.createMessageCollector({ filter, time: 30000 });
  
      let newsletterData = {
        discordId: interaction.user.id,  // Get creator's Discord ID
      };
  
      collector.on('collect', async (collected) => {
        if (!newsletterData.newsletterName) {
          newsletterData.newsletterName = collected.content;
          await interaction.followUp('Please enter your niche:');
        } else if (!newsletterData.niche) {
          newsletterData.niche = collected.content;
          await interaction.followUp('Please enter your number of subscribers:');
        } else if (!newsletterData.subscribers) {
          newsletterData.subscribers = collected.content;
          await interaction.followUp('Please provide a link to your newsletter:');
        } else if (!newsletterData.link) {
          newsletterData.link = collected.content;
  
          // Now that all data is collected, store it in the backend
          await fetch('http://localhost:5000/api/register', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(newsletterData),
          });
  
          await interaction.followUp('Your details have been saved successfully!');
          console.log("Sucessfully registered")
          collector.stop();  // Stop the collector once all data is collected
        }
      });
  
      collector.on('end', (collected, reason) => {
        if (reason === 'time') {
          interaction.followUp('Time out! Please use /register to start again.');
        }
      });
    }
  });
  
  client.login(process.env.DISCORDJS_BOT_TOKEN);
  