const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true
  },
  description: {
    type: String,
    required: true
  },
  location: {
    street: { 
      type: String, 
      required: true 
    },
    city: { 
      type: String, 
      required: true 
    },
    province: { 
      type: String 
    },
    zipCode: { 
      type: String 
    }
  },
  priceRange: {
    min: { 
      type: Number, 
      required: true,
      min: 0 
    },
    max: { 
      type: Number, 
      required: true,
      min: 0
    }
  }
}, { timestamps: true });

module.exports = mongoose.model('Restaurant', restaurantSchema);