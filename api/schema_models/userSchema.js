const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
    username: { 
        type: String, 
        required: true, 
        unique: true 
    },
    password: { 
        type: String, 
        required: true 
    }, 
    avatar: { type: String, // picture ni user
        default: 'images/user-avatar.png' 
    }, 
    description: {  // about you
        type: String, 
        default: '' 
    }, 
    role: {
        type: String, 
        enum: ['user', 'owner'], 
        default: 'user' 
    }, 
    following: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }], 
    followers: [{ 
        type: mongoose.Schema.Types.ObjectId, 
        ref: 'User' 
    }]
}, { timestamps: true });

module.exports = mongoose.model('User', userSchema);
