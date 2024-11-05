const mongoose = require('mongoose');
const { secondaryDb } = require('./db/db');

const urlSchema = new mongoose.Schema({
  shortId: String,
  originalUrl: String,
  totalClicks: { type: Number, default: 0 },
  uniqueClicks: { type: Number, default: 0 },
  visitorDetails: [
    {
      visitorId: String,
      city: String,
    }
  ]
});

module.exports = secondaryDb.model('Url', urlSchema);
