// Ensure namespace exists
var H1 = H1 || { };

const { classes: Cc, interfaces: Ci } = Components;

H1.Preferences = {

    add: function() {
        let textbox = document.getElementById('h1-whitelist-uri');
        let ioService = Cc['@mozilla.org/network/io-service;1']
            .getService(Ci.nsIIOService);
        try {
            let uri = textbox.value;
            if (!/:\/\//.test(uri)) {
                uri = 'http://' + uri;
            }
            uri = ioService.newURI(uri, null, null);
            dump('URI host: ' + uri.asciiHost + '\n');

            textbox.value = '';
        } catch (ex) {
            dump('Invalid URI\n');
        }
    }

};
