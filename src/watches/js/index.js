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
            method: 'GET',
            credentials: 'include',
            headers: { 'Accept': 'application/json' }
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
    const apiEndpoint = 'https://api.itinerarywatch.com/api/v001/watches';
    const startTime = performance.now();
    try {
        const response = await fetch(apiEndpoint, {
            method: 'GET',
            credentials: 'include',
            headers: { 'Accept': 'application/json' }
        });
        if (response.status === 401) { return null; }
        if (!response.ok) { throw new Error(`HTTP error! Status: ${response.status}`); }

        userWatchesData = await response.json();
        const tbody = document.querySelector('#div_id_dynamic_data_all_searches table tbody');
        if (!tbody) { return; }
        tbody.textContent = '';
        const fragment = document.createDocumentFragment();

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

            const updatedTimestamp = watchData.watch_last_updated_timestamp || "";
            const changedTimestamp = watchData.search_contents_changed_timestamp || "";
            const checkedTimestamp = watchData.search_last_checked_timestamp || "";

            const updatedDate = updatedTimestamp.length >= 10 ? updatedTimestamp.substring(0, 10) : "0000-00-00";
            const updatedTime = updatedTimestamp.length >= 16 ? updatedTimestamp.substring(11, 16) : "00:00";
            const resultsDate = changedTimestamp.length >= 10 ? changedTimestamp.substring(0, 10) : "00-00-00";
            const resultsTime = changedTimestamp.length >= 16 ? changedTimestamp.substring(11, 16) : "00:00";
            const checkedDate = checkedTimestamp.length >= 10 ? checkedTimestamp.substring(0, 10) : "0000-00-00";
            const checkedTime = checkedTimestamp.length >= 16 ? checkedTimestamp.substring(11, 16) : "00:00";

            const tdName = document.createElement('td'); tdName.textContent = watchData.watch_name; tr.appendChild(tdName);
            const tdLine = document.createElement('td'); tdLine.textContent = cruiseLine; tr.appendChild(tdLine);
            const tdSailings = document.createElement('td'); tdSailings.textContent = watchData.matching_sailings_found; tr.appendChild(tdSailings);
            const tdUpdated = document.createElement('td'); tdUpdated.textContent = `${updatedDate} ${updatedTime} UTC`; tr.appendChild(tdUpdated);
            const tdResults = document.createElement('td'); tdResults.textContent = `${resultsDate} ${resultsTime} UTC`; tr.appendChild(tdResults);
            const tdChecked = document.createElement('td'); tdChecked.textContent = `${checkedDate} ${checkedTime} UTC`; tr.appendChild(tdChecked);

            fragment.appendChild(tr);
        });
        tbody.appendChild(fragment);
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
            headers: { 'Accept': 'application/json' }
        });
        if (response.status === 401) return null;
        if (!response.ok) throw new Error(`HTTP error! Status: ${response.status}`);

        userSingleWatchData = await response.json();
        const summary = userSingleWatchData.summary;

        // Activity display map
        const activityMap = {
            "PORT_EMBARK": "Boarding Day",
            "AT_SEA": "At Sea",
            "PORT_DOCKED": "Port (Docked)",
            "PORT_TENDERED": "Port (Tendering)",
            "PORT_DEBARK": "Departure Day"
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

        document.getElementById('td_id_summary_name').textContent = summary.name || "Unknown";
        const urlTd = document.getElementById('td_id_summary_url');
        urlTd.innerHTML = '';
        if (summary.url) {
            const a = document.createElement('a');
            a.href = summary.url;
            a.textContent = summary.url;
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            urlTd.appendChild(a);
        }

        document.getElementById('td_id_summary_search_last_updated').textContent = formatTime(summary.last_updated_timestamp);
        document.getElementById('td_id_summary_search_contents_last_changed').textContent = formatTime(summary.search_contents_last_changed_timestamp);
        document.getElementById('td_id_summary_search_last_run').textContent = formatTime(summary.search_last_run_timestamp);

        const singleSearchDiv = document.getElementById('div_id_dynamic_data_single_search');
        let cont = document.getElementById('div_id_itineraries_container');
        if (cont) cont.remove();
        cont = document.createElement('div');
        cont.id = 'div_id_itineraries_container';

        Object.entries(userSingleWatchData.search_result_sets || {}).forEach(([resultSetTime, sailings]) => {
            const h4 = document.createElement('h4');
            h4.textContent = `Results from: ${formatTime(resultSetTime)}`;
            cont.appendChild(h4);

            sailings.forEach(sailing => {
                const sDiv = document.createElement('div');
                sDiv.style.marginBottom = "2rem";
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

                sDiv.innerHTML += `<table class="sailing-summary-table"><thead><tr><th>SHIP</th><th>DATES</th></tr></thead><tbody><tr><td>${shipDisplay}</td><td>${datesDisplay}</td></tr></tbody></table>`;

                const itineraryLabel = document.createElement('p');
                itineraryLabel.style.fontWeight = "bold";
                itineraryLabel.style.marginBottom = "0.25rem";
                itineraryLabel.textContent = "Itinerary:";
                sDiv.appendChild(itineraryLabel);

                const table = document.createElement('table');
                table.className = 'itinerary-details-table';
                table.innerHTML = `<thead><tr><th>Date</th><th>Activity Type</th><th>Location</th><th>Start</th><th>End</th></tr></thead><tbody></tbody>`;
                const tbody = table.querySelector('tbody');

                (sailing.day_details || []).forEach(day => {
                    (day.activities || []).forEach(act => {
                        const tr = document.createElement('tr');
                        const displayType = activityMap[act.type] || act.type.replace(/_/g, ' ');
                        tr.innerHTML = `<td>${day.date}</td><td>${displayType}</td><td>${act.location?.name || ''}${act.location?.region ? ', ' + act.location.region : ''}</td><td>${formatTimeOnly(act.time_start)}</td><td>${formatTimeOnly(act.time_end)}</td>`;
                        tbody.appendChild(tr);
                    });
                });
                sDiv.appendChild(table);
                cont.appendChild(sDiv);
            });
        });
        singleSearchDiv.appendChild(cont);
        renderUserSpecificDataIfReady();
    } catch (e) {
        displayFatalError(e.message);
    }
}

function main() {
    document.body.style.visibility = 'visible';
    getUserInfo();
    initializeTableSorter();
    getUserWatches();
}

main();
