let pageStartTime = null;
let userInfo = null;
let userWatches = null;


function displayFatalError(message) {
    const mainApp = document.getElementById('div_id_watched_itineraries');
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

    const userWatchesDiv = document.getElementById('div_id_watched_itineraries');
    if (userWatchesDiv) {
        userWatchesDiv.style.display = 'block';
    } else {
        displayFatalError("The hidden div element did not exist in the DOM.");
        return;
    }

    // Trigger initial default sort by "Search Name" column in ascending order
    const firstHeader = document.querySelector('th.sortable-header');
    if (firstHeader) {
        firstHeader.click();
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
    try {
        const startTime = performance.now();
        userWatches = await apiUserWatches();
        const endTime = performance.now();
        const duration = Math.ceil(endTime - startTime);
        console.log(`User's itinerary watches retrieved in ${duration} ms`);

        const tbody = document.querySelector('#div_id_watched_itineraries table tbody');
        if (!tbody) {
            displayFatalError("Could not find table structure in the DOM.");
            return;
        }

        tbody.textContent = '';
        const fragment = document.createDocumentFragment();

        Object.entries(userWatches).forEach(([watchId, watchData]) => {
            const tr = document.createElement('tr');

            // --- Data Parsing Layer ---

            let cruiseLine = "Unknown";
            if (watchData.url.includes("celebritycruises.com")) {
                cruiseLine = "Celebrity";
            } else if (watchData.url.includes("ncl.com")) {
                cruiseLine = "Norwegian";
            }

            // Extract the date (YYYY-MM-DD) from indices 0 to 10
            const searchDate = watchData.watch_last_updated_timestamp.substring(0, 10);
            const resultsDate = watchData.search_contents_changed_timestamp.substring(0, 10);

            // Extracted only hours and minutes (HH:MM) from indices 11 to 16
            const searchTime = watchData.watch_last_updated_timestamp.substring(11, 16);
            const resultsTime = watchData.search_contents_changed_timestamp.substring(11, 16);

            // Assemble the optimized compact display string components
            const searchLastUpdatedFormatted = `${searchDate} ${searchTime} UTC`;
            const resultsLastUpdatedFormatted = `${resultsDate} ${resultsTime} UTC`;

            // --- DOM Element Construction Layer ---

            // Column 1: Search Name
            const tdName = document.createElement('td');
            tdName.textContent = watchData.watch_name;
            tr.appendChild(tdName);

            // Column 2: Cruise Line Mapped String
            const tdLine = document.createElement('td');
            tdLine.textContent = cruiseLine;
            tr.appendChild(tdLine);

            // Column 3: Search Last Updated Date + Time ('YYYY-MM-DD HH:MM UTC')
            const tdUpdated = document.createElement('td');
            tdUpdated.textContent = searchLastUpdatedFormatted;
            tr.appendChild(tdUpdated);

            // Column 4: Search Results Last Updated Date + Time ('YYYY-MM-DD HH:MM UTC')
            const tdResults = document.createElement('td');
            tdResults.textContent = resultsLastUpdatedFormatted;
            tr.appendChild(tdResults);

            fragment.appendChild(tr);
        });

        tbody.appendChild(fragment);
        renderUserSpecificDataIfReady();

    } catch (error) {
        displayFatalError(`Failed to render dashboard rows: ${error.message}`);
    }
}



function main() {
    // Initialize table sorter; only needs to be done once
    initializeTableSorter();

    pageStartTime = performance.now();

    // These two functions are both async, meaning they run *in parallel*; they are independent and
    //      running them in serial would impact UX in an unhappy way. There's still only one thread
    //      of execution in JS, so there's no chance of race conditions
    getUserInfo();
    getUserWatches();
}


main();
