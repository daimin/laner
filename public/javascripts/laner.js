function set_thumbs(obj, W, H) {
	jQuery(obj + ' img').hide().each(function() {
		var w, h, t, l, cw, ch;
		function doResize(o) {
			cw = o.width();
			ch = o.height();
			w = W;
			h = ch*W/cw;
			if(cw > W){
			    if (h>H) {
				    l = 0;
				    t = (ch*W/cw-H)/2;
			    } else {
				    h = H;
				    w = H*cw/ch;
				    l = (H*cw/ch-W)/2;
				    t = 0;
			    }
			}else{
			    h = ch;
			    w = cw;
			    l = 0
			    t = 0;
			}
			o.attr('style', 'width: ' + w + 'px; height: ' + h + 'px; left: -' + l + "px; top: -" + t + "px;").hide().fadeIn('slow');
		}
		if (jQuery(this).get(0).complete) doResize(jQuery(this));
		else jQuery(this).bind("load", function() { doResize(jQuery(this)); });
	});
}


function add_diary(){
    window.location="add";
}


function del_diary(durl, delobj){
	art.dialog({
	    content: '确定删除该篇日志？',
	    ok: function () {
          $.get(durl, {}, function(data){
                 if(data == 1){
                    window.location.reload();
                 }

          });
	        return true;
	    },
	    follow:delobj,
	    cancelVal: '取消',
	    cancel: true
	});
}

function doCommentSubmit(url){
    var param = {commenter:$("#commenter").val(),diary_id:$("#diary_id").val(),comment:$("#comment").val()};
    $.post(url, param,
        function(data){
           if(data == 1){
              render_viewlist($("#diary_id").val());
              $("#comment").val("");
           }else{
              $("#alert-error").css({"display":"block"});
              $("#alert-error").html(data);
           }
        }
    );
    return false;
}

function dologin(url,ispage){

    var href = window.location.href;
    var pa = "";
    if(href.lastIndexOf('=') != -1){
        pa = href.substring(href.lastIndexOf('=')+1);
    }
    var param = {password:$("#password").val(),email:$("#email").val(),p:pa};
    $.post(url, param,
        function(data){
           var code = data.substring(0,data.indexOf(':'));
           var res = data.substring(data.indexOf(':')+1);
           if(code == 1){
              if(typeof ispage == 'undefined'){
                  window.location.reload();
              }else{
                  if(res != ""){
                      window.location = res;
                  }else{
                      window.location = '/';
                  }
              }
           }else{
              $("#alert-error").css({"display":"block"});
              $("#error_msg").html(res);
           }
        }
    );
    return false;
}

function doregister(url){
    var param = {
                 password:$("#password").val(),
                 email:$("#email").val(),
                 repassword:$("#repassword").val(),
                 nickname:$("#nickname").val()
                 };

    $.post(url, param,
        function(data){
           if(data == 1){
              window.location.href='/';
           }else{
              $("#alert-error").css({"display":"block"});
              $("#error_msg").html(data);
           }
        }
    );
    return false;
}

function doupdate_info(url){
	var actionVal = url.substring(url.lastIndexOf('/')+1);
	url = url.substring(0,url.lastIndexOf('/'));
    var param = {
    		     nickname:$("#nickname").val(),
                 email:$("#email").val(),
                 motto:$("#motto").val(),
                 action:actionVal
                 };

    $.post(url, param,
        function(data){
           if(data == 1){
              $("#alert-error").css({"display":"none"});
			  $("#alert-success").css({"display":"block"});
              $("#success_msg").html("更新成功");
           }else{
              $("#alert-error").css({"display":"block"});
			  $("#alert-success").css({"display":"none"});
              $("#error_msg").html(data);
           }
        }
    );
    return false;
}

function doupdate_pass(url){
    var actionVal = url.substring(url.lastIndexOf('/')+1);
	url = url.substring(0,url.lastIndexOf('/'));
    var param = {
	               email:$("#email").val(),
    		         cur_password:$("#cur_password").val(),
                 new_password:$("#new_password").val(),
                 re_new_password:$("#re_new_password").val(),
                 action:actionVal
                 };

    $.post(url, param,
        function(data){
           if(data == 1){
              $("#alert-error").css({"display":"none"});
			  $("#alert-success").css({"display":"block"});
              $("#success_msg").html("更新成功");
           }else{
              $("#alert-error").css({"display":"block"});
			  $("#alert-success").css({"display":"none"});
              $("#error_msg").html(data);
           }
        }
    );
    return false;
}


function render_viewlist(diary_id){
          $.post("/comment/list", { "diary_id":diary_id},
            function(data){
              var dataObj = eval("("+data+")");
            var html = new EJS({url: '/client_tmp/comment.ejs'}).render(dataObj);
               $("#comment_div").html(html);
        });
}

function render_focus(email, diary_id, isload){
      if(email == "" && isload == 0){
          return false;
      }
      $.post("/diary/focus", {"email":email, "diary_id":diary_id,"isload":isload},
            function(data){
              var dataObj = eval("("+data+")");
              var html = new EJS({url: '/client_tmp/diary_focus.ejs'}).render(dataObj);
               $("#focus_div").html(html);
        });
}

function doupdate_avatar(url){
    var actionVal = url.substring(url.lastIndexOf('/')+1);
	  url = url.substring(0,url.lastIndexOf('/'));
    var param = {
	             email:$("#email").val(),
    		     new_avatar:$("#new_avatar").val(),
                 action:actionVal
                 };

    $.post(url, param,
        function(data){
		   var tpos = data.indexOf(':');
		   var tag = msg = "";
		   if(tpos != -1){
		   		tag = data.substring(0,tpos);
		        msg = data.substring(tpos + 1);
		   }else{
		      tag = data;
		   }

           if(tag == 1){
              $("#alert-error").css({"display":"none"});
			  $("#alert-success").css({"display":"block"});
              $("#success_msg").html("更新成功");
			  $("#avatar_img").attr({"src":msg});
           }else{
              $("#alert-error").css({"display":"block"});
			  $("#alert-success").css({"display":"none"});
              $("#error_msg").html(data);
           }
        }
    );
    return false;
}



function close_alter_error(alter_error){
    $(".alert-error").first().css({"display":"none"});
}

function close_alter_success(alter_success){
    $(".alert-success").first().css({"display":"none"});
}




function get_today_fmt(){
    var date = new Date();
    var year = date.getFullYear();
    var month = date.getMonth() + 1;
    var cdate = date.getDate();
    var day = date.getDay();
    var sday = "";
    switch(day){
       case 0:
           sday = "星期日";
           break;
       case 1:
           sday = "星期一";
           break;
       case 2:
           sday = "星期二";
           break;
       case 3:
           sday = "星期三";
           break;
       case 4:
           sday = "星期四";
           break;
       case 5:
           sday = "星期五";
           break;
       case 6:
           sday = "星期六";
           break;       
    }
    
    return year+"年"+month+"月"+cdate+"日 "+sday; 
}

function dosearch(formobj, action){
   var keyword = formobj.keyword.value;
   if(keyword.length == 0){
      return false;
   }
   var actions = action.split('/');
   
   var shref = '/' + actions[1] + '/:' + keyword + '/' + actions[2];

   window.location.href =  shref;

   return false;
}
