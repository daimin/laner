var DB = require("../models")
    ,Diary = DB.Table('Diary')
    ,common = require('../utils/common')
    ,config = require('../config').config;

var ObjID = DB.ObjID;

exports.index = function(req, res, next){
  //  var loguser = common.verify(req, res);
    
    var method = req.method.toLowerCase();
	if(method == "get"){
	   Diary.find({},{sort:[['create_date', -1]]}).toArray(function(err, diarys){
	        if(err) return next(err);
	            //console.log(docs);
	            for(var i = 0 ; i < diarys.length;i++){
	               diarys[i].create_date = common.dateFormat(diarys[i].create_date);
	               diarys[i].edit_date = common.dateFormat(diarys[i].edit_date);
	               if(diarys[i].up_img_thumb){
	                   diarys[i].up_img_thumb = config.diary_url + diarys[i].up_img_thumb;
	               }
	               diarys[i].content = diarys[i].summary;
	            }
	            
		        res.render('index', {
		    	title:config.name,
		    	config:config,
		    	diarys:diarys
		    });
	        
	        
            DB.close();

        });

	}
};

