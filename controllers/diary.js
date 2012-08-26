var DB = require("../models"),
    Notes = DB.Table('Notes');
var config = require('../config').config;
var check = require('validator').check,
sanitize = require('validator').sanitize;

var diary_config = {
	diary_title_size : config.diary_title_size,
	diary_content_size : config.diary_content_size,
	diary_img_size : config.diary_img_size
};

exports.add = function(req, res, next){
	var method = req.method.toLowerCase();
	if(method == "get"){
	    res.render('diary/add', {
	    	title:config.name,
	    	error_msg:"",
	    	content:"",
	    	note_title:"",
            config:diary_config
	    	});
	}
	
	if(method == "post"){
		var title = sanitize(req.body.title).trim();
		var content = sanitize(req.body.content).trim();
		
		
		var err_msg = "";
		// 检测控制
		if(title == ""){
			err_msg += "标题不能是空的。 ";
		}
		if(content == ""){
			err_msg += "笔记内容不能是空的。";
		}
		
		if(err_msg != ""){
		    res.render('diary/add',{title:config.name,error_msg:err_msg,content:"",note_title:"",config:diary_config});
		    return;
		}
		// 检验文本的长度
		if(title.length < config.diary_title_size[0] || title.length > config.diary_title_size[1]){
			err_msg += "日志标题的长度必须是" + config.diary_title_size[0] + "到" + config.diary_title_size[1] + "个之间 。";
		}
		
		if(content.length < config.diary_content_size[0] || content.length > config.diary_content_size[1]){
			err_msg += "日志内容的长度必须是" + config.diary_content_size[0] + "到" + config.diary_content_size[1] + "个之间。 ";
		}
		
		if(err_msg != ""){
		    res.render('diary/add',{title:config.name,error_msg:err_msg,content:"",note_title:"",config:diary_config});
		    return;
		}
		
		// 检验图片的长度
	}
	
};

