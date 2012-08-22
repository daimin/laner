/*
 * GET home page.
 */

var note = require('../controllers/note'),
    site = require('../controllers/site');

exports.index = function(req, res){
};

exports = function(app){
	// 参数1是GET的URL地址
	// 参数2是控制器地址
	app.get('/', site.index);
	app.get('/add_note', note.add);	
};
