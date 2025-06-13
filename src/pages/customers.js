import SearchBar from '@/components/SearchBar';
import styles from '../styles/Customers.module.css';
import { useEffect, useState } from 'react';

// Helper function to truncate long text
const truncate = (text, length = 20) => {
    return text.length > length ? text.substring(0, length) + '...' : text;
};

const Customers = () => {

    // TODO: To implement search functionality , spinner while fetching data, and error handling

    const [customers, setCustomers] = useState([]);

    // fetching customers
    useEffect(() => {

        function getToken() {
            const token = localStorage.getItem('authToken');
            if (!token) {
                return null;
            }
            return token;
        }

        const getCustomers = async () => {

            // Get the token from localStorage
            const token = getToken();

            // Check if the token exists
            if (!token) {
                return;
            }

            try {
                // Fetch customers from the API with the token included in the headers
                const response = await fetch('/api/customers/getAll', {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `${token}`
                    }
                });
                if (response.status !== 200) {
                    throw new Error('Network response was not ok');
                }
                const data = await response.json();
                setCustomers(data.customers || []);

            } catch (error) {
                console.error('Error fetching customers:', error);
            }
        }

        getCustomers()

    }, [])

    return (
        <div className={styles.container}>
            {/* Search input bar */}
            <SearchBar />

            {/* Table headers */}
            <div className={styles.header}>
                <h4>Name</h4>
                <h4>Email</h4>
                <h4>Phone Number</h4>
                <h4>Address</h4>
            </div>

            {/* Customer row with tooltips */}
            {customers.map((customer) => (
                <div className={styles.customers} key={customer.customer_id}>
                    <p title={customer.name}>{truncate(customer.name)}</p>
                    <p title={customer.email}>{truncate(customer.email)}</p>
                    <p title={customer.phone}>{customer.phone_number}</p>
                    <p title={customer.address}>{truncate(customer.address)}</p>
                </div>


            ))}

        </div>
    );
};

export default Customers;
