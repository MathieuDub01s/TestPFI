class Posts_API {
    static API_URL() { return "http://localhost:5000/api/posts" };
    static serverHost() { return "http://localhost:5000/api" };
   //static Host_URL() { return "http://localhost:5000"; }
   // static API_URL() { return this.Host_URL() + "/api/posts" };
    static initHttpState() {
        this.currentHttpError = "";
        this.currentStatus = 0;
        this.error = false;
    }
    static setHttpErrorState(xhr) {
        if (xhr.responseJSON)
            this.currentHttpError = xhr.responseJSON.error_description;
        else
            this.currentHttpError = xhr.statusText == 'error' ? "Service introuvable" : xhr.statusText;
        this.currentStatus = xhr.status;
        this.error = true;
    }
    static storeAccessToken(token){
        sessionStorage.setItem('access_Token', token);
    }
    static eraseAccessToken(){
        sessionStorage.removeItem('access_Token');
    }
    static retrieveAccessToken(){
        return sessionStorage.getItem('access_Token');
    }
    static storedLoggedUser(user){
        sessionStorage.setItem('user',JSON.stringify(user));
    }
    static retrieveLoggedUser(){
        let user = JSON.parse(sessionStorage.getItem('user'));
        return user;
    }
    static eraseLoggedUser(){
        sessionStorage.removeItem('user');
    }
    static calculateTime(initialTime, expirationTime){
        if(initialTime == expirationTime){
            timeout(5);
        }
    }

   
    static async Login(email, password){
        this.initHttpState();
        return new Promise((resolve)=>{
            $.ajax({
                url: "http://localhost:5000/token",
                type: "POST",
                contentType: "application/json",
                data: JSON.stringify({Email:email,Password:password}),
                success: async (response) =>{
                    if(!response.User.isBlocked){
                    this.storeAccessToken(response.Access_token);
                    this.storedLoggedUser(response.User);
                    initTimeout(5);
                    currentTimeouID = response.User.Id;
                    resolve(response);
                    let expirationTime = response.Expire_Time;
                    setInterval(()=>this.calculateTime(Math.floor(Date.now() / 1000),expirationTime),1000);
                    }else{
                        renderLogin("Votre compte est bloqué");
                        timeout(1);
                    }
                },
                error: (xhr) => {
                    this.setHttpErrorState(xhr);
                    resolve(null);
                }
            });
        });
    }
    static async Logout() {
        this.initHttpState();  
        return new Promise((resolve) => {
            $.ajax({
                url: `http://localhost:5000/accounts/logout?userId=${this.retrieveLoggedUser().Id}`,
                type: "GET",
                contentType: "application/json",
                success: (response) => {
                    this.eraseAccessToken();
                    this.eraseLoggedUser();
                    showPosts();
                    resolve(response); 
                },
                error: (xhr) => {
                    this.setHttpErrorState(xhr);
                    resolve(null); 
                }
            });
        });
    }
    static async verifyUser(verificationCode) {
        this.initHttpState();  
        return new Promise((resolve) => {
            $.ajax({
                url: `http://localhost:5000/accounts/verify?id=${this.retrieveLoggedUser().Id}&code=${verificationCode}`, 
                type: "GET", 
                contentType: "text/plain",
                success: (profil) => {
                    this.storedLoggedUser(profil);
                    showPosts();
                    $('#verifyUser').empty();
                },
                error: (xhr) => {
                    this.setHttpErrorState(xhr);  
                    resolve(null); 
                }
            });
        });
    }
    static modifyUserProfil(profil){
        this.initHttpState();
        return new Promise(resolve=>{
            $.ajax({
                url: "http://localhost:5000/accounts/modify",
                type:"PUT",
                contentType: 'application/json',
                headers: {'Authorization': 'Bearer ' + this.retrieveAccessToken()},
                data:JSON.stringify(profil),
                success:(profil)=>{
                    Posts_API.storedLoggedUser(profil);
                    resolve(profil);
                },
                error: xhr=>{Posts_API.setHttpErrorState(xhr); resolve(false);}
            });
        });
    }
    static async GetUser(id = null) {
        Posts_API.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: `http://localhost:5000/api/accounts` + (id != null ? "/" + id : ""),
                headers: {'Authorization': 'Bearer ' +this.retrieveAccessToken()},
                complete: data => { resolve({ ETag: data.getResponseHeader('ETag'), data: data.responseJSON }); },
                error: (xhr) => { Posts_API.setHttpErrorState(xhr); resolve(null); }
            });
        });
        
    }
    static async GetUserName(id = null) {
        Posts_API.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: `http://localhost:5000/api/usersNames` + (id != null ? "/" + id : ""),
               
                complete: data => { resolve({ ETag: data.getResponseHeader('ETag'), data: data.responseJSON }); },
                error: (xhr) => { Posts_API.setHttpErrorState(xhr); resolve(null); }
            });
        });
        
    }
    static async SaveUser(data, create = true) {
        Posts_API.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: create ? `http://localhost:5000/accounts` : `http://localhost:5000/accounts` + "/" + data.Id,
                type: create ? "POST" : "PUT",
                headers:{'Authorization': 'Bearer ' +this.retrieveAccessToken()},
                contentType: 'application/json',
                data: JSON.stringify(data),
                success: (data) => {  Posts_API.storedLoggedUser(profil);resolve(data); },
                error: (xhr) => { Posts_API.setHttpErrorState(xhr); resolve(null); }
            });
        });
    }
    static async GetUserName(id = null) {
        Posts_API.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: `http://localhost:5000/api/usersNames` + (id != null ? "/" + id : ""),
               
                complete: data => { resolve({ ETag: data.getResponseHeader('ETag'), data: data.responseJSON }); },
                error: (xhr) => { Posts_API.setHttpErrorState(xhr); resolve(null); }
            });
        });
        
    }
    static async PromoteUser(user) {
        return new Promise(resolve => {
            $.ajax({
                url: `http://localhost:5000/accounts/promote/` + user,
                type: "POST",
                contentType: "application/json", 
                headers:{'Authorization':  this.retrieveAccessToken()},
                data: JSON.stringify(user),
                complete: () => {
                    Posts_API.initHttpState();
                    resolve(true);
                },
                success: (user) => { resolve(user); },
                error: (xhr) => {
                    Posts_API.setHttpErrorState(xhr); resolve(null);
                }
            });
        });
    }
    static async BlockUser(user) {
        return new Promise(resolve => {
            $.ajax({
                url: `http://localhost:5000/accounts/block/`  + user,
                type: "POST",
                contentType: "application/json", 
                headers:{'Authorization':  this.retrieveAccessToken()},
                data: JSON.stringify(user),
                complete: () => {
                    Posts_API.initHttpState();
                    resolve(true);
                },
                success: (data) => { resolve(data); },
                error: (xhr) => {
                    Posts_API.setHttpErrorState(xhr); resolve(null);
                }
            });
        });
    }
    static async DeleteUser(id) {
        return new Promise(resolve => {
            $.ajax({
                url: `http://localhost:5000/accounts/remove/` + id,
                type: "GET",
                contentType: "application/json", 
                headers:{'Authorization':  this.retrieveAccessToken()},
                success: (data) => {
                    Posts_API.initHttpState();
                    resolve(data);
                },
                error: (xhr) => {
                    Posts_API.setHttpErrorState(xhr); 
                    resolve(null);
                }
            });
        });
    }
    static async Register(user) {
        this.initHttpState();  
        return new Promise((resolve) => {
            $.ajax({
                url: "http://localhost:5000/accounts/register",  
                type: "POST",  
                contentType: "application/json", 
                data: JSON.stringify(user),  
                success: (response) => {
                    showPosts();
                    resolve(response);  
                },
                error: (xhr) => {
                    this.setHttpErrorState(xhr); 
                    resolve(null);  
                }
            });
        });
    }
    static async RegisterUserName(user) {
        console.log(user);
        this.initHttpState();  
        return new Promise((resolve) => {
            $.ajax({
                url: "http://localhost:5000/userNames/register",  
                type: "POST",  
                contentType: "application/json", 
                
                data: JSON.stringify(user),  
                success: (response) => {
                    resolve(response);  
                },
                error: (xhr) => {
                    this.setHttpErrorState(xhr); 
                    resolve(null);  
                }
            });
        });
    }
    static async RegisterUserName(user) {
        this.initHttpState();  
        return new Promise((resolve) => {
            $.ajax({
                url: "http://localhost:5000/userNames/register",  
                type: "POST",  
                contentType: "application/json", 
                
                data: JSON.stringify(user),  
                success: (response) => {
                    resolve(response);  
                },
                error: (xhr) => {
                    this.setHttpErrorState(xhr); 
                    resolve(null);  
                }
            });
        });
    }
    static async HEAD() {
        Posts_API.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: this.API_URL(),
                type: 'HEAD',
                contentType: 'text/plain',
                complete: data => { resolve(data.getResponseHeader('ETag')); },
                error: (xhr) => { Posts_API.setHttpErrorState(xhr); resolve(null); }
            });
        });
    }
    static async Get(id = null) {
        Posts_API.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: this.API_URL() + (id != null ? "/" + id : ""),
                complete: data => { resolve({ ETag: data.getResponseHeader('ETag'), data: data.responseJSON }); },
                error: (xhr) => { Posts_API.setHttpErrorState(xhr); resolve(null); }
            });
        });
    }
    static async GetQuery(queryString = "") {
        Posts_API.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: this.API_URL() + queryString,
                complete: data => {
                    resolve({ ETag: data.getResponseHeader('ETag'), data: data.responseJSON });
                },
                error: (xhr) => {
                    Posts_API.setHttpErrorState(xhr); resolve(null);
                }
            });
        });
    }
    static async Save(data, create = true) {
        Posts_API.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: create ? this.API_URL() : this.API_URL() + "/" + data.Id,
                type: create ? "POST" : "PUT",
                contentType: 'application/json',
                data: JSON.stringify(data),
                success: (data) => { resolve(data); },
                error: (xhr) => { Posts_API.setHttpErrorState(xhr); resolve(null); }
            });
        });
    }
    
    static async Delete(id) {
        return new Promise(resolve => {
            $.ajax({
                url: this.API_URL() + "/" + id,
                type: "DELETE",
                complete: () => {
                    Posts_API.initHttpState();
                    resolve(true);
                },
                error: (xhr) => {
                    Posts_API.setHttpErrorState(xhr); resolve(null);
                }
            });
        });
    }
}