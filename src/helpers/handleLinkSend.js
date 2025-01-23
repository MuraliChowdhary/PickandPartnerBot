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
const CROSSPROMOTION_TRIGGER = process.env.WEBHOOK_URL_CROSSPROMOTION;

// Set up Express app
const app = express();
app.use(cors());
app.use(express.json());

 
// API routes
app.use("/api/admin", AdminRoutes);
app.use("/api/", listARoutes);
// app.use("/api/", listBRoutes);
app.use("/api/utm", utmRoutes);

 

 
async function handleLinkSend(interaction) {
  try {
    // Send a GET request to the backend to fetch verified users whose links are not generated
    const response = await fetch("https://pickandpartnerbackend-titu.onrender.com/api/linkGenarated", {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    // Check if the response is successful
    if (!response.ok) {
      const errorMessage = await response.text();
      console.error("Error fetching users:", errorMessage.message);
      await interaction.reply({
        content: "Error: Unable to fetch user data. Please try again later.",
        ephemeral: true,
      });
      return;
    }

    // Parse the response to get the formatted user details
    const usersDetails = await response.text();

    // Send the fetched user details as a response
    await interaction.reply({
      content: usersDetails,
      ephemeral: true,
    });
  } catch (error) {
    console.error("Error in handleLink:", error);
    await interaction.reply({
      content: "An error occurred while fetching user data. Please try again later.",
      ephemeral: true,
    });
  }
}


module.exports = {
    handleLinkSend
}