let userInfo = null;
let userWatches = null;


function renderUserSpecificDataIfReady() {

    // Bail out if we're not, in fact, ready to render
    if ((userInfo === null) || (userWatches === null)) {
        return;
    }

    console.log("As all required data has been successfully data, now populating hidden part of pag ewit huser-specific data");

}

async function getUserInfo() {
    const startTime = performance.now();

    userInfo = await apiUserInfo();

    const endTime = performance.now();
    const duration = Math.ceil(endTime - startTime);

    console.log(`Userinfo retrieved for ${userInfo.email_address} in ${duration} ms`);

    renderUserSpecificDataIfReady();
}


async function getUserWatches() {
    const startTime = performance.now();

    userWatches = await apiUserWatches();

    const endTime = performance.now();
    const duration = Math.ceil(endTime - startTime);

    console.log(`User's itinerary watches retrieved in ${duration} ms`);

    renderUserSpecificDataIfReady();
}



function main() {
    // These two fcuntions are both async, meaning they run *in parallel*; they are independent and
    //      running them in serial would impact UX in an unhappy way. There's still only one thread
    //      of execution in JS, so there's no chance of race conditions
    getUserInfo();
    getUserWatches();
}


main();
