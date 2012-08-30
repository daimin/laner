var DB = require("../models")
    ,Diary = DB.Table('Diary')
    ,ObjID = DB.ObjID
    ,config = require('../config').config
    ,check = require('validator').check
    ,sanitize = require('validator').sanitize
    ,common = require('./common')
    ,fs = require('fs')
    ,path = require('path')
    ,canvas = require('canvas');

var diary_config = {
	diary_title_size : config.diary_title_size,
	diary_content_size : config.diary_content_size,
	diary_img_size : config.diary_img_size,
    allow_img : config.allow_img.join(", "),
    diary_type:config.diary_type
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
        var weather = sanitize(req.body.weather).trim();
        var diary_type = sanitize(req.body.type).trim();
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
		
		 var target_path = "";
		if(req.files.up_img.size > 0){
			// 验证文件的大小
			if(req.files.up_img.size >= config.diary_img_size){
			   err_msg += "上传图片的大小应小于" + (config.diary_img_size / 1024 / 1024)+"M";
			   res.render('diary/add',{title:config.name,error_msg:err_msg,content:content,diary_title:title,config:diary_config});
			   return;
			}
			
			 // 获得文件的临时路径
	        var tmp_path = req.files.up_img.path;
	        
	        var up_img_name = req.files.up_img.name;
	        var fileext = path.extname(up_img_name)
	        
	        var is_allow_img = false;
	        fileext = fileext.toLowerCase();
	        for(var i = 0; i < config.allow_img.length;i++){
	            var aimg = config.allow_img[i].toLowerCase();
	            if(fileext == aimg){
	               is_allow_img = true;
	            }
	            
	        }
	        
	        if(is_allow_img == false){
			   err_msg += "上传图片类型只能是" + config.allow_img.join(",")+"之一";
			   res.render('diary/add',{title:config.name,error_msg:err_msg,content:content,diary_title:title,config:diary_config});
	           return;
	        }
	        // 指定文件上传后的目录 
	        target_path =  new Date().getTime() + fileext;
	        var full_img_path = config.site_dir + config.diary_img + target_path;
	        
	        // 移动文件
	        fs.rename(tmp_path, full_img_path, function(err) {
	           if (err) throw err;
	           // 删除临时文件夹文件, 
	           fs.unlink(tmp_path, function() {
	           if (err) throw err;
	               // res.send('File uploaded to: ' + target_path + ' - ' + req.files.thumbnail.size + ' bytes');
	           });
	        });
        }

        //保存日志
		var diary = {};
		diary.title = title;
		diary.content = content;
		diary.create_date = new Date();
		diary.edit_date = new Date();
		diary.weather = weather;
		diary.up_img = target_path;
		diary.author = 'daimin';
		diary.type = diary_type;
		
		Diary.save(diary, function(err){
		    if(err) return next(err);
		    res.redirect('diary/list');
		});
	}
	
};


exports.list = function(req, res, next){
   var method = req.method.toLowerCase();
	if(method == "get"){
	   Diary.find({},{sort:[['create_date', -1]]}).toArray(function(err, diarys){
	        if(err) return next(err);
	            //console.log(docs);
	            for(var i = 0 ; i < diarys.length;i++){
	               diarys[i].create_date = common.dateFormat(diarys[i].create_date);
	               diarys[i].edit_date = common.dateFormat(diarys[i].edit_date);
	               if(diarys[i].up_img){
	                   diarys[i].up_img = config.diary_url + diarys[i].up_img;
	               }
	            }
	            
		        res.render('diary/list', {
		    	title:config.name,
		    	diarys:diarys,
	            config:diary_config
		    });
	        
	        
            DB.close();

        });

	}
};
