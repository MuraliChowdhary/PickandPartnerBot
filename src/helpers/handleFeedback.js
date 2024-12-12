require("dotenv").config();
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));
const { EmbedBuilder } = require("discord.js");

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Importing routes
const listARoutes = require("../../Routes/listARoutes");
const utmRoutes = require("../../Routes/utmRoutes");
const AdminRoutes = require("../../Routes/AdminRoutes");

const WEBHOOK_URL = process.env.ISSUE_URL;
const FEEDBACK_URL=process.env.FEEDBACK_URL;

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/admin", AdminRoutes);
app.use("/api/", listARoutes);

app.use("/api/utm", utmRoutes);

// mongoose
//   .connect(process.env.MONGODB_URI, {
//     // useNewUrlParser: true,
//     // useUnifiedTopology: true,
//   })
//   .then(() => {
//     console.log("Database Connected Successfully");
//   })
//   .catch((err) => {
//     console.error("Database connection error:", err);
//   });

// Show feedback details and instructions
async function handleFeedback(interaction) {
  const feedbackMessage = new EmbedBuilder()
    .setColor("#E91E63") // A vibrant pink for emphasis and creativity
    .setTitle("📝 Feedback")
    .setDescription(
      "We value your feedback! Let us know if you're facing any issues or have suggestions for improving the bot."
    )
    .setThumbnail(
      "https://cdn-icons-png.flaticon.com/512/786/786407.png" // A pen or feedback icon for a professional touch
    )
    .addFields(
      {
        name: "1️⃣ Reporting Issues",
        value:
          "If you encounter any issues with a command, describe the problem clearly using `/issue <your message>`. This helps us resolve it efficiently.",
      },
      {
        name: "2️⃣ Suggestions",
        value:
          "Have ideas for new features or improvements? Share them to help us make the bot better for everyone!",
      },
      {
        name: "📬 How to Submit Feedback",
        value:
          "Use `/submit_feedback <your message>` to send your thoughts, suggestions, or issues directly to us.",
      }
    )
    .setFooter({
      text: "Your feedback drives our improvements. Thank you!",
      iconURL: "https://cdn-icons-png.flaticon.com/512/847/847969.png", // Adds a feedback-related icon for a polished footer
    });

  await interaction.reply({ embeds: [feedbackMessage] });
}

 

  async function handleSubmitFeedback(interaction) {
    const feedbackContent = interaction.options.getString("message");
    const discordId = interaction.user.id;
    const username = interaction.user.username;

    // Log the feedback content to see if it's correctly retrieved
    console.log("Feedback Content:", feedbackContent);

    // Check if feedbackContent is valid
    if (!feedbackContent) {
      return await interaction.reply({
        content: "Feedback cannot be empty. Please provide your feedback.",
        ephemeral: true,
      });
    }

    // Confirm the receipt to the user
    await interaction.reply({
      content: "Thank you! Your feedback has been submitted. 🙏",
    });

    const feedbackPayload = {
      embeds: [
        {
          title: "📝 **Feedback Submission**",
          color: 0xE91E63, // A vibrant pink color for attention
          description: `**User Information**\n---------------------------\n- **User ID**: ${discordId}\n- **Username**: ${username}\n---------------------------\n**Feedback Details**\n---------------------------\n- **Feedback**: ${feedbackContent}`,
          footer: {
            text: "Thank you for your feedback!",
            icon_url: "https://cdn-icons-png.flaticon.com/512/847/847969.png", // Feedback-related icon
          },
        },
      ],
    };
    
    //console.log("Feedback Payload:", feedbackPayload);
    
    // Sending feedback to the backend
    try {
      const response = await fetch(FEEDBACK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(feedbackPayload), // Ensure the payload is stringified
      });

      if (!response.ok) throw new Error("Error submitting feedback");

      console.log("Feedback submitted successfully!");
    } catch (error) {
      console.error("Failed to send feedback:", error);
      await interaction.followUp({
        content:
          "There was an error submitting your feedback. Please try again later.",
      });
    }
  }



  async function handleIssue(interaction) {
    const IssueContent = interaction.options.getString("message");
    const discordId = interaction.user.id;
    const username = interaction.user.username;
  
    // Log the feedback content to see if it's correctly retrieved
    console.log("Issue Content:", IssueContent);
  
    // Check if feedbackContent is valid
    if (!IssueContent) {
      return await interaction.reply({
        content: "Issue cannot be empty. Please provide your Issue.",
        ephemeral: true,
      });
    }
  
    // Confirm the receipt to the user
    await interaction.reply({
      content: "Thank you! Your Issue has been submitted. 🙏",
    });
  
    const IssuePayload = {
      embeds: [
        {
          title: "📝 **Issue Submission**",
          color: 0xFF5733, // A bright red color to draw attention
          description: `**User Information**\n---------------------------\n- **User ID**: ${discordId}\n- **Username**: ${username}\n---------------------------\n**Issue Details**\n---------------------------\n- **Issue**: ${IssueContent}`,
          footer: {
            text: "Thank you for reporting the issue!",
            icon_url: "https://cdn-icons-png.flaticon.com/512/709/709701.png", // Issue-related icon
          },
        },
      ],
    };
  
    //console.log("Issue Payload:", IssuePayload);
  
    // Sending feedback to the backend
    try {
      const response = await fetch(WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(IssuePayload), // Ensure the payload is stringified
      });
  
      if (!response.ok) throw new Error("Error submitting feedback");
  
      console.log("Issue submitted successfully!");
    } catch (error) {
      console.error("Failed to send feedback:", error);
      await interaction.followUp({
        content:
          "There was an error submitting your feedback. Please try again later.",
      });
    }
  }

module.exports = {
  handleFeedback,
  handleSubmitFeedback,
  handleIssue
};
