function displayFatalError(message) {
    const mainApp = document.getElementById('div_id_dynamic_data');
    // Hide anything but page title
    if (mainApp) {
        mainApp.style.display = 'none';
    }

    // Check if the banner was already created
    let errorBanner = document.getElementById('div_id_error_banner');

    if (!errorBanner) {
        errorBanner = document.createElement('div');

        // There's CSS declared for this in index.css
        errorBanner.id = 'div_id_error_banner';

        errorBanner.textContent = message || 'Something went wrong. Please refresh the page.';
        document.body.appendChild(errorBanner);
    } else {
        console.log("Can't display an error when banner is already up!");
    }
}

function clearFatalErrorMessageIfShown() {
    const errorBanner = document.getElementById("div_id_error_banner");

    if (errorBanner) {
        errorBanner.remove();
    }
}
