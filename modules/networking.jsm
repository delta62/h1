var EXPORTED_SYMBOLS = [ 'H1Networking' ];

// Alias API components
const { classes: Cc, interfaces: Ci } = Components;

var observerService = Cc['@mozilla.org/observer-service;1']
    .getService(Ci.nsIObserverService);

// Reference to H1 user agent database
Components.utils.import('resource://h1/database.jsm');

// HTTP modification topic
const TOPIC_MODIFY_REQUEST = 'http-on-modify-request';

// Root preferences branch
const PREF_BRANCH = 'extensions.h1.';

// Preference keys
const PREF_ETAG_ALLOW    = 'etag.allow';
const PREF_REFERER_ALLOW = 'referer.allow';
const PREF_UA_MANGLE     = 'ua.mangle';

var H1Networking = (function() {

    /**
     * Whether or not the module has been initialized
     */
    var initialized = false;

    /**
     * H1 extension branch
     */
    var prefBranch = null;

    /**
     * Cached preferences for which actions to perform. Until initialized, these
     * all assume their default values.
     */
    var prefCache = {
        PREF_ETAG_ALLOW:    true,
        PREF_REFERER_ALLOW: false,
        PREF_UA_MANGLE:     true
    };

    /**
     * Initialize the module. Should only be called once.
     */
    var init = function() {
        let prefService = Cc['@mozilla.org/preferences-service;1']
            .getService(Ci.nsIPrefService);
        prefBranch = prefService.getBranch(PREF_BRANCH);
        prefBranch.addObserver('', prefObserver, false);

        // Load base preferences
        prefCache[PREF_ETAG_ALLOW] = prefBranch.getBoolPref(PREF_ETAG_ALLOW);
        prefCache[PREF_REFERER_ALLOW] = 
            prefBranch.getBoolPref(PREF_REFERER_ALLOW);
        prefCache[PREF_UA_MANGLE] = prefBranch.getBoolPref(PREF_UA_MANGLE);

        // Listen for network requests
        observerService.addObserver(observer, TOPIC_MODIFY_REQUEST, false);
    };

    /**
     * Observer callback for H1 preference changes. Arguments passed to the 
     * observe function are as follows:
     *     subject: The nsIPrefBranch that observed the change
     *     topic: A constant defined by Mozilla. Unimportant to this callback.
     *     data: The name of the preference within the branch that changed
     */
    var prefObserver = {
        observe: function(subject, topic, data) {
            if (prefCache[data] != undefined) {
                // Update the preference cache
                prefCache[data] = subject.getBoolPref(data);
            }
        }
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

        if (!prefCache['referer.allow']) {
            // Strip HTTP referer header
            subject.referrer = null;
        }

        if (!prefCache['etag.allow']) {
            // Check for HTTP ETag header
            try {
                subject.getRequestHeader('ETag');
                subject.setRequestHeader('ETag', '', false);
            } catch (e) {
                // No ETag header set.
            }
        }

        if (prefCache['ua.mangle']) {
            let ua = H1Database.nextUA();
            subject.setRequestHeader('User-Agent', ua, false);
        }
    };

    if (!initialized) {
        init();
    }

})();
