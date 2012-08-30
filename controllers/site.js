var DB = require("../models")
    ,Diary = DB.Table('Diary')
    ,common = require('./common')
    ,config = require('../config').config;

var diary_config = {
	diary_title_size : config.diary_title_size,
	diary_content_size : config.diary_content_size,
	diary_img_size : config.diary_img_size,
    allow_img : config.allow_img.join(", "),
    diary_type:config.diary_type
};

var ObjID = DB.ObjID;

exports.index = function(req, res, next){
 var method = req.method.toLowerCase();
	if(method == "get"){
	   Diary.find({},{sort:[['create_date', -1]]}).toArray(function(err, diarys){
	        if(err) return next(err);
	            //console.log(docs);
	            for(var i = 0 ; i < diarys.length;i++){
	               diarys[i].create_date = common.dateFormat(diarys[i].create_date);
	               diarys[i].edit_date = common.dateFormat(diarys[i].edit_date);
	               if(diarys[i].up_img){
	                   diarys[i].up_img = config.diary_url + diarys[i].up_img;
	               }
	               diarys[i].content = common.index_cut_cont( diarys[i].content);
	            }
	            
		        res.render('index', {
		    	title:config.name,
		    	diarys:diarys,
	            config:diary_config
		    });
	        
	        
            DB.close();

        });

	}
};

