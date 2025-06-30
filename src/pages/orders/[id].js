import getToken from '@/utils/getToken';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';

const OrderDetails = () => {
    const router = useRouter();
    const { id } = router.query;
    console.log("ORDER ID ", id);


    const [order, setOrder] = useState(null);

    const getOrderDetails = async () => {

        // Get the token from local storage 
        const token = getToken();
        if (!token) return;

        // If id is not present in the query, return
        if (!id) return;

        try {
            const response = await fetch(`/api/orders/get?id=${id}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                }
            });

            const data = await response.json();
            if (response.status != 200 ) {
                console.log("Failed to fetch order details: " + data.error);
                
            }

            console.log(data.order);
        } catch (error) {
            console.error('Error fetching order details:', error);
        }

    }

    useEffect(() => {

        getOrderDetails();

    }, []);

    return (
        <div>
            <h2>Order Details {id} </h2>
            {/* Display full order details */}
        </div>
    );
};

export default OrderDetails;
