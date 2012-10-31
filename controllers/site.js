var DB = require("../models")
    ,Diary = DB.Table('Diary')
    ,util = require('../utils/util')
    ,config = require('../config').config
    ,EventProxy = require("eventproxy").EventProxy
    ,page = require('./page');

var ObjID = DB.ObjID;

exports.index = function(req, res, next){
    util.userinfo(req, function(user){
        var method = req.method.toLowerCase();
	    if(method == "get"){
           var pageno = 1;
	       if(req.params.page){
	          pageno = parseInt(req.params.page);
	       }
	       var proxy = new EventProxy();
	       var total_page = 0;
	   
	       proxy.once("get_list",function(){
	           Diary.find({},{sort:[['create_date', -1]],skip: config.PAGE_SIZE * (pageno - 1), limit:config.PAGE_SIZE}).toArray(function(err, diarys){
	           if(err) return next(err);
	               for(var i = 0 ; i < diarys.length;i++){
	                   diarys[i].create_date = util.dateFormat(diarys[i].create_date);
	                   diarys[i].edit_date = util.dateFormat(diarys[i].edit_date);
	                   if(diarys[i].up_img_thumb && diarys[i].up_img_thumb != ""){
	                   
	                       diarys[i].up_img_thumb = config.diary_url + diarys[i].up_img_thumb;
	                   }
	                   diarys[i].content = diarys[i].summary;
	                }
	                if(total_page > config.INDEX_ITEM_SIZE){
	                    total_page = config.INDEX_ITEM_SIZE;
	                }
	                var pageData = page.createPage(pageno, total_page);
	      
	            
	            

		            res.render('index', {
		    	        title       :config.name,
		    	        diarys      :diarys,
                        config      :config,
                        pageData    :pageData,
                        req_path    :req.path
		            });
	        
	        
                    DB.close();

                 });
	        });
	   
	        proxy.once("get_total",function(){
	            Diary.find({}).toArray(function(err, diarys){
	            var total_items = diarys.length;
	            total_page = Math.floor ( (total_items + config.PAGE_SIZE - 1) / config.PAGE_SIZE );
	            proxy.trigger('get_list');
	        });
	   });
	   
	   proxy.trigger('get_total');	   


	  }
    });
  

};

