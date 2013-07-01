var DB = require("../models")
    ,ObjID = DB.ObjID
    ,Diary = DB.Table('Diary')
    ,User = DB.Table('User')
    ,Comment = DB.Table('Comment')
    ,UserCollectDiary = DB.Table('UserCollectDiary')
    ,lutil = require('../utils/util');


exports.update_user_score = function(email,score,callback){
    
    User.findOne({"email":email}, function(err, user){
	    if(err) return next(err);
	    if(user == null){
	       callback();
	    }else{
	    	var cur_score = user.score;
	    	if(!cur_score){
	    		cur_score = 5 + score;
	    	}else{
	    		cur_score += score;
	    	}
	    	
	        User.update( {"email":email},{$set:
		                    {
		                      "score":cur_score,
		                    }
		                  }, {},function(err){
		        if(err) 
				   return next(err);
		        callback();
		    });
	    }
	   });
};

exports.get_collect_num = function(diary_id,callback){
	var collect_num = 0;
    var diary_id = ObjID(diary_id);
    
    UserCollectDiary.find({"diary_id":diary_id}).toArray(function(err, userCollectDiarys){
        var collect_num = userCollectDiarys.length;
      
        callback(collect_num);
    });
		   
};

exports.has_collect = function(diary_id,email,callback){
	var collect_num = 0;
    var diary_id = ObjID(diary_id);
    
    UserCollectDiary.findOne({"diary_id":diary_id,"email":email},function(err, userCollectDiary){

        if(userCollectDiary == null){

        	callback(false);
        }else{

        	callback(true);
        }
    });
		   
};

exports.find_user_by_email = function(email,callback){
    
    User.findOne({"email":email},function(err, user){
        callback(user);
    });
		   
};

exports.find_user_by_id = function(uid,callback){

    User.findOne({"_id":uid},function(err, user){
        callback(user);
    });
};

exports.find_diary_by_id = function(did,callback){
	did = '' + did;
    var diary_id = did;
    Diary.findOne({"_id":diary_id},function(err, diary){
        callback(diary);
    });
		   
};


