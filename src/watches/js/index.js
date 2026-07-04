let pageStartTime = null;
let userInfo = null;
let userWatches = null;


function displayFatalError(message) {
    const mainApp = document.getElementById('div_user_watches');
    if (mainApp) {
        mainApp.style.display = 'none';
    }

    let errorBanner = document.getElementById('app_fatal_error');
    if (!errorBanner) {
        errorBanner = document.createElement('div');
        errorBanner.id = 'app_fatal_error';
        errorBanner.style.cssText = 'background: #fee2e2; color: #991b1b; padding: 20px; border-radius: 8px; text-align: center; margin: 20px;';
        document.body.appendChild(errorBanner);
    }

    errorBanner.textContent = message || 'Something went wrong. Please refresh the page.';
}

function renderUserSpecificDataIfReady() {

    // Bail out if we're not, in fact, ready to render
    if ((userInfo === null) || (userWatches === null)) {
        return;
    }

    const hiddenDataRenderTime = performance.now();
    const hiddenDataRenderDuration = Math.ceil(hiddenDataRenderTime - pageStartTime);
    console.log(`Revealing hidden part of page ${hiddenDataRenderDuration} ms after kicking off parallel API queries`);

    const userWatchesDiv = document.getElementById('div_id_user_watches');

    if (userWatchesDiv) {
        userWatchesDiv.style.display = 'block';
    } else {
        displayFatalError("The hidden div element div_id_user_watches did not exist in the DOM.");
        return;
    }
}

async function getUserInfo() {
    const startTime = performance.now();

    userInfo = await apiUserInfo();

    const endTime = performance.now();
    const duration = Math.ceil(endTime - startTime);

    console.log(`Userinfo retrieved for ${userInfo.email_address} in ${duration} ms`);

    // Update fields of DOM in hidden portion of page now that we have their contents
    const emailSpans = document.querySelectorAll('.span_class_user_email');
    if (emailSpans.length > 0) {
        emailSpans.forEach(
            span => {
                span.textContent = userInfo.email_address;
            }
        );
    } else {
        displayFatalError("Couldn't find any spans to display email address");
        return;
    }

    renderUserSpecificDataIfReady();
}


async function getUserWatches() {
    const startTime = performance.now();

    userWatches = await apiUserWatches();

    const endTime = performance.now();
    const duration = Math.ceil(endTime - startTime);

    console.log(`User's itinerary watches retrieved in ${duration} ms`);

    renderUserSpecificDataIfReady();
}



function main() {
    pageStartTime = performance.now();

    // These two functions are both async, meaning they run *in parallel*; they are independent and
    //      running them in serial would impact UX in an unhappy way. There's still only one thread
    //      of execution in JS, so there's no chance of race conditions
    getUserInfo();
    getUserWatches();
}


main();
