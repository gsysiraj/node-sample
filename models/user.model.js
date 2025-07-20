const mongoose = require("mongoose")

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        default: null
    },
    email: {
        type: String,
        default: null,
    },
    password: {
        type: String,
        default: null
    }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User;