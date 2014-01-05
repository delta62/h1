var EXPORTED_SYMBOLS = [ 'H1Networking' ];

// Alias API components
const { classes: Cc, interfaces: Ci } = Components;

var observerService = Cc['@mozilla.org/observer-service;1']
    .getService(Ci.nsIObserverService);

// Constants
const TOPIC_MODIFY_REQUEST = 'http-on-modify-request';

var H1Networking = (function() {

    /**
     * Whether or not the module has been initialized
     */
    var initialized = false;

    /**
     * Initialize the module. Should only be called once.
     */
    var init = function() {
        observerService.addObserver(observer, TOPIC_MODIFY_REQUEST, false);
    };

    /**
     * Observer function that modifies headers before they are sent to the
     * server
     */
    var observer = function(subject, topic, data) {
        subject.QueryInterface(Ci.nsIHttpChannel);

        // Strip HTTP referer header
        subject.referrer = null;

        // Check for HTTP ETag header
        try {
            subject.getRequestHeader('ETag');
            dump('ETag header!\n');
        } catch (e) {
            // No ETag header set
        }
    };

    /**
     * Converts an nsIURI object into a human-readable string
     */
    var uriToString = function(uri) {
        dump(
            uri.scheme
            + '://'
            + uri.host
            + uri.path
            + '\n'
        );
    };

    if (!initialized) {
        init();
    }

})();
