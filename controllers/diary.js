var DB = require("../models")
    ,Diary = DB.Table('Diary')
    ,User = DB.Table('User')
    ,Comment = DB.Table('Comment')
    ,UserCollectDiary = DB.Table('UserCollectDiary')
    //,GridStore = DB.GridStore
    ,ObjID = DB.ObjID
    ,config = require('../config').config
    ,check = require('validator').check
    ,sanitize = require('validator').sanitize
    ,lutil = require('../utils/util')
    ,fs = require('fs')
    ,path = require('path')
    ,EventProxy = require("eventproxy").EventProxy
    ,page = require('./page')
    ,dbutil = require("../models/dbutil");

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
    
	var method = req.method.toLowerCase();
	if(method == "get"){
	    lutil.userinfo(req, function(user){
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
	    lutil.userinfo(req, function(user){
			var title = sanitize(req.body.title).trim();
			var content = sanitize(req.body.content).xss();
		
	        var summary = lutil.get_summary(content);
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
			    res.render('diary/add',{title:config.name,error_msg:err_msg,content:content,summary:summary,diary_title:title,diary_config:diary_config,config:config,userinfo:user});
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
			    res.render('diary/add',{title:config.name,error_msg:err_msg,content:content,summary:summary,diary_title:title,diary_config:diary_config,config:config,userinfo:user});
			    return;
			}
			
	        
			var proxy = new EventProxy();
			
	        
			var target_path = "";
	        var no_up_img = true;
	        
	        
			if(req.files.up_img && req.files.up_img.size > 0){
			    no_up_img = false;
				// 验证文件的大小
				if(req.files.up_img.size >= config.diary_img_size){
				   err_msg += "上传图片的大小应小于" + (config.diary_img_size / 1024 / 1024)+"M";
				   res.render('diary/add',{title:config.name,error_msg:err_msg,content:content,summary:summary,diary_title:title,diary_config:diary_config,config:config,userinfo:user});
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
				   res.render('diary/add',{title:config.name,error_msg:err_msg,content:content,summary:summary,diary_title:title,diary_config:diary_config,config:config,userinfo:user});
		           return;
		        }
		        target_path = "";
		        target_path =  lutil.genId("g") + fileext;
		        if(config.IMG_PERSISTENT == "file"){
		        	// 指定文件上传后的目录 
			        // 不适用图片的扩展名
			        
			        var full_img_path = process.cwd() + config.diary_img + target_path;
			        
			        fs.rename(tmp_path, full_img_path, function (err) {
		                if (err) {
		                    return next(err);
		                }
		                proxy.trigger('save');
		            });
		        }else{
		        	// 这里解决保存到数据库中了
		        	fs.readFile(tmp_path, function (err, data) {
                         target_path = data;
                         
                         proxy.trigger('save');
                    });
		        
		        }
		        
	        }
	        proxy.once("save",function(save){
	            lutil.userinfo(req, function(user){
		        //保存日志
				// 还是最好先确认数据格式
				    var diary = {};
				    diary._id = lutil.genId("d");
			     	diary.title = title;
			    	diary.content = content;
		            diary.summary = summary;
				    diary.create_date = new Date();
				    diary.edit_date = new Date();
				    diary.up_img = target_path;
				    diary.up_img_thumb = "";     // 100X100
				    diary.up_img_thumb_big = ""; // 350X350
				    diary.up_img_ext = fileext;
				    diary.author = user.email;
				    diary.view_num = 0;
					diary.comment_num = 0;
				    diary.type = diary_type;
				
				    Diary.save(diary, function(err){
				        if(err) return next(err);
				        dbutil.update_user_score(user.email,2,function(){
				        	if(diary.up_img){
				        		lutil.thumb_img(diary.up_img, diary._id, fileext);
				        	}
				        	
	                        res.redirect('/diary/'+user._id+'/mlist');
	                    });
				        
				    });
	             });
	        });
	        
	        if(no_up_img) {
	            proxy.trigger('save');
	        }
	    });
	}
	
	
};


