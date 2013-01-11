var DB = require("../models")
    ,User = DB.Table('User')
    ,Notice = DB.Table('Notice')
    ,Diary = DB.Table('Diary')
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



exports.index = function(req, res, next){
    var method = req.method.toLowerCase();

    if(method == "get"){
        lutil.userinfo(req, function(user){
        	if(!user || user.email != config.admin_email){
                  res.redirect("/");
                  return;
        	}
	        res.render('user/admin', {
	            title:config.name,
	            error_msg:"",
	            config:config,
	            user_config:config.user_config,
	            userinfo:user
	            });
        });
     }
}

exports.update_notice = function(req, res, next){
	 var h1 = sanitize(req.body.h1).trim();
	 var h2 = sanitize(req.body.h2).trim();
	 try{
		 check(h1,'公告标题不能为空').notEmpty();
     }catch(e){
           res.send(e.message);
     }
     try{
		 check(h2,'公告内容不能为空').notEmpty();
     }catch(e){
           res.send(e.message);
     }

    Notice.findOne({"notice":"notice"},function(err, notice){
        if(notice == null){
        	var no = {};
        	no.h1 = h1;
        	no.h2 = h2;
        	no.notice = "notice";
        	Notice.save(no, function(err){
			    if(err) return next(err);
			    res.send("1");
			});
        }else{
        	Notice.update( {"notice":"notice"},{$set:
	                    {
	                      "h1":h1,"h2":h2,
	                    }
	                  }, {},function(err){
	        if(err) return next(err);
	        res.send("1");
	    });
        }
    
   });
};

exports.notice = function(req, res, next){
	/*lutil.userinfo(req, function(user){
		
		if(!user || user.email != config.admin_email){
	         res.send(JSON.stringify({"notice":{}}));
	         return;
	    }
	    

	});*/

    Notice.findOne({"notice":"notice"},function(err, notice){
	    if(notice == null){
	    	notice = config.announcement;
	    	notice.notice = "notice";
	    	Notice.save(notice, function(err){
			    if(err) return next(err);
			    res.send(JSON.stringify({"notice":notice}));
			});
	    }else{
	    	res.send(JSON.stringify({"notice":notice}));
	    }

    
    });

};

exports.diarys = function(req, res, next){
   lutil.userinfo(req, function(user){
		if(!user || user.email != config.admin_email){
	         res.send(JSON.stringify({"diarys":{}}));
	         return;
	    }
		Diary.find({},{sort:[['create_date', -1]]}).toArray(function(err, diarys){
			 if(err) throw err;
			 var dlen = diarys && diarys.length;
			 for(var i = 0; i < dlen ;i ++){
			 	diarys[i].create_date = lutil.dateFormat(diarys[i].create_date);
			 }
			 res.send(JSON.stringify({"diarys":diarys}));
		});
    });
};

exports.users = function(req, res, next){
	lutil.userinfo(req, function(user){
		if(!user || user.email != config.admin_email){
	         res.send(JSON.stringify({"users":{}}));
	         return;
	    }
		User.find({},{sort:[['reg_date', -1]]}).toArray(function(err, users){
			 if(err) throw err;
			 var dlen = users && users.length;
			 for(var i = 0; i < dlen ;i ++){
			 	users[i].reg_date = lutil.dateFormat(users[i].reg_date);
			 }
			 res.send(JSON.stringify({"users":users}));
		});
    });
};


