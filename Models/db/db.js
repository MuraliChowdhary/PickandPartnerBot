  const mongoose = require('mongoose');

// Main database (CrossPromotion)
const mainDb = mongoose.createConnection(process.env.MAIN_DB, {
  // useNewUrlParser: true,
  // useUnifiedTopology: true
});

// Secondary database (URL Schema)
const secondaryDb = mongoose.createConnection(process.env.SECONDARY_DB, {
  // useNewUrlParser: true,
  // useUnifiedTopology: true
});
  
mainDb.on('connected', () => {
  console.log('Connected to the main database (CrossPromotion)');
});

secondaryDb.on('connected', () => {
  console.log('Connected to the secondary database');
});

module.exports = { mainDb, secondaryDb };
