var sys = require("sys")
    ,crypto = require('crypto')
    ,config = require('../config').config
    ,site = require('../controllers/site')
    ,DB = require("../models")
    ,User = DB.Table('User')
    ,Diary = DB.Table('Diary')
    ,ObjID = DB.ObjID
    ,EventProxy = require("eventproxy").EventProxy
    ,htmlparser = require("htmlparser")
    ,fs = require('fs')
    ,sys = require('util')
    ,http = require('http');
    
    
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

var genId = function(tag){
    var d = new Date();
    var tmp_id = d.getTime();
    return tag + parseInt(tmp_id, 16) + exports.randomString(8);
};

exports.genId = genId;

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


exports.isint = function(val){
   if(!isNaN(val)){
      return true;
   }else{
      return false;
   }
};

var log = function(info){
    if(config.DEBUG == true){
        var log_info = sys.inspect(info, true, null) + '\t' + exports.dateFormat(new Date());
        console.log(log_info);
        log_file(log_info)
    }
};

var log_file = function(info){
    var tmp_file_name = "info.log";
    info = info + '\n';
    var tmp_img_url = process.cwd() + config.log_dir + tmp_file_name;
    
    fd = fs.openSync(tmp_img_url, 'a+');
    
    fs.writeSync(fd, info, 0, info.length, null);
    fs.closeSync(fd);
};

exports.log = log;

exports.dateFormat = function(cd){
   if(cd){
      var tz = cd.getTimezoneOffset();
      var off = config.time_zone + tz;
      cd.setHours(cd.getHours() + off);
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
  if(typeof str == 'undefined'){
    return '';
  }
  var s = str.replace(/\n/g,'<br/>');
  s = s.replace(/\n\r/g,'<br/>');
  s = s.replace(/' '/g,'&nbsp;');
  s = s.replace(/'"'/g,'&quot;');
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

             if(paths[i].indexOf(':') == 0){
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

                // 如果最后一个是:page 而且当前paths_obj最后一个元素是数字也匹配
                if(ops && ops.length > 0 && paths && paths.length > 0){
                      if(ops[ops.length - 1] == ":page" && exports.isint(paths[paths.length - 1])){
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
                var gcfunc = get_ctrl_func(req.path, req.method);
                
                if(gcfunc){
                    gcfunc(req,res,next);
                }else{
                    res.redirect('/');
                }
            }else{
                res.redirect('user/login?p='+req.path);
            }
        });
        
    }
   
};

exports.render_at = function(str){
    if(typeof str == 'undefined' || str == ""){
       return "";
    }
    var nstr = str;
    var atP = /@\S+[:\s]/g;
    var index = 0;
    while(1){
         var matches = atP.exec(str);

         if(matches == null || typeof matches.length == 'undefined' || matches.length <= 0){
             break;
         }else{

             var repstr = '<span class="at-span">' + matches[0] + '&nbsp;</span>';
             nstr = nstr.replace(matches[0], repstr);
         }
         
    }

    return nstr;
}

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

var thumb = function(url, size,prefix,file_ext, callback){
    var tmp_file_name = "";
    if (typeof size == 'object'){
        tmp_file_name = genId(prefix) + size.psize + file_ext;
    }else{
        tmp_file_name = genId(prefix) + size + file_ext;
    }
    
    var tmp_img_url = process.cwd() + config.diary_img + tmp_file_name;


    var thumber_url = config.thumber_url;
    var dslash_pos = -1;
    var rhost = "";
    var rpath = "";
    dslash_pos = thumber_url.indexOf('//');
    var sub_thumber_url = thumber_url;
    
    if(dslash_pos != -1){
        
        sub_thumber_url = thumber_url.substring(dslash_pos + 2);
        
    }

    rhost = sub_thumber_url.substring(0, sub_thumber_url.indexOf('/'));
    rpath = sub_thumber_url.substring(sub_thumber_url.indexOf('/'));
 
    if(typeof size == 'object'){
        rpath = rpath + "?u=" + url + "&size=" + size.psize + "&w=" + size.pw + "&h=" + size.ph + "&x=" + size.px + "&y=" + size.py;
    }else{
        rpath = rpath + "?u=" + url + "&size=" + size;
    }
    
    var options = {
        host: rhost,
        port: 80,
        path: rpath,
        method: 'GET'
    };
    log(options);
    var req = http.request(options, function(res) {
         log('STATUS: ' + res.statusCode);
         log('HEADERS: ' + JSON.stringify(res.headers));
         //res.setEncoding('utf8');
         res.on('data', function (chunk) {
           if(chunk){
              fs.appendFileSync(tmp_img_url,chunk);
           }
         });
         res.on('end',function(){
           
            
         });
    });

    req.on('error', function(e) {
       log('problem with request: ' + e.message)
    });

    req.end();
};


exports.thumb_avatar = function(user_email, img_path, size, file_ext, callback){
    
    var tmp_img_url = process.cwd() + config.diary_img + img_path;
    var http_img_url = config.site_base + config.diary_url + img_path;

    thumb(http_img_url,size,'a',file_ext,function(imgurl){

              User.update( {"email":user_email},{$set:
                                {
                                  "avatar":imgurl
                                }
                              }, {},function(err){
                    if(err) return next(err);  
                    callback(imgurl);      
          });
    });
};

/*
exports.create_cache_img = function(diary){
    if(!diary.up_img || diary.up_img == "" || !diary.up_img_thumb || diary.up_img_thumb == "" || !diary.up_img_thumb_big || diary.up_img_thumb_big == ""){
        return null;
    }

    var  cache_img = config.diary_url + config.diary_img;

    return cache_img;
};

*/
exports.thumb = thumb;


exports.thumb_img = function(up_img,diary_id, file_ext){
    // 源文件
    // up_img buffer数据
    
    var tmp_img_url = process.cwd() + config.diary_img + up_img;
    var http_img_url = config.site_base + config.diary_url + up_img;
    
    thumb(http_img_url,100,'g',file_ext,function(imgurl){
          
          Diary.update( {"_id":diary_id},{$set:
                                {
                                  "up_img_thumb":imgurl
                                }
                              }, {},function(err){
                    if(err) return next(err);          
          });
    });

    thumb(http_img_url,350,'g',file_ext,function(imgurl){
          Diary.update( {"_id":diary_id},{$set:
                                {
                                  "up_img_thumb_big":imgurl
                                }
                              }, {},function(err){
                    if(err) return next(err);          
          });
          
     });

};


exports.filte_face_img = function(str){
   if(!str) return "";

   for(var k in config.face_imgs){
       var varr = config.face_imgs[k];
       var titlev = varr[0];
       var facev = varr[1];
       var title = titlev.substring(1,titlev.length-1);
       var face_img = '<img class="view-face" src="'+ (config.icon_img_url + facev) +'" title="'+title+'" alt="' + title + '">';
       var p = new RegExp(titlev,"ig");
       str = str.replace(p, face_img);

   }

   return str;
}