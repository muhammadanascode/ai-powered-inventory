// function to fetch customers 
    const getCustomers = async () => {
        const token = getToken();
        if (!token) return;

        try {
            const response = await fetch('/api/customers/getAll', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `${token}`
                }
            });
            const data = await response.json();


            if (response.status !== 200) {
                console.log(data.error);
            }

            return data.customers || [];
        } catch (error) {
            console.error('Error fetching customers:', error);
            return [] ; // Return an empty array in case of error
         }
    };

export default getCustomers;