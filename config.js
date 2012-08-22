/**
 * config
 */
exports.config = {
	name: '飞魚+',
	description: 'Node Blog',
	version: '0.1.2',
	// site settings
	site_headers: [
		'<meta name="author" content="飞魚+" />',
		'<meta name="description" content="Node Blog">'
	],
	host: 'flyfish.cnodejs.net', // host 结尾不要添加'/'
	site_logo: '', // default is `name`
	site_navs: [
		[  ]
	],
	site_static_host: '', // 静态文件存储域名  dbUserName:dbPassword@127.0.0.1:20088/dbName
	db: 'localhost:27017/laner',
	session_secret: 'node_blog',
	auth_cookie_name: 'node_blog',
	port: 80,
    
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
	mail_user: 'nodeblog@126.com',
	mail_pass: 'node123',
	mail_host: 'smtp.126.com',
	mail_sender: 'nodeblog@126.com',
	mail_use_authentication: true,
	
	// admin 可删除话题，编辑标签
	admins: { admin: true },
	// [ [ plugin_name, options ], ... ]
	plugins: [['clean']]
};
var host = exports.config.host;
if (host[host.length - 1] === '/') {
	exports.config.host = host.substring(0, host.length - 1);
}
