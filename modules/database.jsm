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

// Import required services
Components.utils.import("resource://gre/modules/AddonManager.jsm");
Components.utils.import('resource://gre/modules/FileUtils.jsm');
Components.utils.import("resource://gre/modules/NetUtil.jsm");
Components.utils.import("resource://gre/modules/XPCOMUtils.jsm");

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
     * An array of user-agent strings that should be used. This acts as a ring
     * buffer, loading more random UA strings when it starts running low.
     */
    var uaCache = [ ];

    /**
     * Initialize the service. This should only be called once per browser
     * instance.
     */
    var init = function() {
        checkInstalled();
    };

    /**
     * Ensure that a UA definition file has been created. If not, copy the
     * default database as the definition file.
     */
    var checkInstalled = function() {
        let defFile = FileUtils.getFile(
            PROFILE_DIR,
            [EXTENSION_DIR, DEFINITION_FILE]
        );

        if (!defFile.exists()) {
            AddonManager.getAddonByID(ADDON_ID, copyDefaultDefs);
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
            },
            QueryInterface: XPCOMUtils.generateQI([
                Ci.nsISupports,
                Ci.nsIStreamListener,
                Ci.nsIRequestObserver
            ])
        };
        channel.asyncOpen(handler, null);
        
    };

    var getUAString = function() {

    };

    if (!initialized) {
        init();
    }

    return {
        nextUA: getUAString
    };

})();
