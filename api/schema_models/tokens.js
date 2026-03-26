
const mongoose = require('mongoose');

const tokensSchema = new mongoose.Schema({
    tok: {
        type: String,
        unique: true,
        required: true,
    }
});

module.exports = mongoose.model('Tokens', tokensSchema);
