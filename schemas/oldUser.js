const mongoose = require('mongoose');

const listSchema = new mongoose.Schema({
    email:
    {
        type: String
    },
    title: 
    {
        type: String,
        required: true,
    },
    completed : 
    {
        type : Boolean,
        default: false,
        required: true
    },
    user:[{
        type: mongoose.Types.ObjectId,
        ref:"userSchema",
    }]
})


const listData = mongoose.model('listData', listSchema , 'listdatas');

module.exports = listData;