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
const { sendDM } = require("./sendDm");
const { Client } = require('discord.js');

const CROSSPROMOTION_TRIGGER = process.env.WEBHOOK_URL_CROSSPROMOTION;
const client = new Client({ intents: ['Guilds', 'GuildMessages', 'DirectMessages'] });

// Log in to Discord
client.login(process.env.DISCORDJS_BOT_TOKEN)
    .then(() => {
        console.log('Bot logged in successfully!');
    })
    .catch(console.error);
// Set up Express app
const app = express();
app.use(cors());
app.use(express.json());

// API routes
app.use("/api/admin", AdminRoutes);
app.use("/api/", listARoutes);
// app.use("/api/", listBRoutes);
app.use("/api/utm", utmRoutes);

async function handleVerified(interaction) {
    try {
      const discordId = interaction.options.getString("discord_id");
      console.log(discordId);
  
      // Check if the user is already verified
      const verifyCheckResponse = await fetch(`http://localhost:3030/api/isVerify?discordId=${discordId}`);
      
      if (!verifyCheckResponse.ok) {
        const errorData = await verifyCheckResponse.json();
        console.error("Verification check error:", errorData);
        
        await interaction.reply({
          content: `Error: ${errorData.message || "Unable to check the verification status."}`,
          ephemeral: true,
        });
        return;
      }
  
      const verifyCheckData = await verifyCheckResponse.json();
    
      if (verifyCheckData.verified) {
        // If user is already verified, send a message indicating so
        await interaction.reply({
          content: `✅ User with Discord ID **${discordId}** is already verified and eligible for cross-promotion!`,
          ephemeral: true,
        });
        return;
      }

      else{
        const verifyResponse = await fetch("http://localhost:3030/api/verify", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ discordId }),
          });
      
          // Handle non-successful response
          if (!verifyResponse.ok) {
            const errorData = await verifyResponse.json();
            console.error("Verification error:", errorData);
      
            await interaction.reply({
              content: `Error: ${errorData.message || "Unable to verify the user."}`,
              ephemeral: true,
            });
            return;
          }
      
          // Successful verification response
          const successData = await verifyResponse.json();
          await interaction.reply({
            content: `✅ ${successData.message}`,
            ephemeral: true,
          });
      
          // Send a DM with the verification success message
          const message = {
            embeds: [
              {
                color: 0x00ff00, // Green color for success
                title: "✅ Verification Complete!",
                description: `
      **Congratulations! You are now verified and eligible to use the CrossPromote feature! 🎉**
      
      You can now perform cross-promotions and utilize the **/cross-promote** command to boost your presence. 🚀
      
      Enjoy and start promoting with confidence! 🙌
      
      - **The CrossPromotion Team**`,
                footer: {
                  text: "Happy Promoting! ✨",
                },
              },
            ],
          };
      
          await sendDM(client, discordId, message);
          console.log("DM sent to the user with discordId " + discordId);
      
      }
  
    
    } catch (error) {
      console.error("Error in handleVerified:", error);
  
      await interaction.reply({
        content: "An unexpected error occurred. Please try again later.",
        ephemeral: true,
      });
    }
  }


module.exports = {
  handleVerified,
};
