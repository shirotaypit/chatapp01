var jwt = require('jsonwebtoken');
var redis = require('redis');
var client = redis.createClient(); 
const config = require('../config');


function verifyToken(req, res, next) {
  var token = req.cookies.auth;
  if (!token)
    return res.status(403).send({ auth: false, message: 'No token provided.' });

   client.exists(req.cookies.auth, function(err, data) {
    if (data === 1) {
	    return res.status(403).send({ auth: false, message: 'Invalid token.' });

    } 
});
	
  jwt.verify(token, config.secret, function(err, decoded) {
    if (err)
    return res.status(500).send({ auth: false, message: 'Failed to authenticate token.' });
      
    // すべてうまくいけば、他のルートで使用するために保存して
    req.name = decoded.name;
	req.id = decoded.id;
    next();
  });
}

module.exports = verifyToken;