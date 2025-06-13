import SearchBar from '@/components/SearchBar';
import styles from '../styles/Customers.module.css';
import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus } from '@fortawesome/free-solid-svg-icons';
import InputField from '@/components/InputField';

// Helper function to truncate long text for better display in UI
const truncate = (text, length = 20) => {
    return text.length > length ? text.substring(0, length) + '...' : text;
};

const Customers = () => {
    // State for storing customer list
    const [customers, setCustomers] = useState([]);

    // States for form visibility and input fields
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [address, setAddress] = useState('');

    // Toggle form visibility
    const handleToggleForm = () => {
        setShowForm(prev => !prev);
    };

    // Fetch customer list from backend API on component mount
    useEffect(() => {
        function getToken() {
            const token = localStorage.getItem('authToken');
            return token || null;
        }

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

        getCustomers();
    }, []);

    return (
        <div className={styles.container}>
            {/* "Add" button with plus icon to open form modal */}
            <div className={styles.btnDiv} title='Add new customer'>
                <button className={styles.btn} onClick={handleToggleForm}>
                    Add
                    <FontAwesomeIcon icon={faPlus} style={{ marginLeft: '8px' }} />
                </button>
            </div>

            {/* Full-screen modal form for adding a new customer */}
            {showForm && (
                <div className={styles.overlay}>
                    <div className={styles.formModal}>
                        <h3>Add New Customer</h3>

                        {/* Input fields for new customer */}
                        <InputField
                            label={"Name"}
                            name={"name"}
                            type={"text"}
                            value={name}
                            placeholder={"John Doe"}
                            onChange={(e) => setName(e.target.value)}
                        />

                        <InputField
                            label={"Email"}
                            name={"email"}
                            type={"email"}
                            value={email}
                            placeholder={"johndoe@gmail.com"}
                            onChange={(e) => setEmail(e.target.value)}
                        />

                        <InputField
                            label={"Phone"}
                            name={"phone_number"}
                            type={"number"}
                            value={phoneNumber}
                            placeholder={"+923242650627"}
                            onChange={(e) => setPhoneNumber(e.target.value)}
                        />

                        <InputField
                            label={"Address"}
                            name={"address"}
                            type={"text"}
                            value={address}
                            placeholder={"123 Main St, City, Country"}
                            onChange={(e) => setAddress(e.target.value)}
                        />

                        {/* Submit and Cancel buttons */}
                        <div className={styles.formButtons}>
                            <button type="submit" className={styles.submitBtn}>Submit</button>
                            <button type="button" className={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Search bar component */}
            <SearchBar />

            {/* Table headers for customer data */}
            <div className={styles.header}>
                <h4>Name</h4>
                <h4>Email</h4>
                <h4>Phone Number</h4>
                <h4>Address</h4>
            </div>

            {/* Render customer list */}
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
