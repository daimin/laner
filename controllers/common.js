var crypto = require('crypto')
    ,config = require('../config').config;
exports.encrypt = function(str,secret) {
   var cipher = crypto.createCipher('aes192', secret);
   var enc = cipher.update(str,'utf8','hex');
   enc += cipher.final('hex');
   return enc;
};

exports.decrypt = function (str,secret) {
   var decipher = crypto.createDecipher('aes192', secret);
   var dec = decipher.update(str,'hex','utf8');
   dec += decipher.final('utf8');
   return dec;
};

exports.md5 = function(str) {
  var md5sum = crypto.createHash('md5');
  md5sum.update(str);
  str = md5sum.digest('hex');
  return str;
};

exports.randomString = function (size) {
  size = size || 6;
  var code_string = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'; 
  var max_num = code_string.length + 1;
  var new_pass = '';
  while(size>0){
    new_pass += code_string.charAt(Math.floor(Math.random()* max_num));
    size--; 
  }
  return new_pass;
};

exports.dateFormat = function(cd){
   if(cd){
      var m = (cd.getMonth()+1);
      if(m < 10) m = '0'+m;
      var d = cd.getDate();
      if(d < 10) d = '0'+d;
      var h = cd.getHours();
      if(h < 10) h = '0'+h;
      var min = cd.getMinutes();
      if(min < 10) min = '0'+min;
      var s = cd.getSeconds();
      if(s < 10) s = '0'+s;
      var df = cd.getFullYear()+"-"+m + "-" + d + " " + h + ":"+min+":"+s;
      return df;
   }
   return "";
};

exports.index_cut_cont = function(cont){
   if(!cont) return "";
   if(cont.length > config.diary_size){
      return cont.substring(0,config.diary_size);
   }else{
      return cont;
   }
};

exports.html_entries = function(str){
  var s = str.replace(/\n/g,'<br/>');
  s = s.replace(/\n\r/g,'<br/>');
  s = s.replace(/' '/g,'&nbsp;');
  return s;
};