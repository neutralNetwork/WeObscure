(function (init) {
	var el = document.createElement('script');
	el.src = chrome.extension.getURL('page.js');

	document.addEventListener('wesecure_message', function(e){
        var message = e.detail;
        console.log(message);
        //if (message.MsgType === 1) {
            //do something
        //}
	});

	document.body.appendChild(el);
})();
