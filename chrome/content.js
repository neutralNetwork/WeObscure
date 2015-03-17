(function (init) {
	var el = document.createElement('script');
	el.src = chrome.extension.getURL('page.js');

    var me_irl;
    var get_key = function(){
        var keyString = localStorage.privateKey;
        if (keyString) { return DSA.parsePrivate(keyString); }
        var privateKey = new DSA();
        localStorage.privateKey = privateKey.packPrivate();
        return privateKey;
    };

    var init_buddy = function(key) {
        var options = {
            fragment_size: 2000
          , send_interval: 200
          , debug: true
          , priv: key
        }
        var buddy = new OTR(options);
        buddy.on('ui', function (msg, encrypted, meta) {
          console.log("message to display to the user: " + msg)
          // encrypted === true, if the received msg was encrypted
          console.log("(optional) with receiveMsg attached meta data: " + meta)
        })

        buddy.on('io', function (msg, meta) {
          console.log("message to send to buddy: " + msg);
          console.log("meesage length " + msg.length);
          console.log("(optional) with sendMsg attached meta data: " + meta)
        })

        buddy.on('status', function (state) {
          switch (state) {
            case OTR.CONST.STATUS_AKE_SUCCESS:
              // sucessfully ake'd with buddy
              // check if buddy.msgstate === OTR.CONST.MSGSTATE_ENCRYPTED
              break
            case OTR.CONST.STATUS_END_OTR:
              // if buddy.msgstate === OTR.CONST.MSGSTATE_FINISHED
              // inform the user that his correspondent has closed his end
              // of the private connection and the user should do the same
              break
          }
        })

        buddy.on('error', function (err, severity) {
          if (severity === 'error')  // either 'error' or 'warn'
            console.error("error occurred: " + err)
        })
        return buddy;
    };

    document.addEventListener('page_ready', function(){
        console.log("receive page ready event");
        var privKey = get_key();
        me_irl = init_buddy(privKey);
    });

	document.addEventListener('wesecure_message', function(e){
        var message = e.detail;
        if (message.MsgType === 1) {
            console.log(message.Content, message.Status);
            if (message.Status === 1) {
                me_irl.sendQueryMsg();
            }
        }
	});

	document.body.appendChild(el);
})();
