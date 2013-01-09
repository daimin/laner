var lutil = require('../utils/util')
    ,config = require('../config').config
    ,EventProxy = require("eventproxy").EventProxy
    ,fs = require("fs")
    ,path = require('path')
    ,mime = require('../utils/mime');


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

