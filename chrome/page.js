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
        var origSendText = sendLogic.sendText;

        messageModel.addMessages = function(msgs){
            var msgsToForward = [];
            msgs.forEach(function(msg) {
                if (msg.MsgType !== 1 || msg.Status !== 3) {
                    msgsToForward.push(msg);
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

        sendLogic.sendText = function(msg){
            console.log("sending message:", msg);
            if (!dispatchEvent('outgoing_message', {
                to: msg.Msg.ToUserName,
                content: msg.Msg.Content
            }).defaultPrevented) {
                return origSendText.apply(this, arguments);
            }
        };

        document.addEventListener('wesecure_send_message', function(e){
            var message = e.detail;
            var base = jQuery.extend(WebMM.model("account").getBaseRequest(), { Msg: {
                FromUserName: WebMM.model("account").getUserName(),
                ToUserName: message.to,
                Type: 1,
                Content: message.content
            } });
            base.Msg.LocalID = base.Msg.ClientMsgId = jQuery.now()
            origSendText.call(sendLogic, jQuery.extend({}, base, {
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
                MsgType: 3
            }]);
        });
    });
})();
