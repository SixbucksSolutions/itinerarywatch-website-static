// As we are using await to get the return value out of an async function, we must invoke it from an immediately-invoked async main
(async function main() {
    const startTime = performance.now(); 
    
    // Now await is completely valid inside this local scope context
    const userInfo = await apiUserInfo(); 
    
    const endTime = performance.now(); 
    const duration = Math.ceil(endTime - startTime); 
    
    if (userInfo) {
        console.log(`User info for successfully-authenticated user ${userInfo.email_address} retrieved from API in ${duration} ms`);
    } else {
        console.log("Auth validation returned null. Proceeding with fallback sequence.");
    }
})();
