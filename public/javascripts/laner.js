function set_thumbs(obj, W, H) {
	jQuery(obj + ' img').hide().each(function() {
		var w, h, t, l, cw, ch;
		function doResize(o) {
			cw = o.width();
			ch = o.height();
			w = W;
			h = ch*W/cw;
			if (h>H) {
				l = 0;
				t = (ch*W/cw-H)/2;
			} else {
				h = H;
				w = H*cw/ch;
				l = (H*cw/ch-W)/2;
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


function del_diary(did){
	art.dialog({
	    content: '确定删除该篇日志？',
	    ok: function () {
	        window.location = did; 
	        return false;
	    },
	    cancelVal: '取消',
	    cancel: true
	});
}

function doCommentSubmit(url){
    var param = {commenter:$("#commenter").val(),diary_id:$("#diary_id").val(),comment:$("#comment").val()};
    $.post(url, param,
        function(data){
           if(data == 1){
              window.location.reload();
           }else{
              $("#alert-error").css({"display":"block"});
              $("#alert-error").html(data);
           }
        }
    );
    return false;
}

function dologin(url,ispage){
    var param = {password:$("#password").val(),email:$("#email").val()};
    $.post(url, param,
        function(data){
           if(data == 1){
              if(typeof ispage == 'undefined'){
                  window.location.reload();
              }else{
                  window.location.href = '/';
              }
           }else{
              $("#alert-error").css({"display":"block"});
              $("#alert-error").html(data);
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

function close_alter_error(alter_error){
    $(".alert-error").first().css({"display":"none"});
}