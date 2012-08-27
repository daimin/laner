var config = require('../config').config;
var mongo = require("mongoskin");
var db = mongo.db(config.db);
exports.Table = function(con){
  var clt = db.collection(con);
  return clt;
};

exports.ObjID = function(id){
  return db.ObjectID.createFromHexString(id);
};
