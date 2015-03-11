(function() {
    function patch_function(orig, patch) {
        return function() {
            patch.apply(this, arguments);
            return orig.apply(this, arguments);
        };
    };
    (new Promise(function(res, rej){
        var chat = WebMM.getCtrlInstants('chat');
        if (chat) {
            res(chat);
            return;
        };
        // check if chat is not ready, then we patch window.ready to get
        // WebMM obj
        window.ready = patch_function(window.ready, function(component) {
            if (component === 'view') {
                res(chat);
            }
        });
    })).then(function(chat) {
        chat.messageAdded = patch_function(chat.messageAdded, function(message){
            if (message) {
                console.log(message);
                document.dispatchEvent(new CustomEvent('wesecure_message', {
                    detail: message
                }));
            }
        });
    });
})();
