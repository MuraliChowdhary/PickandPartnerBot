require("dotenv").config();
const fetch = (...args) =>
import("node-fetch").then(({ default: fetch }) => fetch(...args));
const { EmbedBuilder } = require("discord.js");

const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

// Importing routes
const listARoutes = require("../../Routes/listARoutes");
const listBRoutes = require("../../Routes/listBRoutes");
const utmRoutes = require("../../Routes/utmRoutes");
const AdminRoutes = require("../../Routes/AdminRoutes");
 
const WEBHOOK_URL = process.env.FEEDBACK_URL

const app = express();
app.use(cors());
app.use(express.json());


app.use("/api/admin",AdminRoutes)
app.use("/api/", listARoutes);
 
app.use("/api/utm", utmRoutes);

mongoose
  .connect(process.env.MONGODB_URI, {
    // useNewUrlParser: true,
    // useUnifiedTopology: true,
  })
  .then(() => {
    console.log("Database Connected Successfully");
  })
  .catch((err) => {
    console.error("Database connection error:", err);
  });

 
// Show feedback details and instructions
async function handleFeedback(interaction) {
    const feedbackMessage = new EmbedBuilder()
        .setColor('#0099ff')
        .setTitle('Feedback')
        .setDescription('We appreciate your feedback! Please provide details about any issues or suggestions below.')
        .addFields(
            { name: '1️⃣ Reporting Issues', value: 'If you’re facing a problem with a command, please describe it here. This helps us troubleshoot effectively.' },
            { name: '2️⃣ Suggestions', value: 'Have ideas for new features or improvements? Let us know how we can make the bot better for you!' },
            { name: 'How to Submit:', value: 'Use `/submitFeedback <your message>` to send us your thoughts or any issues you’re facing.' }
        )
        .setFooter({ text: 'Your feedback is important to us!' });

    await interaction.reply({ embeds: [feedbackMessage] });
}


async function handleSubmitFeedback(interaction) {
    const feedbackContent = interaction.options.getString("message");
    const discordId = interaction.user.id;
    const username = interaction.user.username;

    // Log the feedback content to see if it's correctly retrieved
    console.log('Feedback Content:', feedbackContent);

    // Check if feedbackContent is valid
    if (!feedbackContent) {
        return await interaction.reply({ content: 'Feedback cannot be empty. Please provide your feedback.', ephemeral: true });
    }

    // Confirm the receipt to the user
    await interaction.reply({ content: 'Thank you! Your feedback has been submitted. 🙏' });

    const feedbackPayload = {
        content: `📝 **Feedback Submission**\n` +
                 `---------------------------\n` +
                 `**User Information:**\n` +
                 `- User ID: ${discordId}\n` +
                 `- Username: ${username}\n` +
                 `---------------------------\n` +
                 `**Feedback Details:**\n` +
                 `- Feedback: ${feedbackContent}`
    };

    console.log('Feedback Payload:', feedbackPayload.content);

    // Sending feedback to the backend
    try {
        const response = await fetch(WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(feedbackPayload) // Ensure the payload is stringified
        });

        if (!response.ok) throw new Error('Error submitting feedback');

        console.log('Feedback submitted successfully!');
    } catch (error) {
        console.error('Failed to send feedback:', error);
        await interaction.followUp({ content: 'There was an error submitting your feedback. Please try again later.' });
    }
}

module.exports = {
    handleFeedback,
    handleSubmitFeedback
};
