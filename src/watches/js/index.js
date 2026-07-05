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
    const dynamicDataDiv = document.getElementById('div_id_dynamic_data'); 
    if (userWatchesDiv && dynamicDataDiv) {
        userWatchesDiv.style.display = 'block';
        dynamicDataDiv.style.display = 'block';
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
    const apiEndpoint = 'https://api.itinerarywatch.com/api/v001/user';
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
            
            // Fixed using a proper template literal and the correct www frontend domain
            const targetUrl = `/watches/${watchId}`;

            // Handle modern row-level click navigation while honoring text selection & meta keys
            tr.addEventListener('click', (event) => {
                // Gracefully ignore navigation if the user is highlighting text inside the row
                if (window.getSelection().toString()) {
                    return;
                }
                
                if (event.metaKey || event.ctrlKey) {
                    window.open(targetUrl, '_blank');
                } else {
                    history.pushState(null, '', `/watches/${watchId}`);

                    // Hide list of ALL watches
                    document.getElementById("div_id_watched_itineraries").style.display = "none";

                    console.log("Hid list of all watches")

                    console.log("TODO: send API request for full details on one watch")
                }
            });

            // --- Data Parsing Layer ---
            let cruiseLine = "Unknown";
            if (watchData.url.includes("celebritycruises.com")) {
                cruiseLine = "Celebrity";
            } else if (watchData.url.includes("ncl.com")) {
                cruiseLine = "Norwegian";
            }

            // Safe fallback timestamp check layers to guarantee substrings don't break on corrupted responses
            const updatedTimestamp = watchData.watch_last_updated_timestamp || "";
            const changedTimestamp = watchData.search_contents_changed_timestamp || "";
            const checkedTimestamp = watchData.search_last_checked_timestamp || "";

            const updatedDate = updatedTimestamp.length >= 10 ? updatedTimestamp.substring(0, 10) : "0000-00-00";
            const updatedTime = updatedTimestamp.length >= 16 ? updatedTimestamp.substring(11, 16) : "00:00";
            
            const resultsDate = changedTimestamp.length >= 10 ? changedTimestamp.substring(0, 10) : "0000-00-00";
            const resultsTime = changedTimestamp.length >= 16 ? changedTimestamp.substring(11, 16) : "00:00";
            
            const checkedDate = checkedTimestamp.length >= 10 ? checkedTimestamp.substring(0, 10) : "0000-00-00";
            const checkedTime = checkedTimestamp.length >= 16 ? checkedTimestamp.substring(11, 16) : "00:00";

            // Assemble optimized compact display strings matching your minute-resolution pattern
            const watchLastUpdatedFormatted = `${updatedDate} ${updatedTime} UTC`;
            const resultsLastUpdatedFormatted = `${resultsDate} ${resultsTime} UTC`;
            const searchLastCheckedFormatted = `${checkedDate} ${checkedTime} UTC`;

            // --- DOM Element Construction Layer ---
            // Column 1: Search Name 
            const tdName = document.createElement('td');
            tdName.textContent = watchData.watch_name;
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

