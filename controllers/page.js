var config = require('../config').config
    ,util = require('../utils/util')
    ,path = require('path')
    ,EventProxy = require("eventproxy").EventProxy;

exports.createPage = function(pageno,pagecount){
   // 如果是第一页，就不用显示上一页和首页，如果是最后一页就不用显示尾页和下一页
        var page_view = [];
        
        //先考虑页码
        if(pagecount <= 8){
        	for(var i = 1; i <= pagecount;i++){
        	    page_view[page_view.length] = [""+i,i]; // 显示,页码
        	}
        }else if(pagecount > 8 &&  pagecount <= 15) { //大于8会根据当前页面的变化，显示...
        	// 处理当前页面前的显示
        	if(pageno <= 8){
	        	for(var i = 1; i <= pageno+5;i++){ // 最多显示15
	        	    page_view[page_view.length] = [""+i,i]; // 显示,页码
	        	}
        	}else{//否则还需显示前5
	        	for(var i = 1; i <= 3;i++){
	        	    page_view[page_view.length] = [""+i,i]; // 显示,页码
	        	}
	        	page_view[page_view.length] = ["...",0];
	        	for(var i = pageno-4; i < pageno;i++){
	        	    page_view[page_view.length] = [""+i,i]; // 显示,页码
	        	}

        	}
        	
        	// 处理当前页面后的显示
        	if(pageno + 5 < pagecount-2){
        		if(pageno > 8){
		        	for(var i = pageno; i <= pageno+5;i++){
		        	    page_view[page_view.length] = [""+i,i]; // 显示,页码
		        	}
        		}
        	    page_view[page_view.length] = ["...",0];
            	for(var i = pagecount-2; i <= pagecount;i++){
            	    page_view[page_view.length] = [""+i,i]; // 显示,页码
            	}
        	}else{
        		// 小于等于8时需要先显示后五与尾页后三的冲突
        		if(pageno <= 8){
	        		//var off = 10 - pagecount + pageno;
		        	for(var i = pageno + 5; i <= 2 * pageno + 15 - pagecount;i++){
		        	    page_view[page_view.length] = [""+i,i]; // 显示,页码
		        	}
        		}else{
		        	for(var i = pageno; i <= pagecount;i++){
		        	    page_view[page_view.length] = [""+i,i]; // 显示,页码
		        	}
        		}
        	}

        }else{ // > 15
        	// 处理当前页面前的显示
        	if(pageno <= 8){
	        	for(var i = 1; i <= pageno+5;i++){ // 最多显示15
	        	    page_view[page_view.length] = [""+i,i]; // 显示,页码
	        	}
        	}else{//否则还需显示前5
	        	for(var i = 1; i <= 3;i++){
	        	    page_view[page_view.length] = [""+i,i]; // 显示,页码
	        	}
	        	page_view[page_view.length] = ["...",0];
	        	for(var i = pageno-4; i < pageno;i++){
	        	    page_view[page_view.length] = [""+i,i]; // 显示,页码
	        	}

        	}
        	
        	// 处理当前页面后的显示
        	if(pageno + 5 < pagecount-2){
        		if(pageno > 8){
		        	for(var i = pageno; i <= pageno+5;i++){
		        	    page_view[page_view.length] = [""+i,i]; // 显示,页码
		        	}
        		}
        	    page_view[page_view.length] = ["...",0];
            	for(var i = pagecount-2; i <= pagecount;i++){
            	    page_view[page_view.length] = [""+i,i]; // 显示,页码
            	}
        	}else{
	        	for(var i = pageno; i <= pagecount;i++){
	        	    page_view[page_view.length] = [""+i,i]; // 显示,页码
	        	}
        	}
        }
        // 在考虑首尾页
        if(pageno > 1){
        	page_view.unshift(["首页",1],["上一页",pageno-1]);
        }
        if(pageno < pagecount){
        	page_view.push(["下一页",pageno+1],["尾页",pagecount]);
        }
   
        return page_view;
};
