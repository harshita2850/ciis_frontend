import React, { useEffect } from 'react'
import './Chat.css'
import { useState } from 'react';
import { Plus, ChevronLeft, Send, PlusCircle, ChevronRight } from 'lucide-react';
import Form from './Form';
import AzureMap from './AzureMap';
import axios from 'axios';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import 'katex/dist/katex.min.css';
import Message from './Message';



function Chat() {
  const [mapOpen, setmapOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [message, setMessage] = useState("");
  const [startChat, setstartChat] = useState(false);
  const [showRegionForm, setShowRegionForm] = useState(false);
  const [lat , setLat] = useState(0) ; 
  const [lon , setLon] = useState(0) ; 
  const [formData, setFormData] = useState({
    district: '',
    state: '',
    areaOfRoof: '',
    noFamilyMem: '',
    roofMaterial: ''
  });
  const[res1 , setRes1] = useState({});
  const[data , setData] = useState({}) ; 
  
  const [area , setArea] = useState(0);
  useEffect(()=>{
    setFormData(prev => ({
      ...prev,
      areaOfRoof: area
    }));
  },[area])
// ...existing code...
  useEffect(()=>{
      if (data.features && data.features.length > 0) {
          console.log(data.features[0].geometry.coordinates[0][0]) ; 
          const coord = data.features[0].geometry.coordinates[0][0]  ; 
          setLon(coord[0]) ; 
          setLat(coord[1]) ;
      }
      

  },[data]) ;
  useEffect(()=>{
    console.log("Latitude:" , lat , "Longitude:" ,lon) ;
  },[lat , lon])
// ...existing code...
  console.log("Form Data" , formData)  ;
  const createNewChat = () => {
    setstartChat(false);
    setMessages([]);
  }

  const MapOpen = () => {
    setmapOpen(!mapOpen);
  }

  const handleSend = async () => {
    if (message.trim() === "") return;
    const msg  = message.trim() ;
    setMessage("");
    setMessages((prev) => [...prev, { text: msg, time: Date.now(),sender:'user' }]);
    setstartChat(true);
    const res  =await axios.post('http://localhost:8000/api/chat', {
      message: msg , 
      history : res1 
    });
    setMessages((prev) => [...prev, { text: res.data.answer, time: Date.now(),sender:'ai' }]);
    

  };



  const handleInputChange = (e) => {
    const value = e.target.value;
    setMessage(value);
    
    if (value === "@" && !startChat) {
      setShowRegionForm(true);
      setMessage("");
    }
  };
  // ...existing code...
const submitForm = async () => {
  try {
    const res = await axios.post('http://localhost:8000/api/init', {
      state: formData.state,
      district: formData.district,
      lat: lat,
      lon: lon,
      area: formData.areaOfRoof,
      members: formData.noFamilyMem,
      roof_type: formData.roofMaterial,
      year: 2023
    });
    console.log(res);
    setRes1(res.data);
    setShowRegionForm(false);
    
    // Create formatted message from API response
    const formattedMessage = `
📊 **Water Analysis Report for ${res.data.district}, ${res.data.state}**

🏠 **Site Information:**
• Area: ${res.data.area} m²
• Roof Type: ${res.data.roof_type}
• Annual Rainfall: ${res.data.rainfall} mm
• Slope: ${res.data.slope.toFixed(2)}%

💧 **Water Assessment:**
• Water Requirements: ${res.data.water_requirements.toLocaleString()} L/year
• Water Availability: ${res.data.water_availability.toLocaleString()} L/year
• Groundwater Level: ${res.data.groundwater} m

⚡ **Recommended Solution:**
${res.data.recharge_type}
 
    `;
    
    setMessages((prev) => [...prev, { text: formattedMessage, time: Date.now(),sender:'ai' }]);
    setstartChat(true);
    
  } catch (error) {
    console.error('Error submitting form:', error);
    setMessages((prev) => [...prev, { 
      text: "Sorry, there was an error processing your request. Please try again.", 
      time: Date.now() 
    }]);
  }
};
// ...existing code...
   const handleRegionSubmit = () => {
    setShowRegionForm(false);
   }

  return (
    <div className="chatPage">
      <div className="sidebar">
        <button
          className="newChat"
          onClick={createNewChat}
        >
          <Plus />
        </button>
        <button className="slideSidebar">
          <ChevronRight/>
        </button>
      </div>

      <div
        className="chatArea"
        style={{ width: mapOpen ? '50%' : '90%' }}
      >

        <div className="mainChatarea">
          {!startChat ? (
            <div className="firstChatText">
              <div class="welcome-content">
                <h1 class="welcome-title">Welcome</h1>
                <p class="welcome-subtitle">Ask me anything about rainwater harvesting.</p>
              </div>

              <div class="action-buttons">
                <button class="action-btn primary">
                 Quick Start
                </button>
                <button class="action-btn secondary">
                 Documentation
                </button>
              </div>


             <div class="input-container">
               <button class="input-btn icon">
                            <PlusCircle/>  </button>
                <input
                className='input-field'
                  type="text"
                  placeholder="Type @ to start"
                  value={message}
                  onChange={handleInputChange}
                />
                <button onClick={handleSend}
                className='input-btn send
                '><Send /></button>

              </div>
            </div>
          ) : (
            <div className="compact-input">

              <div className="chat-messages">
                {messages.map((msg, index) => (
                  <div key={index} className={`chat-message ${msg.sender}`}>
                   <Message msg = {msg} />
                  </div>
                ))}
              </div>

               <div class="input-container">
               <button class="input-btn icon">
                            <PlusCircle/>  </button>
                <input
                className='input-field'
                  type="text"
                  placeholder="Ask"
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <button onClick={handleSend}
                className='input-btn send
                '><Send /></button>

              </div>
            </div>
          )}
        </div>
      </div>

      <div
        className="mapArea"
        style={{ width: mapOpen ? '50%' : '0%' }}
      >
        <div className="mapBtnArea">
        <button
          className="mapToggle"
          onClick={MapOpen}
        >
          <ChevronLeft />
        </button>
        
        </div>

        <div className="mapContainer">
          {mapOpen ?(<AzureMap 
          area={area} 
          setArea={setArea}
          data={data}
          setData={setData}
          />
        ):(
          <div className="notMap">
          </div>
        )}
          
        </div>
      </div>

      <Form
        isOpen={showRegionForm}
        onClose={() => setShowRegionForm(false)}
        onSubmit={submitForm}
        setFormData={setFormData}
        formData = {formData}

      />

    </div>
  )
}

export default Chat
