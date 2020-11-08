const mongoose = require('mongoose');
const questionSchema = mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    variants:[{
        text:{
            type: String,
            required: true,
        },
        isCorrect:{
            type: Boolean,
            required: true,
            default: false
        }
     }]
},{
    timestamps: true
}
);
const Question = mongoose.model('Question',questionSchema);

module.exports = Question;