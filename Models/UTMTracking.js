const mongoose = require('mongoose');

const UTMTrackingSchema = new mongoose.Schema({
  promoter: { type: String, required: true },
  promotee: { type: String, required: true },
  utmLink: { type: String, required: true },
  clicks: { type: Number, default: 0 },
  signups: { type: Number, default: 0 },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('UTMTracking', UTMTrackingSchema);
