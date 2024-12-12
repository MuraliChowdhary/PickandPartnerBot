const {sendDM} = require('../helpers/sendDm'); // Utility for sending DMs
const { updateDailyClicks, updateWeeklyClicks } = require("../helpers/clicksDailyWeeklyMonitor");
const Url = require('../../Models/UTMTracking'); // Secondary DB URL Schema
const ListA = require('../../Models/ListASchema'); // Main DB Schema
const url = require('url'); // Node.js module for parsing URLs
const cron = require('node-cron'); // Node-cron package to schedule tasks
const {secondaryDb} = require("../../Models/db/db")
const { Client } = require('discord.js');

// Initialize the client in the same file
const client = new Client({ intents: ['Guilds', 'GuildMessages', 'DirectMessages'] });

// Log in to Discord
client.login(process.env.DISCORDJS_BOT_TOKEN)
    .then(() => {
        console.log('Bot logged in successfully!');
    })
    .catch(console.error);

// Extract query parameters from URL
const extractQueryParams = (originalUrl) => {
  const parsedUrl = url.parse(originalUrl, true);
  return parsedUrl.query;
};

// Function to handle URL change stream and process click tracking
const trackUrlClicks = (urlDb) => {
    const changeStream = urlDb.collection('urls').watch();
  
    changeStream.on('change', async (change) => {
      if (change.operationType === 'update') {
        const { totalClicks, uniqueClicks } = change.updateDescription.updatedFields;
        const shortId = change.documentKey._id;
  
        if (totalClicks !== undefined || uniqueClicks !== undefined) {
          try {
             
            const urlRecord = await Url.findById(shortId);
  
            if (!urlRecord) {
              console.log(`URL record not found for shortId: ${shortId}`);
              return;
            }
  
            // Extract promoter and promotee Discord IDs from the URL
            const queryParams = extractQueryParams(urlRecord.originalUrl);
  
            const promoterDiscordId = queryParams.utm_source;
            const promoteeDiscordId = queryParams.utm_content;
  
            if (!promoterDiscordId || !promoteeDiscordId) {
              console.log(`Promoter or promotee Discord ID missing in originalUrl: ${urlRecord.originalUrl}`);
              return;
            }
  
            // Fetch URLs specifically promoted by this promoter, filtering using `utm_source` (promoterDiscordId)
            const allPromotedUrls = await Url.find({
              "originalUrl": { $regex: `utm_source=${promoterDiscordId}`, $options: "i" }
            });
  
            console.log("Links promoted by the promoter:", allPromotedUrls);
            let totalClicksSum = 0;
            let uniqueClicksSum = 0;
  
            // Calculate total and unique clicks for the URLs promoted by the specific promoter
            for (let promotedUrl of allPromotedUrls) {
              // Only consider the promoter's own links, not the promotee's links
              const urlClicks = promotedUrl.totalClicks || 0;
              const urlUniqueClicks = promotedUrl.uniqueClicks || 0;
  
              totalClicksSum += urlClicks;
              uniqueClicksSum += urlUniqueClicks;
            }
  
            // Update the promoter's click data in the main DB
            const promoter = await ListA.findOne({ discordId: promoterDiscordId });
  
            if (promoter) {
              // Update the promoter's total and unique clicks
              promoter.totalClicksGenerated = totalClicksSum;
              promoter.uniqueClicks = uniqueClicksSum;
  
              //Update daily and weekly click counts
            //   await updateDailyClicks(promoterDiscordId, totalClicksSum);
            //   await updateWeeklyClicks(promoterDiscordId);
  
              // Save the updated data
              await promoter.save();
              console.log(`Promoter clicks updated for discordId: ${promoterDiscordId}`);
            } else {
              console.log(`Promoter not found for discordId: ${promoterDiscordId}`);
            }
  
          } catch (error) {
            console.error('Error while processing click tracking:', error);
          }
        }
      }
    });
    console.log("Tracking the URLs");
  };
  
  

// Cron job to send DM to promotees at 6 PM daily
const sendDailyDM = async () => {
    try {
      const today = new Date();
      today.setHours(0, 0, 0, 0); // Reset time to midnight to filter for today's date
  
      // Fetch records with a `createdAt` field matching today's date
      const recordsWithLinks = await secondaryDb.collection('urls')
        .find({
          originalUrl: { $exists: true, $ne: null }, // Ensure originalUrl exists
          createdAt: { $gte: today },              // Match today's records
        })
        .sort({ _id: -1 })                        // Sort in descending order (most recent first)                              // Limit to last 3 records
        .toArray();
  
      if (recordsWithLinks.length === 0) {
        console.log("No promotees found with valid links in the originalUrl for today.");
        return;
      }
  
      // Loop through the filtered records
      for (const record of recordsWithLinks) {
        const originalUrl = record.originalUrl;
        console.log("Processing URL:", originalUrl);
  
        // Extract 'utm_content' from the originalUrl
        const urlParams = new URLSearchParams(new URL(originalUrl).search);
        const promoteeDiscordId = urlParams.get('utm_content'); // Assuming utm_content stores the Discord ID
        console.log("Promotee Discord ID:", promoteeDiscordId);
  
        if (!promoteeDiscordId) {
          console.log(`No UTM content (Discord ID) found in URL: ${originalUrl}`);
          continue; // Skip if no discordId is found
        }
  
        // Fetch the total clicks and unique clicks
        const totalClicks = record.totalClicks;
        const uniqueClicks = record.uniqueClicks;
  
        const message = `Hello! 🎉 You received ${totalClicks} total clicks and ${uniqueClicks} unique clicks today! From PickandPartner 🚀`;
  
        // Send DM to promotee's contact (e.g., Discord or another platform)
        try {
          await sendDM(client,promoteeDiscordId, message); // Send DM to the promotee's Discord ID
          console.log(`DM sent to promotee ${promoteeDiscordId} regarding link ${originalUrl}`);
        } catch (dmError) {
          console.error(`Failed to send DM to promotee ${promoteeDiscordId}:`, dmError);
        }
      }
    } catch (error) {
      console.error('Error sending daily DMs:', error);
    }
  };
  
  // Schedule the task to run at 9:30 PM for testing
//   cron.schedule('29 23 * * *', sendDailyDM);  
  
//   console.log('Cron job set to send daily DMs at 9:30 PM for testing.');
  
  module.exports = { trackUrlClicks, sendDailyDM };
  