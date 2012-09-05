var DB = require("../models")
    ,User = DB.Table('User')
    ,ObjID = DB.ObjID
    ,config = require('../config').config
    ,check = require('validator').check
    ,sanitize = require('validator').sanitize
    ,Validator = require('validator').Validator
    ,check = require('validator').check
    ,common = require('./common')
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


function view_diary(did){
	Diary.findOne({"_id":diary_id}, function(err, diary){
	    diary.create_date = common.dateFormat(diary.create_date);
        diary.edit_date = common.dateFormat(diary.edit_date);
        if(err) return next(err);
        return diary;
    });
};

exports.add = function(req, res, next){
	var method = req.method.toLowerCase();
	if(method == "post"){
		var comment_cont = sanitize(common.html_entries(req.body.comment)).xss();
        var diary_id = sanitize(req.body.diary_id).trim();
        var commenter = sanitize(req.body.commenter).trim();
        
        var render_url = 'diary/'+diary_id+'/view';
        
		var err_msg = "";
		// 检测控制
		if(comment_cont == ""){
			err_msg += "评论内容不能是空的。 ";
		}
		
		if(err_msg != ""){
		    res.send(err_msg);
		    return;
		}
		// 检验文本的长度
		if(comment_cont.length < config.comment_size[0] || comment_cont.length > config.comment_size[1]){
			err_msg += "评论的长度必须是" + config.comment_size[0] + "到" + config.comment_size[1] + "个之间 。";
		}
		
		
		if(err_msg != ""){
		    res.send(err_msg);
		    return;
		}

        //保存评论
		var comment = {};
		comment.content = comment_cont;
        comment.commenter = commenter;
        comment.diary_id = ObjID(diary_id);
		comment.comment_date = new Date();
		
		Comment.save(comment, function(err){
		    if(err) return next(err);
		    res.send("1");
		});
	}
	
};


exports.login = function(req, res, next){
    var method = req.method.toLowerCase();
	if(method == "post"){
	    var email = sanitize(req.body.email).trim();
        var password = sanitize(req.body.password).trim();
        try{
            check(email,'Email不能是空的! ').notEmpty();
        }catch(e){
            res.send(e.message);
        }
        try{
            check(password,'密码不能是空的!').notEmpty();
        }catch(e){
            res.send(e.message);
        }
        
        try{
            check(email,"email 格式不正确!").isEmail();
        }catch(e){
            res.send(e.message);
        }
		
		User.findOne({"email":email,"password":common.md5(password)}, function(err, user){
		    if(err) return next(err);
		    if(user == null){
		       res.send('用户名或密码错误!');
		    }
		});
		
        
	}
};

exports.list = function(req, res, next){
   var method = req.method.toLowerCase();
	if(method == "get"){
	   Diary.find({},{sort:[['create_date', 1]]}).toArray(function(err, diarys){
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
	            config:diary_config
		    });
	        
	        
            DB.close();

        });

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
			    res.redirect('diary/list');
		    }); 
        } 
    });  


};
