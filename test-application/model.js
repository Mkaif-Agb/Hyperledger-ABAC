const mongoose = require('mongoose');



const userSchema = new mongoose.Schema({
    userName: {type:String,required:true, unique:true},
    email: {type:String, required:true, unique:true},
    password:{type:String},
    org:{type:String},
    date: {type:Date, default:Date.now()},
    isAdmin:  {type:String, default:false},
    approved: {type:String, default:true} 
});



const model = mongoose.model('user', userSchema);
module.exports = model
