var DB = require("../models")
    ,Diary = DB.Table('Diary')
    ,User = DB.Table('User')
    ,lutil = require('../utils/util')
    ,config = require('../config').config
    ,EventProxy = require("eventproxy").EventProxy
    ,page = require('./page');

var ObjID = DB.ObjID;

exports.index = function(req, res, next){
    lutil.userinfo(req, function(uinfo){
        var method = req.method.toLowerCase(); 
	    if(method == "get"){
           var pageno = 1;
	       if(req.params.page){
	          pageno = parseInt(req.params.page);
	       }
	       var proxy = new EventProxy();
	       var total_page = 0;
		   
		   var hot_diarys = [];
		   var active_users = [];
	       
	   	   proxy.once("renderto",function(diarys, uinfo){
	   	       if(total_page > config.INDEX_ITEM_SIZE){
	               total_page = config.INDEX_ITEM_SIZE;
	           }

               var pageData = page.createPage(pageno, total_page);
		       res.render('index', {
		           title       :config.name,
		    	   diarys      :diarys,
                   config      :config,
                   pageData    :pageData,
                   req_path    :req.path,
                   userinfo    :uinfo,
				   hot_diarys  :hot_diarys,
				   active_users:active_users
		       });
               DB.close();
	       });
	       
	       	proxy.once("get_active_users", function(diarys, uinfo){
			   User.find({},{sort:[['score', -1]], limit:10}).toArray(function(err, users){
	           if(err) return next(err);
	               for(var i = 0 ; i < users.length;i++){
					   active_users[active_users.length ] = users[i];
	                }
	               
	                proxy.trigger('renderto',diarys, uinfo);

                 });
			});

		    proxy.once("get_hot_diarys", function(diarys, uinfo){
			   Diary.find({},{sort:[['view_num', -1]], limit:10}).toArray(function(err, s_diarys){
	           if(err) return next(err);
	               for(var i = 0 ; i < s_diarys.length;i++){
	               	    if(uinfo){
                           if(s_diarys[i].author != uinfo.email && s_diarys[i].type == config.diary_type.private){
                               continue;
                           }
               	        }else{
               	   	       if(s_diarys[i].type == config.diary_type.private){
               	   	   	       continue;
               	   	       }
               	        }
	                   s_diarys[i].create_date = lutil.dateFormat(s_diarys[i].create_date);
	                   s_diarys[i].edit_date = lutil.dateFormat(s_diarys[i].edit_date);
	                   if(s_diarys[i].up_img_thumb && s_diarys[i].up_img_thumb != ""){
	                   
	                       s_diarys[i].up_img_thumb = config.diary_url + s_diarys[i].up_img_thumb;
	                   }
	                   s_diarys[i].content = s_diarys[i].summary;
					   hot_diarys[hot_diarys.length ] = s_diarys[i];
	                }
	               
	                proxy.trigger('get_active_users',diarys, uinfo);

                 });
			});


	       
		   proxy.once("get_nickname",function(diarys,uinfo){
			   if(!diarys || diarys.length <= 0){
				   proxy.trigger('get_hot_diarys', null);
			   }else{
				   var diarys_len = diarys.length;
			       proxy.assignAlways("get_sub_nickname",function(idx){
			           var diary = diarys[idx];
				       User.findOne({"email":diary.author}, function(err, user){
                          if(user){
                          	diary.author_nickname = user.nickname;
                          }
					      
					      idx++;
					      if(idx < diarys_len){
					          proxy.trigger('get_sub_nickname',idx);
					      }else{

					          proxy.trigger('get_hot_diarys',diarys,uinfo);
					      }
					   });
			       });
			       
				   proxy.trigger('get_sub_nickname',0);
			   }
		       
		   });
	       
	       proxy.once("get_list",function(){
	           Diary.find({"type":"public"},{sort:[['create_date', -1]],skip: config.PAGE_SIZE * (pageno - 1), limit:config.PAGE_SIZE}).toArray(function(err, diarys){
	           if(err) return next(err);
	               for(var i = 0 ; i < diarys.length;i++){
	                   diarys[i].create_date = lutil.dateFormat(diarys[i].create_date);
	                   diarys[i].edit_date = lutil.dateFormat(diarys[i].edit_date);
	                   if(diarys[i].up_img_thumb && diarys[i].up_img_thumb != ""){
	                   
	                       diarys[i].up_img_thumb = config.diary_url + diarys[i].up_img_thumb;
	                   }
	                   diarys[i].content = diarys[i].summary;
	                }
	               
	                proxy.trigger('get_nickname',diarys, uinfo);

                 });
	        });
			
			

	   
	        proxy.once("get_total",function(){
	            Diary.find({"type":"public"}).toArray(function(err, diarys){
	            var total_items = 0;
	            if(diarys){
	            	total_items = diarys.length;
	            }
	            
	            total_page = Math.floor ( (total_items + config.PAGE_SIZE - 1) / config.PAGE_SIZE );
	            proxy.trigger('get_list');
	        });
	   });
	   
	   proxy.trigger('get_total');	   


	  }
    });
  

};

