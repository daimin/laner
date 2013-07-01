var lutil = require('../utils/util')
    ,config = require('../config').config
    ,EventProxy = require("eventproxy").EventProxy
    ,fs = require("fs")
    ,path = require('path')
    ,mime = require('../utils/mime')
    ,http = require('http')
    ,DB = require("../models")
    ,Diary = DB.Table('Diary')
    ,cheerio = require('cheerio');





exports.index = function(req, res, next){
    // Http URL 匹配正则
    var parterns = {
      "http://www.52new.net/":{
          "html"    : "^http://[a-zA-Z0-9]+\.[a-zA-Z0-9]+\.[a-zA-Z]+/([a-zA-Z0-9]+)/[0-9]+\.html$",
          "title"   : ".post_title h2",
          "content" : ".post_content"
      },
      "http://www.u148.net/" :{
          "html"    : "^/([a-zA-Z0-9]+)/[0-9]+\.html$",
          "title"   : ".u148content h1 a",
          "content" : ".u148content .content div"
      },
      "http://www.guokr.com/" : {
          //http://www.guokr.com/question/391601/
          "html"    : "^http://[a-zA-Z0-9]+\.[a-zA-Z0-9]+\.[a-zA-Z]+/article/[0-9]+/$",
          "title"   : ".content-th h1",
          "content" : ".document div"
      }
    };




    var furl = req.param('furl');
    var HTML_PARTN = parterns[furl]['html'];
    var TITLE_DOM =  parterns[furl]['title'];
    var CONTENT_DOM = parterns[furl]['content'];


    var new_titles = [];
    var proxy = new EventProxy();
    proxy.once("getDiarys",function(diarys,uinfo){
        Diary.find({}).toArray(function(err, diarys){
            if(err) throw err;
            for(var i = 0; i < diarys.length;i++){
                new_titles[new_titles.length] = diarys[i].title;
            }
            proxy.trigger('doFetch');
        });
    });


    var has_existed = function(srcArr, obj){
        if(!srcArr) return false;
        for(var i = 0, len = srcArr.length;i < len; i++){
           if(srcArr[i] == obj){
               return true;
           }
        }

        return false;
    };

    var do_fetch = function(url, titles){

      var datas = [];
       try{
              var req = http.get(url, function(resp) {
              resp.on("end", function() {
                  
                  $ = cheerio.load(datas.join(""));
                  
                  res.header("Content-Type", "text/html");
                  var dObj = {};
                  var title = $(TITLE_DOM).text();
                  var content = $(CONTENT_DOM).html();
                  if(title && content){
                    if(!has_existed(titles, title)){
                       dObj.title = title;


                       dObj.content = content;
                       //lutil.log(dObj);
                       titles[titles.length] = title;
                       addDiary(dObj);
                    }else{
                       return;
                    }
                    
                  }
                  //http://www.52new.net/qw2/449.html
                  var patrn = new RegExp(HTML_PARTN);
                  $("a").each(function(i,ao){
                      var href = $(ao).attr("href");
                      
                      if(href){
                          var matches = patrn.exec(href);
                          if(matches == null || typeof matches.length == 'undefined' || matches.length <= 0){
                                return;
                          }
                          //if(matches[1].indexOf("at") != -1){
                          //   return;
                          //}
                          lutil.log(href);
                       
                          setTimeout(do_fetch(href, titles), 1000);
                       
                      }
                      
                  });

                  
              })
              resp.on("close", function(e) {
                  
                  console.log("close");
              })

              resp.on("abort", function() {
                  console.log("abort");
              });

              resp.on("data", function(chunk) {
                  datas[datas.length] = chunk;
              });   
              resp.on("error", function(err) {
                  console.log(err);
              });   
            });
            //req.end();
            req.on("error", function(err){
                console.log(err);
            });
       }catch(e){

       }
   };
    proxy.once("getDiarys",function(){
       do_fetch(furl, new_titles);
    });

    proxy.trigger('getDiarys');
   
};


var addDiary = function(dObj){

    
      var summary = lutil.get_summary(dObj.content);
      

      var diary = {};
      diary._id = lutil.genId("d");
      diary.title = dObj.title;
      diary.content = dObj.content;
      diary.summary = summary;
      diary.create_date = new Date();
      diary.edit_date = new Date();
      diary.up_img = "";
      diary.up_img_thumb = "";     // 100X100
      diary.up_img_thumb_big = ""; // 350X350
      diary.up_img_ext = "";
      diary.author = "admin@admin.com";
      diary.view_num = 0;
      diary.comment_num = 0;
      diary.type = "public";
        
      Diary.save(diary, function(err){
          if(err) return next(err);     
      });

};

