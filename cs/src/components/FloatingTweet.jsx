// import React, { useState, useEffect } from 'react';
// import './FloatingTweet.css';

// const FloatingTweet = () => {
//   const [tweets, setTweets] = useState([]);

//   const sampleTweets = [
//     { id: 1, text: "Sample negative tweet content here...", user: "@user1" },
//     { id: 2, text: "Another example tweet that would be displayed...", user: "@user2" },
//     { id: 3, text: "Third sample tweet for demonstration purposes...", user: "@user3" },
//     { id: 4, text: "Fourth example of tweet content that floats up...", user: "@user4" },
//     { id: 5, text: "Fifth sample tweet with negative sentiment...", user: "@user5" },
//     { id: 6, text: "Sixth example tweet for the floating animation...", user: "@user6" },
//     { id: 7, text: "Seventh sample tweet content goes here...", user: "@user7" },
//     { id: 8, text: "Eighth example of floating tweet content...", user: "@user8" },
//   ];

//   useEffect(() => {
//     let timeoutId;

//     const addTweet = () => {
//       const randomTweet = sampleTweets[Math.floor(Math.random() * sampleTweets.length)];
//       const newTweet = {
//         ...randomTweet,
//         id: Date.now() + Math.random(),
//         animationId: `float-${Date.now()}-${Math.random()}`,
//       };

//       setTweets(prev => [...prev, newTweet]);

//       // Remove after 15 seconds
//       setTimeout(() => {
//         setTweets(prev => prev.filter(t => t.animationId !== newTweet.animationId));
//       }, 15000);

//       // Schedule the next tweet with a random delay (1–5s here)
//       const nextDelay = Math.random() * 4000 + 1000;
//       timeoutId = setTimeout(addTweet, nextDelay);
//     };

//     // Start with the first tweet immediately
//     addTweet();

//     // Cleanup on unmount
//     return () => clearTimeout(timeoutId);
//   }, []);

//   return (
//     <div className="floating-tweets-container">
//       <div className="floating-container">
//         {tweets.map((tweet) => (
//           <div key={tweet.animationId} className="tweet-wrapper">
//             <div className="tweet-box">
//               <div className="user-id">{tweet.user}</div>
//               <div className="tweet-text">{tweet.text}</div>
//             </div>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// };

// export default FloatingTweet;



// import React from "react";
// import "./FloatingTweet.css"; // We'll add CSS here

// const tweets = [
//   { id: "@alice", text: "Just launched my new project 🚀" },
//   { id: "@bob", text: "Loving the vibes today 😎" },
//   { id: "@charlie", text: "Working on some cool animations ✨" },
//   { id: "@diana", text: "Who else is hyped for the weekend? 🎉" },
//   { id: "@eve", text: "React + CSS = ❤️" },
//   { id: "@frank", text: "Coffee is life ☕" },
// ];

// const TweetCard = ({ id, text }) => (
//   <div className="tweet-card">
//     <p className="tweet-id">{id}</p>
//     <p className="tweet-text">{text}</p>
//   </div>
// );

// const FloatingTweet = () => {
//   return (
//     <div className="floating-tweets">
//       {/* Line 1 */}
//       <div className="marquee marquee-left">
//         {[...tweets, ...tweets].map((tweet, i) => (
//           <TweetCard key={i} id={tweet.id} text={tweet.text} />
//         ))}
//       </div>

//       {/* Line 2 */}
//       <div className="marquee marquee-right">
//         {[...tweets, ...tweets].map((tweet, i) => (
//           <TweetCard key={"line2-" + i} id={tweet.id} text={tweet.text} />
//         ))}
//       </div>
//     </div>
//   );
// };

// export default FloatingTweet;




import React from "react";
import "./FloatingTweet.css";
import ReactMarkdown from 'react-markdown';

// const tweets = [
//   { id: "@patriot_voice", text: "India's digital infrastructure is setting global standards! 🇮🇳" },
//   { id: "@tech_observer", text: "Impressed by India's renewable energy progress 🌱" },
//   { id: "@global_citizen", text: "India's space missions continue to inspire the world 🚀" },
//   { id: "@culture_lover", text: "The diversity and unity in India is remarkable ✨" },
//   { id: "@economic_watch", text: "India's startup ecosystem is booming globally 📈" },
//   { id: "@travel_enthusiast", text: "Can't wait to visit India again, such hospitality! 🙏" },
//   { id: "@food_critic", text: "Indian cuisine has the most amazing flavors 🍛" },
//   { id: "@history_buff", text: "Learning about India's rich heritage and contributions 📚" },
//   { id: "@climate_activist", text: "India's solar energy initiatives are game-changing ☀️" },
//   { id: "@sports_fan", text: "Indian athletes are making us proud on global stage! 🏆" },
//   { id: "@innovation_hub", text: "Made in India products are top quality 💪" },
//   { id: "@education_advocate", text: "Indian professionals leading tech companies worldwide 👨‍💻" },
// ];

// Function to randomly assign sentiment (90% positive, 10% negative)
const assignSentiment = (tweet, index) => {
  // Use a combination of index and text hash for consistent randomization
  const hash = tweet.text.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  
  const randomValue = Math.abs(hash + index) % 100;
  return randomValue < 10 ? 'negative' : 'positive';
};

const TweetCard = ({ id, text, sentiment }) => (
  <div className={`tweet-card ${sentiment}`}>
    <div className="tweet-header">
      <p className="tweet-id">{id}</p>
      <div className={`sentiment-indicator ${sentiment}`}>
        {sentiment === 'positive' ? '↗' : '↘'}
      </div>
    </div>
    <div className="tweet-text">
      <ReactMarkdown>{text}</ReactMarkdown>
    </div>
    <div className={`tweet-border ${sentiment}`}></div>
  </div>
);

const FloatingTweet = ({tweets , user_data}) => {
  // Create tweets with sentiment
  
  const tweetsWithSentiment = tweets
  // keep only those that have a comment
  .filter(tweet => tweet.Comment_Body && tweet.Comment_Body.trim() !== "" && tweet.Comment_Body.length > 100)
  // map to add _id and sentiment
  .map((tweet, idx) => ({
    ...tweet,
    id: idx,
    text: tweet.Comment_Body ,
    sentiment: tweet.OpenAI_Label_Comment==0 ? "positive" : "negative" 
  }));

console.log("Tweets with sentiment:", tweetsWithSentiment);


  console.log("Tweets with sentiment: " , tweetsWithSentiment);


  return (
    <div className="floating-tweets">
      {/* Line 1 - Left to Right */}
      <div className="marquee marquee-left">
        {[...tweetsWithSentiment, ...tweetsWithSentiment].map((tweet, i) => (
          <TweetCard 
            key={i} 
            id={tweet.id} 
            text={tweet.text} 
            sentiment={tweet.sentiment}
          />
        ))}
      </div>

      {/* Line 2 - Right to Left */}
      <div className="marquee marquee-right">
        {[...tweetsWithSentiment, ...tweetsWithSentiment].map((tweet, i) => (
          <TweetCard 
            key={"line2-" + i} 
            id={tweet.id} 
            text={tweet.text} 
            sentiment={tweet.sentiment}
          />
        ))}
      </div>
    </div>
  );
};

export default FloatingTweet;
