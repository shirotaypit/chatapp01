var express  = require('express');
var app = express();
var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var ejs = require("ejs");
var bcrypt = require('bcryptjs');
var cookieParser = require('cookie-parser')
var jsonwebtoken  =  require('jsonwebtoken');
var redis = require('redis');
var client = redis.createClient(); 
var sanitize = require('mongo-sanitize');


const { check, validationResult } = require('express-validator');
const userService = require('./users/user.service');
const db = require('./_helpers/db');
const verifyToken = require('./_helpers/VerifyToken');
const config = require('./config');
const User = db.User;

app.use(cookieParser())
app.engine('ejs',ejs.renderFile);
app.use(express.static(__dirname + '/public'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); 
client.on('connect', function() {
    console.log('connected');
});

// （暫定）会話用のIDを設定
var myID = '01';
var f1ID = '02';

// （暫定）会話用のコレクション名を作成
var chatCollection = myID + f1ID;

//　MongoDBに接続
mongoose.connect('mongodb://localhost/mydb',{ useNewUrlParser: true });



// （暫定）会話格納用（スタンプや画像はまだ）
var Chats = mongoose.model(chatCollection, {
    fromAddress : String,
    toAddress : String,
    message : String,
    timeStamp :String
});


//  最初の挨拶を登録
Chats.create({
    fromAddress : f1ID,
    toAddress : myID,
    message : 'こんにちは',
    timeStamp : getDateTime()
    });

// 直近の会話を比較用に保存
var resentMsg = "---";
var query = { "fromAddress": "01" };
    Chats.find(query,{},{sort:{_id: -1},limit:1}, function(err, data){
        if(err){
            console.log(err);
        }
        if(data.length > 0){
            if (data[0].timeStamp !==''){
				          resentMsg =data[0].timeStamp + data[0].message;

            }
        }
    });

// クライアントからgetされると会話全件をjsonで返す
app.get('/api/messages', verifyToken, (req, res) => {
    Chats.find()
            .then((messages) => {
            res.json(messages);
        })
        .catch((err) => {
            res.send(err);
        })
});

// 会話内容がポストされれば、それを登録する
app.post('/api/messages', verifyToken, (req, res) => {
    var postData = req.body;

    Chats.create({
            fromAddress : myID,
            toAddress : f1ID,
            message : postData.mess,
            timeStamp : getDateTime()
        })
        .then((postData) => {
            res.json(postData.mess);
        })
        .catch((err) => {
            res.send(err);
        });
});

// （暫定）1秒ごとに新しいメッセージを検索する
const timer = setInterval(function(){
    var query = { };
    Chats.find(query,{},{sort:{_id: -1},limit:1}, function(err, data){
        if(err){
            console.log(err);
        }
        if ( data[0].fromAddress == '01') {
            if ( resentMsg != data[0].timeStamp + data[0].message) {
                resentMsg = data[0].timeStamp + data[0].message;
                msgFooking(data[0].message);
            }
        }
    });
},1000);

// （暫定）ECHOさんの処理
function msgFooking(msg){
    Chats.create({
        fromAddress : f1ID,
        toAddress : myID,
        message : msg + "ですね",
        timeStamp : getDateTime()
    });
}

//ログイン画面をレンダリングする
app.get('/', function(req, res, next) {
	res.clearCookie("auth");
	res.render('login.ejs', {error: false, errors:false});
});

//ユーザ認証
app.post('/auth',[check('nickName', 'Please enter nick name.').not().isEmpty().trim().escape(),
  check('passCode', 'Please enter passcode.').not().isEmpty().trim().escape(),
], (req, res) => {
		var errors = validationResult(req);
		//検証エラー
		if (!errors.isEmpty()) {
			res.render('register.ejs',{data: req.body, errors: errors.mapped() });
		}
		
		const  nickName  =  sanitize(req.body.nickName);
		const  passcode  =  sanitize(req.body.passCode);

		User.findOne({nickName}, (err, user)=>{
        if (err) return  res.status(500).send(err);
		
        if (!user) return  res.render('login.ejs',  {error: 'User not found.', errors:false});
		
		//パスコードチェック
        bcrypt.compare(passcode, user.passCode, function(err, result) {
			
        if(!result) return  res.render('login.ejs',  {error: 'Passcode is invalid.', errors:false});
        //JSON Webトークンを生成する,トークンの有効期限を15分に設定
		const  expiresIn  =  900;
        const  accessToken  =  jsonwebtoken.sign({ name :  user.nickName }, config.secret, {
            expiresIn:  expiresIn
        });
		//トークンをクッキーに保存する
		res.cookie('auth',accessToken , { maxAge: 900000, httpOnly: true });
		
        //res.json({success:true,message:'Success', token:accessToken, user: {username:user.nickName}});
        res.redirect('/home');
    });
 });
});
	
//登録画面をレンダリングする
app.get('/register', function(req, res, next) {
   res.render('register.ejs',  {errors: false});
});

//ユーザー登録
app.post('/save', [
  check('nickName', 'Nick name must be alphabets only').not().isEmpty().isAlpha().trim().escape(),
  check('passCode', 'Pass code must be alphanumeric').not().isEmpty().isAlphanumeric().trim().escape(),
  check('nickName', 'Nick name length must be between 4 to 12.').not().isEmpty().isLength({min: 4, max: 12}).trim().escape(),
  check('passCode', 'Passcode length must be between 6 to 12.').not().isEmpty().isLength({min: 6, max: 12}).trim().escape(),
  check('nickName').custom(value => {
	//ニックネームを検証する
    return User.findOne({'nickName': value}).then(user => {
      if (user) {
        return Promise.reject('Nick name already in use.');
      }
    });
  })
], (req, res) => {
	
	  var errors = validationResult(req);
	//検証エラー
  if (!errors.isEmpty()) {
     res.render('register.ejs',{data: req.body, errors: errors.mapped() });
  }else{
				
		//エラーなし, データベースにユーザー情報を保存する	  
		userService.create(req.body);
     
		res.redirect('/');
		
  }
  
});


//ホームページのルーティング
app.get('/home', verifyToken, function(req, res, next) {
	var users = [];
	 User.find({ nickName: {$ne: req.name}})
           .stream()
  .on('data', function(doc){
	   var base64Data;
	  if(doc.userImage != undefined){
	   base64Data = doc.userImage.replace(/^data:image\/png;base64,/, "")
	  }

	users.push({nickName : doc.nickName, userImage: base64Data });
  })
  .on('error', function(err){
	res.send(err);
  })
  .on('end', function(){
    res.render('list.ejs', {listUsers : users });

  });
        
});

// ルートアクセス時にベースの画面を返す
// 友達の名前とそれぞれのIDをEJSでHTMLに埋め込む
app.get('/chat', verifyToken, (req, res) => {
    res.render('chatapp.ejs',
        {frendName: 'Echo' ,
         myidf: myID ,
         fiidf: f1ID });
});

app.get('/logout', function(req, res, next) {
	//無効化トークン
	client.set(req.cookies.auth, req.cookies.auth);
	//Cookiesからトークンをクリア
	res.clearCookie("auth");
	res.redirect('/');

});

// 日時の整形処理
function getDateTime(){
    var date = new Date();

    var year_str = date.getFullYear();
    var month_str = date.getMonth();
    var day_str = date.getDate();
    var hour_str = date.getHours();
    var minute_str = date.getMinutes();
    var second_str = date.getSeconds();

    month_str = ('0' + month_str).slice(-2);
    day_str = ('0' + day_str).slice(-2);
    hour_str = ('0' + hour_str).slice(-2);
    minute_str = ('0' + minute_str).slice(-2);
    second_str = ('0' + second_str).slice(-2);

    format_str = 'YYYY/MM/DD hh:mm:ss';
    format_str = format_str.replace(/YYYY/g, year_str);
    format_str = format_str.replace(/MM/g, month_str);
    format_str = format_str.replace(/DD/g, day_str);
    format_str = format_str.replace(/hh/g, hour_str);
    format_str = format_str.replace(/mm/g, minute_str);
    format_str = format_str.replace(/ss/g, second_str);
console.log(format_str);
    return format_str;

}

// ポート3000で待ち受け
app.listen(3000, () => {
    console.log("起動しました　ポート3000");
});