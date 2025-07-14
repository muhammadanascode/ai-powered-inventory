import { useEffect, useState } from "react"
import styles from "../../styles/Predictions.module.css"
import getToken from "@/utils/getToken"

const Predictions = () => {
    const [products, setProducts] = useState([])

    const getProducts = async () => {
        const token = getToken();
        if (!token) return;

        const res = await fetch("/api/predictions", {
            method: "GET",
            headers: {
                "Content-Type": "application/json",
                "Authorization": token
            }
        });

        const data = await res.json();

        //checking for error
        if (res.status != 200) {
            console.log(data.error)
        } else {

            //checking for error due to lack of products
            if (data.error) {
                console.log(data.error);
                return;
            } else {
                console.log(data);
                setProducts(data.predictedData)
            }
        }
    };


    useEffect(() => {
        // fecthing products 
        getProducts();
    }, [])

    return (
        <>
            <div className={styles.container}>
                {/* Table headers for Product's data */}
                <div className={styles.header}>
                    <div className={styles.namehead}><h4>Name</h4></div>
                    <div className={styles.quantity}><h4>Quantity</h4></div>
                    <div className={styles.forecastedQuantity}><h4>forecasted</h4></div>
                    <div className={styles.totalSold}><h4>total sold</h4></div>
                    <div className={styles.action}><h4>Action</h4></div>
                </div>

                {/* Mapping products with thier forecasted values */}
                {/* Render customer list */}
                {products?.map((product) => (
                    <div className={styles.products} key={product.product_id}>
                        <div className={styles.nameDiv}><p title={product.name}>{product.product_name}</p></div>
                        <div className={styles.quantityDiv}><p title={product.quantity}>{product.quantity}</p></div>
                        <div className={styles.forecastedQuantityDiv}><p title={product.forecstedQuantity}>{product.forecastedQuantity}</p></div>
                        <div className={styles.totalSoldDiv}><p title={product.totalSold}>{product.total_sold}</p></div>
                        <div className={styles.actionDiv}><p title={product.action}>Action</p></div>

                    </div>
                ))}
            </div>
        </>
    )
}

export default Predictions