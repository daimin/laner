var DB = require("../models"),
    Notes = DB.Table('Notes');    

exports.add = function(req, res, next){
	res.render('add_note', { title: 'Laner.dm' });
};
