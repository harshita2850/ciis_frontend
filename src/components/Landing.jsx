import React from 'react'
import './Landing.css'
// import j2 from '../assets/j2.jpeg'

function Landing() {
  return (
    <div className="landing">
      <section id="home">
        <h1>
          Rainwater Blah Blah
        </h1>
        <p>
          All it takes a single prompt!
        </p>
        <button>
          Try It Now
        </button>
      </section>

      <section id="about">
        <span>
          From Data to Decisions—Instantly
        </span>
        <p>
          No coding. No complexity. Just ask, and AI transforms your geospatial data into instant insights.
        </p>
        <div className="cards">
        <div className="card1 card">
          <div className="card-text">
           <span>
              Powerful, yet Simple to Use
              </span>
            <p>
              Bring the power of AI and geospatial data to your fingertips with our intuitive interface.
            </p>
           
          </div>
        </div>

        <div className="card2 card">
          <div className="card-text">
            <span>
              Powerful, yet Simple to Use
              </span>
            <p>
              Bring the power of AI and geospatial data to your fingertips with our intuitive interface.
            </p>
            
            
          </div>
        </div>

        <div className="card3 card">
          <div className="card-text">
            <span>
              Powerful, yet Simple to Use
              </span>
            
            <p>
              Bring the power of AI and geospatial data to your fingertips with our intuitive interface.
            </p>
            
          </div>
        </div>
        </div>
        
      </section>
    </div>
  )
}

export default Landing
