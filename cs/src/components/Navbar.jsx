import React from 'react';
import { Link } from "react-router-dom";
import './Navbar.css';

function Navbar() {
  return (
    <div className="header">
 <div className="navbar">
      <div className="nav-links">
        <Link to="/">Home</Link>
        <a href="#about-section">About</a>
        <Link to="/search">Search</Link>
        <Link to="/zyx">ZYX</Link>
      </div>
      </div>
    </div>
   
  );
}

export default Navbar;
