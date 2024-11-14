const mongoose = require('mongoose');
const { mainDb } = require('./db/db');


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
    required: true,
    validate: {
      validator: function(v) {
        // Ensure niche is not a number
        return isNaN(v);
      },
      message: props => `${props.value} is not a valid niche! Niche cannot be a number.`
    }
  },        
  link: {
    type: String,
    required: true,
    unique: true,
    validate: {
      validator: function(v) {
        // Simple URL validation
        return /^(https?:\/\/)?([\w-]+(\.[\w-]+)+)(:[0-9]{1,5})?(\/.*)?$/i.test(v);
      },
      message: props => `${props.value} is not a valid URL!`
    }
  },
  subscribers: { 
    type: Number, 
    required: true,
    min: [0, 'Subscribers cannot be negative.'] // Ensure subscribers is not negative
  },
 
  totalPromotionsGiven: { 
    type: Number, 
    default: 0,
    min: [0, 'Total promotions given cannot be negative.'] // Ensure total promotions given is not negative
  },
  totalClicksGenerated: { 
    type: Number, 
    default: 0,
    min: [0, 'Total clicks generated cannot be negative.'] // Ensure total clicks generated is not negative
  },
  totalSignupsGenerated: { 
    type: Number, 
    default: 0,
    min: [0, 'Total signups generated cannot be negative.'] // Ensure total signups generated is not negative
  },
  isEligibleForPromotion: { 
    type: Boolean, 
    default: false 
  },
  isVerified:{
    type:Boolean,
    default:false
  },

  maxPromotionsAllowed: { 
    type: Number, 
    default: 5,
    min: [0, 'Max promotions allowed cannot be negative.'] // Ensure max promotions allowed is not negative
  },
  createdAt: { 
    type: Date, 
    default: Date.now 
  }
});

module.exports = mainDb.model('ListA', ListASchema);



