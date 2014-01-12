var EXPORTED_SYMBOLS = [ 'H1Database' ];

// Alias API components
const { classes: Cc, interfaces: Ci } = Components;

/**
 * The ID of this extension (h1).
 */
const ADDON_ID = 'h1@samnoedel.com';

/**
 * The number of UA strings to cache at once. Setting this higher will result
 * in less filesystem hits, but will also increase memory consumption.
 */
const CACHE_SIZE = 100;

/**
 * The lower-bound of the cache before more items are loaded
 */
const MIN_CACHE_SIZE = 5;

/**
 * The XPCOM notification used for referring to the current user's profile
 * directory.
 */ 
const PROFILE_DIR = 'ProfD';

/**
 * The directory within PROFILE_DIR that holds this extension's data.
 */
const EXTENSION_DIR = 'h1';

/**
 * The filename of the user agent database, located within EXTENSION_DIR.
 */
const DEFINITION_FILE = 'ua.def';

/**
 * Preference key for the h1 whitelist data
 */
const PREF_WHITELIST = 'extensions.h1.whitelist';

// Import required services
Components.utils.import('resource://gre/modules/AddonManager.jsm');
Components.utils.import('resource://gre/modules/FileUtils.jsm');
Components.utils.import('resource://gre/modules/NetUtil.jsm');
Components.utils.import('resource://gre/modules/Timer.jsm');
Components.utils.import('resource://gre/modules/XPCOMUtils.jsm');

/**
 * The H1 database consists of a file containing the different user agent
 * strings that should be used. Parsing the file is done sparingly, with results
 * stored in memory. As such, it is a fairly cheap operation to get the next UA
 * string.
 *
 * The module provides an iterator-like interface that can be called repeatedly
 * to get UA strings.
 */
