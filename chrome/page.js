(function() {
    function patch_function(orig, patch) {
        return function() {
            var ret = orig.apply(this, arguments);
            patch.apply(this, arguments);
            return ret;
        };
    };
    (new Promise(function(res, rej){
        function getChat() {
            return WebMM.getCtrlInstants('chat');
        }

        var chat = getChat();
        if (chat) {
            res(chat);
            return;
        };
        // check if chat is not ready, then we patch window.ready to get
        // WebMM obj
        window.ready = patch_function(window.ready, function(component) {
            if (component === 'view') {
                console.log('PATCH FIRED');
                res(getChat());
            }
        });
    })).then(function(chat) {
        chat.messageAdded = patch_function(chat.messageAdded, function(message){
            var msg = {};
            for (attr in message) {
                if (message.hasOwnProperty(attr)) {
                    msg[attr] = message[attr];
                }
            }
            console.log("copied_msg", msg);
            msg.update = null;
            msg.isSysMessage = null;
            document.dispatchEvent(
                new CustomEvent('wesecure_message', { detail: msg })
            );
        });
    });
})();
