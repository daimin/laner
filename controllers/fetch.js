var lutil = require('../utils/util')
    ,config = require('../config').config
    ,EventProxy = require("eventproxy").EventProxy
    ,fs = require("fs")
    ,path = require('path')
    ,mime = require('../utils/mime')
    ,http = require('http');





exports.index = function(req, res, next){
    var furl = req.param('furl');


    var rhost = furl.substring(0, furl.indexOf('/'));
    var fpath = furl.substring(furl.indexOf('/'));
    if(furl.indexOf('/') == -1){
       rhost = furl;
       fpath = '/';
    }
    
    var options = {
        host: rhost,
        port: 80,
        path: fpath,
        method: 'GET'
    };

    lutil.log(options);
    
    var tmp_file = process.cwd() + "/fetchdata/" + (new Date()).getTime() + ".html";
/*
    var req = http.request(options, function(res) {
         lutil.log('STATUS: ' + res.statusCode);
         lutil.log('HEADERS: ' + JSON.stringify(res.headers));
         //res.setEncoding('utf8');
         res.on('data', function (chunk) {
           if(chunk){
              fs.appendFileSync(tmp_file,chunk);
           }
         });
         res.on('end',function(){
           
           //callback(tmp_file_name);
         });
    });

    req.on('error', function(e) {
       lutil.log('problem with request: ' + e.message)
    });
*/

http.get({host:'localhost', port:80, path:'/', agent:false}, function (res) {
  lutil.log(res);
  // Do stuff
});

};

