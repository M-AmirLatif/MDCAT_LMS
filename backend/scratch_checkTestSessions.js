const mongoose = require('mongoose');
require('dotenv').config();

const MONGO_URI = process.env.MONGO_URI;
console.log('Connecting to:', MONGO_URI);

mongoose.connect(MONGO_URI)
  .then(async () => {
    console.log('Connected successfully!');
    
    try {
      const count = await mongoose.connection.db.collection('testsessions').countDocuments({});
      console.log('Total TestSession documents:', count);

      const sample = await mongoose.connection.db.collection('testsessions').find({}).limit(3).toArray();
      console.log('Sample TestSessions:', JSON.stringify(sample, null, 2));
    } catch (err) {
      console.error('Error counting test sessions:', err);
    }

    mongoose.disconnect();
  })
  .catch(err => {
    console.error('Connection error:', err);
  });
