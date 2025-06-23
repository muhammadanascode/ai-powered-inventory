import { useState, useEffect } from 'react';
import styles from '../styles/Suppliers.module.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import InputField from '@/components/InputField';
import getToken from '@/utils/getToken';
import SearchBar from '@/components/SearchBar';
import truncate from '@/utils/truncate';

const suppliers = () => {

    // states for data
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [phoneNumber, setPhoneNumber] = useState('');
    const [address, setAddress] = useState('');

    // state for form visibility and edit mode
    const [showForm, setShowForm] = useState(false);

    // state for to check if it's in edit mode
    const [isEditMode, setIsEditMode] = useState(false);

    // state for suppliers data
    const [suppliers, setSuppliers] = useState([]);

    // state for supplier id
    const [supplierId, setSupplierId] = useState(null);

    // state for error handling
    const [error, setError] = useState(false);

    // state for error message
    const [message, setMessage] = useState('');

    // state for delete confirmation
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // Fetch suppliers data
    const getSuppliers = async () => {
        // Get token for authentication
        const token = getToken();


        try {
            const response = await fetch(`/api/suppliers/getAll`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': token
                }
            });

            // Check for error
            if (response.status !== 200) {
                throw new Error('Failed to fetch suppliers');
            }

            // Parse the response data
            const data = await response.json();
            console.log(data.suppliers);

            setSuppliers(data.suppliers);

        } catch (error) {
            console.error('Error fetching suppliers:', error);
        }
    }

    useEffect(() => {
        // Fetch suppliers data on component mount
        getSuppliers();
    }, []);



    // Toggle form visibility
    const handleToggleForm = () => {
        setShowForm(prev => !prev);
    };

    const handleSubmit = async () => {

        // check all fields are filled
        if (!name || !phoneNumber || !address) {
            setError(true)
            setMessage("Please fill out all required fields")
            return;
        }

        //fetching token from local storage
        const token = getToken();

        // url for creating or updating customer
        const url = isEditMode
            ? `/api/suppliers/update?supplier_id=${supplierId}`
            : `/api/suppliers/create`;

        // method for API call
        const method = isEditMode ? 'PUT' : 'POST';

        const response = await fetch(url, {
            method,
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

        if ((isEditMode && response.status !== 200) || (!isEditMode && response.status !== 201)) {
            setError(true);
            setMessage(data.error);
            return;
        }

        // Update local state
        if (isEditMode) {
            setSuppliers(prev =>
                prev.map(c =>
                    c.supplier_id === supplierId ? { ...c, name, email, phone_number: phoneNumber, address } : c
                )
            );
        } else {
            setSuppliers(prev => [...prev, {
                supplier_id: data.supplierId, // assuming the API returns the new customer ID
                name,
                email,
                phone_number: phoneNumber,
                address
            }]);
        }

        //clear form fields after submission and close the form
        setName('');
        setEmail('');
        setPhoneNumber('');
        setAddress('');
        setSupplierId(null);
        setIsEditMode(false);
        setShowForm(false);
        setError(false);
        setMessage('');
    }

    const deleteSupplier = async () => {

        try {
            // get token from local storage
            const token = getToken();

            // Delete customer API call
            const response = await fetch(`/api/suppliers/delete?supplier_id=${supplierId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `${token}`
                }
            });
            if (response.status !== 200) {
                throw new Error('Failed to delete supplier');
            }

            // set customers 
            setSuppliers(prev => prev.filter(c => c.supplier_id !== supplierId));

        } catch (error) {
            console.log("Error Deleting supplier", error);

        }
        finally {
            //closing delete confirm modal
            setShowDeleteConfirm(false);
        }
    }

    return (
        <div className={styles.container}>

            {/* "Add" button with plus icon to open form modal */}
            <div className={styles.btnDiv} title='Add new supplier'>
                <button className={styles.btn} onClick={handleToggleForm}>
                    Add
                    <FontAwesomeIcon icon={faPlus} style={{ marginLeft: '8px' }} />
                </button>
            </div>

            {/* Full-screen modal form for adding a new supplier or to edit the supplier data */}
            {showForm && (
                <div className={styles.overlay}>
                    <div className={styles.formModal}>
                        <h3>{isEditMode ? 'Edit supplier' : 'Add New supplier'}</h3>

                        {/* Input fields for new supplier */}
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
                            <button type="button" className={styles.cancelBtn}
                                onClick={() => {
                                    setShowForm(false);
                                    setIsEditMode(false);
                                    setSupplierId(null);
                                    setName('');
                                    setEmail('');
                                    setPhoneNumber('');
                                    setAddress('');
                                    setError(false);
                                    setMessage('');
                                }}
                            >Cancel</button>
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

            {/* Table headers for supplier data */}
            <div className={styles.header}>
                <h4>Name</h4>
                <h4>Email</h4>
                <h4>Phone Number</h4>
                <h4>Address</h4>
            </div>

            {/* Render supplier list */}
            {suppliers.map((supplier) => (
                <div className={styles.suppliers} key={supplier.supplier_id}>
                    <div className={styles.nameDiv}><p title={supplier.name}>{truncate(supplier.name, 6)}</p></div>
                    <div className={styles.emailDiv}><p title={supplier.email}>{supplier.email ? truncate(supplier.email, 21) : "N/A"}</p></div>
                    <div className={styles.phoneNumberDiv}><p title={supplier.phone}>{truncate(supplier.phone_number, 18)}</p></div>
                    <div className={styles.addressDiv}><p title={supplier.address}>{truncate(supplier.address, 18)}</p></div>
                    <div className={styles.options}>
                        <FontAwesomeIcon
                            icon={faEdit}
                            className={styles.editIcon}
                            title="Edit"
                            onClick={() => {
                                setIsEditMode(true);
                                setShowForm(true);
                                setSupplierId(supplier.supplier_id);
                                setName(supplier.name);
                                setEmail(supplier.email);
                                setPhoneNumber(supplier.phone_number);
                                setAddress(supplier.address);
                            }}
                        />
                        <FontAwesomeIcon
                            icon={faTrash}
                            className={styles.deleteIcon}
                            title="Delete"
                            onClick={() => {
                                setShowDeleteConfirm(true)
                                setSupplierId(supplier.supplier_id)
                            }}
                        />
                    </div>
                </div>
            ))}

            {/* Delete confirmation popup */}
            {showDeleteConfirm && (
                <div className={styles.modalOverlay}>
                    <div className={styles.modalBox}>
                        <p>Are you sure you want to delete this supplier?</p>
                        <div className={styles.modalButtons}>
                            <button className={styles.submitBtn} onClick={deleteSupplier}>Yes, Delete</button>
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
}

export default suppliers;