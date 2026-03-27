const mongoose = require('mongoose');

const tokensSchema = new mongoose.Schema({
    tok: {
        type: String,
        unique: true,
        required: true,
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User', 
        required: true
    },
    expiresAfter: {
        type: Date,
        required: true,
    }
});

module.exports = mongoose.model('Tokens', tokensSchema);
