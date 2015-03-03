var fs = require('fs');
var otr = require('otr');

var run_with = function(file, cb) {
    fs.readFile(file, function(err, res) {
        if (err) throw err;
        cb(res.toString());
    });
};

var init_buddy = function(ks) {
    var key = otr.DSA.parsePrivate(ks);
    var options = {
        fragment_size: 2000
      , send_interval: 200
      , debug: true
      , priv: key
    }
    var buddy = new otr.OTR(options);
    buddy.SEND_WHITESPACE_TAG = true;
    buddy.WHITESPACE_START_AKE = true;true
    console.log('send white space tage check: ', buddy.SEND_WHITESPACE_TAG);
    buddy.on('ui', function (msg, encrypted, meta) {
      console.log("message to display to the user: " + msg)
      // encrypted === true, if the received msg was encrypted
      console.log("(optional) with receiveMsg attached meta data: " + meta)
    })

    buddy.on('io', function (msg, meta) {
      console.log("message to send to buddy: " + msg)
      console.log("(optional) with sendMsg attached meta data: " + meta)
    })

    buddy.on('status', function (state) {
      switch (state) {
        case otr.OTR.CONST.STATUS_AKE_SUCCESS:
          // sucessfully ake'd with buddy
          // check if buddy.msgstate === OTR.CONST.MSGSTATE_ENCRYPTED
          break
        case otr.OTR.CONST.STATUS_END_OTR:
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

run_with('id_dsa', function(ks) {
    var buddy = init_buddy(ks);
    run_with('id_dsa_friend', function(ks2) {
        var peer = init_buddy(ks2);
        buddy.sendMsg('hello');
        console.log(buddy.priv.packPrivate());
        console.log(peer.priv.packPrivate());
        peer.receiveMsg('?OTRv23?');
        
    });
});
