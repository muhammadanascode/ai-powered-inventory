import getToken from '@/utils/getToken';
import { useRouter } from 'next/router';
import { useEffect, useState } from 'react';
import styles from '../../styles/OrderDetails.module.css';

const OrderDetails = () => {
    const router = useRouter();
    const { id } = router.query;
    console.log("ORDER ID ", id);


    const [order, setOrder] = useState(null);
    const [loading, setLoading] = useState(true);

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
            if (response.status != 200) {
                console.log("Failed to fetch order details: " + data.error);

            }

            setOrder(data.order);
            setLoading(false);

            console.log(data.order);
        } catch (error) {
            console.error('Error fetching order details:', error);
        }

    }

    useEffect(() => {

        getOrderDetails();

    }, []);

    if (loading) {
        return <div className="loading">Loading order details...</div>;
    }

    // Import the CSS module

    return (
        <div className={styles.container}>
            <div className={styles.orderHeader}>
                <div className={styles.orderIdDiv}><h2>Order #{order.order_id}</h2></div>
                <div className={styles.orderStatusDiv}><p>Status: <strong>{order.order_status}</strong></p></div>
                <div className={styles.totalPriceDiv}><p>Total: Rs. <strong>{order.total_price}</strong></p></div>
                <div className={styles.dateDiv}><p>Placed on: <strong>{new Date(order.created_at).toLocaleString()}</strong></p></div>
            </div>

            <div className={styles.ordersheading}><h2>Order Items</h2></div>

            <div className={styles.orderItemHeader}>
                <div className={styles.productNameHead}><h4>Product Name</h4></div>
                <div className={styles.productQuantityHead}><h4>Quantity</h4></div>
                <div className={styles.productPriceHead}><h4>Price</h4></div>
            </div>

            {order.products.map((product) => (
                <div className={styles.product}>
                    <div className={styles.productNameDiv}><p>{product.product_name}</p></div>
                    <div className={styles.productQuantityDiv}><p>{product.quantity}</p></div>
                    <div className={styles.productPriceDiv}><p>{product.price}&times;{product.quantity} = {product.price * product.quantity}</p></div>
                </div>
            ))}
            <div className={styles.customerDetailsDiv}>
                <h2 className={styles.customerDetailsHead}>Customer Details</h2>
                <p><strong>Name:</strong> {order.customer_name}</p>
                <p><strong>Email:</strong> {order.email}</p>
                <p><strong>Phone:</strong> {order.phone_number}</p>
                <p><strong>Address:</strong> {order.address}</p>
            </div>
        </div>
    );
};

export default OrderDetails;
