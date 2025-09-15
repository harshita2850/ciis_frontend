import React from 'react';
import { Link } from "react-router-dom";
import './Navbar.css';

function Navbar() {
  return (
    <div className="header">
 <div className="navbar">
      <div className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/about">About</Link>
        <Link to="/chat">Chat</Link>
        <Link to="/zyx">ZYX</Link>
      </div>
      </div>
    </div>
   
  );
}

export default Navbar;
