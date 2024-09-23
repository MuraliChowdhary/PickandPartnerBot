const mongoose = require('mongoose');

const ListASchema = new mongoose.Schema({
  discordId: { 
    type: String, 
    required: true, 
    unique: true 
  },
  newsletterName: { 
    type: String, 
    required: true 
  },
  niche: { 
    type: String, 
    required: true 
  },        
  link:{
    type:String,
    required:true,
    unique:true
  },
  subscribers: { 
    type: Number, 
    required: true 
  },
  totalPromotionsGiven: { 
    type: Number, 
    default: 0 
  },
  totalClicksGenerated: { 
    type: Number, 
    default: 0 
  },
  totalSignupsGenerated: { 
    type: Number, 
    default: 0 
  },
  isEligibleForPromotion: { 
    type: Boolean, 
    default: false 
  },
  maxPromotionsAllowed: { 
    type: Number, 
    default: 5 
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mongoose.model('ListA', ListASchema);
