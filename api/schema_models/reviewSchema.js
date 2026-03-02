const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  restaurant: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Restaurant', 
    required: true 
},
  author: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
},
  title: { 
    type: String, 
    required: true 
}, 
  text: { 
    type: String, 
    required: true 
},  
  media: { 
    type: String 
}, 
  rating: { 
    type: Number, 
    min: 1, max: 5, 
    required: true
 }
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);