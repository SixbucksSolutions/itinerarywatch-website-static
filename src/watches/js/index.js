let pageStartTime = null;
let userInfo = null;
let userWatchesData = null;
let userSingleWatchData = null;

function displayFatalError(message) {
    // console.log("Inside displayFatalError");
    const mainApp = document.getElementById('div_id_dynamic_data');
    // Hide anything but page title
    if (mainApp) {
        mainApp.style.display = 'none';
    }

    // Check if the banner was already created
    let errorBanner = document.getElementById('div_id_error_banner');

    if (!errorBanner) {
        // console.log("Did not find div for error banner, creating a new one");
        errorBanner = document.createElement('div');

        // There's CSS declared for this in index.css
        errorBanner.id = 'div_id_error_banner';

        errorBanner.textContent = message || 'Something went wrong. Please refresh the page.';
        document.body.appendChild(errorBanner);
        // console.log("Fatal error is now attached as the last child of the body");
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

function renderUserSpecificDataIfReady() {
    // Bail out if we're not, in fact, ready to render

    // User email is mandatory in either case, if we don't have it, wait for it
    if ( userInfo === null ) {
        return;
    }

    // If we have user info AND all the user's watches, show the full list
    if ( userWatchesData !== null ) {
        // console.log('renderUserSpecificDataIfReady calling renderAllUserWatches');
        renderAllUserWatches();
    }
    else if ( userSingleWatchData !== null ) {
        // console.log('renderUserSpecificDataIfReady calling renderSingleUserWatchDetails');
        renderSingleUserWatchDetails();
    }
}

function renderAllUserWatches() {
    if (pageStartTime !== null) {
        const hiddenDataRenderTime = performance.now();
        const hiddenDataRenderDuration = Math.ceil(hiddenDataRenderTime - pageStartTime);
        console.log(`Making dynamic content visible ${hiddenDataRenderDuration} ms after API queries sent in parallel`);
    }

    const userWatchesDiv = document.getElementById('div_id_dynamic_data_all_searches');
    const dynamicDataDiv = document.getElementById('div_id_dynamic_data');

    // display email and list of all user searches
    if (userWatchesDiv && dynamicDataDiv) {
        userWatchesDiv.style.display = 'block';
        dynamicDataDiv.style.display = 'block';
    } else {
        displayFatalError("One or both divs we needed to show when rendering all user watches were missing");
        return;
    }

    // Trigger initial default sort by "Search Name" column in ascending order
    const firstHeader = document.querySelector('th.sortable-header');
    if (firstHeader) {
        firstHeader.click();
    }
}

function renderSingleUserWatchDetails() {
    if (pageStartTime !== null) {
        const hiddenDataRenderTime = performance.now();
        const hiddenDataRenderDuration = Math.ceil(hiddenDataRenderTime - pageStartTime);
        console.log(`Making dynamic content for single watch visible ${hiddenDataRenderDuration} ms after API queries sent in parallel`);
    }

    const searchDivName = 'div_id_dynamic_data_single_search';
    const searchDiv = document.getElementById(searchDivName);

    if (!searchDiv) {
        throw new Error(`Div for single search \"${searchDivName}\" not found in DOM`);
    }

    searchDiv.style.display = "block";
    console.log("single watch search dynamic data was set to visible");

    // display all dynamic data if it's still hidden (first page load)
    const allDynamicDataDiv = document.getElementById('div_id_dynamic_data');
    if (!allDynamicDataDiv) {
        throw new Error("Div for dynamic data \"div_id_dynamic_data\" not found in DOM");
    }

    // Have we not already displayed email yet because the user came straight to this URL?
    if (allDynamicDataDiv.style.display !== 'block') {
        allDynamicDataDiv.style.display = 'block'
        console.log('Flipped all dynamic data block to visible as it was hidden');
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

        userWatchesData = await response.json();
        const endTime = performance.now();
        const duration = Math.ceil(endTime - startTime);
        console.log(`User watches API data retrieved in ${duration} ms`);

        const tbody = document.querySelector('#div_id_dynamic_data_all_searches table tbody');
        if (!tbody) {
            displayFatalError("Could not find table structure in the DOM.");
            return;
        }
        tbody.textContent = '';

        const fragment = document.createDocumentFragment();

        Object.entries(userWatchesData).forEach(([watchId, watchData]) => {
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

                    console.log(`User clicked row for detailed data on watch ID ${watchId}`);

                    // Hide all dynamic data besides email to be safe
                    document.getElementById('div_id_dynamic_data_all_searches').style.display = "none";
                    document.getElementById('div_id_dynamic_data_single_search').style.display = "none";
                    console.log("Hid dynamic watch/watches data")

                    // Nuke dynamic state, force an API pull for anything besides their email address
                    userWatchesData = null;
                    userSingleWatchData = null;

                    // Remove page start time, not a fresh load
                    pageStartTime = null;

                    getUserWatchDetails(watchId);
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

async function getUserWatchDetails(searchId) {
    console.log(`Making API request for details of user search ID ${searchId}`);

    const apiEndpoint = `https://api.itinerarywatch.com/api/v001/watch/${searchId}?search_result_timestamp=latest`
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

        userSingleWatchData = await response.json();
        const endTime = performance.now();
        const duration = Math.ceil(endTime - startTime);
        console.log(`User watch ${searchId} API data retrieved in ${duration} ms`);

        // --- 1. Populate Summary Data ---
        const summary = userSingleWatchData.summary;

        // Reusable formatter for "YYYY-MM-DD h:mmpm UTC"
        const formatTime = (ts) => {
            if (!ts) return "N/A";
            const datePart = ts.substring(0, 10);
            const timePart = ts.substring(11, 16);
            if (timePart.length !== 5 || !timePart.includes(':')) return ts; // safe fallback

            let [hourStr, minuteStr] = timePart.split(':');
            let hour = parseInt(hourStr, 10);
            const ampm = hour >= 12 ? 'pm' : 'am';
            hour = hour % 12;
            hour = hour ? hour : 12; // 0 becomes 12

            return `${datePart} ${hour}:${minuteStr}${ampm} UTC`;
        };
        
        // Formatter for time-only strings like "16:00:00" -> "4:00pm"
        const formatTimeOnly = (timeStr) => {
            if (!timeStr) return '';
            const parts = timeStr.split(':');
            if (parts.length < 2) return timeStr; 
            
            let hour = parseInt(parts[0], 10);
            const minuteStr = parts[1];
            const ampm = hour >= 12 ? 'pm' : 'am';
            hour = hour % 12;
            hour = hour ? hour : 12; // 0 becomes 12
            
            return `${hour}:${minuteStr}${ampm}`;
        };

        document.getElementById('td_id_summary_name').textContent = summary.name || "Unknown";

        // Create a clickable anchor for the long search URL
        const urlTd = document.getElementById('td_id_summary_url');
        urlTd.innerHTML = ''; // Clear prior data
        if (summary.url) {
            const urlAnchor = document.createElement('a');
            urlAnchor.href = summary.url;
            urlAnchor.textContent = summary.url;
            urlAnchor.target = "_blank";
            urlAnchor.rel = "noopener noreferrer";
            urlTd.appendChild(urlAnchor);
        }

        document.getElementById('td_id_summary_search_last_updated').textContent = formatTime(summary.last_updated_timestamp);
        document.getElementById('td_id_summary_search_contents_last_changed').textContent = formatTime(summary.search_contents_last_changed_timestamp);
        document.getElementById('td_id_summary_search_last_run').textContent = formatTime(summary.search_last_run_timestamp);

        // --- 2. Populate Itineraries (Dynamic DOM Construction) ---
        const singleSearchDiv = document.getElementById('div_id_dynamic_data_single_search');

        // Nuke the old itineraries container if it exists (handles back/forward navigation state)
        let itinerariesContainer = document.getElementById('div_id_itineraries_container');
        if (itinerariesContainer) {
            itinerariesContainer.remove();
        }

        // Create a fresh container
        itinerariesContainer = document.createElement('div');
        itinerariesContainer.id = 'div_id_itineraries_container';

        const resultSets = userSingleWatchData.search_result_sets || {};

        Object.entries(resultSets).forEach(([resultSetTime, sailings]) => {
            // Header for the specific result set, now utilizing our 12hr formatter
            const setHeader = document.createElement('h4');
            setHeader.textContent = `Results from: ${formatTime(resultSetTime)}`;
            setHeader.style.marginTop = "1.5rem";
            itinerariesContainer.appendChild(setHeader);

            if (!sailings || sailings.length === 0) {
                const noResults = document.createElement('p');
                noResults.textContent = "No sailings found in this result set.";
                itinerariesContainer.appendChild(noResults);
                return; // skip to next result set
            }

            sailings.forEach(sailing => {
                // Wrapper for each individual sailing
                const sailingDiv = document.createElement('div');
                sailingDiv.style.marginBottom = "2rem";
                sailingDiv.style.paddingLeft = "1rem";
                sailingDiv.style.borderLeft = "4px solid #cbd5e1"; // Visual anchor grouping days together

                const sailingTitle = document.createElement('p');
                sailingTitle.innerHTML = `<strong>Sailing ID:</strong> ${sailing.id}`;
                sailingDiv.appendChild(sailingTitle);

                // Build a mini-table for the day-by-day activities
                const table = document.createElement('table');
                table.style.marginTop = "0.5rem";
                table.style.marginLeft = "0"; // Overriding the global table margin in your CSS

                const thead = document.createElement('thead');
                // Updated "TIME START" and "TIME END" strictly to "START" and "END"
                thead.innerHTML = `
                    <tr>
                        <th scope="col">Date</th>
                        <th scope="col">Activity Type</th>
                        <th scope="col">Location</th>
                        <th scope="col">Start</th>
                        <th scope="col">End</th>
                    </tr>
                `;
                table.appendChild(thead);

                const tbody = document.createElement('tbody');

                (sailing.day_details || []).forEach(day => {
                    (day.activities || []).forEach(activity => {
                        const tr = document.createElement('tr');
                        
                        const tdDate = document.createElement('td');
                        tdDate.textContent = day.date;
                        
                        const tdType = document.createElement('td');
                        // Replace underscores with spaces for cleaner reading (e.g., PORT_EMBARK -> PORT EMBARK)
                        tdType.textContent = (activity.type || '').replace(/_/g, ' ');

                        const tdLocation = document.createElement('td');
                        let locString = '';
                        if (activity.location && activity.location.name) {
                            locString = activity.location.name;
                            if (activity.location.region) {
                                locString += `, ${activity.location.region}`;
                            }
                        }
                        tdLocation.textContent = locString;

                        // Pushed through our new 12-hr formatting helper
                        const tdStart = document.createElement('td');
                        tdStart.textContent = formatTimeOnly(activity.time_start);

                        const tdEnd = document.createElement('td');
                        tdEnd.textContent = formatTimeOnly(activity.time_end);

                        tr.appendChild(tdDate);
                        tr.appendChild(tdType);
                        tr.appendChild(tdLocation);
                        tr.appendChild(tdStart);
                        tr.appendChild(tdEnd);
                        tbody.appendChild(tr);
                    });
                });

                table.appendChild(tbody);
                sailingDiv.appendChild(table);
                itinerariesContainer.appendChild(sailingDiv);
            });
        });

        // Attach the completely built container to the DOM in one go
        singleSearchDiv.appendChild(itinerariesContainer);

        // Render phase complete, unhide UI
        renderUserSpecificDataIfReady();

    } catch (error) {
        displayFatalError(`Error when fetching and processing detailed user watch data: ${error.message}`);
    }
}

function main() {
    // Reveal the hidden page elements including the h1 now that fonts and scripts are ready -- avoids
    //      "Flicker Of Unstylized Text" (FOUT) problem that was visible when watching the h1 closely on
    //      reloads
    document.body.style.visibility = 'visible';

    pageStartTime = performance.now();
    console.log("pageStartTime set in main")

    // See if the element exists here
    const searchDivName = 'div_id_dynamic_data_single_search';
    const searchDiv = document.getElementById(searchDivName);

    if (!searchDiv) {
        console.log(`Inside main, div for single search \"${searchDivName}\" not found in DOM`);
    }

    // 1. Always fetch user profile data for the header email display right away
    getUserInfo();
    initializeTableSorter();

    // Clean, split, and array-filter the current path
    const initialSegments = window.location.pathname.replace(/\/$/, '').split('/').filter(s => s.length > 0);

    if (initialSegments.length === 2 && initialSegments[0] === 'watches') {
        const targetWatchId = initialSegments[1];
        console.log(`Initial page load: deep-link detected for watch ID ${targetWatchId}`);
        getUserWatchDetails(targetWatchId); // Will now fire and trigger displayFatalError()
    } else {
        console.log("Initial page load: default main dashboard view detected");
        getUserWatches();
    }

    // 3. NAVIGATION NAVIGATION INTERCEPTORS: Handle future browser Back/Forward clicks smoothly
    window.addEventListener('popstate', (event) => {
        console.log("User clicked back or forward; popstate event listener invoked");

        // Remove error banner in case it showed on the last page
        clearFatalErrorMessageIfShown();

        // Hide and wipe state on dynamic data that may have changed
        document.getElementById('div_id_dynamic_data_all_searches').style.display = "none";
        document.getElementById('div_id_dynamic_data_single_search').style.display = "none";
        userWatchesData = null;
        userSingleWatchData = null;

        const segments = window.location.pathname.replace(/\/$/, '').split('/').filter(s => s.length > 0);

        if (segments.length === 2 && segments[0] === 'watches') {
            // User clicked forward/back straight into a specific watch profile view target
            getUserWatchDetails(segments[1]);
        } else {
            // User clicked browser back button to return to the baseline watch listing directory
            getUserWatches();
        }
    });
}

main();
