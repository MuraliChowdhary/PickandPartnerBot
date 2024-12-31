const ListA = require("../Models/ListASchema");
const mongoose = require("mongoose");

exports.addToListA = async (req, res) => {
  try {
    const { discordId, newsletterName, niche, subscribers, link, copyText } = req.body;
    console.log(req.body);

    // Validate input
    if (!discordId || !newsletterName || !niche || !subscribers || !link || !copyText) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const subscriberCount = parseInt(subscribers, 10);
    if (isNaN(subscriberCount) || subscriberCount < 0) {
      return res.status(400).json({ message: "Subscribers must be a positive number" });
    }

    // Ensure the link starts with "https://"
    let processedLink = link.trim();
    if (!/^https?:\/\//i.test(processedLink)) {
      processedLink = `https://${processedLink}`;
    }

    const urlPattern = /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)(:[0-9]{1,5})?(\/.*)?$/i;
    if (!urlPattern.test(processedLink)) {
      return res.status(400).json({ message: "Invalid URL format" });
    }

    // Check for duplicate discordId
    const existingDiscordId = await ListA.findOne({ discordId });
    if (existingDiscordId) {
      return res.status(400).json({ message: "This Discord ID is already registered" });
    }

    // Check for duplicate link
    const existingLink = await ListA.findOne({ link: processedLink });
    if (existingLink) {
      return res.status(400).json({ message: "This newsletter link is already registered" });
    }

    const newEntry = new ListA({
      discordId,
      newsletterName,
      niche,
      subscribers: subscriberCount,
      link: processedLink,
      copyText,
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


exports.verify = async (req, res) => {
  const  discordId  = req.query.discordId
  console.log(discordId)
  try {
    // Find the entry in the ListA collection based on discordId
    const existingEntry = await ListA.findOne({ discordId });

    if (!existingEntry) {
      return res.status(404).json({
        message: "You are not registered in the cross-promotion program.",
      });
    }

    // Return the isVerified status
    const verified = existingEntry.isVerified;
    return res.status(200).json({ verified });
  } catch (err) {
    // Log the error and send a server error response
    console.error("Error verifying user:", err);
    res.status(500).json({
      error: "An internal server error occurred while verifying the user.",
    });
  }
};


exports.verified = async (req, res) => {
  const { discordId } = req.body;

  if (!discordId) {
    return res.status(400).json({
      message: "Discord ID is required.",
    });
  }

  try {
    const existingEntry = await ListA.findOne({ discordId });

    if (!existingEntry) {
      return res.status(404).json({
        message: "You are not registered.",
      });
    }

    // Update the isVerified status
    existingEntry.isVerified = true;
    await existingEntry.save();

    res.status(200).json({
      message: "Profile verified successfully.",
    });
  } catch (err) {
    console.error("Error verifying user:", err);

    res.status(500).json({
      error: "An internal server error occurred while verifying the user.",
    });
  }
};



exports.isLinkGenerated = async (req, res) => {
  try {
    // Find users who are verified but have not generated cross-promotion links
    const existingLinks = await ListA.find({
      isVerified: true,
      isLinkSend: false,
    });

    if (existingLinks.length === 0) {
      return res.status(200).json({
        message: "No verified users without generated links.",
      });
    }

    // Format the user details into a line-by-line string
    const formattedUsers = existingLinks
      .map(user => {
        return `Discord ID: ${user.discordId}\nNewsletter Name: ${user.newsletterName}\nNiche: ${user.niche}\nLink: ${user.link}\n`;
      })
      .join("\n--------------------\n");

    // Send the response with formatted user details
    return res.status(200).send(
      `Verified users without generated links:\n\n${formattedUsers}`
    );
  } catch (err) {
    console.error("Error fetching users:", err);
    res.status(500).json({
      error: "An internal server error occurred while fetching the users.",
    });
  }
};

exports.isLinkVerfied = async (req, res) => {
  const { discordId1, discordId2 } = req.body;
  try {
      const user1 = await ListA.findOne({ discordId: discordId1 });
      const user2 = await ListA.findOne({ discordId: discordId2 });

      if (!user1 || !user2) {
          return res.status(404).json({
              error: "One or both users do not exist.",
          });
      }

      // Mark both users as having received the link
      user1.isLinkSend = true;
      user2.isLinkSend = true;

      // Save changes to the database
      await user1.save();
      await user2.save();

      res.status(200).json({
          message: "Link Genarated and Sent successful.",
      });
  } catch (err) {
      console.error("Error fetching user:", err);
      res.status(500).json({
          error: "An internal server error occurred while fetching the user.",
      });
  }
};

exports.copyText = async (req, res) => {
  const { discordId1, discordId2 } = req.query;

  if (!discordId1 || !discordId2) {
    return res.status(400).json({
      error: "Both discordId1 and discordId2 are required.",
    });
  }

  try {
    console.log("Fetching users for IDs:", discordId1, discordId2);

    const [user1, user2] = await Promise.all([
      ListA.findOne({ discordId: discordId1 }),
      ListA.findOne({ discordId: discordId2 }),
    ]);

    if (!user1 || !user2) {
      return res.status(404).json({
        error: "One or both users do not exist.",
      });
    }

    return res.status(200).json({
      copyText1: user1.copyText,
      copyText2: user2.copyText,
    });
  } catch (err) {
    console.error("Error fetching users:", err);
    return res.status(500).json({
      error: "An internal server error occurred while fetching the users.",
    });
  }
};
