console.log("Watches JS starting")

const startTime = performance.now();

const userInfo = apiUserInfo();

const endTime = performance.now();
const duration = endTime - startTime;

console.log(`User info for successfully-authenticated user ${user_info.email_address} retrieved from API in ${duration.toFixed(3)} ms`);