exports.edit = function(req, res, next){
    
	var method = req.method.toLowerCase();
	var proxy = new EventProxy();
	var diary_id = ObjID(req.params.did);
	if(method == "get"){
	    lutil.userinfo(req, function(user){
	       

       		Diary.findOne({"_id":diary_id}, function(err, diary){
	               
	               if(err) return next(err);
	               
	               proxy.trigger('torender', diary);
	        }); 
	          
		    proxy.once("torender", function (gdiary) {
		        res.render('diary/edit', {
		    	    title       :config.name,
		    	    error_msg   :"",
		    	    diary       :gdiary,
	                diary_config:diary_config,
	                config      :config,
	                userinfo    :user
		    	});
	        });

	    });
	}
	
	if(method == "post"){
	    lutil.log("edit diary post begin.");
		var title = sanitize(req.body.title).trim();
		var content = sanitize(req.body.content).xss();
	
        var summary = lutil.get_summary(content);
        
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
		    res.render('diary/edit',{title:config.name,error_msg:err_msg,content:content,summary:summary,diary_title:title,diary_config:diary_config,config:config});
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
		    res.render('diary/edit',{title:config.name,error_msg:err_msg,content:content,summary:summary,diary_title:title,diary_config:diary_config,config:config});
		    return;
		}
		
		var target_path = "";
        
        var no_up_img = true;
        var fileext = "";
        
		if(req.files.up_img && req.files.up_img.size > 0){
		    no_up_img = false;
		    
			// 验证文件的大小
			if(req.files.up_img.size >= config.diary_img_size){
			   err_msg += "上传图片的大小应小于" + (config.diary_img_size / 1024 / 1024)+"M";
			   res.render('diary/edit',{title:config.name,error_msg:err_msg,content:content,summary:summary,diary_title:title,diary_config:diary_config,config:config});
			   return;
			}
			
			 // 获得文件的临时路径
	        var tmp_path = req.files.up_img.path;
	        
	        var up_img_name = req.files.up_img.name;
	        fileext = path.extname(up_img_name);
	        
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
			   res.render('diary/edit',{title:config.name,error_msg:err_msg,content:content,summary:summary,diary_title:title,diary_config:diary_config,config:config});
	           return;
	        }
            target_path = "";
		    target_path =  lutil.genId("g") + fileext;
		    
	        
	        var img_buff = null;
	        if(config.IMG_PERSISTENT == "file"){
	        	// 指定文件上传后的目录 
		        // 不适用图片的扩展名
		        var full_img_path = process.cwd() + config.diary_img + target_path;
			        
			        fs.rename(tmp_path, full_img_path, function (err) {
		                if (err) {
		                    return next(err);
		                }
		                proxy.trigger('update');
		        });
	        }else{
	        	// 这里解决保存到数据库中了
	        	fs.readFile(tmp_path, function (err, data) {
	        		 if(err) throw err;
                     target_path = data;
                     
                     proxy.trigger('update');
                });
	        
	        }
        }
        proxy.once("update",function(update){
           
            lutil.userinfo(req, function(user){
	            //更新日志
	            if(user){
		            Diary.findOne({"_id":diary_id},function(err, diary){
		            	if(err) return next(err);
	                    if(diary && diary.author == user.email){
						    Diary.update( {"_id":diary_id},{$set:
						                    {
						                      "title":title,"content":content,"summary":summary,"edit_date":new Date(),
						                      "up_img":target_path,"up_img_thumb":"","type":diary_type,"up_img_ext":fileext
						                    }
						                  }, {},function(err){
						        if(err) return next(err);

						        if(target_path){
						        	lutil.thumb_img(target_path, diary._id, fileext);
						        }
						        
						        res.redirect('/diary/'+user._id+'/mlist');
						    });
	                    }else{
	                    	res.redirect('/diary/'+user._id+'/mlist');
	                    }
	                });

	            }

             });
        });
        
        if(no_up_img) {
            proxy.trigger('update');
        }
	}
	
};


