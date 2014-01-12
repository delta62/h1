// Ensure namespace exists
var H1 = H1 || { };

// Alias API components
const { classes: Cc, interfaces: Ci } = Components;

// Reference to H1 user agent database
Components.utils.import('resource://h1/database.jsm');

H1.Preferences = {

    add: function() {
        let textbox = document.getElementById('h1-whitelist-uri');
        try {
            H1Database.allowURI(textbox.value);
            textbox.value = '';
        } catch (ex) {
            dump('Invalid URI, cannot add.\n');
        }
    },

    /**
     * Re-load the listbox's contents
     */
    load: function() {
        let listbox = document.getElementById('h1-whitelist');

        // Remove any existing elements
        while (listbox.firstChild) {
            listbox.removeChild(listbox.firstChild);
        }

        // Add whitelist items
        let whitelist = H1Database.allURIs();
        for (let i = 0; i < whitelist.length; i += 1) {
            dump('Adding ' + whitelist[i] + ' to listbox.\n');
            listbox.appendItem(whitelist[i]);
        }
    }

};
