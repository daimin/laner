var DB = require("../models")
    ,Diary = DB.Table('Diary')
    ,Comment = DB.Table('Comment')
    ,ObjID = DB.ObjID
    ,config = require('../config').config
    ,check = require('validator').check
    ,sanitize = require('validator').sanitize
    ,common = require('../utils/common')
    ,fs = require('fs')
    ,path = require('path')
    ,gm = require('gm')
    ,EventProxy = require("eventproxy").EventProxy;

var diary_config = {
	diary_title_size : config.diary_title_size,
	diary_content_size : config.diary_content_size,
    diary_summary_size : config.diary_summary_size,
    comment_size : config.comment_size,
	diary_img_size : config.diary_img_size,
    allow_img : config.allow_img.join(", "),
    diary_type:config.diary_type
};

exports.add = function(req, res, next){
    //var loguser = common.verify_auth(req, res);
    
	var method = req.method.toLowerCase();
	if(method == "get"){
	    res.render('diary/add', {
	    	title:config.name,
	    	error_msg:"",
	    	content:"",
            summary:"",
	    	diary_title:"",
            diary_config:diary_config,
            config:config
	    	});
	}
	
	if(method == "post"){
		var title = sanitize(req.body.title).trim();
		var content = sanitize(common.html_entries(req.body.content)).xss();
        var summary = common.get_summary(content);
        var weather = sanitize(req.body.weather).trim();
        var diary_type = sanitize(req.body.type).trim();
		var err_msg = "";
		// 检测控制
		if(title == ""){
			err_msg += "标题不能是空的。 ";
		}
		if(content == ""){
			err_msg += "日记内容不能是空的。";
		}
        if(summary == ""){
			err_msg += "日记摘要不能是空的。";
		}
		
		if(err_msg != ""){
		    res.render('diary/add',{title:config.name,error_msg:err_msg,content:content,summary:summary,diary_title:title,diary_config:diary_config,config:config});
		    return;
		}
		// 检验文本的长度
		if(title.length < config.diary_title_size[0] || title.length > config.diary_title_size[1]){
			err_msg += "日志标题的长度必须是" + config.diary_title_size[0] + "到" + config.diary_title_size[1] + "个之间 。";
		}
		
		if(content.length < config.diary_content_size[0] || content.length > config.diary_content_size[1]){
			err_msg += "日志内容的长度必须是" + config.diary_content_size[0] + "到" + config.diary_content_size[1] + "个之间。 ";
		}
        
        if(summary.length < config.diary_summary_size[0] || summary.length > config.diary_summary_size[1]){
			err_msg += "日志摘要的长度必须是" + config.diary_summary_size[0] + "到" + config.diary_summary_size[1] + "个之间。 ";
		}
		
		if(err_msg != ""){
		    res.render('diary/add',{title:config.name,error_msg:err_msg,content:content,summary:summary,diary_title:title,diary_config:diary_config,config:config});
		    return;
		}
		
		var proxy = new EventProxy();
		
		var target_path = "";
        var target_path_thumb = "";
		if(req.files.up_img.size > 0){
			// 验证文件的大小
			if(req.files.up_img.size >= config.diary_img_size){
			   err_msg += "上传图片的大小应小于" + (config.diary_img_size / 1024 / 1024)+"M";
			   res.render('diary/add',{title:config.name,error_msg:err_msg,content:content,summary:summary,diary_title:title,diary_config:diary_config,config:config});
			   return;
			}
			
			 // 获得文件的临时路径
	        var tmp_path = req.files.up_img.path;
	        
	        var up_img_name = req.files.up_img.name;
	        var fileext = path.extname(up_img_name);
	        
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
			   res.render('diary/add',{title:config.name,error_msg:err_msg,content:content,summary:summary,diary_title:title,diary_config:diary_config,config:config});
	           return;
	        }
	        // 指定文件上传后的目录 
	        target_path =  new Date().getTime() + fileext;
	        var full_img_path = config.site_dir + config.diary_img + target_path;
	        target_path_thumb =  new Date().getTime() + "_thumb" + fileext;
	        var full_img_path_thumb = config.site_dir + config.diary_img + target_path_thumb;

	        // 上传后上传两张图片
             
             
             var render = function (thumb_img, img, del_img){
             };
             proxy.assign("thumb_img", "img", "del_img","save", render);
             proxy.once("thumb_img", function (thumb_img) {
                 gm(tmp_path)
	             .resize(config.img_size.thumb, config.img_size.thumb)
	             .write(full_img_path_thumb, function(err){
	                    if (err) return console.dir(arguments);
	                    proxy.trigger('img');
	             });
             });
             proxy.once("img", function (img) {
                 gm(tmp_path)
	             .resize(config.img_size.cont, config.img_size.cont)
	             .write(full_img_path, function(err){
	                if (err) return console.dir(arguments);
	                proxy.trigger('del_img');
	             });
             });
             proxy.once("del_img", function (del_img) {
                fs.unlink(tmp_path, function(err) {
		            if (err) throw err;
		            proxy.trigger('save');
		        });
             });
             proxy.trigger('thumb_img');
        }else{
           
             var render = function (thumb_img, img, del_img){
             };
             proxy.assign("save", render);
             proxy.trigger('save');
        }
        
        proxy.once("save",function(save){
	        //保存日志
			var diary = {};
			diary.title = title;
			diary.content = content;
	        diary.summary = summary;
			diary.create_date = new Date();
			diary.edit_date = new Date();
			diary.weather = weather;
			diary.up_img = target_path;
			diary.up_img_thumb = target_path_thumb;
			diary.author = 'daimin';
			diary.type = diary_type;
			
			Diary.save(diary, function(err){
			    if(err) return next(err);
			    res.redirect('diary/list');
			});
        });

	}
	
};


