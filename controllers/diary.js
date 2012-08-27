var DB = require("../models")
    ,Diary = DB.Table('Diary')
    ,ObjID = DB.ObjID
    ,config = require('../config').config
    ,check = require('validator').check
    ,sanitize = require('validator').sanitize
    ,common = require('./common')
    ,fs = require('fs');

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
	    	diary_title:"",
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
		    res.render('diary/add',{title:config.name,error_msg:err_msg,content:content,diary_title:title,config:diary_config});
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
		    res.render('diary/add',{title:config.name,error_msg:err_msg,content:content,diary_title:title,config:diary_config});
		    return;
		}
		
		// 验证文件的大小
		if(req.files.up_img.size >= config.diary_img_size){
		   err_msg += "上传图片的大小应小于" + (config.diary_img_size / 1024 / 1024)+"M";
		   res.render('diary/add',{title:config.name,error_msg:err_msg,content:content,diary_title:title,config:diary_config});
		   return;
		}
		
		 // 获得文件的临时路径
        var tmp_path = req.files.up_img.path;
        
        var up_img_name = req.files.up_img.name;
        var fileext = up_img_name.substring(up_img_name.lastIndexOf('.')+1);
        
        for()
        // 指定文件上传后的目录 
        var target_path = config.diary_img + new Date().time() + '.' + fileext;
        
        console.log(target_path);
        // 移动文件
        fs.rename(tmp_path, target_path, function(err) {
           if (err) throw err;
           // 删除临时文件夹文件, 
           fs.unlink(tmp_path, function() {
           if (err) throw err;
           res.send('File uploaded to: ' + target_path + ' - ' + req.files.thumbnail.size + ' bytes');
         });
        });
		
		
		Diary.save(diary, function(err){
		    if(err) return next(err);
		    res.end("OK");
		
		});
		var diary = {};
		diary.title = title;
		diary.content = title;
		diary.create_date = new Date();
		diary.edit_date = new Date();
		
		// 检验图片的长度
	}
	
};

