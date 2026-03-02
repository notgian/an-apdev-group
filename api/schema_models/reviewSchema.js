const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    required: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User', 
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 0, 
    max: 5  
  },
  comment: {
    type: String,
    required: true,
    trim: true
  },
  media: [{
    type: String,
    default: []
  }]
}, { timestamps: true });

module.exports = mongoose.model('Review', reviewSchema);