exports.list = function(req, res, next){

   var method = req.method.toLowerCase();
	if(method == "get"){
	   Diary.find({},{sort:[['create_date', -1]]}).toArray(function(err, diarys){
	        if(err) return next(err);
	            // console.log(diarys);
	            for(var i = 0 ; i < diarys.length;i++){
	               diarys[i].create_date = common.dateFormat(diarys[i].create_date);
	               diarys[i].edit_date = common.dateFormat(diarys[i].edit_date);
	               if(diarys[i].up_img_thumb){
	                   diarys[i].up_img_thumb = config.diary_url + diarys[i].up_img_thumb;
	               }
	               diarys[i].content = diarys[i].summary;
	            }
		        res.render('diary/list', {
		    	title:config.name,
		    	diarys:diarys,
	            diary_config:diary_config,
                config:config
		    });
	        
	        
            DB.close();

        });

	}
};

exports.view = function(req, res, next){
    var method = req.method.toLowerCase();
	if(method == "get"){
	   var gdiary = null;
	   var proxy = new EventProxy();
       var render = function (diary,comments){
       		
       };
       var diary_id = ObjID(req.params.did);
       proxy.assign("get_diary", "get_comment_list","render", render);
	   proxy.once("get_diary", function (img) {
	       Diary.findOne({"_id":diary_id}, function(err, diary){
	           diary.create_date = common.dateFormat(diary.create_date);
               diary.edit_date = common.dateFormat(diary.edit_date);
               diary.up_img_thumb = config.diary_url + diary.up_img_thumb;
               diary.up_img = config.diary_url + diary.up_img;
               gdiary = diary;
               if(err) return next(err);
               proxy.trigger('get_comment_list');
          }); 
       });
       
       proxy.once("get_comment_list", function (img) {
	       Comment.find({'diary_id':diary_id},{sort:[['comment_date', 1]]}).toArray(function(err, comments){
	           if(err) return next(err);
	           for(var i = 0 ; i < comments.length;i++){
	               comments[i].comment_date = common.dateFormat(comments[i].comment_date);
	               comments[i].floor = "#" + (i + 1);
	               
	           }
	           
	           res.render('diary/view', {
		    	title:config.name,
		    	diary:gdiary,
		    	comments:comments,
	            diary_config:diary_config,
                config:config
		      });
           });
       });
       
       proxy.trigger('get_diary');

	}
};

exports.del = function(req, res, next){
    var diary_id = ObjID(req.params.did);

    // 先删图片，所以要先查图片的链接
    Diary.findOne({"_id":diary_id}, function(err, diary){
        if(err) return next(err);
        // 删除图片啊个
        var tar_img_path = config.site_dir + config.diary_img + diary.up_img;
        fs.unlink(tar_img_path, function() {
	        if (err) throw err;
	        console.log('remove img ' + tar_img_path);
	    });
	    if(diary){
		    Diary.remove({"_id":diary_id}, function(err){
		       if(err) return next(err);
		       // 删评论
		       Comment.remove({"diary_id":diary_id}, function(err){
		         if(err) return next(err);
			      res.redirect('diary/list');
		       });
		    }); 		    
        } 
    });  
 


};
