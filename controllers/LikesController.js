import LikeModel from '../models/like.js';
import Repository from '../models/repository.js';
import Controller from './Controller.js';
import AccessControl from '../accessControl.js';

export default class LikesController extends Controller {
    constructor(HttpContext) {
        super(HttpContext, new Repository(new LikeModel()));
    }
     
    register(like) {
        if (this.repository != null) {
            let newLike = this.repository.add(like);
            if (this.repository.model.state.isValid) {
                this.HttpContext.response.created(newLike);
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