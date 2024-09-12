const API_URL = "http://localhost:3000";

function signup(){
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;
    asyncSignup(username,password)
}

async function asyncSignup(username,password){
    document.querySelector(".error-message").innerText = "";
    let response = null;
    try{
        response = await axios.post(API_URL+"/signup",
            {
                username:username,
                password:password
            }
        );
        asyncSignin(username,password);

    } catch(error){
        console.log(error);
        document.querySelector(".error-message").innerText = error.response.data.message;
    }
}

function signin(){
    let username = document.getElementById("username").value;
    let password = document.getElementById("password").value;
    asyncSignin(username,password)
}

async function asyncSignin(username,password){
    document.querySelector(".error-message").innerText = "";
    let response = null;
    try{
        response = await axios.post(API_URL+"/signin",
            {
                username:username,
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

    document.getElementById("password").addEventListener("keydown",function(event){
        if(event.key === 'Enter'){
            signin();
        }
    })
}

initializePage();