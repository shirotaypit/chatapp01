var bcrypt = require('bcryptjs');
var sanitize = require('mongo-sanitize');

const db = require('../_helpers/db');
const User = db.User;
const saltRounds = 10;

module.exports = {
     create
 };

// ユーザーモデルを作成し、データベースに保存する
function create(userParam) {

	const nickName = sanitize(userParam.nickName);
	const passCode = sanitize(userParam.passCode);
    const user = new User();
	user.nickName = nickName;
	// 画像はオプションです。デフォルト画像を使用して選択されていません
	if(userParam.ufile){
		user.userImage=userParam.ufile;

	}
    if (passCode) {
		// ハッシュパスコードを保存する
        user.passCode = bcrypt.hashSync(passCode, bcrypt.genSaltSync(saltRounds));
    }
    // save user
     user.save();
	 console.log(user);

}

function getById(id) {
    return User.findById(id).select('-hash');
}


