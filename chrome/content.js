(function (init) {
	var el = document.createElement('script');
	el.src = chrome.extension.getURL('page.js');

	document.addEventListener('wesecure_message', function(e){
        var message = e.detail;
        if (message && (message.Content !== "")) {
            console.log(message);
        }
	});

	document.body.appendChild(el);
})();
