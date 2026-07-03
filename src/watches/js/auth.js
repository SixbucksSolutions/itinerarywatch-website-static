function cookieValue(cookieName) {
    // console.log("Retrieving value for cookie \"" + cookieName + "\"");

    const decodedCookie = decodeURIComponent(document.cookie);
    const cookieArray = decodedCookie.split(';');
    const searchString = cookieName + "=";

    for (let i = 0; i < cookieArray.length; i++) {
        let cookie = cookieArray[i].trim();
        if (cookie.indexOf(searchString) === 0) {
            return cookie.substring(searchString.length, cookie.length);
        }
    }

    return null;
}


function removeQueryParamFromBrowserUrl(paramToRemove) {
    const url = new URL(window.location.href);
    // Remove only the target parameter
    url.searchParams.delete(paramToRemove);
    window.history.replaceState({}, document.title, url.pathname + url.search);
}


function queryParam(queryParamName) {
    // console.log("Retrieving value for URL query parameter \"" + queryParamName + "\"");

    // Extracts parameters directly from the current address bar
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get(queryParamName);
    if (userid !== null) {
        removeQueryParamFromBrowserUrl('user_id');
    }

    return userId;
}


function getUserId() {
    // Check cookie
    let userId = cookieValue("__Secure-user-id")

    if (userId === null) {
        userId = queryParam("user_id")
    }

    return userId;
}


function main() {
    const userId = getUserId();
    if (userId === null) {
        // Redirect to login
        console.log("TODO: redirect to login page, no user ID offered");
        return
    }

    console.log("Auth: User ID = \"" + userId + "\"");
}

main();
