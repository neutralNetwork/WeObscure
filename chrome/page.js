(function() {

	var chat = WebMM.getCtrlInstants('chat');
	var oldMessageAdded = chat.messageAdded;

	chat.messageAdded = function(message){
		document.dispatchEvent(new CustomEvent('wesecure_message', {
			detail: message
		}));
		oldMessageAdded.apply(this, arguments);
	};

})();
