
/**
 * Module dependencies.
 */

var express = require('express')
  , routes = require('./routes')
  , http = require('http')
  , path = require('path')
       , partials = require('express-partials')
  , config = require('./config').config;

var app = express();

app.use(partials());


app.configure(function(){
  app.set('port', process.env.VMC_APP_PORT || config.port);
  app.set('host', process.env.VCAP_APP_HOST || config.host);
  app.set('views', __dirname + '/views');
  app.set('view engine', 'html');
  app.engine('.html', require('ejs').__express);
  app.use(express.favicon());
  app.use(express.logger('dev'));
  app.use(express.bodyParser({uploadDir:config.upload_dir}));
  app.use(express.cookieParser());
  app.use(express.methodOverride());
  app.use(express.static(path.join(__dirname, 'public')));  // 需要在router设置之前，否则会有路径问题
  app.use(app.router);
  
});
//production
app.configure('development', function(){
  app.use(express.errorHandler());
});


//index即为routes脚本地址
routes(app);


http.createServer(app).listen(app.get('port'), function(){
    console.log("Express server listening on port " + app.get('port'));
});