var H1Database = (function() {

    /**
     * Whether or not the service has been initialized
     */
    var initialized = false;

    /**
     * An array of user-agent strings that should be used. This acts as a stack,
     * loading more random UA strings when it starts running low. If a
     * request is made but no UA strings are available, the default UA is sent.
     * If the last UA string is consumed, it will be repeatedly re-used until
     * more are made available. Thus, the only time the real UA is sent is when
     * either the random UA coincides with the real one, or when requests are
     * made before random UA strings can be loaded.
     */
    var uaCache = [ ];

    /**
     * A default user-agent to use if one is needed, but none have been loaded
     * yet. This should occur very rarely.
     */
    var defaultUserAgent = 'Mozilla/5.0 (Windows NT 6.0; WOW64; rv:24.0) ' +
        'Gecko/20100101 Firefox/24.0';

    /**
     * The whitelist is persisted via a Firefox preference, as a string of space
     * separated domains (identical to the format of NoScript). The service's 
     * whitelist variable is kept in-sync with said preference to allow a faster
     * lookup at runtime.
     */
    var whitelist = '';

    /**
     * Initialize the service. This should only be called once per browser
     * instance. Upon initialization, CACHE_SIZE user agent strings will be
     * available for consupmtion. If a request is made before the cache is
     * ready, the real user agent string will be used.
     */
    var init = function() {
        checkInstalled();
        loadWhitelist();
    };

    /**
     * Ensure that a UA definition file has been created. If not, copy the
     * default database as the definition file.
     */
    var checkInstalled = function() {
        let defFile = FileUtils.getFile(
            PROFILE_DIR,
            [ EXTENSION_DIR, DEFINITION_FILE ]
        );

        if (!defFile.exists()) {
            // Defer loading strings until there is a db to load from
            AddonManager.getAddonByID(ADDON_ID, copyDefaultDefs);
        } else {
            loadUAStrings();
        }
    };

    /**
     * Copy the default UA definitions into the appropriate profile directory.
     * @param addon An Addon object representing this extension
     */
    var copyDefaultDefs = function(addon) {
        /* The alternative to all this is to make this extension unpacked. Since
         * that seems to slow down Firefox, I've opted to make the installation
         * process a little less elegant instead.
         */

        // Open a channel to the bundled file
        var ioService = Cc['@mozilla.org/network/io-service;1']
            .getService(Ci.nsIIOService);
        let uri = addon.getResourceURI('defaults/ua.def');
        let channel = ioService.newChannelFromURI(uri);
        let defContents;
        
        /* Create a new ua.def file, and write the contents of the bundled file
         * to it.
         */
        let handler = {
            onStartRequest: function() { },
            onDataAvailable: function(req, ctx, stream, offset, count) {
                defContents = NetUtil.readInputStreamToString(stream, count);
            },
            onStopRequest: function() {
                // Create the new definitions file
                let defsFile = FileUtils.getFile(
                    PROFILE_DIR,
                    [ EXTENSION_DIR, DEFINITION_FILE ]
                );
                defsFile.create(defsFile.NORMAL_FILE_TYPE, 0644);

                // Write data to file
                let outStream = FileUtils.openSafeFileOutputStream(defsFile);
                outStream.write(defContents, defContents.length);
                FileUtils.closeSafeFileOutputStream(outStream);

                // Load some UA strings
                loadUAStrings();
            },
            QueryInterface: XPCOMUtils.generateQI([
                Ci.nsISupports,
                Ci.nsIStreamListener,
                Ci.nsIRequestObserver
            ])
        };
        channel.asyncOpen(handler, null);
    };

    /**
     * Load CACHE_SIZE UA strings into memory from disk
     */
    var loadUAStrings = function() {
        let defsFile = FileUtils.getFile(
            PROFILE_DIR,
            [ EXTENSION_DIR, DEFINITION_FILE ]
        );

        NetUtil.asyncFetch(defsFile, function(inStream, result) {
            if (!Components.isSuccessCode(result)) {
                throw {
                    message: 'Unable to open UA definitions file'
                };
            }

            let unparsed = NetUtil.readInputStreamToString(
                inStream,
                inStream.available()
            );

            let lines = unparsed.split(/\r?\n/);
            while (uaCache.length < CACHE_SIZE) {
                let item = arrayRand(lines);
                if (!/(^#.*$)|(^\s*$)/m.test(item)) {
                    uaCache.push(item);
                }
            }
        });
    };

    /**
     * Load the whitelist from Firefox's preferences system
     */
    var loadWhitelist = function() {
        let prefService = Cc['@mozilla.org/preferences-service;1']
            .getService(Ci.nsIPrefBranch);
        whitelist = prefService.getCharPref(PREF_WHITELIST);
    };

    /**
     * Get a singe UA string from the cache. This will trigger loading of more 
     * UA strings if the lower-bound is reached.
     */
    var getUAString = function() {
        // Defer loading of more UA strings until this function returns
        if (uaCache.length == MIN_CACHE_SIZE + 1) {
            setTimeout(loadUAStrings, 0);
        }
        // BALLMER PEAK GO
        if (uaCache.length > 1) {
            return uaCache.pop();
        }

        if (uaCache.legth == 1) {
            // Never destroy the last available user agent string
            return uaCache[0];
        }

        return defaultUserAgent;
    };

    /**
     * Get a random element out of an array
     */
    var arrayRand = function(arr) {
        let idx = Math.floor(Math.random() * arr.length);
        return arr[idx];
    };

    /**
     * Whitelist a URI. This will disable all features of h1 for the given
     * domain. Will throw an error if the URI is invalid.
     * @param uri Either a URI string, or an nsIURI object
     */
    var allowURI = function(uri) {
        if (!(uri instanceof Ci.nsIURI)) {
            if (!/:\/\//.test(uri)) {
                uri = 'http://' + uri;
            }
            let ioService = Cc['@mozilla.org/network/io-service;1']
                .getService(Ci.nsIIOService);
            uri = ioService.newURI(uri, null, null);
        }
        dump('Added URI: ' + uri.asciiHost + '\n');

        let prefService = Cc['@mozilla.org/preferences-service;1']
            .getService(Ci.nsIPrefBranch);
        whitelist += parseURI(uri) + ' ';
        prefService.setCharPref(PREF_WHITELIST, whitelist);
    };

    /**
     * Retrieve all whitelisted URIs from the database
     * @returns
     */
    var allURIs = function() {
        return whitelist.split(' ');
    };

    /**
     * Check to see if a URI has been whitelisted. Returns true if the given
     * URI's domain is whitelisted, or false otherwise. 
     * @param uri An nsIURI object
     */
    var checkURI = function(uri) {
        dump('Testing " ' + parseURI(uri) + ' " against "' + whitelist + '".\n');
        let re = new RegExp(' ' + parseURI(uri) + ' ');
        return re.test(whitelist);
    };

    /**
     * Return the host part of a URI, which is the internal method of deciding
     * if a given URI should be whitelisted or not.
     * @param uri An nsIURI object
     */
    var parseURI = function(uri) {
        return uri.asciiHost;
    };

    if (!initialized) {
        init();
    }

    return {
        nextUA:    getUAString,
        allowURI:  allowURI,
        isAllowed: checkURI,
        parseURI:  parseURI
    };

})();
