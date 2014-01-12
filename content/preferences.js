// Ensure namespace exists
var H1 = H1 || { };

// Alias API components
const { classes: Cc, interfaces: Ci } = Components;

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
    },

    /**
     * Disable the delete button
     */
    enableRemove: function() {
        document.getElementById('h1-whitelist-remove').disabled = false;
    },

    /**
     * Disable the delete button
     */
    disableRemove: function() {
        document.getElementById('h1-whitelist-remove').disabled = true;
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
        H1.Preferences.load();
        // Disable remove button
        H1.Preferences.disableRemove();
    }

};
