/**
 * config
 */
exports.config = {
	name: '晓知+',
	description: 'Diary',
	version: '0.1.2',
	// site settings
	site_headers: [
		'<meta name="author" content="晓知+" />',
		'<meta name="description" content="laner diary">'
	],
	host: '', // host 结尾不要添加'/'
	site_logo: '', // default is `name`
	site_navs: [
		[  ]
	],
	site_static_host: '', // 静态文件存储域名  dbUserName:dbPassword@127.0.0.1:20088/dbName
	db: 'localhost:27017/laner',
	session_secret: 'laner_diary',
	auth_cookie_name: 'laner_diary',
	port: 3000,
    
    // 话题列表显示的话题数量
    list_topic_count: 10,
    recent_topic_count: 10,
    
	// RSS
	rss: {
		title: '',
		link: '',
		language: 'zh-cn',
		description: '',
		//最多获取的RSS Item数量
		max_rss_items: 50
	},
	// mail SMTP
	mail_port: 25,
	mail_user: 'daiming253685@126.com',
	mail_pass: '',
	mail_host: 'smtp.126.com',
	mail_sender: 'daiming253685@126.com',
	mail_use_authentication: true,
	
	// admin 可删除话题，编辑标签
	admins: { admin: true },
	// [ [ plugin_name, options ], ... ]
	plugins: [['clean']],
	
	// 日记配置
	diary_title_size : [2,40],
	diary_content_size : [10,2000],
	diary_img_size : 1024 * 1024 *2
	
};


var host = exports.config.host;
if (host[host.length - 1] === '/') {
	exports.config.host = host.substring(0, host.length - 1);
}
