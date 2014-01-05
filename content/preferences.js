// Ensure namespace exists
var H1 = H1 || { };

H1.Preferences = {

    unload: function(e) {
        dump('unload\n');
        H1.preferenceWindow = null;
    }

};
