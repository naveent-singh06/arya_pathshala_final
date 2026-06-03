import mongoose  from "mongoose";

const userschema  = new mongoose.Schema({
    userName  : String , 
    email : String  , 
    password : String
})

export const userModel = mongoose.model("user" , userschema) ; 
