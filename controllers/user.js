var DB = require("../models")
    ,User = DB.Table('User')
    ,UserCollectDiary = DB.Table('UserCollectDiary')
    ,ObjID = DB.ObjID
    ,config = require('../config').config
    ,check = require('validator').check
    ,sanitize = require('validator').sanitize
    ,Validator = require('validator').Validator
    ,check = require('validator').check
    ,lutil = require('../utils/util')
    ,fs = require('fs')
    ,path = require('path')
    ,EventProxy = require("eventproxy").EventProxy
    ,dbutil = require("../models/dbutil");

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
		
		User.findOne({"email":email,"password":lutil.md5(password)}, function(err, user){
		    if(err) return next(err);
		    if(user == null){
		       res.send('0:用户名或密码错误!');
		    }else{
		       gen_session(user, res);
		       lutil.log(req.body.p);
               dbutil.update_user_score(email,1,function(){

                   if(req.body.p){
                      res.send('1:'+ req.body.p);
                   }else{
                      res.send('1:');
                   }
               });

		    }
		});
		
        
	}
};

exports.logout = function(req, res, next){
    res.clearCookie(config.auth_cookie_name, { path: '/' });
    res.redirect('/');
};

function gen_session(user,res) {
  var auth_token = lutil.encrypt(user.email, config.session_secret);
  res.cookie(config.auth_cookie_name, auth_token, { expires: new Date(Date.now() + 1000*60*60*2), httpOnly: true }); //cookie 有效期2个小时      
}

exports.register = function(req, res, next){
    var method = req.method.toLowerCase();
    if(method == "get"){
    lutil.userinfo(req, function(user){
	    res.render('user/register', {
	    	title:config.name,
	    	error_msg:"",
	    	email:"",
            nickname:"",
            config:config,
            user_config:config.user_config,
            userinfo :user
        });
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
	   User.findOne({"email":email}, function(err, user){
	    if(user != null){
		        res.send('邮箱已存在，请登录');
		}else{
		        //保存日志
			var user = {};
            user._id = lutil.genId('u');
			user.email = email;
			user.password = lutil.md5(password);
		    user.nickname = nickname;
			user.reg_date = new Date();
			user.avatar = "default.jpg";
            user.score = 5;
				
			User.save(user, function(err){
				if(err) return next(err);
				    gen_session(user, res);
				    res.send('1');
				});
		    }
	    });
		    
		
        
	}
};

exports.setting = function(req, res, next){
    var method = req.method.toLowerCase();
    if(method == "get"){
        lutil.userinfo(req, function(user){
	        res.render('user/setting', {
	            title:config.name,
	            error_msg:"",
	            config:config,
	            user_config:config.user_config,
	            userinfo:user
	            });
        });
     }else{
//    	 console.log(req.body);
    	 var action = sanitize(req.body.action).trim();
    	 if(action == "update_info"){ // 更新用户基本信息
    		 var email = sanitize(req.body.email).trim();
    		 var nickname = sanitize(req.body.nickname).trim();
    		 var motto = sanitize(req.body.motto).trim();
    		 try{
    			 check(nickname,'昵称不能是空的！').notEmpty();
    	     }catch(e){
    	           res.send(e.message);
    	     }
    	     try{
				check(nickname,'昵称长度必须在'+config.user_config.nickname_size[0]+'到'+config.user_config.nickname_size[1]+'个之间!')
				.len(config.user_config.nickname_size[0],config.user_config.nickname_size[1]);
			}catch(e){
				res.send(e.message);
			}
    	     User.update( {"email":email},{$set:
			                    {
			                      "nickname":nickname,"motto":motto,
			                    }
			                  }, {},function(err){
			        if(err) return next(err);
			        res.send("1");
			    });
    	        
    	 }else if(action == "update_pass"){ // 更新用户密码
		     var email = sanitize(req.body.email).trim();
    		 var cur_password = sanitize(req.body.cur_password).trim();
    		 var new_password = sanitize(req.body.new_password).trim();
    		 var re_new_password = sanitize(req.body.re_new_password).trim();
    		 try{
    			 check(cur_password,'当前密码不能是空的！').notEmpty();
    	     }catch(e){
    	           res.send(e.message);
    	     }
			 
			 try{
    			 check(new_password,'新密码不能是空的！').notEmpty();
    	     }catch(e){
    	           res.send(e.message);
    	     }
			 
			 try{
    			 check(re_new_password,'重复新密码不能是空的！').notEmpty();
    	     }catch(e){
    	           res.send(e.message);
    	     }
			try{
				check(cur_password,'当前密码长度必须在'+config.user_config.password_size[0]+'到'+config.user_config.password_size[1]+'个之间!')
				.len(config.user_config.password_size[0],config.user_config.password_size[1]);
			}catch(e){
				res.send(e.message);
			}
			
			try{
				check(new_password,'新密码长度必须在'+config.user_config.password_size[0]+'到'+config.user_config.password_size[1]+'个之间!')
				.len(config.user_config.password_size[0],config.user_config.password_size[1]);
			}catch(e){
				res.send(e.message);
			}

			try{
				check(re_new_password,'重复新密码长度必须在'+config.user_config.password_size[0]+'到'+config.user_config.password_size[1]+'个之间!')
				.len(config.user_config.password_size[0],config.user_config.password_size[1]);
			}catch(e){
				res.send(e.message);
			}
			
			try{
				check(new_password,"输入重复新密码错误").equals(re_new_password);
            }catch(e){
                res.send(e.message);
            }
			
			User.findOne({"email":email,"password":lutil.md5(cur_password)}, function(err, user){
		    if(err) return next(err);
		    if(user == null){
		       res.send('当前密码输入错误!');
		    }else{
		        User.update( {"email":email},{$set:
			                    {
			                      "password":lutil.md5(new_password),
			                    }
			                  }, {},function(err){
			        if(err) 
					   return next(err);
			        res.send("1");
			    });
		    }
		   });
    	     

    	        
    	 }else if(action == "update_avatar"){
		 
		     var email = sanitize(req.body.email).trim();
    		 var new_avatar = sanitize(req.body.new_avatar).trim();
    		 try{
    			 check(new_avatar,'新头像地址不能为空！').notEmpty();
    	     }catch(e){
    	           res.send(e.message);
    	     }
			 
			
			User.update( {"email":email},{$set:
			                {
			                  "avatar":new_avatar,
			                }
			             }, {},function(err){
			    if(err) 
					return next(err);
			    res.send("1:" + new_avatar);
			});
		 }
     }
}


exports.del = function(req, res, next){
   var user_id = ObjID(req.params.did);
   lutil.userinfo(req, function(uinfo){
       if(uinfo.email == config.admin_email){
              User.findOne({"_id":user_id}, function(err, user){
                if(user){
                   User.remove({"_id":user_id},function(err){
                       UserCollectDiary.remove({"email":user.email},function(err){
                            res.send('1');
                       });
                   });
                }

              });     
       }else{
          res.send('2');
       }

   });


};


