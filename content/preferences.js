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
            H1.Preferences.load();
            textbox.value = '';
        } catch (ex) {
            throw ex;
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
        H1.Preferences.load();
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
    }

};
