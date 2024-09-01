const express = require('express');
const app = express();
const cors = require("cors");

app.use(cors());

// Handing and processing JSON body coming from requests
app.use(express.json());
// Handling and processing URL encoded payloads
app.use(express.urlencoded({ extended: true }));

let todos = [];
const validRequests = ["add","clear","reorder"];


// Task class to create tasks
class Task{
    constructor(name,index){
        this._id = index;
        this.name = name;
        this.isDone = false;
        this.isActive = true;
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

// This route will return list of todos
app.get('/tasks',(req,res)=>{
    res.json(todos);
});

// This route lets user to add task in tasks list and clear all the tasks
app.post('/tasks',(req,res)=>{
    const body = req.body;
    const request = body.request;
    const taskName = body.name;
    const startIndex = body.from;
    const endIndex = body.to;

    // Validate incoming request
    if(!request || request.trim() === ''){
        return res.status(400).json({error:'Request is not defined'});
    }
    if(!validRequests.includes(request)){
        return res.status(400).json({error:'This is not a valid request',allowed:["add","clear","reorder"]});
    }

    if(request=='add' && (!taskName || taskName.trim() === '' )){
        return res.status(400).json({error:'Task name is required to create a task'});
    }

    if(request=='reorder' && ( startIndex == null || endIndex ==null)){
        return res.status(400).json({error:'Reorder index not defined',expected:["from","to"]});
    }

    if(request=='reorder' && (startIndex>todos.length || !endIndex>todos.length)){
        return res.status(400).json({error:'Reorder index out of bounds'});
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
    res.send(todos);
});

// This route returns a task with given index in url
app.get('/task/:id',(req,res)=>{
    let {id} = req.params;
    id = parseInt(id);
    let filterTask = todos.filter((element)=>{return element._id===id});
    if(filterTask.length==0){
        return res.status(404).json({error:"Task not found"});
    }
    let task = filterTask[0];
    res.json(task);
});

app.post('/task/:id',(req,res)=>{
    let {id} = req.params;
    const body = req.body;
    const request = body.request;
    const name = body.name;
    const isDone = body.isDone;
    const isActive = body.isActive;

    id = parseInt(id);
    let filterTask = todos.filter((element)=>{return element._id===id});

    if(filterTask.length==0){
        return res.status(404).json({error:"Task not found"});
    }

    console.log(request,name);

    if(request==="rename"&& (name === "" || name == undefined)){
        return res.status(404).json({error:"Task name is required"});
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
    res.json(task);
});
app.listen(3000);