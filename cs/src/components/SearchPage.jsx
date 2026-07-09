import React, { useCallback } from 'react'
import './SearchPage.css'
import FloatingTweet from './FloatingTweet'
// import Typed from "react-typed";
import { ReactTyped } from "react-typed";
import { useState, useEffect } from 'react';
import axios from 'axios';
import Graph1 from './Graph1';
import HeatMapGraph from './HeatMapGraph';
import Graph2 from './Graph2';

function SearchPage() {
    const [tweets , setTweets] =useState([]); 
    const [userData  , setUserData] = useState([]);
    const fetchDefaultTweets = async () => {
        try {
            const res = await axios.get('http://localhost:8000/search/scheduled/data');
            setTweets(res.data.result_data);
            setUserData(res.data.user_activity_data);

            
        } catch (error) {
            console.error("Error fetching default tweets:", error);
        }
    }
    useEffect(() => {
        fetchDefaultTweets();
    }, []); // empty deps → only once

    // Debug when state updates
    useEffect(() => {
        console.log("Updated tweets:", typeof(tweets['0']));

    }, [tweets]);

    useEffect(() => {
        console.log("Updated userData:", userData);
    }, [userData]);

    

    return (
        <div className="searchPage">

                <div className="head-text">
                    <div className="heading">
                        Blah Blah <span>{" "}
                         <ReactTyped
        strings={["Insights", "Real-Time Updates"]}
        typeSpeed={150}
        backSpeed={40}
        backDelay={1500}
        loop
      /></span>
                    </div>
                    <div className="heading-sub">
                        Real-time updates from social media
                    </div>
                </div>
                <div className="search-bar">
                    <input
                        className="search-input"
                        type="text"
                        placeholder="Search..."
                    />

                    <button>S</button>
                </div>

                <div className="floatingTw">
<FloatingTweet tweets={tweets} user_data={userData} />


            </div>

                <div className="card-container">
                    <div className="card1 card">
                        <div className="card-text">
                           <Graph1 tweets={tweets} />

                        </div>
                    </div>

                    <div className="card1 card">
                        <div className="card-text">
                           
                        
                       <HeatMapGraph tweets={tweets} />
                        </div>
                        
                    </div>

                    <div className="card1 card">
                        <div className="card-text">
                           <Graph2 tweets={tweets}/>

                        </div>
                    </div>

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
                </div>
            

        </div>
    )
}

export default SearchPage

