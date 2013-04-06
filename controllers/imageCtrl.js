var DB = require("../models")
    ,Diary = DB.Table('Diary')
    ,User = DB.Table('User')
    ,Comment = DB.Table('Comment')
    ,UserCollectDiary = DB.Table('UserCollectDiary')
    //,GridStore = DB.GridStore
    ,ObjID = DB.ObjID
    ,config = require('../config').config
    ,check = require('validator').check
    ,sanitize = require('validator').sanitize
    ,lutil = require('../utils/util')
    ,fs = require('fs')
    ,path = require('path')
    ,EventProxy = require("eventproxy").EventProxy
    ,page = require('./page')
    ,dbutil = require("../models/dbutil");

exports.index = function(req, res, next){
    var img_name = req.params.img;

    DB.GridFS(function(gfs, db){
        var readstream = gfs.createReadStream(img_name, 'r');
        readstream.pipe(res);

        db.close();
       //gfs.files.find({ filename:img_name }).toArray(function (err, files) {
   
       //lutil.log(files);
       //})
	});
};