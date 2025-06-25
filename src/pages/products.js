import { useEffect, useState } from 'react';
import styles from '../styles/Products.module.css';
import InputField from '@/components/InputField';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faPlus, faEdit, faTrash } from '@fortawesome/free-solid-svg-icons';
import SearchBar from '@/components/SearchBar';
import getToken from '@/utils/getToken';
import truncate from '@/utils/truncate';

const products = () => {

    // State to manage the visibility of the form modal
    const [showForm, setShowForm] = useState(false);

    // state for products data
    const [products, setProducts] = useState([]);

    //state for form fields
    const [name, setName] = useState('');
    const [price, setPrice] = useState('');
    const [quantity, setQuantity] = useState('');
    const [supplierId, setSupplierId] = useState('');
    const [suppliers, setSuppliers] = useState([]);

    // state for edit mode
    const [isEditMode, setIsEditMode] = useState(false);

    // state for product id
    const [productId, setProductId] = useState(null);

    // state for error handling
    const [error, setError] = useState(false);
    const [message, setMessage] = useState('');

    // state for delete confirmation modal
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

    // function to get the suppliername using its id 
    const getSupplierName = (sid) => {
        console.log(sid);
        const supplierObj = suppliers.find(s => s.supplier_id == sid);
        console.log(supplierObj, sid);

        return supplierObj ? supplierObj.name : 'N/A';
    }

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
            console.error('Error fetching Products:', error);
        }
    };

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
        // fetching customers
        getProducts();
        // fetching suppliers
        getSuppliers();
    }, []);


    // to handle the toggle of the form modal
    const handleToggleForm = () => {
        setShowForm(prev => !prev);
    }

    // function to handle supplier selection
    const handleSupplierChange = (e) => {
        setSupplierId(e.target.value); // supplier_id from the selected <option>
    };


    // function to handle form submission
    const handleSubmit = async () => {

        if (!name || !price || !quantity) {
            setError(true)
            setMessage("Please fill out all required fields")
            return;
        }

        //fetching token from local storage
        const token = getToken();

        // url for creating or updating customer
        const url = isEditMode
            ? `/api/products/update?product_id=${productId}`
            : `/api/products/create`;

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
                price,
                quantity,
                supplier_id: supplierId
            })
        })

        //parsing response
        const data = await response.json();

        if ((isEditMode && response.status !== 200) || (!isEditMode && response.status !== 201)) {
            setError(true);
            setMessage(data.error);
            return;
        }

        console.log(supplierId);


        // Update local state
        if (isEditMode) {

            setProducts(prev =>
                prev.map(c =>
                    c.product_id === productId ? { ...c, name, price, quantity, supplier_id: supplierId } : c
                )
            );
        } else {
            setProducts(prev => [...prev, {
                product_id: data.product_id, // assuming the API returns the new customer ID
                name,
                price,
                quantity,
                supplier_id: supplierId
            }]);
        }

        //clear form fields after submission and close the form
        setName('');
        setPrice('');
        setQuantity('');
        setSupplierId('')
        setProductId(null);
        setIsEditMode(false);
        setShowForm(false);
        setError(false);
        setMessage('');

    }

    // function to delete a product
    const deleteProduct = async () => {
        try {
            // get token from local storage
            const token = getToken();

            // Delete customer API call
            const response = await fetch(`/api/products/delete?product_id=${productId}`, {
                method: 'DELETE',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `${token}`
                }
            });
            if (response.status !== 200) {
                throw new Error('Failed to delete product');
            }

            // set customers 
            setProducts(prev => prev.filter(c => c.product_id !== productId));

        } catch (error) {
            console.log("Error Deleting product", error);

        }
        finally {
            //closing delete confirm modal
            setShowDeleteConfirm(false);
        }
    }
    return (
        <>
            <div className={styles.container}>
                {/* "Add" button with plus icon to open form modal */}
                <div className={styles.btnDiv} title='Add new customer'>
                    <button className={styles.btn} onClick={handleToggleForm}>
                        Add
                        <FontAwesomeIcon icon={faPlus} style={{ marginLeft: '8px' }} />
                    </button>
                </div>
                {/* Full-screen modal form for adding a new customer or to edit the customer data */}
                {showForm && (
                    <div className={styles.overlay}>
                        <div className={styles.formModal}>
                            <h3>{isEditMode ? 'Edit Product' : 'Add New Product'}</h3>

                            {/* Input fields for new customer */}
                            <InputField
                                label={"Name"}
                                name={"name"}
                                type={"text"}
                                value={name}
                                placeholder={"Eg : National Masala"}
                                onChange={(e) => setName(e.target.value)}
                            />

                            <InputField
                                label={"Price"}
                                name={"price"}
                                type={"number"}
                                value={price}
                                placeholder={"Eg: Rs. 1000"}
                                onChange={(e) => setPrice(e.target.value)}
                            />

                            <InputField
                                label={"Quantity"}
                                name={"quantity"}
                                type={"number"}
                                value={quantity}
                                placeholder={"Eg: 10"}
                                onChange={(e) => setQuantity(e.target.value)}
                            />

                            {/* Supplier selection dropdown */}
                            <div className={styles.inputField}>
                                <select
                                    id="supplier"
                                    name="supplier"
                                    value={supplierId}
                                    onChange={handleSupplierChange}
                                >
                                    <option value="">Select Supplier</option>
                                    {suppliers.map((supplier) => (
                                        <option key={supplier.supplier_id} value={supplier.supplier_id}>
                                            {supplier.name}
                                        </option>
                                    ))}
                                </select>
                            </div>

                            {/* Submit and Cancel buttons */}
                            <div className={styles.formButtons}>
                                <button type="submit" className={styles.submitBtn} onClick={handleSubmit}>Submit</button>
                                <button type="button" className={styles.cancelBtn}
                                    onClick={() => {
                                        setShowForm(false);
                                        setIsEditMode(false);
                                        setProductId(null);
                                        setName('');
                                        setPrice('');
                                        setQuantity('');
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

                {/* Table headers for Product's data */}
                <div className={styles.header}>
                    <div className={styles.namehead}><h4>Name</h4></div>
                    <div className={styles.pricehead}><h4>Price</h4></div>
                    <div className={styles.quantityhead}><h4>Quantity</h4></div>
                    <div className={styles.supplierhead}><h4>Supplier</h4></div>
                    <div className={styles.optionshead}></div>
                </div>

                {/* Render customer list */}
                {products.map((product) => (
                    <div className={styles.products} key={product.product_id}>
                        <div className={styles.nameDiv}><p title={product.name}>{truncate(product.name, 12)}</p></div>
                        <div className={styles.priceDiv}><p title={product.price}>{product.price}</p></div>
                        <div className={styles.quantityDiv}><p title={product.quantity}>{product.quantity}</p></div>
                        <div className={styles.supplierDiv}><p title={product.supplier}>{getSupplierName(product.supplier_id)}</p></div>
                        <div className={styles.options}>
                            <FontAwesomeIcon
                                icon={faEdit}
                                className={styles.editIcon}
                                title="Edit"
                                onClick={() => {
                                    setIsEditMode(true);
                                    setShowForm(true);
                                    setProductId(product.product_id);
                                    setName(product.name);
                                    setPrice(product.price);
                                    setQuantity(product.quantity);
                                    setSupplierId(product.supplier_id);
                                }}
                            />
                            <FontAwesomeIcon
                                icon={faTrash}
                                className={styles.deleteIcon}
                                title="Delete"
                                onClick={() => {
                                    setShowDeleteConfirm(true)
                                    setProductId(product.product_id)
                                }}
                            />
                        </div>
                    </div>
                ))}

                {/* Delete confirmation popup */}
                {showDeleteConfirm && (
                    <div className={styles.modalOverlay}>
                        <div className={styles.modalBox}>
                            <p>Are you sure you want to delete this Product?</p>
                            <div className={styles.modalButtons}>
                                <button className={styles.submitBtn} onClick={deleteProduct}>Yes, Delete</button>
                                <button className={styles.cancelBtn} onClick={() => {
                                    setShowDeleteConfirm(false)
                                    setProductId(null)
                                }}>
                                    Cancel</button>
                            </div>
                        </div>
                    </div>
                )}

            </div>
        </>
    )
}

export default products;