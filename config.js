/**
 * config
 */
exports.config = {
	name       : '晓知+',
	description: 'Diary',
	version    : '0.0.1',
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
		'<meta name="description" content="laner diary">'
	]
	},
	ACCESS_PUBLIC : 1,
	ACCESS_VERIFY : 2,
	// 路径的访问权限，1表示公共访问，2代表注册用户才能访问,3代表管理员才能访问
	path_access:
	{
		"/"              : 1,
		"/diary/add"     : 2,
		"/diary/view"    : 1,
		"/diary/list"    : 1,
		"/user/login"    : 1,
		"/user/register" : 1,
		"/comment/add"   : 2
	}
	,
	host: '', // host 结尾不要添加'/'
	site_dir:'d:/nodework/laner',
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
	auth_cookie_name: 'laner_diary',
	port            : 3000,
	
	// admin 可删除话题，编辑标签
	admins    : { admin: true },
	// 上传临时目录
	upload_dir:"./upload",
	
	// 日记配置
	diary_title_size   : [2,40],
	diary_content_size : [2,4000],
    diary_summary_size : [2,80],
    comment_size       : [2,2000],
	diary_img_size : 512 * 1024,
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
	   public : 1,
	   private:0
	},
	// 首页日志的内容显示字数
	diary_size:120,
	user_config:{
	    email_size   :[8,80],
	    nickname_size:[4,40],
	    password_size:[2,20],
	    avatar_size  :128*1024,
	    avatar_url : '/images/avatar/',
	},
	// 公告配置，h1，为大标题，h2,次之，总是都是标题
	announcement:{
	  h1:"晓知+日记终于快上线",
	  h2:"可惜没有钱买VPS啊，哪位大大捐献点米米。",
	  h3:"",
	},
	// 程序是否是调试模式
	DEBUG:true,
	PAGE_SIZE:20,
	
};


var host = exports.config.host;
if (host[host.length - 1] === '/') {
	exports.config.host = host.substring(0, host.length - 1);
}
