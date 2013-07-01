var DB = require("../models")
    ,lutil = require('../utils/util');

exports.index = function(req, res, next){
    var img_name = req.params.img;
    img_name = 'gf/' + img_name;
    lutil.read_gridfs_img(img_name,function(buffer){
        res.setHeader("Content-Type", lutil.getImgHeader(img_name));
        res.send(buffer);
    });
};