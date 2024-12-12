import Model from './model.js';

export default class UserName extends Model {
    constructor() {
        super(true);
        this.addField('UserId', 'integer');
        this.addField('Name', 'string');
        
        this.setKey("UserId");
    }
}