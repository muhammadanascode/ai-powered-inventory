import React from 'react';
import NavBar from './NavBar';
import SideBar from './SideBar';
import '../styles/Layout.css'; // Assuming you have a CSS file for layout styles


const Layout = ({ children }) => {
  return (
    <div className="layout-container">
      <SideBar />
      <div className="main-content">
        <NavBar />
        <div className="page-content">{children}</div>
      </div>
    </div>
  );
};

export default Layout;