
let todos = [];
let dragSource = null;
const API_URL = "http://localhost:3000";



class ToDo {
    constructor(name) {
        this.name = name;
        this.isDone = false;
    }
}


let input = document.getElementById("new-todo-input");
input.addEventListener("keyup",(event)=>{
    if(event.key === 'Enter'){
        addToDo();
    }
});

async function initialAsyncRender(){
    const token = localStorage.getItem("token");
    if(token==null || token == undefined){
        let redirect = API_URL+"/login";
        window.location.href = redirect;
        return;
    }
    const response = await axios.get(API_URL+"/tasks",{
        headers:{
            token:token
        }
    });
    todos= response.data.tasks;
    render();
}


async function addAsyncToDo(taskName){
    const token = localStorage.getItem("token");
    await axios.post(API_URL+"/tasks",
        {
            request:"add",
            title:taskName
        },
        {
            headers:{
                token:token
            }
        }
    );
    const response = await axios.get(API_URL+"/tasks",{
        headers:{
            token:token
        }
    });

    todos= response.data.tasks;
    render();
};



// This function will add new to do
function addToDo(){
    const item = document.getElementById("new-todo-input");
    if(item.value != ""){
        addAsyncToDo(item.value);
        item.value = "";
    }
}

async function asyncMarkAsDone(id,todo){
    const token = localStorage.getItem("token");
    let body = {
        title: todo.title,
        isDone: !todo.isDone,
        isActive : todo.isActive
    }
    await axios.post(API_URL+'/task/'+id,{
        title:todo.title,
        isActive:todo.isActive,
        isDone : !todo.isDone
    },
    {
        headers:{
            token:token
        }
    })
    const response = await axios.get(API_URL+'/tasks',{
        headers:{
            token:token
        }
    });
    todos = response.data.tasks;
    render();
}

function markAsDone(id){
    let todo = todos.filter((element)=>{return element._id == id})[0];
    asyncMarkAsDone(id,todo);
}

async function asyncDeleteToDo(todo){
    const token = localStorage.getItem("token");
    await axios.post(API_URL+'/task/'+todo._id,{
        title:todo.title,
        isDone:todo.isDone,
        isActive : false
    },
    {
        headers:{
            token:token
        }
    })
    const response = await axios.get(API_URL+'/tasks',{
        headers:{
            token:token
        }
    });
    todos = response.data.tasks;
    render();
}

function deleteToDo(id){
    let todo = todos.filter((element)=>{return element._id == id})[0];
    asyncDeleteToDo(todo);
}

async function asyncEditToDo(todo,newName){
    const token = localStorage.getItem("token");
    await axios.post(API_URL+'/task/'+todo._id,{
        title:newName,
        isActive:todo.isActive,
        isDone:todo.isDone
    },
    {
        headers:{
            token:token
        }
    })
    const response = await axios.get(API_URL+'/tasks',{
        headers:{
            token:token
        }
    });
    todos = response.data.tasks;
    render();
}


function editToDo(id){
    render();
    let target = document.getElementById(id).querySelector('.todo-name');
    let targetEditBtn = document.getElementById(id).querySelector('.edit-button');
    targetEditBtn.setAttribute("onClick","");
    targetEditBtn.innerHTML = "";
    let targetVal = target.innerText;

    let targetInput = document.createElement("input");
    targetInput.value = targetVal;
    targetInput.setAttribute("class","todo-name");

    targetInput.addEventListener("keydown",function(event){
        if(event.key === 'Enter'){
            let editedValue = targetInput.value;
            let todo = todos.filter((element)=>{return element._id == id})[0];
            asyncEditToDo(todo,editedValue);
            console.log("Rendering");
            render();
        }
    })

    target.replaceWith(targetInput);
    targetInput.focus();
}

async function asyncClearAll(){
    const token = localStorage.getItem("token");
    await axios.post(API_URL+'/tasks',{
        request:"clear"
    },
    {
        headers:{
            token:token
        }
    });
    todos = [];
    render();
}

function clearAll(){
    asyncClearAll();
}

function logOut(){
    localStorage.removeItem("token");
    let redirect = API_URL+"/login";
    window.location.href = redirect;
}

function render(){
    let todosEl = document.querySelector(".todos");
    todosEl.innerHTML = "";
    let index = 0;
    todos.forEach((todo)=>{
        todos.innerHTML = "";
        if(todo.isActive){
            let todoContainer = document.createElement("div");
            todoContainer.setAttribute("class",`todo-container`);
            todoContainer.setAttribute("id",todo._id);

            let checkbox = document.createElement("input");
            checkbox.setAttribute("type","checkbox");
            checkbox.setAttribute("onClick",`markAsDone("${todo._id}")`);
            let todoName = document.createElement("div");
            todoName.setAttribute("class","todo-name");
            todoName.innerText = todo.title;
            if(todo.isDone){
                todoName.setAttribute("class","completed");
                checkbox.setAttribute("checked","check");
            }

            let editBtn = document.createElement("button");
            editBtn.setAttribute("class",`edit-button`);

            if(!todo.isDone){
                editBtn.setAttribute("onClick",`editToDo("${todo._id}")`);
                editBtn.innerHTML=`<svg height="15" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M12.3 3.7l4 4L4 20H0v-4L12.3 3.7zm1.4-1.4L16 0l4 4-2.3 2.3-4-4z"/></svg>`;
            }
            
            let deleteBtn = document.createElement("button");
            deleteBtn.setAttribute("class",`delete-button`);
            deleteBtn.setAttribute("onClick",`deleteToDo("${todo._id}")`);
            deleteBtn.innerHTML = `<svg height="20" style="enable-background:new 0 0 24 24;" version="1.1" viewBox="0 0 24 24" xml:space="preserve" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink"><g id="info"/><g id="icons"><path d="M14.8,12l3.6-3.6c0.8-0.8,0.8-2,0-2.8c-0.8-0.8-2-0.8-2.8,0L12,9.2L8.4,5.6c-0.8-0.8-2-0.8-2.8,0   c-0.8,0.8-0.8,2,0,2.8L9.2,12l-3.6,3.6c-0.8,0.8-0.8,2,0,2.8C6,18.8,6.5,19,7,19s1-0.2,1.4-0.6l3.6-3.6l3.6,3.6   C16,18.8,16.5,19,17,19s1-0.2,1.4-0.6c0.8-0.8,0.8-2,0-2.8L14.8,12z" id="exit"/></g></svg>`;

            todoContainer.appendChild(checkbox);
            todoContainer.appendChild(todoName);
            todoContainer.appendChild(editBtn);
            todoContainer.appendChild(deleteBtn);
            todosEl.appendChild(todoContainer);
            index++;
        }
    });
}

initialAsyncRender();