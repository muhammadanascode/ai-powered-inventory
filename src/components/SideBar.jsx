import React from "react";
import '../styles/SideBar.css';
import Image from "next/image";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
    faUser,
    faTruck,
    faCartShopping,
    faBoxOpen,
    faRightFromBracket
} from "@fortawesome/free-solid-svg-icons";
import { useRouter } from "next/router";

const SideBar = () => {

    const router = useRouter();

    const handleLogout = (e) => {
        e.preventDefault(); // Prevent default anchor behavior
        localStorage.removeItem('authToken'); // Remove token from localStorage
        router.push('/login'); // Redirect to login page
    };

    return (
        <>
            <div className="sidebar">
                <div className="head">
                    <h3 className="heading">StockSense</h3>
                    <Image src="/head-img.png" alt="head-img" height={50} width={50} />
                </div>
                <ul className="menu">
                    <li className="menu-list">
                        <a href="/customers" className="menu-item">
                            <FontAwesomeIcon icon={faUser} className="font" /> Customers
                        </a>
                    </li>
                    <li className="menu-list">
                        <a href="/suppliers" className="menu-item">
                            <FontAwesomeIcon icon={faTruck} className="font" /> Suppliers
                        </a>
                    </li>
                    <li className="menu-list">
                        <a href="" className="menu-item">
                            <FontAwesomeIcon icon={faCartShopping} className="font" /> Orders
                        </a>
                    </li>
                    <li className="menu-list">
                        <a href="/products" className="menu-item">
                            <FontAwesomeIcon icon={faBoxOpen} className="font" /> Products
                        </a>
                    </li>
                </ul>
                <div className="logoutDiv">
                    <a href="" className="logoutBtn" onClick={handleLogout}>
                        <FontAwesomeIcon icon={faRightFromBracket} className="font" />
                        Logout</a>
                </div>
            </div>
        </>
    )
}

export default SideBar;
