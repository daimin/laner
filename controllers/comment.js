var DB = require("../models")
    ,Comment = DB.Table('Comment')
    ,Diary = DB.Table('Diary')
    ,User = DB.Table('User')
    ,ObjID = DB.ObjID
    ,config = require('../config').config
    ,check = require('validator').check
    ,sanitize = require('validator').sanitize
    ,lutil = require('../utils/util')
    ,fs = require('fs')
    ,path = require('path')
    ,EventProxy = require("eventproxy").EventProxy;

    
var comment_config = {
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
	    diary.create_date = lutil.dateFormat(diary.create_date);
        diary.edit_date = lutil.dateFormat(diary.edit_date);
        if(err) return next(err);
        return diary;
    });
};

exports.add = function(req, res, next){
	var method = req.method.toLowerCase();
	if(method == "post"){
		var comment_cont = sanitize(lutil.html_entries(req.body.comment)).xss();
        var diary_id = sanitize(req.body.diary_id).trim();
        var commenter = sanitize(req.body.commenter).trim();
        var cu_name = sanitize(req.body.cu_name).trim();
        var cu_contact = sanitize(req.body.cu_contact).trim();
        
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
		comment._id = lutil.genId("m");
		comment.content = comment_cont;
        comment.cu_name = cu_name;
        comment.commenter = commenter;
        comment.contact = cu_contact;
        comment.diary_id = ObjID(diary_id);
		comment.comment_date = new Date();
		
		var proxy = new EventProxy ();
		proxy.once("save_comment", function(){
		    Comment.save(comment, function(err){
		        if(err) return next(err);
		        res.send("1");
		    });		
		});
		
		proxy.once("update_diary_comment",function(){
		     Diary.findOne({"_id":ObjID(diary_id)}, function(err, diary){
		         if(err) return next(err);
		         var n_comment_num = 0;
		         if(diary['comment_num']){
		            n_comment_num = diary['comment_num'] + 1;
		         }else{
		            n_comment_num = 1;
		         }
		         
		         Diary.update({_id:ObjID(diary_id)}, {$set: {comment_num : n_comment_num}},{},function(err){
                     if(err)  return next(err);
                     proxy.trigger('save_comment');
                 });
		     });
		});
		
		 proxy.trigger('update_diary_comment');


	}
	
};



exports.list = function(req, res, next){
   var diary_id = ObjID(req.body.diary_id);
   var proxy = new EventProxy ();

   proxy.once("renderto",function(comments){
	    var comments_obj = {"comments":comments, "config":config};
	    res.send(JSON.stringify(comments_obj));
   });

   Comment.find({'diary_id':diary_id},{sort:[['comment_date', 1]]}).toArray(function(err, comments){
   	    var comments_len = comments.length;

   	    var idx = 0;
	    if(err) return next(err);
	    proxy.assignAlways("get_commenter_user",function(idx){
	         var comment = comments[idx];
	         comment.comment_date = lutil.dateFormat(comment.comment_date); 
	         comment.content = lutil.render_at(comment.content);
	         comment.floor = '#' + (idx + 1);
		       User.findOne({"email":comment.commenter}, function(err, user){

		       	  if(user){
		       	  	 comment.commenter = user;
		       	  }
			      
			      idx++;
			      if(idx < comments_len){
			          proxy.trigger('get_commenter_user',idx);
			      }else{
			          proxy.trigger('renderto',comments);
			      }
			   });
	       });

          if(comments_len > 0){
          	  proxy.trigger('get_commenter_user',idx);
          }else{
          	  proxy.trigger('renderto', comments);
          }

      });
};       

