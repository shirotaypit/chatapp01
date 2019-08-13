const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const schema = new Schema({
    nickName: { type: String, unique: true, required: true },
    passCode: { type: String, required: true },
	userImage: {type: String}
 
});

schema.set('toJSON', { virtuals: true });

module.exports = mongoose.model('user', schema);