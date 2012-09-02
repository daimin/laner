var config = require('../config').config;
var mongo = require("mongoskin");
var db = mongo.db(config.db);
exports.Table = function(con){
  var clt = db.collection(con);
  return clt;
};

exports.close = function(){
   db.close();
};

/*
 * 创建objectid,这样才可以在mongoskin中使用
 * db.collection.id()这个也可以
*/
exports.ObjID = function(id){
  return db.ObjectID.createFromHexString(id);
};