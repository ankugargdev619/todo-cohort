const API_URL = "http://localhost:3000";

function signup(){
    let name = document.getElementById("name").value;
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;
    asyncSignup(name,email,password)
}

function openRegister(){
    let redirect = API_URL+"/register";
        window.location.href = redirect;
}

function openLogin(){
    let redirect = API_URL+"/login";
        window.location.href = redirect;
}

async function asyncSignup(name,email,password){
    document.querySelector(".error-message").innerText = "";
    let response = null;
    try{
        response = await axios.post(API_URL+"/signup",
            {
                name:name,
                email:email,
                password:password
            }
        );
        asyncSignin(email,password);

    } catch(error){
        console.log(error);
        document.querySelector(".error-message").innerText = error.response.data.message;
    }
}

function signin(){
    let email = document.getElementById("email").value;
    let password = document.getElementById("password").value;
    asyncSignin(email,password)
}

async function asyncSignin(email,password){
    document.querySelector(".error-message").innerText = "";
    let response = null;
    try{
        response = await axios.post(API_URL+"/signin",
            {
                email:email,
                password:password
            }
        );
        localStorage.setItem("token",response.data.token);
        
        
        let redirect = API_URL+"/home";
        window.location.href = redirect;
    } catch(error){
        document.querySelector(".error-message").innerText = error.response.data.message;
    }


}

function initializePage(){
    let token = localStorage.getItem("token");
    if(token){
        let redirect = API_URL+"/home";
        window.location.href = redirect;
        return;
    }

    let page = document.getElementById("password").getAttribute("data-page");

    document.getElementById("password").addEventListener("keydown",function(event){
        if(event.key === 'Enter'){
            console.log(page);
            if(page=="login"){
                signin();
            } else if(page=="register"){
                signup();
            }
        }
    })
}

initializePage();