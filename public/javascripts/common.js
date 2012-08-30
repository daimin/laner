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