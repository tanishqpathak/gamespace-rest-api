const mongoose = require('mongoose');

const gameSchema = mongoose.Schema({
    game:{
        type: String,
        required: true
    },
    author:{
        type: String,
        required: true
    },
    price:{
        type: Number,
        required: true
    },
    desc:{
        type: String,
        required: true
    }
})

let Game = module.exports = mongoose.model('Game', gameSchema)