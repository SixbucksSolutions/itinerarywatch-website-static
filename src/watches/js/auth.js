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


/*
function removeParamAndRedirect(paramToRemove, redirectTarget) {
    const url = new URL(window.location.href);
    url.searchParams.delete(paramToRemove);

    // Wipe the current history slot first
    window.history.replaceState({}, document.title, url.pathname + url.search);

    // Nuke the entry entirely by replacing it with the next page
    window.location.replace(redirectTarget);
}
*/



function queryParam(queryParamName) {
    // console.log("Retrieving value for URL query parameter \"" + queryParamName + "\"");

    // Extracts parameters directly from the current address bar
    const urlParams = new URLSearchParams(window.location.search);
    const userId = urlParams.get(queryParamName);
    if (userid !== null) {
        // removeParamAndRedirect("user_id", "https://www.itinerarywatch.com/watches");
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
        // Redirect to login
        console.log("TODO: redirect to login page, no user ID offered");
        return
    }

    console.log("Auth: User ID = \"" + userId + "\"");
}

console.log("Auth: starting");
main();
