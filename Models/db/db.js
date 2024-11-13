const mongoose = require('mongoose');

// Main database (CrossPromotion)
const mainDb = mongoose.createConnection('mongodb+srv://ananyapappula2004:aEwfuIWq2qVz2rJC@cluster0.2ea39.mongodb.net/CrossPromotion?retryWrites=true&w=majority', {
  // useNewUrlParser: true,
  // useUnifiedTopology: true
});

// Secondary database (URL Schema)
const secondaryDb = mongoose.createConnection('mongodb+srv://muralisudireddy0:p2SuSUUQaJ3LukEV@cluster0.f4fnf.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0', {
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
