/*
 * GET home page.
 */

var diary = require('../controllers/diary')
    ,site = require('../controllers/site')
    ,comment = require('../controllers/comment')
    ,user = require('../controllers/user')
    ,filter = require('../utils/common').filter;

exports.index = function(req, res){
};



/**
 * 给模块本身赋值
 * module.exports是require返回真正的东东。
 * exports.xxx只是一种helper，他最后所有的东西都将赋值给module.exports。
 */
exports = module.exports = function(app){
	// 参数1是GET的URL地址
	// 参数2是控制器地址
	//过滤这些个路径，进行权限控制
	
	var maps = [
	{
	   path:"/",
	   ctrl:site.index,
	   method:'get'
	},
	{
	   path:"/diary/add",
	   ctrl:diary.add,
	   method:'get'
	},
	{
	   path:"/diary/add",
	   ctrl:diary.add,
	   method:'post'
	},
	{
	   path:"/diary/list",
	   ctrl:diary.list,
	   method:'get'
	},
	{
	   path:"/diary/:did",
	   ctrl:diary.list,
	   method:'get'
	},
	{
	   path:"/diary/:did/del",
	   ctrl:diary.del,
	   method:'get'
	},
	{
	   path:"/diary/:did/view",
	   ctrl:diary.view,
	   method:'get'
	},
	{
	   path:"/comment/add",
	   ctrl: comment.add,
	   method:'post'
	},
	{
	   path:"/user/login",
	   ctrl: user.login,
	   method:'post'
	},
	{
	   path:"/user/login",
	   ctrl: user.login,
	   method:'get'
	},
	{
	   path:"/user/register",
	   ctrl:user.register,
	   method:'get'
	},
	{
	   path:"/user/register",
	   ctrl:user.register,
	   method:'post'
	},
	{
	   path:"/user/logout",
	   ctrl:user.logout,
	   method:'get'
	}
	];
	
	filter(app, maps);
	
	/*
	app.get('/', function(req,res,next){console.log('1231221dd');site.index(req,res,next)});
	app.get('/diary/add', diary.add);
	app.post('/diary/add', diary.add);
	app.get('/diary/list', diary.list);
	app.get('/diary/:did', diary.index);
	app.get('/diary/:did/del', diary.del);
	app.get('/diary/:did/view', diary.view);
    app.post('/comment/add', comment.add);
    app.post('/user/login', user.login);
    app.get('/user/login', user.login);
    app.get('/user/register', user.register);
    app.post('/user/register', user.register);
    app.get('/user/logout', user.logout);
    */
    
};

