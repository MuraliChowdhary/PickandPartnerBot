
const mongoose = require('mongoose');
const ListA = require('../../Models/ListASchema'); // Ensure this points to your schema file
const Url = require('../../Models/UTMTracking');


const updateDailyClicks = async (discordId) => {
    const today = new Date().toISOString().split('T')[0]; // Get current date in YYYY-MM-DD format
  
    // Fetch the user from the main DB
    const user = await ListA.findOne({ discordId });
    if (!user) {
      throw new Error('User not found.');
    }
  
    // Fetch only the URLs where the user is the promoter (utm_source)
    const urlsToday = await Url.find({
      "originalUrl": { $regex: `utm_source=${discordId}`, $options: "i" }, // Match URLs promoted by the user
      "createdAt": {
        $gte: new Date(today),
        $lt: new Date(new Date(today).setDate(new Date(today).getDate() + 1)), // Today's date range
      },
    });
  
    let totalClicksToday = 0;
    let uniqueClicksToday = 0;
  
    // Sum up total and unique clicks from the URLs promoted by the user
    for (let url of urlsToday) {
      totalClicksToday += url.totalClicks || 0;
      uniqueClicksToday += url.uniqueClicks || 0;
    }
  
    // Check if today's record exists in the daily clicks array
    const dailyRecord = user.dailyClicks.find(
      (record) => record.date.toISOString().split('T')[0] === today
    );
  
    if (dailyRecord) {
      // Update the existing record for today
      dailyRecord.totalClicks = totalClicksToday;
      dailyRecord.uniqueClicks = uniqueClicksToday;
    } else {
      // Add a new record for today's clicks
      user.dailyClicks.push({
        date: new Date(),
        totalClicks: totalClicksToday,
        uniqueClicks: uniqueClicksToday,
      });
    }
  
    // Save the updated user record to the main DB
    await user.save();
    console.log(
      `Updated daily clicks for discordId: ${discordId} with ${totalClicksToday} total clicks and ${uniqueClicksToday} unique clicks.`
    );
  };
  
  
  
  // Update weekly clicks
  const updateWeeklyClicks = async (discordId) => {
    const user = await ListA.findOne({ discordId });
    if (!user) {
      throw new Error('User not found.');
    }
  
    // Get the start of the current week (Sunday)
    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - startOfWeek.getDay()); // Sunday
    startOfWeek.setHours(0, 0, 0, 0); // Set time to 00:00:00
  
    // Get the end of the current week (Saturday)
    const endOfWeek = new Date(startOfWeek);
    endOfWeek.setDate(endOfWeek.getDate() + 6); // Saturday
    endOfWeek.setHours(23, 59, 59, 999); // Set time to 23:59:59
  
    // Calculate totalClicks and uniqueClicks for the current week
    const weeklyStats = user.clickHistory.reduce(
      (totals, record) => {
        const recordDate = new Date(record.date);
        if (recordDate >= startOfWeek && recordDate <= endOfWeek) {
          totals.totalClicks += record.totalClicks;
          totals.uniqueClicks += record.uniqueClicks;
        }
        return totals;
      },
      { totalClicks: 0, uniqueClicks: 0 } // Initial accumulator values
    );
  
    // Update weeklyClicks in the user object
    user.weeklyClicks = {
      startOfWeek,
      endOfWeek,
      totalClicks: weeklyStats.totalClicks,
      uniqueClicks: weeklyStats.uniqueClicks,
    };
  
    // Save the updated user record
    await user.save();
  
    console.log(
      `Updated weekly clicks for discordId: ${discordId} from ${startOfWeek.toISOString()} to ${endOfWeek.toISOString()}: Total Clicks: ${weeklyStats.totalClicks}, Unique Clicks: ${weeklyStats.uniqueClicks}`
    );
  };
  
  

  module.exports={
    updateDailyClicks,
    updateWeeklyClicks
  }