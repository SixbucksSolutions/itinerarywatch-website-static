// As we are calling an async function, we must wrap in an immediately-invoked async main
(async function main() {
    console.log("Watches JS starting"); 
    
    const startTime = performance.now(); 
    
    // Now await is completely valid inside this local scope context
    const userInfo = await apiUserInfo(); 
    
    const endTime = performance.now(); 
    const duration = endTime - startTime; 
    
    if (userInfo) {
        console.log(`User info for successfully-authenticated user ${userInfo.email_address} retrieved from API in ${duration.toFixed(3)} ms`);
    } else {
        console.log("Auth validation returned null. Proceeding with fallback sequence.");
    }
    
    console.log("End of script");
})();
