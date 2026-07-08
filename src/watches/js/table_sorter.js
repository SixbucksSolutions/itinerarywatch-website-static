/**
 * ItineraryWatch - Core UI Orchestration & Sorting Engine
 */

/**
 * Attaches event listeners to table headers to provide ascending/descending sorting functionality.
 */
function initializeTableSorter() {
    // UPDATED: 'sortable-header' changed to 'sort-hdr'
    const headers = document.querySelectorAll('th.sort-hdr');

    headers.forEach((header, columnIndex) => {
        header.addEventListener('click', () => {
            const table = header.closest('table');
            const tbody = table.querySelector('tbody');
            const rowsArray = Array.from(tbody.querySelectorAll('tr'));

            // If the table is currently empty, exit early to avoid unnecessary execution
            if (rowsArray.length === 0) {
                return;
            }

            // Check current sort state
            const isAscending = header.classList.contains('asc');

            // Clear sorting classes from all headers to ensure clean visual state
            headers.forEach(h => h.classList.remove('asc', 'desc'));

            // Toggle sorting direction multiplier
            const direction = isAscending ? -1 : 1;

            // Sort rows based on the text content of the selected column cell
            const sortedRows = rowsArray.sort((rowA, rowB) => {
                const cellA = rowA.children[columnIndex].textContent.trim();
                const cellB = rowB.children[columnIndex].textContent.trim();

                // Perform locale-aware natural alphanumeric comparison
                return cellA.localeCompare(cellB, undefined, { numeric: true, sensitivity: 'base' }) * direction;
            });

            // Re-append rows in the newly sorted order to the DOM container
            sortedRows.forEach(row => tbody.appendChild(row));

            // Assign the active sorting state tracking class to the clicked header
            if (direction === 1) {
                header.classList.add('asc');
            } else {
                header.classList.add('desc');
            }
        });
    });
}

/**
 * Resets the visual sorting state of all table headers to neutral.
 * This should be called when navigating back to the dashboard to avoid reverse-sort persistence.
 */
function resetTableSorting() {
    // UPDATED: 'sortable-header' changed to 'sort-hdr'
    const headers = document.querySelectorAll('th.sort-hdr');
    headers.forEach(header => {
        header.classList.remove('asc', 'desc');
    });
}
