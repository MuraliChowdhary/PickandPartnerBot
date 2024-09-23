const mongoose = require("mongoose");

const ListBSchema = new mongoose.Schema({
  discordId: {
    type: String,
    required: true,
    unique: true,
  },
  newsletterName: {
    type: String,
    required: true,
  },
  niche: {
    type: String,
    required: true,
  },
  subscribers: {
    type: Number,
    required: true,
  },
  totalPromotionsTaken: {
    type: Number,
    default: 0,
  },
  totalClicksReceived: {
    type: Number,
    default: 0,
  },
  totalSignupsReceived: {
    type: Number,
    default: 0,
  },
  promotionLimit: {
    type: Number,
    default: 5,
  },
  isPromoted: {
    type: Boolean,
    default: false,
  },
  maxClicksBeforePromotion: {
    type: Number,
    default: 100,
  },
  lastPromotionDate: {
    type: Date,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model("ListB", ListBSchema);
