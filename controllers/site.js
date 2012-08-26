var DB = require("../models"),
    Notes = DB.Table('Diary');
var config = require('../config').config;

var ObjID = DB.ObjID;

exports.index = function(req, res, next){
	// 参数1是view地址
	// 参数2是传过去的参数值
	res.render('index', { title: config.name });
};

