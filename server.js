const express = require("express");
const jwt = require("jsonwebtoken");
const mongoose = require("mongoose");
const dotenv = require("dotenv");
const {z} = require("zod");
const bcrypt = require("bcrypt");
const cors = require("cors");
const {authenticate,JWT_SECRET} = require("./auth");
const {UserModel,TodoModel} = require("./db");

const emailSchema = z.string().email("Invalid email address");
const passwordSchema = z.string()
    .min(8,{message:"Password must be at least 8 characters long."})
    .max(30,{message:"Password must not exceed 30 characters"})
    .regex(/[a-z]/,{message:"Password must contain at least one small letter."})
    .regex(/[A-Z]/,{message:"Password must contain at least one capital letter."})
    .regex(/[0-9]/,{message:"Password must contain at least one number"})
    .regex(/[@!$%&*?#_]/,{message:"Password must contain at least one special character"});
const nameSchema = z.string()
    .min(4,{message:"Please provide your name"})
    .max(50,{message:"Name should not have more than 50 characters"});
const titleSchema = z.string()
    .min(1,{message:"Title cannot be blank"});
const isBoolean = z.boolean();
const validRequest = ["add","clear"];


dotenv.config();
const DB_URI = `mongodb+srv://${process.env.DB_USERNAME}:${process.env.DB_PASSWORD}@cluster0.tiio2.mongodb.net/todo-app`;    
mongoose.connect(DB_URI);
const app = express();
app.use(express.json());
app.use(cors());

async function hashPassword(password){
    try{
        const salt = await bcrypt.genSalt(5);
        const hashPassword = await bcrypt.hash(password,salt);

        return hashPassword;
    } catch(error){
        console.error("Erorr hashing the password",error);
        throw error;
    }
}

app.use(express.static("public"));

app.get("/login",(req,res)=>{
    res.sendFile(__dirname+"/public/login.html");
});

app.get("/register",(req,res)=>{
    res.sendFile(__dirname+"/public/register.html");
});

app.get("/home",(req,res)=>{
    res.sendFile(__dirname+"/public/index.html");
});

// Signup endpoint
app.post("/signup",async (req,res)=>{
    const email = req.body.email;
    const password = req.body.password;
    const name = req.body.name;

    // Verify if email is valid
    try{
        emailSchema.parse(email);
    } catch(error){
        const errorMsg = error.issues[0].message;
        return res.status(403).json({message:errorMsg});
    }

    // Verify if password passes all the checks
    try{
        passwordSchema.parse(password);
    } catch(error){
        const errorMsg = error.issues[0].message;
        return res.status(403).json({message:errorMsg});
    }

    // Verify that a valid name is provided
    try{
        nameSchema.parse(name);
    } catch(error){
        const errorMsg = error.issues[0].message;
        return res.status(403).json({message:errorMsg});
    }

    // Check if the email already exists
    const foundUser = await UserModel.findOne({
        email:email
    });

    if(foundUser){
        // Return error if the account already exists
        return res.status(403).json({message:"Email is already registered!"})
    } else {
        const hashedPassword = await hashPassword(password);
        // Create an account
        await UserModel.create({
            email:email,
            password:hashedPassword,
            name:name
        });
        return res.json({message:"You are signed up"});
    }
});

app.post("/signin",async (req,res)=>{
    const email = req.body.email;
    const password = req.body.password;

    // Check if the user is present and return an error if the account is not present
    const foundUser = await UserModel.findOne({
        email:email
    });
    if(!foundUser){
        return res.status(403).json({message:"Account not found! Please register."});
    }

    // Check if the provide password is correct and return error if the password doesn't match
    const correctPassword = await bcrypt.compare(password,foundUser.password);
    if(!correctPassword){
        return res.status(403).json({message:"Incorrect Password!"});
    }

    const token = jwt.sign({email:foundUser.email},JWT_SECRET);
    return res.json({message:"Login sucessful!",token:token});
});

app.post("/tasks",authenticate,async (req,res)=>{
    const email = req.email;
    const user = await UserModel.findOne({
        email:email
    });
    const userId = user._id;

    const request = req.body.request;
    const title = req.body.title;

    if(request==="clear"){
        await TodoModel.deleteMany({
            userId : userId
        });

        return res.json({message:"Tasks cleared!"});
    }

    try{
        titleSchema.parse(title);
    } catch(error){
        const errorMsg = error.issues[0].message;
        return res.status(403).json({message:errorMsg});
    }

    if(!validRequest.includes(request)){
        return res.json({message:"Request is not valid, can only have : ['add','clear']"})
    }

    if(request==="add"){
        await TodoModel.create({
            userId : userId,
            title: title,
            isDone: false,
            isActive: true
        })
        return res.json({message:"Task added"});
    }

    
    
})

app.get("/tasks",authenticate,async(req,res)=>{
    const email = req.email;
    const user = await UserModel.findOne({
        email:email
    });

    let userId = null;
    try{
        userId = user._id;
    } catch(error){
        return res.status(403).json({message:"Account doesn't exist"})
    }

    const tasks = await TodoModel.find({
        userId: userId
    });

    res.json({tasks:tasks});

});

app.get("/task/:id",authenticate,async (req,res)=>{
    const email = req.email;
    const user = await UserModel.findOne({
        email:email
    });

    if(!user){
        return res.status(403).json({message:"You are not authenticated!"});
    }

    let {id} = req.params;
    const task = await TodoModel.findOne({
        _id:id
    });

    if(!task){
        return res.status(403).json({message:"Task doesn't exist!"});
    }

    if(user._id.toString()===task.userId.toString()){
        return res.json({task});
    } else {
        res.status(403).json({message:"You are authorized to access the task"});
    }    
});

app.post("/task/:id",authenticate,async (req,res)=>{
    const title = req.body.title;
    const isDone = req.body.isDone;
    const isActive = req.body.isActive;
    const email = req.email;

    try{
        titleSchema.parse(title);
    } catch(error){
        const errorMsg = error.issues[0].message;
        return res.status(403).json({message:errorMsg});
    }

    try{
        isBoolean.parse(isDone);
    } catch(error){
        const errorMsg = error.issues[0].message;
        return res.status(403).json({message:errorMsg});
    }

    try{
        isBoolean.parse(isActive);
    } catch(error){
        const errorMsg = error.issues[0].message;
        return res.status(403).json({message:errorMsg});
    }

    const user = await UserModel.findOne({
        email:email
    });

    if(!user){
        return res.status(403).json({message:"You are not authenticated!"});
    };

    let {id} = req.params;
    const task = await TodoModel.findOne({
        _id:id
    });

    if(!task){
        return res.status(403).json({message:"Task doesn't exist!"});
    };

    if(!user._id.toString()===task.userId.toString()){
        return res.status(403).json({message:"You are authorized to access the task"});
    };
    
    await TodoModel.updateOne(
        {_id:id},
        {title:title,isDone:isDone,isActive:isActive});
    
    const updatedTask = await TodoModel.findOne({
        _id:id
    });

    return res.json(updatedTask);
});

/*
const Todo = new Schema({
    userId : ObjectId,
    title : String,
    isDone : Boolean,
    isActive : Boolean
});
*/

app.listen(3000);