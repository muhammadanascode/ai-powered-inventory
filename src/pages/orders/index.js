import { useEffect, useState } from 'react';
import styles from '../../styles/Orders.module.css';
import SearchBar from '@/components/SearchBar';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import { useRouter } from 'next/router';
import getToken from '@/utils/getToken';
import getCustomers from '@/utils/getCustomers';

const orders = () => {

  // state to hold orders
  const [orders, setOrders] = useState([]);

  // state to control update confirmation modal visibility
  const [showUpdateConfirm, setShowUpdateConfirm] = useState(false);

  // state to hold selected status for updating
  const [selectedStatus, setSelectedStatus] = useState('');

  // state to filter orders by status
  const [statusFilter, setStatusFilter] = useState('all');

  // state to hold filtered orders for rendering
  const [filteredOrders, setFilteredOrders] = useState([]); // for rendering

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
      setFilteredOrders(data.orders || []); // Initialize filteredOrders with fetched orders
    } catch (error) {
      console.error('Error fetching orders:', error);
    }
  };



  useEffect(() => {
    // fetching order
    getOrders();
  }, []);

  // Calculating order counts
  const orderCounts = {
    all: orders.length,
    pending: orders.filter(o => o.order_status.toLowerCase() === "pending").length,
    completed: orders.filter(o => o.order_status.toLowerCase() === "completed").length,
    cancelled: orders.filter(o => o.order_status.toLowerCase() === "cancelled").length,
  };


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

  // Handle status filter change
  const handleStatusFilter = (status) => {
    // update the status filter state
    setStatusFilter(status);

    // Filter orders based on the selected status
    if (status === "all") {
      setFilteredOrders(orders);
    } else {
      const filtered = orders.filter(order =>
        order.order_status.toLowerCase() === status
      );
      setFilteredOrders(filtered);
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

        {/* Filter Orders */}
        <div className={styles.filterBar}>
          {["all", "pending", "completed", "cancelled"].map(status => (
            <button
              key={status}
              className={`${styles.filterBtn} ${statusFilter === status ? styles.activeFilter : ""
                }`}
              onClick={() => handleStatusFilter(status)}
            >
              {status.charAt(0).toUpperCase() + status.slice(1)} ({orderCounts[status]})
            </button>
          ))}
        </div>

        {/* Table headers for order data */}
        <div className={styles.header}>
          <div className={styles.customerHead}><h4>Customer</h4></div>
          <div className={styles.totalPriceHead}><h4>Total Price</h4></div>
          <div className={styles.dateHead}><h4>Date</h4></div>
          <div className={styles.statusHead}><h4>Status</h4></div>
          <div className={styles.viewDetailsHead}><h4></h4></div>
        </div>

        {/* Render customer list */}
        {filteredOrders.map((order) => (
          <div className={styles.orders} key={order.order_id}>
            <div className={styles.customerNameDiv}><p title={order.CustomerName}>{order.customer_name}</p></div>
            <div className={styles.priceDiv}><p title={order.totalPrice}>Rs. {order.total_price}</p></div>
            <div className={styles.dateDiv}><p title={order.date}>{new Date(order.created_at).toLocaleString()}</p></div>

            {/* Displaying order status */}
            <div className={styles.statusDiv}>
              {order.order_status === "pending" ? (
                <>
                  {/* if status is pending user can update it */}
                  <select
                    className={styles.orderStatusSelect}
                    value={selectedStatus || order.order_status}
                    onChange={(e) => {
                      setSelectedStatus(e.target.value);
                      setShowUpdateConfirm(true);
                    }}
                  >
                    <option value="pending">Pending</option>
                    <option value="completed">Completed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>

                  {/* Update confirmation popup */}
                  {showUpdateConfirm && (
                    <div className={styles.modalOverlay}>
                      <div className={styles.modalBox}>
                        <p>Are you sure you want to update the order status?</p>
                        <div className={styles.modalButtons}>
                          <button
                            className={styles.updateBtn}
                            onClick={() => {
                              handleStatusChange(order.order_id, selectedStatus, order.order_status);
                              setShowUpdateConfirm(false);
                            }}
                          >
                            Yes, Update
                          </button>
                          <button
                            className={styles.cancelBtn}
                            onClick={() => {
                              setShowUpdateConfirm(false);
                              setSelectedStatus(order.order_status); // reset if needed
                            }}
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </>
              ) : (

                // If status is not pending, display it as text
                <span>{order.order_status}</span>
              )}
            </div>
            {/* View Details of the order  */}
            <div className={styles.viewDetails}>
              <button
                className={styles.viewDetailsBtn}
                onClick={() => router.push(`/orders/${order.order_id}`)}
              >
                Details
              </button>
            </div>


          </div>
        ))}

      </div>
    </>
  )
}

export default orders;