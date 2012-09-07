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

exports.login = function(req, res, next){
    var method = req.method.toLowerCase();
    if(method == "get"){
        res.render('user/login', {
            title:config.name,
            error_msg:"",
            email:"",
            config:config,
            user_config:config.user_config
        });
    }else if(method == "post"){
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
		    }else{
		       gen_session(user, res);
		       res.send('1');
		    }
		});
		
        
	}
};

exports.logout = function(req, res, next){
    res.clearCookie(config.auth_cookie_name, { path: '/' });
    res.redirect('/');
};

function gen_session(user,res) {
  var auth_token = common.encrypt(user.email, config.session_secret);
  res.cookie(config.auth_cookie_name, auth_token, { expires: new Date(Date.now() + 1000*60*60*2), httpOnly: true }); //cookie 有效期2个小时      
}

exports.register = function(req, res, next){
    var method = req.method.toLowerCase();
    if(method == "get"){
	    res.render('user/register', {
	    	title:config.name,
	    	error_msg:"",
	    	email:"",
            nickname:"",
            config:config,
            user_config:config.user_config
        });
	}else if(method == "post"){
	    var email = sanitize(req.body.email).trim();
        var password = sanitize(req.body.password).trim();
        var repassword = sanitize(req.body.repassword).trim();
        var nickname = sanitize(req.body.nickname).trim();
        
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
            check(nickname,'昵称不能是空的!').notEmpty();
        }catch(e){
            res.send(e.message);
        }
        
        // 检测长度
        try{
            check(email,'Email长度必须在'+config.user_config.email_size[0]+'到'+config.user_config.email_size[1]+'个之间!')
            .len(config.user_config.email_size[0],config.user_config.email_size[1]);
        }catch(e){
            res.send(e.message);
        }
        try{
            check(nickname,'昵称长度必须在'+config.user_config.nickname_size[0]+'到'+config.user_config.nickname_size[1]+'个之间!')
            .len(config.user_config.nickname_size[0],config.user_config.nickname_size[1]);
        }catch(e){
            res.send(e.message);
        }
        try{
            check(password,'密码长度必须在'+config.user_config.password_size[0]+'到'+config.user_config.password_size[1]+'个之间!')
            .len(config.user_config.password_size[0],config.user_config.password_size[1]);
        }catch(e){
            res.send(e.message);
        }

        try{
           check(password,"输入重复密码错误").equals(repassword);
        }catch(e){
           res.send(e.message);
        }
        
        try{
            check(email,"email 格式不正确!").isEmail();
        }catch(e){
            res.send(e.message);
        }
	   User.findOne({"email":email,"password":common.md5(password)}, function(err, user){
	   if(user != null){
		        res.send('邮箱已存在，请登录');
		}else{
		        //保存日志
			var user = {};
			user.email = email;
			user.password = common.md5(password);
		    user.nickname = nickname;
			user.reg_date = new Date();
			user.avatar = "default.jpg";
				
			User.save(user, function(err){
				if(err) return next(err);
				    gen_session(user, res);
				});
		    }
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
