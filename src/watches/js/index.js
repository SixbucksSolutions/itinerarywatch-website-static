let pageStartTime = null;
let userInfo = null;
let userWatchesData = null;
let userSingleWatchData = null;

function displayFatalError(message) {
    const mainApp = document.getElementById('div_id_dynamic_data');
    if (mainApp) {
        mainApp.style.display = 'none';
    }
    let errorBanner = document.getElementById('div_id_error_banner');
    if (!errorBanner) {
        errorBanner = document.createElement('div');
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

function renderUserSpecificDataIfReady() {
    if (userInfo === null) {
        return;
    }
    if (userWatchesData !== null) {
        renderAllUserWatches();
    } else if (userSingleWatchData !== null) {
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

    if (userWatchesDiv && dynamicDataDiv) {
        userWatchesDiv.style.display = 'block';
        dynamicDataDiv.style.display = 'block';
    } else {
        displayFatalError("One or both divs we needed to show when rendering all user watches were missing");
        return;
    }

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
        throw new Error(`Div for single search "${searchDivName}" not found in DOM`);
    }

    searchDiv.style.display = "block";

    const allDynamicDataDiv = document.getElementById('div_id_dynamic_data');
    if (!allDynamicDataDiv) {
        throw new Error("Div for dynamic data \"div_id_dynamic_data\" not found in DOM");
    }

    if (allDynamicDataDiv.style.display !== 'block') {
        allDynamicDataDiv.style.display = 'block';
    }
}

async function getUserInfo() {
    const apiEndpoint = 'https://api.itinerarywatch.com/api/v001/user';
    const startTime = performance.now();
    try {
        const response = await fetch(apiEndpoint, {
            method      : 'GET',
            credentials : 'include',
            headers     : { 'Accept': 'application/json' },

            // Explicitly tell the browser that honoring the Cache-Control HTTP header attached to the response is *encouraged*.
            //      Let's cache it in the memory or disk store for improved UX due to lower latency.
            cache       : 'default'
        });

        if (response.status === 401) { return null; }
        if (!response.ok) { throw new Error(`HTTP error! Status: ${response.status}`); }

        userInfo = await response.json();
        const emailSpans = document.querySelectorAll('.span_class_user_email');
        if (emailSpans.length > 0) {
            emailSpans.forEach(span => { span.textContent = userInfo.email_address; });
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

    // Generate 122 bits of pure entropy, because why kill when you can OVERkill!
    const cacheBuster = crypto.randomUUID();

    // The network layer will look at this URL and weep. It has never seen it before,
    // and it will never see it again.
    //
    // Note: the backend ignores the amusing query string parameter, it's simply to
    //      well and truly fuck with any CDN or brain-dead coffee shop web proxy that tries to do something
    //      that would piss me off
    const apiEndpoint = `https://api.itinerarywatch.com/api/v001/watches?_eat_a_d__k_cdn_and_web_proxies=${cacheBuster}`;

    const startTime = performance.now();
    try {
        const response = await fetch(apiEndpoint, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Accept': 'application/json' },

            // Explicitly mark the JSON returned as toxic radioactive to the cache. 
            //      The backend attached all the HTTP headers possible to ensure the
            //      response is marked by the server as DO NOT CACHE, but this is the 
            //      other half, it tells the browser "hey in case you were tempted to
            //      ignore all those "HERE BE DRAGONS" warnings about caching this
            //      data that will be present in the response from the API endpoint,
            //      as your customer I'm begging you please just don't, k????
            cache: 'no-store'
        });
        if (response.status === 401) { return null; }
        if (!response.ok) { throw new Error(`HTTP error! Status: ${response.status}`); }

        userWatchesData = await response.json();
        const tbody = document.querySelector('#div_id_dynamic_data_all_searches table tbody');
        if (!tbody) { return; }
        tbody.textContent = '';
        const fragment = document.createDocumentFragment();

        const separatorSpan = document.getElementById('span_breadcrumb_separator');
        if (separatorSpan) separatorSpan.style.display = 'none';
        const breadcrumbSpan = document.getElementById('span_breadcrumb_uuid');
        if (breadcrumbSpan) breadcrumbSpan.textContent = '';
        const breadcrumbLink = document.getElementById('a_breadcrumb_watches');
        if (breadcrumbLink) breadcrumbLink.classList.remove('active-breadcrumb');

        const formatTime = (ts) => {
            if (!ts || ts.length < 16) return "0000-00-00 12:00am UTC"; 
            const datePart = ts.substring(0, 10);
            const timePart = ts.substring(11, 16);
            if (!timePart.includes(':')) return `${datePart} ${timePart} UTC`;
            let [hourStr, minStr] = timePart.split(':');
            let hour = parseInt(hourStr, 10);
            const ampm = hour >= 12 ? 'pm' : 'am';
            hour = (hour % 12) || 12;
            return `${datePart} ${hour}:${minStr}${ampm} UTC`;
        };

        Object.entries(userWatchesData).forEach(([watchId, watchData]) => {
            const tr = document.createElement('tr');
            tr.addEventListener('click', (event) => {
                if (window.getSelection().toString()) return;
                if (event.metaKey || event.ctrlKey) {
                    window.open(`/watches/${watchId}`, '_blank');
                } else {
                    history.pushState(null, '', `/watches/${watchId}`);
                    document.getElementById('div_id_dynamic_data_all_searches').style.display = "none";
                    document.getElementById('div_id_dynamic_data_single_search').style.display = "none";
                    userWatchesData = null;
                    userSingleWatchData = null;
                    pageStartTime = null;
                    getUserWatchDetails(watchId);
                }
            });

            let cruiseLine = "Unknown";
            if (watchData.url.includes("celebritycruises.com")) cruiseLine = "Celebrity";
            else if (watchData.url.includes("ncl.com")) cruiseLine = "Norwegian";

            const tdName = document.createElement('td'); tdName.textContent = watchData.watch_name; tr.appendChild(tdName);
            const tdLine = document.createElement('td'); tdLine.textContent = cruiseLine; tr.appendChild(tdLine);
            const tdSailings = document.createElement('td'); tdSailings.textContent = watchData.matching_sailings_found; tr.appendChild(tdSailings);
            
            const tdUpdated = document.createElement('td'); tdUpdated.textContent = formatTime(watchData.watch_last_updated_timestamp); tr.appendChild(tdUpdated);
            const tdResults = document.createElement('td'); tdResults.textContent = formatTime(watchData.search_contents_changed_timestamp); tr.appendChild(tdResults);
            const tdChecked = document.createElement('td'); tdChecked.textContent = formatTime(watchData.search_last_checked_timestamp); tr.appendChild(tdChecked);

            fragment.appendChild(tr);
        });
        tbody.appendChild(fragment);

        if (typeof resetTableSorting === 'function') {
            resetTableSorting();
        }

        renderUserSpecificDataIfReady();
    } catch (error) {
        displayFatalError(`Failed to render dashboard rows: ${error.message}`);
    }
}

async function getUserWatchDetails(searchId) {
    const apiEndpoint = `https://api.itinerarywatch.com/api/v001/watch/${searchId}?search_result_timestamp=latest`;
    try {
        const response = await fetch(apiEndpoint, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Accept': 'application/json' },

            // Explicitly tell the browser that honoring the Cache-Control HTTP header attached to the response is *encouraged*.
            //      The backend only scrapes this data once a day -- let's cache it for improved UX due to lower latency UI.
            cache: 'default'
        });
        if (response.status === 401) return null;
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        userSingleWatchData = await response.json();
        const summary = userSingleWatchData.summary;
        const resultSets = userSingleWatchData.search_result_sets || {};

        let totalItineraries = 0;
        Object.values(resultSets).forEach(sailings => {
            totalItineraries += (sailings || []).length;
        });

        const separatorSpan = document.getElementById('span_breadcrumb_separator');
        if (separatorSpan) separatorSpan.style.display = 'inline';
        const breadcrumbSpan = document.getElementById('span_breadcrumb_uuid');
        if (breadcrumbSpan) breadcrumbSpan.textContent = searchId;
        const breadcrumbLink = document.getElementById('a_breadcrumb_watches');
        if (breadcrumbLink) breadcrumbLink.classList.add('active-breadcrumb');

        const activityMap = {
            "PORT_EMBARK": "Boarding Day",
            "AT_SEA": "At Sea",
            "PORT_DOCKED": "Port (Docked)",
            "PORT_TENDERED": "Port (Tendering)",
            "PORT_DEBARK": "Departure Day",
            "PORT_CRUISING": "Cruising"
        };

        const formatTime = (ts) => {
            if (!ts) return "N/A";
            const datePart = ts.substring(0, 10);
            const timePart = ts.substring(11, 16);
            let [hour, min] = timePart.split(':');
            const ampm = parseInt(hour) >= 12 ? 'pm' : 'am';
            hour = (parseInt(hour) % 12) || 12;
            return `${datePart} ${hour}:${min}${ampm} UTC`;
        };
        
        const formatTimeOnly = (t) => {
            if (!t) return '';
            let [h, m] = t.split(':');
            const ampm = parseInt(h) >= 12 ? 'pm' : 'am';
            h = (parseInt(h) % 12) || 12;
            return `${h}:${m}${ampm}`;
        };

        const nameEl = document.getElementById('td_id_summary_name');
        if (nameEl) nameEl.textContent = summary.name || "Unknown";

        const urlTd = document.getElementById('td_id_summary_url');
        if (urlTd) {
            urlTd.innerHTML = '';
            if (summary.url) {
                const a = document.createElement('a');
                a.href = summary.url;
                a.textContent = summary.url;
                a.target = "_blank";
                a.rel = "noopener noreferrer";
                urlTd.appendChild(a);
            }
        }

        const updatedEl = document.getElementById('td_id_summary_search_last_updated');
        if (updatedEl) updatedEl.textContent = formatTime(summary.last_updated_timestamp);
        const changedEl = document.getElementById('td_id_summary_search_contents_last_changed');
        if (changedEl) changedEl.textContent = formatTime(summary.search_contents_last_changed_timestamp);
        const runEl = document.getElementById('td_id_summary_search_last_run');
        if (runEl) runEl.textContent = formatTime(summary.search_last_run_timestamp);
        const matchingEl = document.getElementById('td_id_summary_matching_itineraries');
        if (matchingEl) matchingEl.textContent = totalItineraries;

        const singleSearchDiv = document.getElementById('div_id_dynamic_data_single_search');
        let cont = document.getElementById('div_id_itineraries_container');
        if (cont) cont.remove();
        cont = document.createElement('div');
        cont.id = 'div_id_itineraries_container';

        Object.entries(resultSets).forEach(([resultSetTime, sailings]) => {
            const h4 = document.createElement('h4');
            h4.textContent = `Results from: ${formatTime(resultSetTime)}`;
            cont.appendChild(h4);

            sailings.forEach(sailing => {
                const sDiv = document.createElement('div');
                sDiv.style.marginBottom = "4rem";
                sDiv.style.paddingLeft = "1rem";
                sDiv.style.borderLeft = "4px solid #cbd5e1";

                const idParts = sailing.id.split('.');
                let shipDisplay = "Unknown Ship", datesDisplay = "Unknown Dates";
                if (idParts.length >= 5) {
                    const lineName = idParts[1] === 'CEL' ? 'Celebrity' : idParts[1];
                    const ships = {
                        'AP': 'Apex', 'AT': 'Ascent', 'BY': 'Beyond', 'CS': 'Constellation',
                        'EC': 'Eclipse', 'EG': 'Edge', 'EQ': 'Equinox', 'FL': 'Flora',
                        'IN': 'Infinity', 'ML': 'Millennium', 'RF': 'Reflection',
                        'SL': 'Solstice', 'SI': 'Silhouette', 'SM': 'Summit',
                        'XC': 'Excel', 'XP': 'Xpedition', 'XR': 'Xploration'
                    };
                    shipDisplay = `${lineName} ${ships[idParts[2]] || idParts[2]}`;
                    datesDisplay = `${idParts[3]} to ${idParts[4]}`;
                }

                const summaryTable = document.createElement('table');
                summaryTable.className = 'sailing-summary-table';
                summaryTable.innerHTML = `<thead><tr><th>SHIP</th><th>DATES</th></tr></thead><tbody><tr><td>${shipDisplay}</td><td>${datesDisplay}</td></tr></tbody>`;
                sDiv.appendChild(summaryTable);

                const itineraryLabel = document.createElement('p');
                itineraryLabel.className = 'itinerary-label';
                itineraryLabel.textContent = "Itinerary:";
                sDiv.appendChild(itineraryLabel);

                const table = document.createElement('table');
                table.className = 'itinerary-details-table';
                table.innerHTML = `<thead><tr><th class="align-center">Day</th><th class="align-center">Day of Week</th><th class="align-center">Date</th><th class="align-center">Activity Type</th><th class="align-left">Location</th><th class="align-center tight-col">Start</th><th class="align-center tight-col">End</th></tr></thead>`;
                
                (sailing.day_details || []).forEach((day, dayIndex) => {
                    const tbody = document.createElement('tbody');
                    const dayNum = dayIndex + 1;
                    const numActivities = day.activities ? day.activities.length : 0;
                    
                    let dayOfWeekStr = "N/A";
                    if (day.date) {
                        const parts = day.date.split('-');
                        if (parts.length === 3) {
                            const dateObj = new Date(parts[0], parts[1] - 1, parts[2]);
                            dayOfWeekStr = dateObj.toLocaleDateString('en-US', { weekday: 'short' });
                        }
                    }

                    if (numActivities > 0) {
                        day.activities.forEach((act, actIndex) => {
                            const tr = document.createElement('tr');
                            const displayType = activityMap[act.type] || act.type.replace(/_/g, ' ');
                            
                            let rowHtml = '';
                            
                            if (actIndex === 0) {
                                rowHtml += `<td rowspan="${numActivities}" class="align-center align-top merged-cell"><strong>${dayNum}</strong></td>`;
                                rowHtml += `<td rowspan="${numActivities}" class="align-center align-top merged-cell">${dayOfWeekStr}</td>`;
                                rowHtml += `<td rowspan="${numActivities}" class="align-center align-top merged-cell">${day.date}</td>`;
                            }
                            
                            rowHtml += `<td class="align-center">${displayType}</td>`;
                            rowHtml += `<td class="align-left">${act.location?.name || ''}${act.location?.region ? ', ' + act.location.region : ''}</td>`;
                            rowHtml += `<td class="align-center tight-col">${formatTimeOnly(act.time_start)}</td>`;
                            rowHtml += `<td class="align-center tight-col">${formatTimeOnly(act.time_end)}</td>`;
                            
                            tr.innerHTML = rowHtml;
                            tbody.appendChild(tr);
                        });
                    }
                    table.appendChild(tbody);
                });
                sDiv.appendChild(table);
                cont.appendChild(sDiv);
            });
        });
        if (singleSearchDiv) {
            singleSearchDiv.appendChild(cont);
        }
        renderUserSpecificDataIfReady();
    } catch (e) {
        displayFatalError(e.message);
    }
}

function main() {
    document.body.style.visibility = 'visible';
    pageStartTime = performance.now();
    
    const breadcrumbLink = document.getElementById('a_breadcrumb_watches');
    if (breadcrumbLink) {
        breadcrumbLink.addEventListener('click', (event) => {
            if (event.metaKey || event.ctrlKey) {
                window.open('/watches', '_blank');
            } else {
                history.pushState(null, '', '/watches');
                document.getElementById('div_id_dynamic_data_all_searches').style.display = "none";
                document.getElementById('div_id_dynamic_data_single_search').style.display = "none";
                userWatchesData = null;
                userSingleWatchData = null;
                getUserWatches();
            }
        });
    }

    getUserInfo();
    initializeTableSorter();

    const initialSegments = window.location.pathname.replace(/\/$/, '').split('/').filter(s => s.length > 0);
    if (initialSegments.length === 2 && initialSegments[0] === 'watches') {
        getUserWatchDetails(initialSegments[1]); 
    } else {
        getUserWatches();
    }

    window.addEventListener('popstate', (event) => {
        clearFatalErrorMessageIfShown();
        document.getElementById('div_id_dynamic_data_all_searches').style.display = "none";
        document.getElementById('div_id_dynamic_data_single_search').style.display = "none";
        userWatchesData = null;
        userSingleWatchData = null;

        const segments = window.location.pathname.replace(/\/$/, '').split('/').filter(s => s.length > 0);
        if (segments.length === 2 && segments[0] === 'watches') {
            getUserWatchDetails(segments[1]);
        } else {
            getUserWatches();
        }
    });
}

main();
