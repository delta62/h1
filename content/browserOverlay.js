// Ensure namespace exists
var H1 = H1 || { };

H1.preferenceWindow = null;

H1.showPreferences = function(e) {
    if (H1.preferenceWindow == null) {
        let instantApply = Application.prefs
            .get('browser.preferences.instantApply');
        let features = 'chrome,titlebar,toolbar,centerscreen' +
            (instantApply ? ',dialog=no' : ',modal');

        H1.preferenceWindow = window.openDialog(
            'chrome://h1/content/preferences.xul',
            'h1-preferences-window',
            features
        );
    }

    H1.preferenceWindow.focus();
};

// Initialize networking
Components.utils.import('resource://h1/networking.jsm');
