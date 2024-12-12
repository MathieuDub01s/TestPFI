import UserNameModel from '../models/userName.js';
import Repository from '../models/repository.js';
import Controller from './Controller.js';

export default class UsersNamesController extends Controller {
    constructor(HttpContext) {
        super(HttpContext, new Repository(new UserNameModel()));
    }
    
    register(userName) {
       console.log(userName);
        if (this.repository != null) {
          
            let newName = this.repository.add(userName);
            if (this.repository.model.state.isValid) {
                this.HttpContext.response.created(userName);
              
            } else {
                if (this.repository.model.state.inConflict)
                    this.HttpContext.response.conflict(this.repository.model.state.errors);
                else
                    this.HttpContext.response.badRequest(this.repository.model.state.errors);
            }
        } else
            this.HttpContext.response.notImplemented();
    }
}