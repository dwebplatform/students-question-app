const mongoose = require('mongoose');
const adminSchema = mongoose.Schema({
    email:{
        type: String,
        required: true
    },
    password:{
        type:String,
        required: true
    },
    cookiestring:{
        type: String,

    }
},{
    timestamps: true
});
 

const Admin = mongoose.model('Admin',adminSchema);

module.exports = Admin;