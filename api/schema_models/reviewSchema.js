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
    }],

    updatedAt: { type:  Date, default: Date.now },
    edited: { type: Boolean, default: false },
    
    helpfulVotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    unhelpfulVotes: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    
    // Must be manually updated when adding/removing helpful or unhelpful votes
    helpfulCount: { type: Number, default: 0 },
    unhelpfulCount: { type: Number, default: 0 },

    // Handling of owner response timestamps is different
    ownerResponse: {
        type: {
            ownerId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Users',
                required: true
            },
            comment: { type: String, required: true, trim: true },
            respondedAt: { type: Date, required: true },
            updatedAt: { type: Date, default: Date.now },
        },
        default: undefined
    }
}, 
    // rename timestamp updated at to avoid confusion w/ the review updatedAt
    { 
        timestamps: { 
            createdAt: true, 
            updatedAt: 'systemUpdatedAt' } 
    } 
);

module.exports = mongoose.model('Review', reviewSchema);
