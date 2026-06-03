import express from "express" ; 
import mongoose from "mongoose";
import jwt from "jsonwebtoken"   
import { userModel } from "./db";
import cors from "cors";
const JWT_SECRET  = "BISON" ; 

const app  = express() ;
app.use(express.json()) ; 
app.use(cors());


app.get("/check" , (req , res)=>{
    res.send("working properly ") ; 
})

app.post("/signup" , async (req, res)=>{
    const userName  = req.body.userName ; 
    const password = req.body.password ; 
    const email  =   req.body.email  ;
    
    const existingUser = await  userModel.findOne({email : email }) ; 
    if(existingUser){
        res.status(401).json({
            message : "User Already  Exists " 
        })
        return  ; 
    }
    userModel.create({
        userName  , 
        password , 
        email 
    })

    res.status(200).json({
        message : "User Registered Susscefully "
    })

})

app.post("/signin" ,  async (req , res)=>{
    const {email  , password } = req.body ; 
    const user = await userModel.findOne({email}) ; 

    if (!user){
        res.status(401).json({
            message : "User Does Not exists Create New Account "
        })
    }
    if (user?.password == password){
        const token    = jwt.sign( {userId : user?._id} ,  JWT_SECRET  ) ; 
        res.status(200).json({
            message  : "logged in sucessfulle " , 
            token  
        })
        return  ; 
    }
    else {
        res.status(401).json({
            message : "INCORRECT PASSWORD "
        })
    }
})

const main = ()=>{
    app.listen(3001 , async ()=>{
        console.log("listing to port 3001") ; 
        await mongoose.connect("mongodb+srv://satyamsinghu123123:SatyamSingh1@cluster0.z5w55.mongodb.net/techno") ;
        console.log("connected to mongoo db") ; 
         
    })
}

main() ; 