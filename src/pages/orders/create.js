import { useEffect, useState } from 'react';
import styles from '../../styles/CreateOder.module.css'
import getToken from '@/utils/getToken';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faTrash } from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/router';

const create = () => {

    const [customers, setCustomers] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedCustomerId, setSelectedCustomerId] = useState();
    const [selectedProductId, setSelectedProductId] = useState();
    const [quantity, setQuantity] = useState('');
    const [orderItems, setOrdersItems] = useState([]);
    const [totalPrice, setTotalPrice] = useState(0);

    // using nextjs router to redirect the user to orders page after placing the order
    const router = useRouter();

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

            if (response.status !== 200) throw new Error('Network response was not ok');

            const data = await response.json();
            setCustomers(data.customers || []);
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    };

    // function to fetch customers 
    const getProducts = async () => {
        const token = getToken();
        if (!token) return;

        try {
            const response = await fetch('/api/products/getAll', {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `${token}`
                }
            });

            if (response.status !== 200) throw new Error('Network response was not ok');

            const data = await response.json();
            setProducts(data.products || []);
        } catch (error) {
            console.error('Error fetching customers:', error);
        }
    };


    useEffect(() => {
        // Fetch customers when the component mounts
        getCustomers();
        // Fetch products when the component mounts
        getProducts();
    }, [])

    const handleAddItem = () => {

        // Validate that a product, and quantity are selected
        if (!selectedProductId || !quantity) {
            console.log("Please select a product, quantity and customer");
            return;
        }

        // making order item object 
        const orderItem = {
            product_id: Number(selectedProductId),
            quantity: parseInt(quantity, 10),
            price: products.find(product => product.product_id == selectedProductId)?.price,
            product_name: products.find(product => product.product_id == selectedProductId)?.name
        };

        //insert the order item into the orderItems state
        setOrdersItems(prevItems => [...prevItems, orderItem]);

        const productPrice = orderItem.price * orderItem.quantity;

        //update total price
        setTotalPrice(prevTotal => prevTotal + productPrice);

    }

    // function to handle removing an item from the order
    const handleRemoveItem = (productId) => {
        // Filter out the item to be removed
        const updatedItems = orderItems.filter(item => item.product_id !== productId);

        // Update the order items state
        setOrdersItems(updatedItems);

        // Recalculate total price
        const removedItem = orderItems.find(item => item.product_id === productId);
        if (removedItem) {
            const removedPrice = removedItem.price * removedItem.quantity;
            setTotalPrice(prevTotal => prevTotal - removedPrice);
        }
    }

    // function to handle placing the order
    const handlePlaceOrder = async () => {
        // Validate that a customer is selected
        if (!selectedCustomerId) {
            console.log("Please select a customer");
            return;
        }
        // Validate that there are order items
        if (orderItems.length === 0) {
            console.log("Please add at least one item to the order");
            return;
        }

        // fetch the token from local storage
        const token = getToken();
        if (!token) return;

        // Create the order by making a POST request to the API
        try {
            const response = await fetch('/api/orders/create', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `${token}`
                },
                body: JSON.stringify({
                    customer_id: selectedCustomerId,
                    products: orderItems.map(item => ({
                        product_id: item.product_id,
                        quantity: item.quantity,
                        price: item.price
                    }))
                })
            });

            // Parse the response data
            const data = await response.json();

            // Check if the response is ok
            if (response.status != 201) {
                console.log(data.error);  
            };

            console.log('Order placed successfully:', data);

            // Reset the form after successful order placement
            setSelectedCustomerId('');
            setSelectedProductId('');
            setQuantity('');
            setOrdersItems([]);
            setTotalPrice(0);

            //push the user to orders page
            router.push('/orders');

        } catch (error) {
            console.error('Error placing order:', error);
        }
    }

    return (
        <>
            <div className={styles.container}>
                <h1 className={styles.heading}>Create New Order</h1>

                {/* Select customer from options */}
                <select
                    value={selectedCustomerId}
                    onChange={(e) => setSelectedCustomerId(e.target.value)}
                    className={`${styles.select} ${styles.selectCustomer}`}
                >
                    <option value="">-- Select Customer --</option>
                    {customers.map((customer) => (
                        <option key={customer.customer_id} value={customer.customer_id}>
                            {customer.name}
                        </option>
                    ))}
                </select>

                <div className={styles.productSelection}>
                    {/* Select product from options */}
                    <select
                        value={selectedProductId}
                        onChange={(e) => setSelectedProductId(e.target.value)}
                        className={`${styles.select} ${styles.selectProduct}`}
                    >
                        <option value="">-- Select Product --</option>
                        {products.map((product) => (
                            <option key={product.product_id} value={product.product_id}>
                                {product.name}
                            </option>
                        ))}
                    </select>

                    {/* Input field for quantity */}
                    <input
                        className={styles.inputQuantity}
                        type="number"
                        placeholder="Quantity"
                        name={"quantity"}
                        id={"quantity"}
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        required
                    />
                    {/* button to add selected item */}
                    <button className={styles.addItemBtn} onClick={handleAddItem}>Add item</button>
                </div>

                {/* Table headers for order data */}
                <div className={styles.header}>
                    <div className={styles.orderItemheadDiv}><h4>order Item</h4></div>
                    <div className={styles.quantityheadDiv}><h4>Quantity</h4></div>
                    <div className={styles.priceheadDiv}><h4>Per_unit_Cost</h4></div>
                </div>

                {/* Displaying all the order items */}
                {orderItems && orderItems.map((orderItem) => (
                    <div className={styles.orderItems} key={orderItem.product_id}>
                        <div className={styles.productNameDiv}>
                            <p title={orderItem.name}>{orderItem.product_name}</p>
                        </div>
                        <div className={styles.productQuantityDiv}>
                            <p title="Quantity">{orderItem.quantity}</p>
                        </div>
                        <div className={styles.productPriceDiv}>
                            <p title="Price">{orderItem.price}</p>
                        </div>
                        <FontAwesomeIcon
                            icon={faTrash}
                            className={styles.deleteIcon}
                            title="Delete"
                            onClick={() => handleRemoveItem(orderItem.product_id)}
                        />
                    </div>
                ))}

                {/* Displaying Total price and button to place order */}
                {orderItems && orderItems.length > 0 && (
                    <div className={styles.totalPriceDiv}>
                        <h4 className={styles.totalPrice}>TotalPrice: Rs. {totalPrice}</h4>
                        <button className={styles.placeOrderBtn} onClick={handlePlaceOrder}>Place Order</button>
                    </div>
                )}

            </div>
        </>
    )

}

export default create;