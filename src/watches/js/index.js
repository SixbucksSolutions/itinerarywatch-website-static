async function getUserInfo() {
    const startTime = performance.now();

    const userInfo = await apiUserInfo();

    const endTime = performance.now();
    const duration = Math.ceil(endTime - startTime);

    console.log(`Userinfo retrieved for ${userInfo.email_address} in ${endTime - startTime} ms`);
}

function main() {
    getUserInfo();
}

main();
