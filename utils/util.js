var sys = require("sys")
    ,crypto = require('crypto')
    ,config = require('../config').config
    ,site = require('../controllers/site')
    ,DB = require("../models")
    ,User = DB.Table('User')
    ,ObjID = DB.ObjID
    ,EventProxy = require("eventproxy").EventProxy
    ,htmlparser = require("htmlparser"),
    sys = require('util');
    
    
exports.encrypt = function(str,secret) {
   var cipher = crypto.createCipher('aes192', secret);
   var enc = cipher.update(str,'utf8','hex');
   enc += cipher.final('hex');
   return enc;
};

exports.decrypt = function (str,secret) {
   var decipher = crypto.createDecipher('aes192', secret);
   var dec = decipher.update(str,'hex','utf8');
   dec += decipher.final('utf8');
   return dec;
};

exports.md5 = function(str) {
  var md5sum = crypto.createHash('md5');
  md5sum.update(str);
  str = md5sum.digest('hex');
  return str;
};

exports.randomString = function (size) {
  size = size || 6;
  var code_string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; 
  var max_num = code_string.length + 1;
  var new_pass = '';
  while(size>0){
    new_pass += code_string.charAt(Math.floor(Math.random()* max_num));
    size--; 
  }
  return new_pass;
};

var log = function(info){
    if(config.DEBUG == true){
        console.log(sys.inspect(info, true, null) + '\t' + exports.dateFormat(new Date()));
    }
};

exports.log = log;

exports.dateFormat = function(cd){
   if(cd){
      var m = (cd.getMonth()+1);
      if(m < 10) m = '0'+m;
      var d = cd.getDate();
      if(d < 10) d = '0'+d;
      var h = cd.getHours();
      if(h < 10) h = '0'+h;
      var min = cd.getMinutes();
      if(min < 10) min = '0'+min;
      var s = cd.getSeconds();
      if(s < 10) s = '0'+s;
      var df = cd.getFullYear()+"-"+m + "-" + d + " " + h + ":"+min+":"+s;
      return df;
   }
   return "";
};

exports.index_cut_cont = function(cont){
   if(!cont) return "";
   if(cont.length > config.diary_size){
      return cont.substring(0,config.diary_size);
   }else{
      return cont;
   }
};

exports.html_entries = function(str){
  var s = str.replace(/\n/g,'<br/>');
  s = s.replace(/\n\r/g,'<br/>');
  s = s.replace(/' '/g,'&nbsp;');
  return s;
};

exports.html_decode = function(html){
    var s = html.replace('&nbsp;', ' ');
    s = s.replace('<br/>', '\n');
    return s;
};


/**
   验证用户是否登录
*/
exports.verify_auth = function(req,res){
    if(config.path_access[req.path] == 1){
        return true;
    }
    
    if(req.cookies[(config.auth_cookie_name)]){
       var email = null;
       try{
        email = exports.decrypt(req.cookies[(config.auth_cookie_name)],config.session_secret);
       }catch(e){
          console.log(e.message);
       }
        if(email){
           return email;
        }else{
           res.redirect("/user/login");
        }
    }else{
        res.redirect("/user/login");
    }
    return true;
};

/**
获取用户信息，并回调函数
*/
exports.userinfo = function(req, callback){
    var proxy = new EventProxy();
    var render = function (get_user, user){
        // 这里可以加入更多的代码 //
        
        do_with_right_menu(user);
        ////
        callback(user);
    };
    proxy.assign("get_user", "callback", render);
    proxy.once("get_user",function(get_user){
        try{
            if(req.cookies[(config.auth_cookie_name)]){
                var email = exports.decrypt(req.cookies[(config.auth_cookie_name)], config.session_secret);
                
                if(email){
	                User.findOne({"email":email}, function(err, user){
	                    if(err) return next(err);
	                    
                        proxy.trigger('callback', user);
	                });   
	            }
	        }else{
	           proxy.trigger('callback');
	        }
	    }catch(e){
	        console.log(e.message);
	    }
	   
    });
    
    proxy.trigger('get_user');
};

