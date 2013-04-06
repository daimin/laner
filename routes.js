/*
 * GET home page.
 */

var  diary       = require('./controllers/diary')
    ,site       = require('./controllers/site')
    ,comment    = require('./controllers/comment')
    ,user       = require('./controllers/user')
    ,lfile       = require('./controllers/lfile')
    ,admin       = require('./controllers/admin')
    ,fetch       = require('./controllers/fetch')
    ,imageCtrl   = require('./controllers/imageCtrl')
    ,partials  = require('express-partials')
    ,filter     = require('./utils/util').filter;




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
	   path:"/:page",
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
	   path:"/diary/list/:page",
	   ctrl:diary.list,
	   method:'get'
	},
	{
	   path:"/diary/list",
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
	   path:"/diary/:did/edit",
	   ctrl:diary.edit,
	   method:'get'
	},
	{
	   path:"/diary/:uid/mlist",
	   ctrl:diary.mlist,
	   method:'get'
	},
	{
	   path:"/diary/:uid/mlist/:page",
	   ctrl:diary.mlist,
	   method:'get'
	},
	
	{
	   path:"/diary/:did/edit",
	   ctrl:diary.edit,
	   method:'post'
	},
	{
	   path:"/diary/collect",
	   ctrl:diary.collect,
	   method:'post'
	},
	{
	   path:"/diary/collection",
	   ctrl:diary.collection,
	   method:'get'
	},
	{
	   path:"/diary/attent/:page",
	   ctrl:diary.attent,
	   method:'get'
	},
	{
	   path:"/diary/:keyword/search",
	   ctrl:diary.search,
	   method:'get'
	},
	{
	   path:"/diary/:keyword/search/:page",
	   ctrl:diary.search,
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
	},
	{
	   path:"/user/setting",
	   ctrl:user.setting,
	   method:'get'
	},
	{
		path:"/user/setting",
		ctrl:user.setting,
		method:'post'
	},
	{
	   path:"/user/:did/del",
	   ctrl:user.del,
	   method:'get'
	},
	{
	   path:"/comment/list",
	   ctrl:comment.list,
	   method:'post'
	},
	{
	   path:"/fsys",
	   ctrl:lfile.index,
	   method:'get'
	},
	{
       path:"/fsys/thumb_test",
       ctrl:lfile.thumb_test,
	   method:'get'
	},
	{
	   path:"/user/admin",
	   ctrl:admin.index,
	   method:'get'
	},
	{
	   path:"/admin/notice",
	   ctrl:admin.notice,
	   method:'post'
	},
	{
	   path:"/admin/diarys",
	   ctrl:admin.diarys,
	   method:'post'
	},
	{
	   path:"/admin/users",
	   ctrl:admin.users,
	   method:'post'
	},
	{
	   path:"/admin/update_notice",
	   ctrl:admin.update_notice,
	   method:'post'
	},
    {
	   path:"/admin/admindel",
	   ctrl:diary.admindel,
	   method:'get'
	},
	{
	   path:"/user/uploadpic",
	   ctrl:user.uploadpic,
	   method:'post'
	},
	{
	   path:"/fetch/get",
	   ctrl:fetch.index,
	   method:'get'
	},
	{   
		path:'/images/upload/:img',
        ctrl:imageCtrl.index,
		method:'get'
	},
	{
	   path:"/404",
	   ctrl:site.p404,
	   method:'get'
	}
	];
	
	filter(app, maps);
	
    app.get("/*", function(req, res, next){
         site.p404(req, res, next);
    });
};

