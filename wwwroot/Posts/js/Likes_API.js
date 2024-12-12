class Likes_API {
    static API_URL() { return "http://localhost:5000/likes" };
    static initHttpState() {
        this.currentHttpError = "";
        this.currentStatus = 0;
        this.error = false;
    }
    static retrieveAccessToken(){
        return sessionStorage.getItem('access_Token');
    }
    static setHttpErrorState(xhr) {
        if (xhr.responseJSON)
            this.currentHttpError = xhr.responseJSON.error_description;
        else
            this.currentHttpError = xhr.statusText == 'error' ? "Service introuvable" : xhr.statusText;
        this.currentStatus = xhr.status;
        this.error = true;
    }
    static async Get(id = null) {
        Likes_API.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: "http://localhost:5000/api/likes" + (id != null ? "?PostId=" + id : ""),
                type: "GET" ,
                contentType: 'application/json',
                
                complete: data => { resolve({ ETag: data.getResponseHeader('ETag'), data: data.responseJSON }); },
                error: (xhr) => { Likes_API.setHttpErrorState(xhr); resolve(null); }
            });
        });
    }
    static async Save(data, create = true) {
        
        console.log(data.Id);
        Likes_API.initHttpState();
        return new Promise(resolve => {
            $.ajax({
                url: create ? `http://localhost:5000/api/likes` : `http://localhost:5000/api/likes` + "/" + data.Id,
                type: create ? "POST" : "PUT",
                contentType: 'application/json',
                headers:{'Authorization': 'Bearer ' + this.retrieveAccessToken()},
                data: JSON.stringify(data),
                success: (data) => { resolve(data); },
                error: (xhr) => { Likes_API.setHttpErrorState(xhr); resolve(null); }
            });
        });
    }
    static async Delete(id) {
        return new Promise(resolve => {
            $.ajax({
                url: this.API_URL() + "/" + id,
                type: "DELETE",
                complete: () => {
                    Likes_API.initHttpState();
                    resolve(true);
                },
                error: (xhr) => {
                    Likes_API.setHttpErrorState(xhr); resolve(null);
                }
            });
        });
    }
    static async Register(like) {
       
        this.initHttpState();  
        return new Promise((resolve) => {
            $.ajax({
                url: "http://localhost:5000/likes/register",  
                type: "POST",  
                contentType: "application/json", 
                
                data: JSON.stringify(like),  
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
}