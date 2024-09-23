const UTMTracking = require('../Models/UTMTracking');

exports.createUTM = async (req, res) => {
  try {
    const { promoter, promotee, utmLink } = req.body;

    const newUTM = new UTMTracking({
      promoter,
      promotee,
      utmLink
    });

    await newUTM.save();
    res.status(201).json(newUTM);
  } catch (error) {
    res.status(500).json({ error: 'Error creating UTM' });
  }
};

exports.trackUTM = async (req, res) => {
  try {
    const { utm_source, utm_medium } = req.body;

    const utm = await UTMTracking.findOne({ promoter: utm_source, promotee: utm_medium });

    if (utm) {
      utm.clicks += 1;
      await utm.save();
      res.status(200).json({ clicks: utm.clicks });
    } else {
      res.status(404).json({ error: 'UTM link not found' });
    }
  } catch (error) {
    res.status(500).json({ error: 'Error tracking UTM' });
  }
};
