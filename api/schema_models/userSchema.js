const mongoose = require('mongoose');

const API_HOSTNAME = process.env.API_HOSTNAME;
const API_PUBLIC_HOSTNAME = process.env.API_PUBLIC_HOSTNAME;
const API_PORT = process.env.API_PORT;
const API_LOC = (process.env.ENVIRONMENT == 'dev') ? 
    `${API_HOSTNAME}:${API_PORT}`: 
    `${API_PUBLIC_HOSTNAME}`;

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
        default: `http://${API_LOC}/cdn/user-avatar.png`
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

userSchema.index({username: 'text'})

module.exports = mongoose.model('User', userSchema);
