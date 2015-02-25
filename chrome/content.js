(function (init) {
	var el = document.createElement('script');
	el.src = chrome.extension.getURL('page.js');
	el.onload = function(){
		console.log('successful load');
	};

	document.addEventListener('wesecure_load', function(e){
		console.log('eeee', e);
		init(e.detail);
	});

	document.body.appendChild(el);
})(function(WebMM){
	console.log('i have webmm', WebMM);
});
