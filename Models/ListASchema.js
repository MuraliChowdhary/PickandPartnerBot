const mongoose = require('mongoose');
const { mainDb } = require('./db/db');

const ListASchema = new mongoose.Schema({
  discordId: { type: String, required: true, unique: true },
  newsletterName: { type: String, required: true },
  niche: {
    type: String,
    required: true,
    validate: {
      validator: function (v) {
        return isNaN(v);
      },
      message: (props) => `${props.value} is not a valid niche!`,
    },
  },
  link: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function (v) {
        return /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)(:[0-9]{1,5})?(\/.*)?$/i.test(v);
      },
      message: (props) => `${props.value} is not a valid URL!`,
    },
  },
  subscribers: { type: Number, required: true, min: [0, 'Subscribers cannot be negative.'] },
  totalPromotionsGiven: { type: Number, default: 0, min: [0, 'Promotions cannot be negative.'] },
  totalClicksGenerated: { type: Number, default: 0, min: [0, 'Clicks cannot be negative.'] },
  uniqueClicks: { type: Number, default: 0, min: [0, 'Unique clicks cannot be negative.'] },
  isEligibleForPromotion: { type: Boolean, default: false },
  isLinkSend: {
    type: Boolean,
    default: false
  },
  isVerified: { type: Boolean, default: false },
  maxPromotionsAllowed: { type: Number, default: 5, min: [0, 'Promotions allowed cannot be negative.'] },
  createdAt: { type: Date, default: Date.now },
  dailyClicks: [
    {
      date: { type: Date, required: true },
      totalClicks: { type: Number, default: 0 },
      uniqueClicks: { type: Number, default: 0 },
    },
  ],
  // Updated field for analytics with default start and end of the week
  weeklyClicks: {
    startOfWeek: {
      type: Date,
      default: function() {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek + (dayOfWeek == 0 ? -6 : 1); // Calculate Monday of the current week
        today.setDate(diff);
        return today.setHours(0, 0, 0, 0); // Set time to midnight (start of day)
      }
    },
    endOfWeek: {
      type: Date,
      default: function() {
        const today = new Date();
        const dayOfWeek = today.getDay();
        const diff = today.getDate() - dayOfWeek + (dayOfWeek == 0 ? -6 : 1) + 6; // Calculate Sunday of the current week
        today.setDate(diff);
        return today.setHours(23, 59, 59, 999); // Set time to end of the day (11:59 PM)
      }
    },
    totalClicks: { type: Number, default: 0, min: [0, 'Clicks cannot be negative.'] },
    uniqueClicks: { type: Number, default: 0, min: [0, 'Unique clicks cannot be negative.'] },
  },
  copyText:{
    type: String,
    default: '',
    required:true

  }
});





module.exports = mainDb.model('ListA', ListASchema);
