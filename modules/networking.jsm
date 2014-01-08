var EXPORTED_SYMBOLS = [ 'H1Networking' ];

// Alias API components
const { classes: Cc, interfaces: Ci } = Components;

var observerService = Cc['@mozilla.org/observer-service;1']
    .getService(Ci.nsIObserverService);

var prefService = Cc['@mozilla.org/preferences-service;1']
    .getService(Ci.nsIPrefBranch);

// Reference to H1 user agent database
Components.utils.import('resource://h1/database.jsm');

// Constants
const TOPIC_MODIFY_REQUEST = 'http-on-modify-request';

var H1Networking = (function() {

    /**
     * Whether or not the module has been initialized
     */
    var initialized = false;

    /**
     * Cached preferences for which actions to perform. Until initialized, these
     * all assume their default values.
     */
    var preferences = {
        'etag.allow':   true,
        'etag.notify':  false,
        'referer.allow': false,
        'ua.mangle':     true
    };

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

        if (H1Database.isAllowed(subject.URI)) {
            // Do nothing if the URI was whitelisted
            return;
        }

        if (!preferences['referer.allow']) {
            // Strip HTTP referer header
            subject.referrer = null;
        }

        if (!preferences['etag.allow']) {
            // Check for HTTP ETag header
            try {
                subject.getRequestHeader('ETag');
                if (preferences['etag.notify']) {
                    // Notify the user...
                    dump('Notify ETag\n');
                }
            } catch (e) {
                // No ETag header set
            }
        }

        if (preferences['ua.mangle']) {
            let ua = H1Database.nextUA();
            subject.setRequestHeader('User-Agent', ua, false);
        }
    };

    if (!initialized) {
        init();
    }

})();
