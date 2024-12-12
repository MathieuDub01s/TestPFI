import Model from './model.js';

export default class Like extends Model {
    constructor() {
        super(true);
        this.addField('PostId', 'string');
        this.addField('Likes', 'integer');
        this.addField('UsersLikesList', 'array');

        this.setKey("PostId");
    }
}