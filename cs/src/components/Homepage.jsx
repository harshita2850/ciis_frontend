import React from 'react'
import './Homepage.css'
import { Link } from 'react-router-dom'
import About from './About'
function Homepage() {
  return (
   <div className="homepage">
    <div className="homePageHead">
        CYBERSHIELD
        <div>Lorem ipsum dolor, sit amet consectetur adipisicing.</div>
  
   <div className="btn">
<Link to='/search'>Get Started</Link>
    </div>
      </div>

      <div id="about-section">
        <About/>
      </div>
   </div>
  )
}

export default Homepage
