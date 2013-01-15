var lutil = require('../utils/util')
    ,config = require('../config').config
    ,EventProxy = require("eventproxy").EventProxy
    ,fs = require("fs")
    ,path = require('path')
    ,mime = require('../utils/mime')
    ,http = require('http');


//显示文件夹下面的文件  
function listDirectory(dir, callback){
	var cwd = process.cwd();
    fs.readdir(dir,function(error, files){
    	var ddfiles = [];
    	if(files) {
            var flen = files.length || 0;
		
			for(var i = 0; i < flen; i++ ){
				var f = files[i];
				if(f.indexOf('.') == 0){
					continue;
				}
				var fp = dir.substring(dir.indexOf(cwd) + cwd.length + 1) + path.sep + f;
				var fstat = fs.statSync(dir + path.sep + f);
				if(fstat.isDirectory()){
					ddfiles[ddfiles.length] = '<span class="f-dir"><a href="/fsys?f='+fp+'">'+f+'</a></span>';
				}else{
					ddfiles[ddfiles.length] = '<span class="f-file">'+f+'</span>';
				}
			} 

    	}
		
		

		callback(ddfiles);
	}); 


  
}  


//显示文件内容  
function showFile(file,req,res){  
    fs.readFile(filename,'binary',function(err,file){  
        var contentType=mime.lookupExtension(path.extname(filename));  
        res.writeHead(200,{  
            "Content-Type":contentType,  
            "Content-Length":Buffer.byteLength(file,'binary'),  
            "Server":"NodeJs("+process.version+")"  
        });  
        res.write(file,"binary");  
        res.end();  
    })  
}  


exports.index = function(req, res, next){
    var f = req.param('f');
    if(typeof f == 'undefined' || f == null || f == ""){
    	f = process.cwd();
    }else{
    	f = process.cwd() + path.sep + f;
    }
    listDirectory(f,function(ddfiles){
        res.render('f/index', {
             "files":ddfiles
        });

    });

     

};


exports.thumb_test = function(req, res,next){
    var img_data = null;
    var tmp_img_url = process.cwd() + config.diary_img + "xxxxxxx_thumb";
    var offset = 0;
    var fd = null;
    http.get("http://localhost/thumber/remote_thumb.php?u=http://xiaode.cz.cc/images/upload/g3403038337294304D4eLUNQ.png", function(res) {
      console.log("Got response: " + res.statusCode);
      if(res.statusCode == 200){
         fd = fs.openSync(tmp_img_url, 'w+');
      }
      res.on('data',function(chunk){
         fs.writeSync(fd, chunk, offset, chunk.length, null);
         offset += chunk.length;
      });
      res.on('end',function(chunk){
         fs.closeSync(fd);
      });

      /*
        var tmp_img_url = process.cwd() + config.diary_img + "xxxxxxx";
        fd = fs.openSync(tmp_img_url, 'w+');
        fs.writeSync(fd, up_img.buffer, 0, up_img.position, null);
        fs.closeSync(fd);
        */
    }).on('error', function(e) {
       lutil.log("Got error: " + e.message);
    });

};

