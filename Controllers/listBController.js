const ListB = require('../Models/ListBSchema');

exports.addToListB = async (req, res) => {
  try {
    const { discordId, newsletterName, niche, subscribers } = req.body;

    const newEntry = new ListB({
      discordId,
      newsletterName,
      niche,
      subscribers
    });

    await newEntry.save();
    res.status(201).json(newEntry);
  } catch (error) {
    res.status(500).json({ error: 'Error adding to List B' });
  }
};

exports.getAllListB = async (req, res) => {
  try {
    const listBEntries = await ListB.find({});
    res.status(200).json(listBEntries);
  } catch (error) {
    res.status(500).json({ error: 'Error fetching List B' });
  }
};
