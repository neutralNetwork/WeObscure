(function() {

    function dispatchEvent(name, data) {
        var e = new CustomEvent('wesecure_' + name, {
            cancelable: true,
            detail: data
        })
        document.dispatchEvent(e);
        return e;
    }

    (new Promise(function(res, rej){
        function getChat() {
            return WebMM.getCtrlInstants('chat');
        }
        function page_ready() {
            console.log("sending page ready");
            document.dispatchEvent(
                    new CustomEvent('page_ready', {})
            );
        };

        var chat = getChat();
        if (chat) {
            page_ready()
            res(chat);
            return;
        };
        // check if chat is not ready, then we patch window.ready to get
        // WebMM obj
        window.ready = (function(orig) {
            return function(component) {
                var ret = orig.apply(this, arguments);
                if (component === 'view') {
                    page_ready();
                    res(getChat());
                }
                return ret;
            }
        })(window.ready);
    })).then(function(chat) {
        var messageModel = WebMM.model('message');
        var sendLogic = WebMM.logic('sendMsg');

        var origAddMessages = messageModel.addMessages;
        var origPostText = sendLogic._postText;

        messageModel.addMessages = function(msgs){
            var msgsToForward = [];
            msgs.forEach(function(msg) {
                if (msg.MsgType !== 1 || msg.Status !== 3) {
                    if (!msg.otr) {
                        msgsToForward.push(msg);
                    }
                    return;
                }
                if (!dispatchEvent('incoming_message', {
                    from: msg.FromUserName,
                    content: msg.Content
                }).defaultPrevented) {
                    msgsToForward.push(msg);
                }
            });
            if (msgsToForward.length) {
                return origAddMessages.apply(this, msgsToForward);
            }
        };

        sendLogic._postText = function(one, two, msg) {
            if (msg.otr) { return; }
            console.log("sending message:", msg);
            if (!dispatchEvent('outgoing_message', {
                to: msg.ToUserName,
                content: msg.Content
            }).defaultPrevented) {
                return origPostText.apply(this, arguments);
            }         
        }

        document.addEventListener('wesecure_send_message', function(e){
            var message = e.detail;
            var base = jQuery.extend(WebMM.model("account").getBaseRequest(), { Msg: {
                FromUserName: WebMM.model("account").getUserName(),
                ToUserName: message.to,
                Type: 1,
                Content: message.content,
                otr: true,
            } });
            base.Msg.LocalID = base.Msg.ClientMsgId = jQuery.now()
            WebMM.logic('sendMsg').sendText(jQuery.extend({}, base, {
                MsgId: jQuery.now(),
                MsgType: 1,
                Status: 1,
                CreateTime: Math.floor(WebMM.util.getServerTime() / 1E3)
            }));
        });

        document.addEventListener('wesecure_receive_message', function(e){
            var message = e.detail;
            origAddMessages.call(messageModel, [{
                FromUserName: message.from,
                Content: message.content,
                MsgType: 1,
                MsgId: jQuery.now(),
                Status: 3,
                CreateTime: Math.floor(WebMM.util.getServerTime() / 1E3)
            }]);
        });
    });
})();