exports.list = function(req, res, next){
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
	   
	   proxy.once("renderto",function(diarys,uinfo){
            var pageData = page.createPage(pageno, total_page);
		    res.render('diary/list', {
		        title       :config.name,
		    	diarys      :diarys,
	            diary_config:diary_config,
                config      :config,
                pageData    :pageData,
                req_path    :req.path,
                userinfo    :uinfo,
                hot_diarys  :hot_diarys,
				active_users:active_users,
		    });
            DB.close();
	   });

	   	proxy.once("get_active_users", function(diarys, uinfo){
			   User.find({},{sort:[['score', -1]],skip: config.PAGE_SIZE * (pageno - 1), limit:10}).toArray(function(err, users){
	           if(err) return next(err);
	               for(var i = 0 ; i < users.length;i++){
	               	   if(users[i].email == config.admin_email){continue;}
					   active_users[active_users.length ] = users[i];
	                }
	               
	                proxy.trigger('renderto',diarys, uinfo);

                 });
			});

	    proxy.once("get_hot_diarys", function(diarys, uinfo){
	        
		   Diary.find({},{sort:[['view_num', -1]],skip: config.PAGE_SIZE * (pageno - 1), limit:10}).toArray(function(err, s_diarys){
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

                   s_diarys[i].content = s_diarys[i].summary;
				   hot_diarys[hot_diarys.length ] = s_diarys[i];
                }
               
                proxy.trigger('get_active_users',diarys, uinfo);

             });
		});
	   
	   proxy.once("get_nickname",function(diarys,uinfo){
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
	       if(diarys_len <= 0){
	       	   proxy.trigger('get_hot_diarys',diarys,uinfo);
	       }else{
	       	   proxy.trigger('get_sub_nickname',0);
	       }
		   
	   });

       
	   lutil.userinfo(req, function(uinfo){
		   proxy.once("get_list",function(){
		       Diary.find({"type":"public"},{sort:[['create_date', -1]],skip: config.PAGE_SIZE * (pageno - 1), limit:config.PAGE_SIZE}).toArray(function(err, diarys){
		        if(err) return next(err);
		            for(var i = 0 ; i < diarys.length;i++){
		               diarys[i].create_date = lutil.dateFormat(diarys[i].create_date);
		               diarys[i].edit_date = lutil.dateFormat(diarys[i].edit_date);
		               var up_img = diarys[i].up_img;
	                   if(up_img && up_img._bsontype && up_img._bsontype == 'Binary'){
	                   	   diarys[i].up_img = lutil.create_cache_img(diarys[i]);
	                   	   
	                   }else{
	                   	   if(diarys[i].up_img && diarys[i].up_img != ""){
                                diarys[i].up_img = config.diary_url + diarys[i].up_img;
	                   	   }
	                   }

		              
		               diarys[i].content = diarys[i].summary;
		            }
		       
		            proxy.trigger('get_nickname',diarys,uinfo);
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
	   

	  });

	}
};




exports.view = function(req, res, next){
    var method = req.method.toLowerCase();
	if(method == "get"){
	   var gdiary = null;
	   var proxy = new EventProxy();
       var nickname = "";
       var diary_id_p = req.params.did;
       var diary_id = ObjID(req.params.did);
       var author_diarys = [];
       var author_collect_diarys = [];
       var author_info = null;
       var userinfo = null;
       
       var get_nickname = function(diary){
	       proxy.assign("get_nickname",function(obj){
	          User.findOne({"email":diary.author}, function(err, user){
	          	  if(user){
	          	     diary.author_nickname = user.nickname;
	          	  }
	              
	              proxy.trigger('update_view_num');
	          });
	       });
	       proxy.trigger('get_nickname');
       };

       proxy.once("renderto",function(){
            
                res.render('diary/view', {
	    	      title:config.name,
	    	      diary:gdiary,
                  diary_config:diary_config,
                  config:config,
                  userinfo:userinfo,
                  "author_info":author_info,

                  "author_diarys":author_diarys,
                  "author_collect_diarys":author_collect_diarys
                });
       });

       proxy.once("get_login_userinfo",function(){
             lutil.userinfo(req, function(user){
             	userinfo = user;
             	proxy.trigger('get_diary');
             });
       });
       
	   proxy.once("get_diary", function (img) {
	       Diary.findOne({"_id":diary_id}, function(err, diary){
	           
	           diary.create_date = lutil.dateFormat(diary.create_date);
               diary.edit_date = lutil.dateFormat(diary.edit_date);
               /*
               var up_img = diary.up_img;
               if(up_img && up_img._bsontype && up_img._bsontype == 'Binary'){
               	  
               	   diary.up_img = lutil.create_cache_img(diary);
               	   
               }else{
               	   	if(diary.up_img && diary.up_img != ""){
                        diary.up_img = config.diary_url + diary.up_img;
	                }
               }*/

		       
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
			    proxy.trigger('get_author_info');

			});
           
       });

        proxy.once("get_author_info",function(){
        	dbutil.find_user_by_email(gdiary.author, function(a_info){
                 author_info = a_info;
                 proxy.trigger('get_author_diarys');
        	});
       });

       proxy.once("get_author_diarys",function(){
       	    var filte_param = {};
       	    filte_param.author = gdiary.author;
       	    if(userinfo){
                if(userinfo.email != gdiary.author){
                    filte_param.type =  config.diary_type.public;
                }
       	    }else{
       	    	filte_param.type = config.diary_type.public;
       	    }
       	    
            Diary.find(filte_param,{sort:[['create_date', -1]], limit:10}).toArray(function(err, s_diarys){
	           if(err) return next(err);
	               for(var i = 0 ; i < s_diarys.length;i++){
					   author_diarys[author_diarys.length ] = s_diarys[i];
	                }
	               
	                proxy.trigger('get_author_collect_diarys');

            });
       });

        proxy.once("get_author_collect_diarys",function(diary){
        	
            UserCollectDiary.find({"email":gdiary.author},{sort:[['collect_date', -1]], limit:10}).toArray(function(err, s_collect_diarys){
	           if(err) return next(err);
               var idx = 0;
               var s_collect_diarys_len = s_collect_diarys.length;
               
	           proxy.assignAlways("get_collect_diary",function(idx){
	               var s_collect_diary = s_collect_diarys[idx];

	               dbutil.find_diary_by_id(s_collect_diary.diary_id,function(s_diary){
		               	var is_self = true;
			        	if(userinfo){
			                if(userinfo.email != gdiary.author){
			                    is_self = false;
			                }
			        	}else{
                            is_self = false;
			        	}
			        	if(is_self || s_diary.type == config.diary_type.public){
                            author_collect_diarys[author_collect_diarys.length] = s_diary;
			        	}
                        
	                        idx++;
						    if(idx < s_collect_diarys_len){
						        proxy.trigger('get_collect_diary',idx);
						    }else{
						        proxy.trigger('renderto');
						    }
	                    });
	              });
	              if(s_collect_diarys_len > 0){
	              	 proxy.trigger('get_collect_diary',idx);
	              }else{
	              	 proxy.trigger('renderto');
	              }

            });
       });



       proxy.trigger('get_login_userinfo');

	}
};

exports.del = function(req, res, next){
    var diary_id = ObjID(req.params.did);

    // 先删图片，所以要先查图片的链接
    Diary.findOne({"_id":diary_id}, function(err, diary){
        if(err) return next(err);
        // 删除图片啊个
        if(config.IMG_PERSISTENT == "file"){
	        var tar_img_path = process.cwd() + config.diary_img + diary.up_img;
	        fs.unlink(tar_img_path, function() {
		        if (err) throw err;
		        console.log('remove img ' + tar_img_path);
		    });
	    }
	    if(diary){
	    	lutil.userinfo(req, function(uinfo){
	    		if((uinfo && uinfo.email == diary.author)|| (uinfo && uinfo.email == config.admin_email)){
				    Diary.remove({"_id":diary_id}, function(err){
		               
				       if(err) return next(err);
				       
				       UserCollectDiary.remove({"diary_id":diary_id},function(err){
				       	   // 删评论
					       Comment.findOne({"diary_id":diary_id},function(err, comment){
					       	   lutil.log(comment);
					       	   if(comment){
					       	   	    Comment.remove({"diary_id":diary_id}, function(err){
					                    if(err) return next(err);
						                res.send('1');
					                });
					       	   }else{
					       	   	    res.send('1');
					       	   }
			               });
				       });

				    }); 
	    		}else{
	    			res.send('2');
	    		}

	    	});
		    
        } 
    });  
 


};

exports.collect = function(req, res, next){

   var diary_id_p = req.body.diary_id;

   var diary_id = ObjID(req.body.diary_id);


   var email = req.body.email;
   var isload = req.body.isload;

  
   var proxy = new EventProxy();

    proxy.once("get_collect_num",function(){
        var d_has_collect = false;
        var d_collect_num = 0;
      	dbutil.get_collect_num(diary_id_p,function(collect_num){
      		d_collect_num = collect_num;
            if(email && email != ""){
             	dbutil.has_collect(diary_id_p,email,function(has_collect){
                     d_has_collect = has_collect;

                     var resobj = {"has_collect":d_has_collect,"collect_num":d_collect_num,"collect_email":email,"diary_id":diary_id_p};
                     res.send(JSON.stringify(resobj));
             	});
             }else{
             	var resobj = {"has_collect":d_has_collect,"collect_num":d_collect_num,"collect_email":email,"diary_id":diary_id_p};
                res.send(JSON.stringify(resobj));
             }
      	});
      					    	      
   });

   if(email && email != "" && isload == 0){

	   proxy.once("do_collect",function(){
		   UserCollectDiary.findOne({"email":email,"diary_id":diary_id}, function(err, userCollectDiary){
			    if(err) return next(err);

			    if(userCollectDiary == null){
				     var userDiary = {};
				     userDiary._id = lutil.genId("ud");
				     userDiary.email = email;
				     userDiary.diary_id = diary_id;
				     userDiary.collect_date = new Date();
                     
			         UserCollectDiary.save(userDiary, function(err){
		   		        if(err) return next(err);
		   		        proxy.trigger('get_collect_num');
					        
			          });
			    }else{
			    	UserCollectDiary.remove({"email":email,"diary_id":diary_id}, function(err){
				       if(err) return next(err);
					    proxy.trigger('get_collect_num');
		           });
			    }
			});
	   });
	   proxy.trigger('do_collect');
   }else{
   	   proxy.trigger('get_collect_num');
   }


};

exports.collection = function(req, res, next){

   var pageno = 1;
   if(req.params.page){
      pageno = parseInt(req.params.page);
   }
   var proxy = new EventProxy();
   var total_page = 0;
   var hot_diarys = [];
   var active_users = [];
   
   proxy.once("renderto",function(diarys,uinfo){
        var pageData = page.createPage(pageno, total_page);
	    res.render('diary/collection', {
	        title       :config.name,
	    	diarys      :diarys,
            diary_config:diary_config,
            config      :config,
            pageData    :pageData,
            req_path    :req.path,
            userinfo    :uinfo,
            hot_diarys  :hot_diarys,
			active_users:active_users,
	    });
        DB.close();
   });

   	proxy.once("get_active_users", function(diarys, uinfo){
		   User.find({},{sort:[['score', -1]], limit:10}).toArray(function(err, users){
           if(err) return next(err);
               for(var i = 0 ; i < users.length;i++){
               	   if(users[i].email == config.admin_email){continue;}
				   active_users[active_users.length ] = users[i];
                }
               
                proxy.trigger('renderto',diarys, uinfo);

             });
    });

    proxy.once("get_hot_diarys", function(diarys, uinfo){
	   Diary.find({},{sort:[['view_num', -1]], limit:10}).toArray(function(err, s_diarys){
       if(err) return next(err);
           for(var i = 0 ; i < s_diarys.length;i++){
               s_diarys[i].create_date = lutil.dateFormat(s_diarys[i].create_date);
               s_diarys[i].edit_date = lutil.dateFormat(s_diarys[i].edit_date);
               s_diarys[i].content = s_diarys[i].summary;
			   hot_diarys[hot_diarys.length ] = s_diarys[i];
            }
           
            proxy.trigger('get_active_users',diarys, uinfo);

         });
	});
   
   proxy.once("get_nickname",function(diarys,uinfo){
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
       if(diarys_len <= 0){
       	   proxy.trigger('get_hot_diarys',diarys,uinfo);
       }else{
       	   proxy.trigger('get_sub_nickname',0);
       }
	   
   });

   
   
	proxy.once("get_list",function(uinfo){
	    UserCollectDiary.find({"email":uinfo.email},{sort:[['collect_date', -1]],skip: config.PAGE_SIZE * (pageno - 1), limit:config.PAGE_SIZE}).toArray(function(err, s_collect_diarys){
           if(err) return next(err);
           var idx = 0;
           var s_collect_diarys_len = s_collect_diarys.length;

           var author_collect_diarys = [];
           proxy.assignAlways("get_collect_diary",function(idx){
               var s_collect_diary = s_collect_diarys[idx];

               dbutil.find_diary_by_id(s_collect_diary.diary_id,function(s_diary){
               	    s_diary.create_date = lutil.dateFormat(s_diary.create_date);
		            s_diary.edit_date = lutil.dateFormat(s_diary.edit_date);
		            /*
		            var up_img = s_diary.up_img;
                    if(up_img && up_img._bsontype && up_img._bsontype == 'Binary'){
                   	    s_diary.up_img = lutil.create_cache_img(s_diary);
                    }else{
                    	  if(s_diary.up_img && s_diary.up_img != ""){
                                s_diary.up_img = config.diary_url + s_diary.up_img;
	                   	  }
                    }
                    */

		            s_diary.content = s_diary.summary;

                    author_collect_diarys[author_collect_diarys.length] = s_diary;
                        idx++;
					    if(idx < s_collect_diarys_len){
					        proxy.trigger('get_collect_diary',idx);
					    }else{
					        proxy.trigger('get_nickname',author_collect_diarys,uinfo);
					    }
                    });
              });
              if(s_collect_diarys_len > 0){
              	 proxy.trigger('get_collect_diary',idx);
              }else{
              	 proxy.trigger('get_nickname',author_collect_diarys,uinfo);
              }

        });
	});

	lutil.userinfo(req, function(uinfo){
	   proxy.once("get_total",function(){
	      UserCollectDiary.find({"email":uinfo.email}).toArray(function(err, userCollectDiary){
	      	  var total_items = 0;
	      	  if(userCollectDiary){
	      	  	  total_items = userCollectDiary.length;
	      	  }
	          
	          total_page = Math.floor ( (total_items + config.PAGE_SIZE - 1) / config.PAGE_SIZE );
	          
	          proxy.trigger('get_list',uinfo);
	      });
	   });
	   proxy.trigger('get_total');
	});
	   
	
      
};


exports.mlist = function(req, res, next){
   var pageno = 1;
   if(req.params.page){
      pageno = parseInt(req.params.page);
   }
   var uid = req.params.uid;

   var proxy = new EventProxy();
   var total_page = 0;
   var author_diarys = [];
   var author_collect_diarys = [];
   var author_info = null;
   var userinfo = null;
   
   proxy.once("renderto",function(diarys){
   	   
        var pageData = page.createPage(pageno, total_page);
	    res.render('diary/mlist', {
	        title       :config.name,
	    	diarys      :author_diarys,
            diary_config:diary_config,
            config      :config,
            pageData    :pageData,
            req_path    :req.path,
            userinfo    :userinfo,
            "author_info":author_info,
            "author_collect_diarys"  :author_collect_diarys
	    });
        DB.close();
   });


    proxy.once("get_author_collect_diarys",function(diary){
        UserCollectDiary.find({"email":author_info.email},{sort:[['collect_date', -1]], limit:10}).toArray(function(err, s_collect_diarys){
           if(err) return next(err);
           var idx = 0;
           var s_collect_diarys_len = s_collect_diarys.length;
           
           proxy.assignAlways("get_collect_diary",function(idx){
               var s_collect_diary = s_collect_diarys[idx];

               dbutil.find_diary_by_id(s_collect_diary.diary_id,function(s_diary){
                    author_collect_diarys[author_collect_diarys.length] = s_diary;
                        idx++;
					    if(idx < s_collect_diarys_len){
					        proxy.trigger('get_collect_diary',idx);
					    }else{
					        proxy.trigger('renderto');
					    }
                    });
              });
              if(s_collect_diarys_len > 0){
              	 proxy.trigger('get_collect_diary',idx);
              }else{
              	 proxy.trigger('renderto');
              }

        });
   });
   
   proxy.once("get_nickname",function(){
       var diarys_len = author_diarys.length;

       proxy.assignAlways("get_sub_nickname",function(idx){
           var diary = author_diarys[idx];
	       User.findOne({"email":diary.author}, function(err, user){
	       	  if(user){
	       	  	 diary.author_nickname = user.nickname;
	       	  }
		      
		      idx++;
		      if(idx < diarys_len){
		          proxy.trigger('get_sub_nickname',idx);
		      }else{
		          proxy.trigger('get_author_collect_diarys');
		      }
		   });
       });
       if(diarys_len <= 0){
       	   proxy.trigger('get_author_collect_diarys');
       }else{
       	   proxy.trigger('get_sub_nickname',0);
       }
	   
   });

   
   
	proxy.once("get_list",function(){
		var s_obj = {"author":author_info.email,"type":"public"};
    	if(userinfo && userinfo.email == author_info.email){
            s_obj = {"author":author_info.email};
    	}

		Diary.find(s_obj,{sort:[['create_date', -1]], skip: config.PAGE_SIZE * (pageno - 1),limit:config.PAGE_SIZE}).toArray(function(err, s_diarys){
           if(err) return next(err);
               for(var i = 0 ; i < s_diarys.length;i++){
               	    var s_diary = s_diarys[i]
               	    s_diary.create_date = lutil.dateFormat(s_diary.create_date);
		            s_diary.edit_date = lutil.dateFormat(s_diary.edit_date);
		            /*
		            var up_img = s_diary.up_img;
                    if(up_img && up_img._bsontype && up_img._bsontype == 'Binary'){
                   	    s_diary.up_img = lutil.create_cache_img(s_diary);
                   	   
                    }else{
                   	      if(s_diary.up_img && s_diary.up_img != ""){
                                s_diary.up_img = config.diary_url + s_diary.up_img;
	                   	  }
                    }
                    */
		            s_diary.content = s_diary.summary;
				    author_diarys[author_diarys.length ] = s_diary;
                }
               
                proxy.trigger('get_nickname');

        });
	});

    proxy.once("get_login_userinfo", function(){
	    lutil.userinfo(req, function(uinfo){
	       userinfo = uinfo;
	       proxy.trigger('get_total');
           
	    });
    });

    proxy.once("get_total",function(){
    	var s_obj = {"author":author_info.email,"type":"public"};
    	if(userinfo && userinfo.email == author_info.email){
            s_obj = {"author":author_info.email};
    	}
	    Diary.find(s_obj).toArray(function(err, s_diarys){
	      	var total_items = 0;
	      	if(s_diarys){
	      	    total_items = s_diarys.length;
	      	}
	          
	        total_page = Math.floor ( (total_items + config.PAGE_SIZE - 1) / config.PAGE_SIZE );
	          
	        proxy.trigger('get_list');
	    });

	});

    dbutil.find_user_by_id(uid, function(ainfo){
        author_info = ainfo;

        proxy.trigger('get_login_userinfo');
	    
    });
	   
	
      
};



exports.search = function(req, res, next){

   var pageno = 1;
   if(req.params.page){
      pageno = parseInt(req.params.page);
   }


   var keyword = sanitize(req.params.keyword).xss();
   keyword = keyword.substring(1); // 除掉第一个关键字标识符
   var proxy = new EventProxy();
   var total_page = 0;
   var hot_diarys = [];
   var active_users = [];
   
   proxy.once("renderto",function(diarys,uinfo){
        var pageData = page.createPage(pageno, total_page);
	    res.render('diary/search', {
	        title       :config.name,
	    	diarys      :diarys,
            diary_config:diary_config,
            config      :config,
            pageData    :pageData,
            req_path    :req.path,
            userinfo    :uinfo,
            hot_diarys  :hot_diarys,
			active_users:active_users,
			keyword : keyword
	    });
        DB.close();
   });

   	proxy.once("get_active_users", function(diarys, uinfo){
		   User.find({},{sort:[['score', -1]], limit:10}).toArray(function(err, users){
           if(err) return next(err);
               for(var i = 0 ; i < users.length;i++){
               	   if(users[i].email == config.admin_email){continue;}
				   active_users[active_users.length ] = users[i];
                }
               
                proxy.trigger('renderto',diarys, uinfo);

             });
    });

    proxy.once("get_hot_diarys", function(diarys, uinfo){
	   Diary.find({},{sort:[['view_num', -1]], limit:10}).toArray(function(err, s_diarys){
       if(err) return next(err);
           for(var i = 0 ; i < s_diarys.length;i++){
               s_diarys[i].create_date = lutil.dateFormat(s_diarys[i].create_date);
               s_diarys[i].edit_date = lutil.dateFormat(s_diarys[i].edit_date);
               s_diarys[i].content = s_diarys[i].summary;
			   hot_diarys[hot_diarys.length ] = s_diarys[i];
            }
           
            proxy.trigger('get_active_users',diarys, uinfo);

         });
	});
   
   proxy.once("get_nickname",function(diarys,uinfo){
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
       if(diarys_len <= 0){
       	   proxy.trigger('get_hot_diarys',diarys,uinfo);
       }else{
       	   proxy.trigger('get_sub_nickname',0);
       }
	   
   });


   var reg_key = '/.*' + keyword + '.*/i';
   
	proxy.once("get_list",function(uinfo){
		try{
	       
			var pattern = eval(reg_key);
            var fuzzy_param = {title:{$regex:pattern},summary:{$regex:pattern},"type":"public"};

	        Diary.find(fuzzy_param,{sort:[['create_date', -1]],skip: config.PAGE_SIZE * (pageno - 1), limit:config.PAGE_SIZE}).toArray(function(err, diarys){
		        if(err) return next(err);
		            for(var i = 0 ; i < diarys.length;i++){
		               diarys[i].create_date = lutil.dateFormat(diarys[i].create_date);
		               diarys[i].edit_date = lutil.dateFormat(diarys[i].edit_date);
		               /*
		               var up_img = diarys[i].up_img;
	                   if(up_img && up_img._bsontype && up_img._bsontype == 'Binary'){
	                   	   diarys[i].up_img = lutil.create_cache_img(diarys[i]);
	                   	   
	                   }else{
	                   	    if(diarys[i].up_img && diarys[i].up_img != ""){
                                diarys[i].up_img = config.diary_url + diarys[i].up_img;
	                   	    }
	                   }
	                   */

		               
		               diarys[i].content = diarys[i].summary;
		            }
		       
		            proxy.trigger('get_nickname',diarys,uinfo);
		    });
	    }catch(e){
               proxy.trigger('get_nickname',[],uinfo);
	    }
	});

	lutil.userinfo(req, function(uinfo){
	   proxy.once("get_total",function(){
	   	try{
		   	  var pattern = eval(reg_key);
	          var fuzzy_param = {title:{$regex:pattern},summary:{$regex:pattern},"type":"public"};
		      Diary.find(fuzzy_param).toArray(function(err, diarys){
		      	  var total_items = 0;
		      	  if(diarys){
		      	  	total_items = diarys.length;
		      	  }
		          
		          total_page = Math.floor ( (total_items + config.PAGE_SIZE - 1) / config.PAGE_SIZE );
		          
		          proxy.trigger('get_list');
		      });
	      }catch(e){
	   		   proxy.trigger('get_list');
	   	  }
	   });
	   proxy.trigger('get_total');
	});
	   
	
      
};


exports.admindel = function(req, res, next){
    lutil.userinfo(req, function(uinfo){
    	 if(uinfo && uinfo.email && uinfo.email == config.admin_email){
                var act = req.param('act');
                if(act == "all"){
				    Diary.remove({}, function(err){  
				       res.redirect('/diary/list');
				    });
                }else if(act == "all_user"){
				    User.remove({}, function(err){  
				       res.redirect('/diary/list');
				    });
                }else{
                	Diary.remove({'_id':act}, function(err){  
				       res.redirect('/diary/list');
				    });
                }
    	 }else{
    	 	res.redirect('/');
    	 }
    });
};