var do_with_right_menu = function(user){
   if(user && user.email.length > 0){
      config.site_headers.right_menu.menu_item = config.site_headers.right_menu.login_item;	
	    
	}else{
	  config.site_headers.right_menu.menu_item = config.site_headers.right_menu.nologin_item;	
	}
};

/**
  过滤路径
*/
exports.filter = function(app,maps){
    

    var deal_path = function(rpath){
        var spos = rpath.lastIndexOf('/');
        var path_tail = rpath.substring(spos);
        rpath = rpath.substring(0,spos);
        spos = rpath.lastIndexOf('/');
        rpath = rpath.substring(0,spos) + path_tail;
        return rpath;
    };
    // 验证用户登录
    var verfiy_auth = function(req,res,next){
	    var pass = false;
      var rpath = req.path;
      var a_verify = config.path_access[rpath];
      if(!a_verify){
           rpath = deal_path(rpath); 
           a_verify = config.path_access[rpath];
      }


	    if(a_verify == config.ACCESS_VERIFY){

	        if(req.cookies[(config.auth_cookie_name)]){
	            var email = null;
	            try{
	                email = exports.decrypt(req.cookies[(config.auth_cookie_name)], config.session_secret);
	                
	            }catch(e){
	                console.log(e.message);
	            }
	            
	            if(email){
	                pass = true;
	            }
	        }
	    }else{
	        pass = true;
	    }
	    return pass;
    };
    
    var get_ctrl_func = function(path, method){
        method = method.toLowerCase();
        // 示例url /diary/add 或者/comment/add以及/diary/2131232dfsddsds/view
        var paths = path.split('/');
        var paths_obj = {};
        var dpath_len = paths.length;
        for(var i = 0; i < paths.length ;i++){
             if(paths[i] != ""){
                paths_obj[paths[i]] = 1;
             }else{
                dpath_len--;
             }
             
        }

        if(dpath_len >= 3 && path.length > 24){
           dpath_len--;
        }

        for(var i = 0, len = maps.length;i < len; i++){
             var objm = maps[i];
             if(path == objm.path && method == objm.method){
                 return objm.ctrl;
             }else if(path != objm.path && method == objm.method){
                var ops = objm.path.split('/');
                
                var march_count = 0;
                for(var j = 0;j < ops.length;j++){
                   if(paths_obj[ops[j]]){
                      march_count++;
                   }
                }

                if(march_count >= dpath_len){
                    return objm.ctrl;
                }else{
                  continue;
                }
             }else{
                continue;
             }
        }
     
    };
    
    for(var i = 0, len = maps.length;i < len; i++){
        var objm = maps[i];

        app[objm.method](objm.path, function(req,res,next){
            if(verfiy_auth(req, res, next)){
                get_ctrl_func(req.path, req.method)(req,res,next);
            }else{
                res.redirect('user/login?p='+req.path);
            }
          
        });
        
    }
   
};

function get_text_from_html(html){
    var text = "";
    var handler = new htmlparser.DefaultHandler(function(err, dom) {
        if (err) {
		    text = "";
        }
	    else {
	        var getText = function(dom){
	            for(var pk in dom){
	                var pv = dom[pk];
	                if(typeof pv == 'object'){
	                    if(pv['type'] == 'tag'){
	                        getText(pv['children']);
	                    }else if(pv['type'] == 'text'){
	                        text += pv['data'];
	                    }
	                }
	            }
	         };
	         getText(dom);
	    }
    }, { verbose: false });
	var parser = new htmlparser.Parser(handler);
	parser.parseComplete(html);
	return exports.html_decode(text);
}


exports.get_summary = function(html){
    var text = get_text_from_html(html);
    var len = text.length < config.diary_summary_size[1]?text.size:config.diary_summary_size[1];
    return text.substring(0, len);
};