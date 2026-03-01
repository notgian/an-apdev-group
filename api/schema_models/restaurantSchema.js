const mongoose = require('mongoose');

const restaurantSchema = new mongoose.Schema({
  name: { 
    type: String, 
    required: true 
},
  image: { 
    type: String 
}, 
  category: { 
    type: String 
}, 
  location: { 
    type: String, required: true 
},
  priceRange: { 
    type: String 
},
  about: { 
    type: String 
}, 
  hours: { 
    type: String 
}, 
  averageRating: { 
    type: Number, 
    default: 0 
}, 
  owner: { type: mongoose.Schema.Types.ObjectId, ref: 'User' } // Links to the owner's account
}, { timestamps: true });

module.exports = mongoose.model('Restaurant', restaurantSchema);