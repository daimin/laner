/**
 * config
 */
 var g_cfg = {};

exports.config = {
	name       : '晓知+',
	description: 'Diary',
	version    : (function(){
		  g_cfg.version = '0.1.5';
		  return g_cfg.version;
	  })(),
	// 配置网站头部
	site_headers:
	{
	  menu:[
	   {name:"首页",url:"/"},
	   {name:"添加日记",url:"/diary/add"},
	   {name:"所有日记",url:"/diary/list"},
	   {name:"关注日记",url:"javascript:void(0)"},
	   ],
	right_menu:{
	    nologin_item :[
	    {name:"注册",url:"/user/register"},
	    {name:"登录",url:"/user/login"},
	    ],
	    login_item :[
	    {name:"设置",url:"/user/setting"},
	    {name:"注销",url:"/user/logout"},
	    ],
	    menu_item:[]
	    
	},
	meta: [
		'<meta name="author" content="vagasnail@gmail.com">',
		'<meta name="description" content="心情记录，知识分享">'
	]
	},
	ACCESS_PUBLIC : 1,
	ACCESS_VERIFY : 2,
	// 路径的访问权限，1表示公共访问，2代表注册用户才能访问,3代表管理员才能访问
	path_access:
	{
		"/"              : 1,
		"/diary/add"     : 2,
		"/diary/del"     : 2,
		"/user/del"      : 2,
		"/diary/edit"    : 2,
		"/diary/view"    : 1,
		"/diary/list"    : 1,
		"/diary/attent"  : 2,
		"/diary/mlist"   : 1,
		"/user/login"    : 1,
		"/user/register" : 1,
		"/comment/add"   : 1,
		"/user/admin"    : 2,
		"/user/setting"  : 2
	}
	,
	host: '', // host 结尾不要添加'/'
	db : (function(){
	    var mongo = null;
	    if(process.env.VCAP_SERVICES){
	        var env = JSON.parse(process.env.VCAP_SERVICES);
	        mongo = env['mongodb-1.8'][0]['credentials'];
	    }
	    else{
	        mongo = {
	        "hostname":"localhost",
	        "port":27017,
	        "username":"",
	        "password":"",
	        "name":"laner",
	        "db":"db"
	        };
	    }
	    
	    var generate_mongo_url = function(obj){
	        obj.hostname = (obj.hostname || 'localhost');
	        obj.port = (obj.port || 27017);
	        obj.db = (obj.db || 'test');
	        if(obj.username && obj.password){
	            return "mongodb://" + obj.username + ":" + obj.password + "@" + obj.hostname + ":" + obj.port + "/" + obj.db + "?auto_reconnect=true";
	        }
	        else{
	            return "mongodb://" + obj.hostname + ":" + obj.port + "/" + obj.db + "?auto_reconnect=true";
	        }
	    };
	    
	    return generate_mongo_url(mongo);;
	})(),
	session_secret  : 'WOWILOVEYOU',
	auth_cookie_name: 'lanerdiarycookiename',
	port            : 3000,
    // 时区，正为东，负为西，我们是东八区
	time_zone : 8,
	
	// admin 可删除话题，编辑标签
	admins    : { admin: true },
	// 上传临时目录
	upload_dir:"./upload",
	
	// 日记配置
	diary_title_size   : [2,40],
	diary_content_size : [2,4000],
    diary_summary_size : [2,80],
    comment_size       : [2,2000],
	diary_img_size : 2 * 1024 * 1024,
	// 上传日记说明图片的目录
	diary_img : '/public/images/upload/',
	// url中访问日记说明图片的目录
	diary_url : '/images/upload/',
	allow_img:['.png','.gif','.jpg'],
	img_size : {
	   thumb :100,
	   cont  :250,
	   header:48,
	},
	// 日志类型(公开，私密)
	diary_type:{
	   public : "public",
	   private: "private"
	},
	// 首页日志的内容显示字数
	diary_size:120,
	user_config:{
	    email_size   :[8,80],
	    nickname_size:[2,40],
	    password_size:[2,20],
	    motto_size   :[0,70],
	    avatar_size  :128*1024,
	    avatar_url : '/images/avatar/',
	    default_avatar:"default.jpg"
	},
	INDEX_ITEM_SIZE : 100,
	// 公告配置，h1，为大标题，h2,次之，总是都是标题,默认的
	announcement:{
	  h1:"douban.fm",
	  h2:'<div class="radio"><iframe src="http://douban.fm/partner/baidu/"></iframe></div>',
	  h3:"",
	},
	// 程序是否是调试模式
	DEBUG:true,
	log_dir:"/public/log/",
	PAGE_SIZE:10,

	related_sites : [
	         "当前版本： v " + g_cfg.version,
	         "<a href=\"mailto:daiming253685@126.com\">联系站长</a> "
	         ],
    // 由于appfog我们将图片保存到数据库中，这里是开关
    // file/db
	IMG_PERSISTENT : "db",
	admin_email:"admin@admin.com",
	site_base  :"http://laner.ap01.aws.af.cm",
	thumber_url:"http://1.lanlog.duapp.com/remote_thumb.php",
	//site_base  :"http://192.168.211.157:3000",
	//thumber_url:"http://192.168.211.157/dx/remote_thumb.php",
	icon_img_url:"/images/statusface/",
	face_imgs : [["\\(谄笑\\)","2.gif?ver=1"],["\\(吃饭\\)","3.gif?ver=1"],["\\(调皮\\)","4.gif?ver=1"],["\\(尴尬\\)","5.gif?ver=1"],
	["\\(汗\\)","6.gif?ver=1"],["\\(惊恐\\)","7.gif?ver=1"],["\\(囧\\)","8.gif?ver=1"],["\\(可爱\\)","9.gif?ver=1"],
	["\\(酷\\)","10.gif?ver=1"],["\\(流口水\\)","11.gif?ver=1"],["\\(生病\\)","14.gif"],["\\(叹气\\)","15.gif"],["\\(淘气\\)","16.gif"],
	["\\(舔\\)","17.gif"],["\\(偷笑\\)","18.gif"],["\\(吐\\)","19.gif?ver=1"],["\\(吻\\)","20.gif"],["\\(晕\\)","21.gif?ver=1"],
	["\\(住嘴\\)","23.gif"],["\\(大笑\\)","16.gif?ver=1"],["\\(害羞\\)","shy.gif"],["\\(口罩\\)","17.gif"],["\\(哭\\)","cry.gif"],
	["\\(困\\)","sleepy.gif"],["\\(难过\\)","sad.gif"],["\\(生气\\)","5.gif?ver=1"],["\\(书呆子\\)","13.gif?ver=1"],
	["\\(微笑\\)","1.gif?ver=1"],["\\(不\\)","1.gif"],["\\(惊讶\\)","surprise.gif"],["\\(kb\\)","kbz2.gif"],["\\(sx\\)","shaoxiang.gif"] ]
};


var host = exports.config.host;
if (host[host.length - 1] === '/') {
	exports.config.host = host.substring(0, host.length - 1);
}
