const ListA = require("../Models/ListASchema");

exports.addToListA = async (req, res) => {
  try {
    const { discordId, newsletterName, niche, subscribers, link } = req.body;

    if (!discordId || !newsletterName || !niche || !subscribers || !link) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const newEntry = new ListA({
      discordId,
      newsletterName,
      niche,
      subscribers,
      link,
    });

    await newEntry.save();
    res.status(201).json(newEntry);
  } catch (error) {
    res.status(500).json({ error: "Error adding to List A" });
  }
};

exports.getAllListA = async (req, res) => {
  try {
    const listAEntries = await ListA.find({}, "newsletterName niche"); // Only select the fields needed
    res.status(200).json(listAEntries);
  } catch (error) {
    res.status(500).json({ error: "Error fetching List A" });
  }
};

exports.getLink = async (req, res) => {
  const id = req.query.creatorId;
  console.log(id);
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
    res.status(500).json({ error: "Error fetching link" });
  }
};

// get user profile
exports.getProfile = async (req, res) => {
  const { discordId } = req.query;

  try {
    const profile = await ListA.findOne({ discordId });

    if (!profile) {
      return res.status(404).json({ message: "Profile not found" });
    }

    res.status(200).json(profile);
  } catch (error) {
    res.status(500).json({ error: "Error fetching profile" });
  }
};

// Update user profile
exports.updateProfile = async (req, res) => {
  const { discordId, newsletterName, niche, subscribers, link } = req.body;

  try {
    // Find the user by their Discord ID
    const existingEntry = await ListA.findOne({ discordId });

    if (!existingEntry) {
      return res.status(404).json({ message: "Profile not found" });
    }

    // Update the fields that are sent in the request body
    if (newsletterName) existingEntry.newsletterName = newsletterName;
    if (niche) existingEntry.niche = niche;
    if (subscribers) existingEntry.subscribers = subscribers;
    if (link) existingEntry.link = link;

    await existingEntry.save();
    res.status(200).json({
      message: "Profile updated successfully",
      updatedProfile: existingEntry,
    });
  } catch (error) {
    res.status(500).json({ error: "Error updating profile" });
  }
};
