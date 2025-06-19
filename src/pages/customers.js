import SearchBar from '@/components/SearchBar';
import styles from '../styles/Customers.module.css';
import { useEffect, useState } from 'react';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import InputField from '@/components/InputField';
import getToken from '@/utils/getToken';

// Helper function to truncate long text for better display in UI
const truncate = (text, length = 20) => {
    return text.length > length ? text.substring(0, length) + '...' : text;
};

const Customers = () => {
    // State for storing customer list
    const [customers, setCustomers] = useState([]);

    //state for error message
    const [error, setError] = useState(false);
    const [message, setMessage] = useState('')

    // States for form visibility and input fields
    const [showForm, setShowForm] = useState(false);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [address, setAddress] = useState('');

    //state to show delete form
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    //state to track customer id to be deleted , or edited
    const [customerId, setCustomerId] = useState(null);

    // Toggle form visibility
    const handleToggleForm = () => {
        setShowForm(prev => !prev);
    };

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



    useEffect(() => {
        // fetching customers
        getCustomers();
    }, []);


    //inserting new customer
    const handleSubmit = async () => {

        if (!name || !email || !phoneNumber || !address) {
            setError(true)
            setMessage("Please fill out all required fields")
            return;
        }

        //fetching token from local storage
        const token = getToken();

        const response = await fetch(`api/customers/create`, {
            method: "POST",
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `${token}`
            },
            body: JSON.stringify({
                name,
                email,
                phone_number: phoneNumber,
                address
            })
        })

        //parsing response
        const data = await response.json();

        if (response.status !== 201) {
            setError(true);
            setMessage(data.error);
            return;
        }

        //clear form fields after submission and close the form
        setAddress('');
        setEmail('');
        setName('');
        setPhoneNumber('');
        setError(false)
        setMessage('');
        setShowForm(false);

        // Add the new customer to the existing list
        setCustomers(prev => [...prev, data.customer]);

    }

    //Edit customer function
    const deleteCustomer = async () => {

        try {
            // get token from local storage
            const token = getToken();

            // Delete customer API call
            const response = await fetch(`/api/customers/delete?customer_id=${customerId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `${token}`
                }
            });
            if (response.status !== 200) {
                throw new Error('Failed to delete customer');
            }


        } catch (error) {
            console.log("Error Deleting customer", error);

        }
        finally {
            //closing delete confirm modal
            setShowDeleteConfirm(false);
        }
    }

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
                            type={"tel"}
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
                            <button type="submit" className={styles.submitBtn} onClick={handleSubmit}>Submit</button>
                            <button type="button" className={styles.cancelBtn} onClick={() => setShowForm(false)}>Cancel</button>
                        </div>

                        {/* Display error message if any */}
                        {error ? <div className={styles.errorMessage}>
                            <p> * {message}</p>
                        </div> : null}
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
                    <div className={styles.nameDiv}><p title={customer.name}>{truncate(customer.name)}</p></div>
                    <div className={styles.emailDiv}><p title={customer.email}>{truncate(customer.email)}</p></div>
                    <div className={styles.phoneNumberDiv}><p title={customer.phone}>{customer.phone_number}</p></div>
                    <div className={styles.addressDiv}><p title={customer.address}>{truncate(customer.address)}</p></div>
                    <div className={styles.options}>
                        <FontAwesomeIcon
                            icon={faEdit}
                            className={styles.editIcon}
                            title="Edit"
                            onClick={() => deleteCustomer(customer.customer_id)}
                        />
                        <FontAwesomeIcon
                            icon={faTrash}
                            className={styles.deleteIcon}
                            title="Delete"
                            onClick={() => {
                                setShowDeleteConfirm(true)
                                setCustomerId(customer.customer_id)
                            }}
                        />
                    </div>
                </div>
            ))}
            {showDeleteConfirm && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalBox}>
                        <p>Are you sure you want to delete this customer?</p>
                        <div className={styles.modalButtons}>
                            <button className={styles.submitBtn} onClick={deleteCustomer}>Yes, Delete</button>
                            <button className={styles.cancelBtn} onClick={() => {
                                setShowDeleteConfirm(false)
                                setCustomerId(null)
                            }}>
                                Cancel</button>
                        </div>
                    </div>
                </div>
            )}

        </div>
    );
};

export default Customers;
