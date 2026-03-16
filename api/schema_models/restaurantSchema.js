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
    imageSrc: {
        type: String,
        required: true
    },
    // WARNING: requires validation on the APPLICATION LEVEL
    // No checks can be added here w/o connecting to and 
    // accessing the DB from here so yeah ._.
    ownerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true
    },
    avgRating: {
        type: Number,
        min: -1,  // -1 means no ratings or no calculated avg ratings
        max: 5.0,
        default: -1
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

restaurantSchema.index({name: 'text'});

module.exports = mongoose.model('Restaurant', restaurantSchema);
