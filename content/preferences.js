// Ensure namespace exists
var H1 = H1 || { };

// Alias API components
const { classes: Cc, interfaces: Ci } = Components;

const NOSCRIPT_ID = '{73a6fe31-595d-460b-a920-fcc0f8843232}';

// Reference to H1 user agent database
Components.utils.import('resource://h1/database.jsm');

H1.Preferences = {

    /**
     * Handle clicks on the 'add to whitelist' button
     */
    add: function() {
        let textbox = document.getElementById('h1-whitelist-uri');
        try {
            H1Database.allowURI(textbox.value);
            H1.Preferences.loadWhitelist();
            textbox.value = '';
        } catch (ex) {
            let promptService = Cc['@mozilla.org/embedcomp/prompt-service;1']
                .getService(Ci.nsIPromptService);
            promptService.alert(
                null,
                'Unable to add site',
                '"' + textbox.value + '" is not a valid site name.'
            );
        }
    },

    /**
     * Initialize the whitelist prefpane
     */
    load: function() {
        // Load items in the listbox
        H1.Preferences.loadWhitelist();

        let noscriptCB = document.getElementById('h1-use-noscript');
        noscriptCB.addEventListener('CheckboxStateChange', 
            H1.Preferences.onCheckChanged);

        let e = new Event('CheckboxStateChange');
        noscriptCB.dispatchEvent(e);

        // Czech if NoScript is installed
        H1.Preferences.queryNoScript(function(installed) {
            if (installed) {
                noscriptCB.disabled = false;
            } else {
                noscriptCB.checked = false;
            }
        });
    },

    /**
     * Re-load the listbox's contents
     */
    loadWhitelist: function() {
        let listbox = document.getElementById('h1-whitelist');

        // Remove any existing elements
        while (listbox.firstChild) {
            listbox.removeChild(listbox.firstChild);
        }

        // Add whitelist items
        let whitelist = H1Database.allURIs();
        for (let i = 0; i < whitelist.length; i += 1) {
            listbox.appendItem(whitelist[i]);
        }
    },

    /**
     * Enable/Disable the delete button.
     * @param enabled A truthy variable indicating whether or not the button
     * should be enabled.
     */
    toggleRemove: function(enabled) {
        document.getElementById('h1-whitelist-remove').disabled = !enabled;
    },

    /**
     * Remove the selected item(s) from the whitelist database
     */
    remove: function() {
        let items = document.getElementById('h1-whitelist').selectedItems;
        for (let i = 0; i < items.length; i += 1) {
            let item = items[i];
            H1Database.disallowURI(item.label);
        }

        // Re-load listbox contents
        H1.Preferences.loadWhitelist();
        // Disable remove button
        H1.Preferences.toggleRemove(false);
    },

    /**
     * Intercept pressing the <ENTER> key in the add URI textbox
     */
    keySubmit: function(event) {
        if (event.keyCode == 13) {
            H1.Preferences.add();
            // Stop the entire dialog from being accepted
            event.preventDefault();
        }
    },

    /**
     * Check to see if NoScript is installed. When detection is complete, the
     * passed callback will be called with a single boolean parameter,
     * indicating if NoScript is installed (and currently activated) or not.
     */
    queryNoScript: function(callback) {
        Components.utils.import('resource://gre/modules/AddonManager.jsm');
        AddonManager.getAddonByID(NOSCRIPT_ID, function(addon) {
            if (addon == null) {
                callback(false);
            } else {
                // NoScript is installed, but is it disabled?
                callback(addon.isActive);
            }
        });
    },

    /**
     * Handle changes to the noscript whitelist setting
     */
    onCheckChanged: function(event) {
        let off = event.target.checked;
        document.getElementById('h1-whitelist-uri').disabled = off;
        document.getElementById('h1-whitelist-add').disabled = off;
        document.getElementById('h1-whitelist').disabled = off;
    }

};
