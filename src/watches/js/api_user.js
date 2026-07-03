async function apiUserInfo() {
    const apiEndpoint = 'https://api.itinerarywatch.com/api/v001/user';

    try {
        const response = await fetch(
            apiEndpoint, 
            {
                method          : 'GET',
                credentials     : 'include',      // 💡 CRUCIAL: Instructs the browser to attach cookies for api.itinerarywatch.com
                headers         : {
                    'Content-Type'      : 'application/json',
                    'Accept'            : 'application/json'
                }
            }
        );

        // Handle a 401 Unauthorized cleanly by identifying missing/invalid cookies
        if (response.status === 401) {
            console.warn('Authentication failed: user ID cookie missing or expired');
            // TODO: forcibly HTTP redirect user to signin URL
            return null;
        }

        // Catch other HTTP errors (403, 404, 500, etc.)
        if (!response.ok) {
            throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const userInfo = await response.json();
        // console.log('Successfully retrieved user info with email:', user_info.email_address);
        return userInfo;

    } catch (error) {
        console.error('Failed to execute API call:', error);
        throw error;
    }
}
