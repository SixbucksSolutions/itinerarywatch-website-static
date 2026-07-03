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


function queryParam() {
    return null;
}


function getUserId() {
    // Check cookie
    let userId = cookieValue("__Secure-user-id")

    if (userId === null) {
        console.log("UserID not found in cookie, checking query param")
        userId = queryParam("user_id")
    }

    // STILL didn't find user ID
    if (userId === null) {
        // Redirect to login 
        console.log("Redirecting to login page; no user ID in cookies or query param")
    }

    return userId;
}


function main() {
    console.log("JS is loaded");
    const userId = getUserId();
    if (userId !== null) {
        console.log("User is logged in with user ID \"" + userId + "\"");
    }
}

main();
