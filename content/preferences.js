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
    }

};
