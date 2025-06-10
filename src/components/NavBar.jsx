import React, { useState } from 'react';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faBell, faGear } from "@fortawesome/free-solid-svg-icons";
import styles from "@/styles/NavBar.css";

const NavBar = () => {
    const [showNotifications, setShowNotifications] = useState(false);
    const [showSettings, setShowSettings] = useState(false);

    const toggleNotifications = () => {
        setShowNotifications(!showNotifications);
        setShowSettings(false); // Close settings if open
    };

    const toggleSettings = () => {
        setShowSettings(!showSettings);
        setShowNotifications(false); // Close notifications if open
    };

    return (
        <>
            <div className="container">
                <div className='subDiv4 subDiv'>AccType: root</div>

                <div className='subDiv3 subDiv' onClick={toggleNotifications}>
                    <FontAwesomeIcon icon={faBell} className="nav-icon" />
                    {showNotifications && (
                        <div className="dropdown">
                            <div className="dropdown-item">Notification 1</div>
                            <div className="dropdown-item">Notification 2</div>
                            <div className="dropdown-item">Notification 3</div>
                        </div>
                    )}
                </div>

                <div className='subDiv2 subDiv' onClick={toggleSettings}>
                    <FontAwesomeIcon icon={faGear} className="nav-icon" />
                    {showSettings && (
                        <div className="dropdown">
                            <div className="dropdown-item">Profile Settings</div>
                            <div className="dropdown-item">Account Settings</div>
                            <div className="dropdown-item">Logout</div>
                        </div>
                    )}
                </div>

                <div className='subDiv1 subDiv'>Muhammad Anas</div>
            </div>
        </>
    )
}

export default NavBar;