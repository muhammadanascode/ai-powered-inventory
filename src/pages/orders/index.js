import { useEffect, useState } from 'react';
import styles from '../../styles/Orders.module.css';
import SearchBar from '@/components/SearchBar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/router';
import getToken from '@/utils/getToken';
import getCustomers from '@/utils/getCustomers';

const orders = () => {

  // state to hold orders
  const [orders, setOrders] = useState([]);

  // useRouter hook to navigate
  const router = useRouter();

  // function to fetch customers 
  const getOrders = async () => {
    const token = getToken();
    if (!token) return;

    try {
      const response = await fetch('/api/orders/getAll', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${token}`
        }
      });

      const data = await response.json();

      if (response.status !== 200) {
        console.log("Failed to fetch orders: " + data.error);

      }

      setOrders(data.orders || []);
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };



  useEffect(() => {
    // fetching order
    getOrders();
  }, []);


  // Toggle form visibility
  const handleToggleForm = () => {
    router.push('/orders/create');
  };

  // Handle status change
  const handleStatusChange = async (orderId, newStatus, prevOrderStatus) => {
    // Prevent unnecessary updates if the status hasn't changed
    if (newStatus === prevOrderStatus) return;

    // Ensure we have a valid token before making the request
    const token = getToken();
    if (!token) return;

    // Validate the new status
    try {
      const response = await fetch(`/api/orders/update`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `${token}`
        },
        body: JSON.stringify({ order_id: orderId, order_status: newStatus.toLowerCase() })
      });

      //Parse the response
      const data = await response.json();

      if (response.status !== 200) {
        console.error("Failed to update order status: " + data.error);
        return;
      }

      // Update the local state with the new status
      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order.order_id == orderId ? { ...order, order_status: newStatus } : order
        )
      );
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  return (
    <>
      <div className={styles.container}>
        {/* "Add" button with plus icon to open form modal */}
        <div className={styles.btnDiv} title='Create New Order'>
          <button className={styles.btn} onClick={handleToggleForm}>
            Create
            <FontAwesomeIcon icon={faPlus} style={{ marginLeft: '8px' }} />
          </button>
        </div>

        {/* Search bar component */}
        <SearchBar />

        {/* Table headers for order data */}
        <div className={styles.header}>
          <div className={styles.customerHead}><h4>Customer</h4></div>
          <div className={styles.totalPriceHead}><h4>Total Price</h4></div>
          <div className={styles.dateHead}><h4>Date</h4></div>
          <div className={styles.statusHead}><h4>Status</h4></div>
        </div>

        {/* Render customer list */}
        {orders.map((order) => (
          <div className={styles.orders} key={order.order_id}>
            <div className={styles.customerNameDiv}><p title={order.CustomerName}>{order.customer_name}</p></div>
            <div className={styles.priceDiv}><p title={order.totalPrice}>Rs. {order.total_price}</p></div>
            <div className={styles.dateDiv}><p title={order.date}>{new Date(order.created_at).toLocaleString()}</p></div>

            {/* Options for updating the order status if it's in pending stage */}
            <div className={styles.statusDiv}>
            {order.order_status == "pending" ? <select
              className={styles.orderStatusSelect}
              value={order.order_status}
              onChange={(e) => handleStatusChange(order.order_id, e.target.value, order.order_status)}
            >
              <option value="pending">Pending</option>
              <option value="completed">Completed</option>
              <option value="cancelled">Cancelled</option>
            </select>

              // If the order is already completed or cancelled it cannot be updated 
              : <span>{order.order_status}</span>}

              </div>

          </div>
        ))}

      </div>
    </>
  )
}

export default orders;