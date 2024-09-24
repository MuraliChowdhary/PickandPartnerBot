const ListA = require('../Models/ListASchema');

exports.addToListA = async (req, res) => {
  try {
    const {  discordId, newsletterName, niche,subscribers,link } = req.body;


    if (!discordId || !newsletterName || !niche || !subscribers || !link) {
        return res.status(400).json({ message: 'All fields are required' });
      }

    const newEntry = new ListA({
      discordId,
      newsletterName,
      niche,
      subscribers,
      link
    });

    await newEntry.save();
    res.status(201).json(newEntry);
  } catch (error) {
    res.status(500).json({ error: 'Error adding to List A' });
  }
};

exports.getAllListA = async (req, res) => {
    try {
      const listAEntries = await ListA.find({}, 'newsletterName niche'); // Only select the fields needed
      res.status(200).json(listAEntries);
    } catch (error) {
      res.status(500).json({ error: 'Error fetching List A' });
    }
  };
  