import React from 'react';
import './Header.css';
import nvagologo from '../../assets/nvalogomini.png'; // Import the logo image

const Header = () => {
  return (
    <header className="Header">
      <div className="Header-logo">
        <img src={nvagologo} alt="NVA Go Logo" />
      </div>
    </header>
  );
};

export default Header;