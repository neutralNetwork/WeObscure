(function (init) {
	var el = document.createElement('script');
	el.src = chrome.extension.getURL('page.js');

	document.addEventListener('wesecure_message', function(e){
		console.log(e.detail);
	});

	document.body.appendChild(el);
})();
