function cookieValue(cookieName) {
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


function queryParam(queryParamName) {
    console.log("Looking for query parameters \"" + queryParamName + "\"");
    return null;
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

    console.log("User is logged in with user ID \"" + userId + "\"");

}

main();
