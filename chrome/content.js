(function (init) {

    function dispatchEvent(name, data) {
        var e = new CustomEvent('wesecure_' + name, {
            cancelable: true,
            detail: data
        })
        document.dispatchEvent(e);
        return e;
    }

	var el = document.createElement('script');
	el.src = chrome.extension.getURL('page.js');

    var get_key = function(){
        var keyString = localStorage.privateKey;
        if (keyString) { return DSA.parsePrivate(keyString); }
        var privateKey = new DSA();
        localStorage.privateKey = privateKey.packPrivate();
        return privateKey;
    };

    var buddies = {}

    function getBuddy(name) {
        if (name in buddies) { return buddies[name]; }

        var options = {
            fragment_size: 2000
          , send_interval: 200
          , debug: true
          , priv: get_key()
        }
        var buddy = new OTR(options);

        buddy.SEND_WHITESPACE_TAG = true;
        buddy.WHITESPACE_START_AKE = true;

        buddies[name] = buddy;

        buddy.on('ui', function (msg, encrypted, meta) {
          console.log("message to display to the user: " + msg)
          // encrypted === true, if the received msg was encrypted
          console.log("(optional) with receiveMsg attached meta data: " + meta)
          dispatchEvent('receive_message', { from: name, content: msg });
        })

        buddy.on('io', function (msg, meta) {
          console.log("message to send to buddy: " + msg);
          console.log("meesage length " + msg.length);
          console.log("(optional) with sendMsg attached meta data: " + meta);
          dispatchEvent('send_message', { to: name, content: msg });
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
    });

    document.addEventListener('wesecure_incoming_message', function(e){
        var message = e.detail;
        getBuddy(message.from).receiveMsg(message.content);
        e.preventDefault();
    });

    document.addEventListener('wesecure_outgoing_message', function(e){
        var message = e.detail;
        getBuddy(message.to).sendMsg(message.content);
        e.preventDefault();
    });

    document.body.appendChild(el);
})();
