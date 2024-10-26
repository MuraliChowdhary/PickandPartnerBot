const ListA = require("../Models/ListASchema");
const mongoose = require("mongoose");

exports.addToListA = async (req, res) => {
  try {
    const { discordId, newsletterName, niche, subscribers, link } = req.body;

    // Validate input
    if (!discordId || !newsletterName || !niche || !subscribers || !link) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const subscriberCount = parseInt(subscribers, 10);
    if (isNaN(subscriberCount) || subscriberCount < 0) {
      return res.status(400).json({ message: "Subscribers must be a positive number" });
    }

    const urlPattern = /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)(:[0-9]{1,5})?(\/.*)?$/i;
    if (!urlPattern.test(link)) {
      return res.status(400).json({ message: "Invalid URL format" });
    }

    const newEntry = new ListA({
      discordId,
      newsletterName,
      niche,
      subscribers: subscriberCount,
      link,
    });

    await newEntry.save();
    res.status(201).json(newEntry);
  } catch (error) {
    console.error("Error adding to List A:", error);
    res.status(500).json({ message: "Error adding to List A" });
  }
};

exports.getAllListA = async (req, res) => {
  try {
    const listAEntries = await ListA.find({}, "newsletterName niche");
    res.status(200).json(listAEntries);
  } catch (error) {
    console.error("Error fetching List A:", error);
    res.status(500).json({ message: "Error fetching List A" });
  }
};

exports.getLink = async (req, res) => {
  const id = req.query.creatorId;
  try {
    const creator = await ListA.findById(id);
    if (!creator) {
      return res.status(404).json({ message: "Creator not found" });
    }

    let creatorLink = creator.link;
    if (!creatorLink.startsWith("https://")) {
      creatorLink = "https://" + creatorLink;
    }

    res.status(200).json(creatorLink);
  } catch (err) {
    console.error("Error fetching link:", err);
    res.status(500).json({ message: "Error fetching link" });
  }
};

// Get user profile
exports.getProfile = async (req, res) => {
  const discordId  = req.query.discordId;

  try {
    const profile = await ListA.findOne({ discordId:discordId });
    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json(
         profile
    );
  } catch (error) {
    console.error("Error fetching profile:", error);
    res.status(500).json({ message: "Error fetching profile" });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  const { discordId, newsletterName, niche, subscribers, link } = req.body;

  try {
    const existingEntry = await ListA.findOne({ discordId });
    if (!existingEntry) {
      return res.status(404).json({ message: "Profile not found" });
    }

    // Validate inputs
    if (subscribers !== undefined) {
      const subscriberCount = parseInt(subscribers, 10);
      if (isNaN(subscriberCount) || subscriberCount < 0) {
        return res.status(400).json({ message: "Subscribers must be a positive number" });
      }
      existingEntry.subscribers = subscriberCount;
    }
    
    if (newsletterName) existingEntry.newsletterName = newsletterName;
    if (niche) existingEntry.niche = niche;
    if (link) {
      const urlPattern = /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)(:[0-9]{1,5})?(\/.*)?$/i;
      if (!urlPattern.test(link)) {
        return res.status(400).json({ message: "Invalid URL format" });
      }
      existingEntry.link = link;
    }

    await existingEntry.save();
    res.status(200).json({
      message: "Profile updated successfully",
      updatedProfile: existingEntry,
    });
  } catch (error) {
    console.error("Error updating profile:", error);
    res.status(500).json({ error: "Error updating profile" });
  }
};
