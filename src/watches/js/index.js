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
    console.log(`Making dynamic content visible ${hiddenDataRenderDuration} ms after API queries sent in parallel`);

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
    const apiEndpoint = 'https://api.itinerarywatch.com/api/v001/watches';
    const startTime = performance.now();
    
    try {
        const response = await fetch(
            apiEndpoint,
            {
                method : 'GET',
                credentials : 'include',
                headers : {
                    'Accept' : 'application/json'
                }
            }
        );

        if (response.status === 401) {
            console.warn('Authentication failed: session credentials missing or expired');
            return null;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        userInfo = await response.json();
        const endTime = performance.now();
        const duration = Math.ceil(endTime - startTime);
        console.log(`Userinfo API data retrieved for ${userInfo.email_address} in ${duration} ms`);

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

    } catch (error) {
        displayFatalError(`Failed to retrieve profile: ${error.message}`);
    }
}

async function getUserWatches() {
    const apiEndpoint = 'https://api.itinerarywatch.com/api/v001/watches';
    const startTime = performance.now();

    try {
        const response = await fetch(
            apiEndpoint,
            {
                method : 'GET',
                credentials : 'include',
                headers : {
                    'Accept' : 'application/json'
                }
            }
        );

        if (response.status === 401) {
            console.warn('Authentication failed: user ID cookie missing or expired');
            return null;
        }

        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        userWatches = await response.json();
        const endTime = performance.now();
        const duration = Math.ceil(endTime - startTime);

        console.log(`User watches API data retrieved in ${duration} ms`);

        const tbody = document.querySelector('#div_id_watched_itineraries table tbody');
        if (!tbody) {
            displayFatalError("Could not find table structure in the DOM.");
            return;
        }

        tbody.textContent = '';
        const fragment = document.createDocumentFragment();

        Object.entries(userWatches).forEach(([watchId, watchData]) => {
            const tr = document.createElement('tr');
            const targetUrl = `https://itinerarywatch.com{watchId}`;

            // Handle row click navigation while honoring selection modifications (Cmd/Ctrl clicks)
            tr.addEventListener('click', (event) => {
                // Ignore click if the user is targeting text selection or clicking an inner link directly
                if (window.getSelection().toString() || event.target.tagName === 'A') {
                    return;
                }
                if (event.metaKey || event.ctrlKey) {
                    window.open(targetUrl, '_blank');
                } else {
                    window.location.href = targetUrl;
                }
            });

            // --- Data Parsing Layer ---
            let cruiseLine = "Unknown";
            if (watchData.url.includes("celebritycruises.com")) {
                cruiseLine = "Celebrity";
            } else if (watchData.url.includes("ncl.com")) {
                cruiseLine = "Norwegian";
            }

            // Extract values and isolate date (YYYY-MM-DD) vs time (HH:MM) segments safely
            const updatedDate = watchData.watch_last_updated_timestamp.substring(0, 10);
            const updatedTime = watchData.watch_last_updated_timestamp.substring(11, 16);
            
            const resultsDate = watchData.search_contents_changed_timestamp.substring(0, 10);
            const resultsTime = watchData.search_contents_changed_timestamp.substring(11, 16);

            const checkedDate = watchData.search_last_checked_timestamp.substring(0, 10);
            const checkedTime = watchData.search_last_checked_timestamp.substring(11, 16);

            // Assemble optimized compact display strings
            const watchLastUpdatedFormatted = `${updatedDate} ${updatedTime} UTC`;
            const resultsLastUpdatedFormatted = `${resultsDate} ${resultsTime} UTC`;
            const searchLastCheckedFormatted = `${checkedDate} ${checkedTime} UTC`;

            // --- DOM Element Construction Layer ---
            // Column 1: Search Name containing semantic accessible anchor link tag
            const tdName = document.createElement('td');
            const rowAnchor = document.createElement('a');
            rowAnchor.className = 'table-row-link';
            rowAnchor.href = targetUrl;
            rowAnchor.textContent = watchData.watch_name;
            tdName.appendChild(rowAnchor);
            tr.appendChild(tdName);

            // Column 2: Cruise Line Mapped String
            const tdLine = document.createElement('td');
            tdLine.textContent = cruiseLine;
            tr.appendChild(tdLine);

            // Column 3: Sailings Count Numeric Integer
            const tdSailings = document.createElement('td');
            tdSailings.textContent = watchData.matching_sailings_found;
            tr.appendChild(tdSailings);

            // Column 4: Search Last Updated Date + Time
            const tdUpdated = document.createElement('td');
            tdUpdated.textContent = watchLastUpdatedFormatted;
            tr.appendChild(tdUpdated);

            // Column 5: Search Results Last Updated Date + Time
            const tdResults = document.createElement('td');
            tdResults.textContent = resultsLastUpdatedFormatted;
            tr.appendChild(tdResults);

            // Column 6: Search Last Checked Date + Time
            const tdChecked = document.createElement('td');
            tdChecked.textContent = searchLastCheckedFormatted;
            tr.appendChild(tdChecked);

            fragment.appendChild(tr);
        });

        tbody.appendChild(fragment);
        renderUserSpecificDataIfReady();

    } catch (error) {
        displayFatalError(`Failed to render dashboard rows: ${error.message}`);
    }
}

function main() {
    initializeTableSorter();
    pageStartTime = performance.now();
    getUserInfo();
    getUserWatches();
}

main();
