async function getUserInfo() {
    const startTime = performance.now();

    const userInfo = await apiUserInfo();

    const endTime = performance.now();
    const duration = Math.ceil(endTime - startTime);

    console.log(`Userinfo retrieved for ${userInfo.email_address} in ${duration} ms`);
}


async function getUserWatches() {
    const startTime = performance.now();

    const userWatches = await apiUserWatches();

    const endTime = performance.now();
    const duration = Math.ceil(endTime - startTime);

    console.log(`User's itinerary watches retrieved in ${duration} ms`);
}



function main() {
    // These two calls are async, meaning they run concurrently
    getUserInfo();
    getUserWatches();
}


main();
