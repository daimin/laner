var DB = require("../models")
    ,Diary = DB.Table('Diary')
    ,User = DB.Table('User')
    ,Comment = DB.Table('Comment')
    ,ObjID = DB.ObjID
    ,config = require('../config').config
    ,check = require('validator').check
    ,sanitize = require('validator').sanitize
    ,util = require('../utils/util')
    ,fs = require('fs')
    ,path = require('path')
    ,EventProxy = require("eventproxy").EventProxy
    ,page = require('./page');

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
	    util.userinfo(req, function(user){
	        res.render('diary/add', {
	    	    title:config.name,
	    	    error_msg:"",
	    	    content:"",
                summary:"",
	    	    diary_title:"",
                diary_config:diary_config,
                config:config,
                userinfo:user
	    	});
	    });
	}
	
	if(method == "post"){
	    util.log("Add diary post begin.");
		var title = sanitize(req.body.title).trim();
		var content = sanitize(req.body.content).xss();
	
        var summary = util.get_summary(content);
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
        		
		if(err_msg != ""){
		    res.render('diary/add',{title:config.name,error_msg:err_msg,content:content,summary:summary,diary_title:title,diary_config:diary_config,config:config});
		    return;
		}
		
        
		var proxy = new EventProxy();
		
        
		var target_path = "";
        var target_path_thumb = "";
        var no_up_img = true;
        
        
		if(req.files.up_img && req.files.up_img.size > 0){
		    no_up_img = false;
		    util.log("Upload img.");
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
	        target_path_thumb = target_path;
	        var full_img_path = config.site_dir + config.diary_img + target_path;
	        
	        fs.rename(tmp_path, full_img_path, function (err) {
                if (err) {
                    return next(err);
                }
                proxy.trigger('save');
            });
        }
        proxy.once("save",function(save){
            util.log("Save diary.");
            util.userinfo(req, function(user){
	        //保存日志
			    var diary = {};
		     	diary.title = title;
		    	diary.content = content;
	            diary.summary = summary;
			    diary.create_date = new Date();
			    diary.edit_date = new Date();
			    diary.up_img = target_path;
			    diary.up_img_thumb = target_path_thumb;
			    diary.author = user.email;
			    diary.view_num = 0;
			    diary.type = diary_type;
			
			    Diary.save(diary, function(err){
			        if(err) return next(err);
			        res.redirect('diary/list');
			    });
             });
        });
        
        if(no_up_img) {
            proxy.trigger('save');
        }
	}
	
};


exports.list = function(req, res, next){
   util.log('Get diary list.');
   var method = req.method.toLowerCase();
   
	if(method == "get"){
	   var pageno = 1;
	   if(req.params.page){
	      pageno = parseInt(req.params.page);
	   }
	   var proxy = new EventProxy();
	   var total_page = 0;
	   
	   proxy.once("get_nickname",function(){
	       var get_nickname = function(diarys){
	           for(var i = 0; i < diarys.length;i++){
		           var diary = diarys[i];
	               User.find({"email":diary.author}, function(err, user){
		              diary.author = user.nickname;
		           });
		       }

           };
	   });

       
	   util.userinfo(req, function(user){
		   proxy.once("get_list",function(){
		       Diary.find({},{sort:[['create_date', -1]],skip: config.PAGE_SIZE * (pageno - 1), limit:config.PAGE_SIZE}).toArray(function(err, diarys){
		        if(err) return next(err);
		            for(var i = 0 ; i < diarys.length;i++){
		               diarys[i].create_date = util.dateFormat(diarys[i].create_date);
		               diarys[i].edit_date = util.dateFormat(diarys[i].edit_date);
		               if(diarys[i].up_img_thumb && diarys[i].up_img_thumb != ""){
		                   
		                   diarys[i].up_img_thumb = config.diary_url + diarys[i].up_img_thumb;
		               }
		               diarys[i].content = diarys[i].summary;
		            }
		       
		            get_nickname(diarys);
		            var pageData = page.createPage(pageno, total_page);

				    res.render('diary/list', {
				    	title       :config.name,
				    	diarys      :diarys,
			            diary_config:diary_config,
		                config      :config,
		                pageData    :pageData,
		                req_path    :req.path,
		                userinfo    :user
				    });
                    DB.close();
	           });
		   });
		   
		   proxy.once("get_total",function(){
		      Diary.find({}).toArray(function(err, diarys){
		          var total_items = diarys.length;
		          total_page = Math.floor ( (total_items + config.PAGE_SIZE - 1) / config.PAGE_SIZE );
		          
		          proxy.trigger('get_list');
		      });
		   });
		   
		   proxy.trigger('get_total');
	   

	  });

	}
};




exports.view = function(req, res, next){
    var method = req.method.toLowerCase();
	if(method == "get"){
	   var gdiary = null;
	   var proxy = new EventProxy();
       var nickname = "";
       var diary_id = ObjID(req.params.did);
       
       var get_nickname = function(diary){
	       proxy.assign("get_nickname",function(obj){
	          User.findOne({"email":diary.author}, function(err, user){
	              diary.author = user.nickname;
	              proxy.trigger('update_view_num');
	          });
	       });
	       proxy.trigger('get_nickname');
       };
       
	   proxy.once("get_diary", function (img) {
	       Diary.findOne({"_id":diary_id}, function(err, diary){
	           
	           diary.create_date = util.dateFormat(diary.create_date);
               diary.edit_date = util.dateFormat(diary.edit_date);
               if(diary.up_img_thumb){
                   diary.up_img_thumb = config.diary_url + diary.up_img_thumb;
               }
               if(diary.up_img){
                   diary.up_img = config.diary_url + diary.up_img;
               }
               gdiary = diary;
               get_nickname(gdiary);
               
               if(err) return next(err);
          }); 
       });
       
       proxy.once("update_view_num", function (img) {
           var n_view_num = 0;
           if(gdiary['view_num']){
               n_view_num = gdiary['view_num'] + 1;
           }else{
               n_view_num = 1;
           }
           Diary.update({_id:diary_id}, {$set: {view_num : n_view_num}},{},function(err){
              if(err)  return next(err);
              proxy.trigger('get_comment_list');
           });
       });
       
       
       proxy.once("get_comment_list", function (img) {
	       Comment.find({'diary_id':diary_id},{sort:[['comment_date', 1]]}).toArray(function(err, comments){
	           if(err) return next(err);
	           for(var i = 0 ; i < comments.length;i++){
	              
	               comments[i].comment_date = util.dateFormat(comments[i].comment_date);
	               comments[i].floor = "#" + (i + 1);
	               
	           }
	           util.userinfo(req, function(user){
		           res.render('diary/view', {
			    	 title:config.name,
			    	 diary:gdiary,
			    	 comments:comments,
		             diary_config:diary_config,
	                 config:config,
	                 userinfo:user
			      });
		      });
           });
       });
       
       proxy.trigger('get_diary');

	}
};

exports.del = function(req, res, next){
    util.log(req.params.did);
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
