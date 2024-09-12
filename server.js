const express = require('express');
const app = express();
const cors = require("cors");
const fs = require('fs').promises;
const path = require('path');
const hostname = "http://localhost:3000";
const jwt = require('jsonwebtoken');
const FILE_PATH = {
    todos : "todos.json",
    users : "users.json"
};
const JWT_SECRET = "MY_SECRET_TOKEN";

// Password tests
const minLengthEx = /.{8,}/; // Atleast 8 characters are there
const specialCharEx = /[$&@#%!]/; // Special characters
const numberEx = /\d/; // Contains a number
const uppercaseEx = /[A-Z]/; // Uppercase letters
const lowercaseEx = /[a-z]/; //Lower case letters


let todos = [];
let users = [];
const validRequests = ["add","clear","reorder"];


// Task class to create tasks
class Task{
    constructor(name,index,ownerId){
        this._id = index;
        this.owner = ownerId;
        this.name = name;
        this.isDone = false;
        this.isActive = true;
    }
}

class User {
    constructor(username,password,index){
        this._id = index;
        this.username = username;
        this.password = password;
        this.tasks = [];
    }
}

// Re-shuffle the order of tasks
function reOrder(startIndex,endIndex){
    console.log("redordering");
    let newTodos = [];
    let arrStart = 0;
    let arrEnd = todos.length;
    let shiftType = "";
    if(startIndex<endIndex){
        arrStart = startIndex;
        arrEnd = endIndex;
        shiftType = "left";
    } else {
        arrStart = endIndex;
        arrEnd = startIndex;
        shiftType = "right";
    }

    let startSeg = null;
    let middleSeg = null
    let endSeg = null;
    
    startSeg = todos.slice(0,arrStart);
    middleSeg = todos.slice(arrStart,arrEnd+1);
    endSeg = todos.slice(arrEnd+1,todos.length);

    if(shiftType === "left"){
        let first = middleSeg.shift();
        middleSeg.push(first);
    } else {
        let last = middleSeg.pop();
        middleSeg.unshift(last);
    }
    newTodos.concat(startSeg,middleSeg,endSeg);
    todos = startSeg.concat(middleSeg,endSeg);
    console.log(startSeg,middleSeg,endSeg);
}

const readFileMiddleware = async (req,res,next)=>{
    try {
        const rawUsers = await fs.readFile("users.json", 'utf8'); // Wait for the file to be read
        users = JSON.parse(rawUsers);
        let path = req.route.path;
        if(path != "/signin" && path != "/signup"){
            let userData = users.filter((user)=>user.username === req.user)[0];
            console.log(userData);
            todos = userData.tasks;
        }
    } catch (error) {
        console.error('Error reading or parsing file:', error);
    }
    
    next();
}

function writeData(data,filePath){
    fs.writeFile(filePath,JSON.stringify(data),"utf-8",(err)=>{
        if(err){
            console.error(err);
            return;
        }
    })
}

function validateAuth(req,res,next){
    console.log("Checking authentication");
    const token = req.headers.token;
    console.log(token);
    jwt.verify(token,JWT_SECRET,(err,user)=>{
        if(err) {
            console.log(err);
            res.sendFile(__dirname+"/public/auth.html");
        }

        req.user = user;
        console.log(user);
    });
    next();
}


app.use(cors());
app.use(express.json());

app.use(express.static("public"));

app.get("/auth",(req,res)=>{
    res.sendFile(__dirname+"/public/auth.html");
});

app.get("/home",(req,res)=>{
    res.sendFile(__dirname+"/public/index.html");
})


// This route will return list of todos
app.get('/tasks',validateAuth,readFileMiddleware,(req,res)=>{
    res.json(todos);
});

// This route lets user to add task in tasks list and clear all the tasks
app.post('/tasks',validateAuth,readFileMiddleware,(req,res)=>{
    const body = req.body;
    const request = body.request;
    const taskName = body.name;
    const startIndex = body.from;
    const endIndex = body.to;

    // Validate incoming request
    if(!request || request.trim() === ''){
        return res.status(400).json({message:'Request is not defined'});
    }
    if(!validRequests.includes(request)){
        return res.status(400).json({message:'This is not a valid request',allowed:["add","clear","reorder"]});
    }

    if(request=='add' && (!taskName || taskName.trim() === '' )){
        return res.status(400).json({message:'Task name is required to create a task'});
    }

    if(request=='reorder' && ( startIndex == null || endIndex ==null)){
        return res.status(400).json({message:'Reorder index not defined',expected:["from","to"]});
    }

    if(request=='reorder' && (startIndex>todos.length || !endIndex>todos.length)){
        return res.status(400).json({message:'Reorder index out of bounds'});
    }

    switch(request){
        case "add":
            let task = new Task(taskName,todos.length);
            todos.push(task);
        break;
        case "clear":
            todos = [];
        break;
        case "reorder":
            reOrder(startIndex,endIndex);
        break;
    }

    users.map((user)=>{if(user.username==req.user){user.tasks=todos}});

    writeData(users,FILE_PATH.users);
    res.send(todos);
});

// This route returns a task with given index in url
app.get('/task/:id',validateAuth,readFileMiddleware,(req,res)=>{
    let {id} = req.params;
    id = parseInt(id);
    let filterTask = todos.filter((element)=>{return element._id===id});
    if(filterTask.length==0){
        return res.status(404).json({message:"Task not found"});
    }
    let task = filterTask[0];
    res.json(task);
});

app.post('/task/:id',validateAuth,readFileMiddleware,(req,res)=>{
    let {id} = req.params;
    const body = req.body;
    const request = body.request;
    const name = body.name;
    const isDone = body.isDone;
    const isActive = body.isActive;

    id = parseInt(id);
    let filterTask = todos.filter((element)=>{return element._id===id});

    if(filterTask.length==0){
        return res.status(404).json({message:"Task not found"});
    }

    console.log(request,name);

    if(request==="rename"&& (name === "" || name == undefined)){
        return res.status(404).json({message:"Task name is required"});
    }

    
    todos.map((element)=>{
        if(element._id===id){
            if(!(isDone==null)){
                element.isDone = isDone;
            }
            if(!(isActive==null)){
                element.isActive = isActive;
            }
            if(request==="rename"){
                element.name = name;
            }
        }
    });
    
    let task = todos.filter((element)=>{return element._id===id})[0];
    users.map((user)=>{if(user.username==req.user){user.tasks=todos}});

    writeData(users,FILE_PATH.users);
    res.json(task);
});

app.post("/signup",readFileMiddleware,(req,res)=>{
    const username = req.body.username;
    const password = req.body.password;

    const isRegistered = users.find((user)=> user.username === username);
    if(isRegistered){
        return res.status(403).json({message:"Username is already registered!"});
    }

    if(!minLengthEx.test(password) ){
        return res.status(400).json({message:"Password must be of min 8 characters"});
    }

    if(!specialCharEx.test(password)){
        return res.status(400).json({message:"Password must have special character [$&@#%!]"});
    }

    if(!numberEx.test(password)){
        return res.status(400).json({message:"Password must contain a number"});
    }

    if(!uppercaseEx.test(password)){
        return res.status(400).json({message:"Password must have atleast one uppercase letter"});
    }

    if(!lowercaseEx.test(password)){
        return res.status(400).json({message:"Password must have atleast one lowercase letter"});
    }

    let user = new User(username,password,users.length);
    users.push(user);
    writeData(users,FILE_PATH.users);

    res.sendFile(__dirname+"/public/index.html");
});

app.post("/signin",readFileMiddleware,(req,res)=>{

    const username = req.body.username;
    const password = req.body.password;

    if(!username){
        return res.status(400).json({message:"Provide an username"});
    }

    if(!password){
        return res.status(400).json({message:"Provide a password"});
    }

    const userExists = users.find((user)=> user.username === username);
    const passwordCorrect = users.find((user)=>user.username === username && user.password === password);

    if(!userExists){
        return res.status(400).json({message:"You are not registered, please Sign Up first"});
    }

    if(!passwordCorrect){
        return res.status(400).json({message:"Your password is incorrect"});
    }

    const token = jwt.sign(username,JWT_SECRET);

    res.json({message:"Login Sucessful!",token:token});

});


app.listen(3000);