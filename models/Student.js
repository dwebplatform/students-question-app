const mongoose = require('mongoose');
const studentSchema = mongoose.Schema({
    name: {
        type: String,
        required: true
    },
    secondname:{
        type: String,
        required: true
    },
    group:{
        type: Number,
        required: true
    },
    password:{
        type:String,
        required: true
    },
    hasParticipated:{
        type: Boolean,
        required: true,
        default: false,
    },
    answers:[
        {
        id:{type:String, required: true},
        answerIndex:{type: String,required: true},
        correctIndex:{type: String, required:true}
    }]
     
},{
    timestamps: true
}
);
 

const Student = mongoose.model('Student',studentSchema);

module.exports = Student;