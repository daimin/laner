var config = require('../config').config;
var mongo = require("mongoskin");
var mongodb = require('mongodb');
var Server = require('mongodb').Server;
var Grid = require('gridfs-stream');

var db = mongo.db(config.db[1]);

exports.Table = function(con){
  var clt = db.collection(con);
  return clt;
};


// make sure the db instance is open before passing into `Grid`

exports.GridFS = function(callback){
      var gfs = Grid(db._dbconn, mongodb);
	    callback(gfs, db._dbconn);
};




exports.close = function(){
   db.close();
};

/*
 * 创建objectid,这样才可以在mongoskin中使用
 * db.collection.id()这个也可以
*/

exports.ObjID = function(id){
  //return db.ObjectID.createFromHexString(id);
  return id;
};
