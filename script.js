
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
    const response = await axios.get(API_URL+"/tasks");
    todos= response.data;
    render();
}


async function addAsyncToDo(taskName){
    const response = await axios.post(API_URL+"/tasks",
        {
            request:"add",
            name:taskName
        }
    );
    todos= response.data;
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

async function asyncMarkAsDone(id,flag){
    await axios.post(API_URL+'/task/'+id,{
        isDone : flag
    })
    const response = await axios.get(API_URL+'/tasks');
    todos = response.data;
    render();
}

function markAsDone(count){
    let stateToSet = !todos[count].isDone;
    asyncMarkAsDone(count,stateToSet);
}

async function asyncDeleteToDo(id){
    await axios.post(API_URL+'/task/'+id,{
        isActive : false
    })
    const response = await axios.get(API_URL+'/tasks');
    todos = response.data;
    render();
}

function deleteToDo(count){
    asyncDeleteToDo(count);
}

async function asyncEditToDo(id,newName){
    await axios.post(API_URL+'/task/'+id,{
        request:"rename",
        name : newName
    })
    const response = await axios.get(API_URL+'/tasks');
    todos = response.data;
    render();
}


function editToDo(count){
    render();
    let target = document.getElementById(count).querySelector('.todo-name');
    let targetEditBtn = document.getElementById(count).querySelector('.edit-button');
    targetEditBtn.setAttribute("onClick","");
    targetEditBtn.innerHTML = "";
    let targetVal = target.innerText;

    let targetInput = document.createElement("input");
    targetInput.value = targetVal;
    targetInput.setAttribute("class","todo-name");

    targetInput.addEventListener("keydown",function(event){
        if(event.key === 'Enter'){
            let editedValue = targetInput.value;
            asyncEditToDo(count,editedValue);
        }
    })

    target.replaceWith(targetInput);
    targetInput.focus();
}


function handleDragStart(e){
    this.style.opacity = '0.4';
    dragSource = this;
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain',this.getAttribute('data-index'));
}

function handleDragEnd(e){
    this.style.opacity = '1';
}

function handleDragEnter(e) {
    this.classList.add('over');
}

function handleDragLeave(e){
    this.classList.remove('over');
}

function handleDragOver(e){
    e.preventDefault();
    return false;
}

async function asyncReorder(start,end){
    const response = await axios.post(API_URL+"/tasks",{
        request:"reorder",
        from:start,
        to:end
    })
    todos = response.data;
    render();
}

function handleDrop(e){
    e.stopPropagation();
    if(dragSource!== this){
        let start = parseInt(dragSource.getAttribute('data-index'));
        let end = parseInt(this.getAttribute('data-index'));
        asyncReorder(start,end);
       
    }
    return false;
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
        todoContainer.setAttribute("data-index",todo._id);
        todoContainer.setAttribute("draggable",index);
        todoContainer.addEventListener('dragstart',handleDragStart);
        todoContainer.addEventListener('dragend',handleDragEnd);
        todoContainer.addEventListener('dragover',handleDragOver);
        todoContainer.addEventListener('dragenter',handleDragEnter);
        todoContainer.addEventListener('dragleave',handleDragLeave);
        todoContainer.addEventListener('drop',handleDrop);

        let checkbox = document.createElement("input");
        checkbox.setAttribute("type","checkbox");
        checkbox.setAttribute("onClick",`markAsDone(${todo._id})`);
        let todoName = document.createElement("div");
        todoName.setAttribute("class","todo-name");
        todoName.innerText = todo.name;
        if(todo.isDone){
            todoName.setAttribute("class","completed");
            checkbox.setAttribute("checked","check");
        }

        let editBtn = document.createElement("button");
        editBtn.setAttribute("class",`edit-button`);

        if(!todo.isDone){
            editBtn.setAttribute("onClick",`editToDo(${todo._id})`);
            editBtn.innerHTML=`<svg height="15" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg"><path d="M12.3 3.7l4 4L4 20H0v-4L12.3 3.7zm1.4-1.4L16 0l4 4-2.3 2.3-4-4z"/></svg>`;
        }
        
        let deleteBtn = document.createElement("button");
        deleteBtn.setAttribute("class",`delete-button`);
        deleteBtn.setAttribute("onClick",`deleteToDo(${todo._id})`);
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
