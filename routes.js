/*
 * GET home page.
 */

var diary = require('./controllers/diary')
    ,site = require('./controllers/site')
    ,comment = require('./controllers/comment')
    ,user = require('./controllers/user')
     , partials = require('express-partials')
    ,filter = require('./utils/common').filter;




/**
 * 给模块本身赋值
 * module.exports是require返回真正的东东。
 * exports.xxx只是一种helper，他最后所有的东西都将赋值给module.exports。
 */
exports = module.exports = function(app){
    app.use(partials());
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
	
    
};
