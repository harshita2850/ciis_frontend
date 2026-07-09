import React, { useMemo } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Cell
} from "recharts";

function Graph2({ tweets }) {
  const chartData = useMemo(() => {
    // Posts flagged by OpenAI
    const filteredTweets = tweets.filter(tweet => tweet.OpenAI_Label_Post === 1);
    const filteredTweets2 =tweets.filter(tweet => tweet.OpenAI_Label_Comment === 1);
    // Post upvotes
    const postScoreCount = filteredTweets.reduce(
      (acc, tweet) => acc + (tweet.Post_Score || 0),
      0
    );

    // Count of comments flagged by OpenAI
    const postCommentsCount = tweets.filter(
      tweet => tweet.OpenAI_Label_Comment === 1
    ).length;

    // Comment upvotes (your original method)
    const totalCommentScore = filteredTweets2.reduce(
      (acc, tweet) => acc + (tweet.Comment_Score || 0),
      0
    );

    return [
      { name: "Post Upvotes", value: postScoreCount, type: "Post Scores" },
      { name: "Post Comments", value: postCommentsCount, type: "Post Comments" },
      { name: "Comment Upvotes", value: totalCommentScore, type: "Comment Scores" }
    ];
  }, [tweets]);

  const colors = {
    "Post Scores": "#4caf50",     // green
    "Post Comments": "#2196f3",   // blue
    "Comment Scores": "#ff9800"   // orange
  };

  return (
    <div style={{ width: "100%", height: 350, backgroundColor: "#ffffff", padding: "10px", borderRadius: "8px" }}>
      <h3 style={{ textAlign: 'center', marginBottom: '20px', color: '#2c3e50' }}>
        Flagged Content Engagement Metrics
      </h3>
      <ResponsiveContainer>
        <BarChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e0e0e0" />
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#2c3e50', fontSize: 12 }}
            axisLine={{ stroke: '#2c3e50' }}
          />
          <YAxis 
            tick={{ fill: '#2c3e50', fontSize: 12 }}
            axisLine={{ stroke: '#2c3e50' }}
          />
          <Tooltip 
            contentStyle={{
              backgroundColor: '#ffffff',
              border: '1px solid #ccc',
              borderRadius: '4px',
              color: '#2c3e50'
            }}
          />
          <Legend 
            wrapperStyle={{ color: '#2c3e50' }}
          />
          <Bar dataKey="value" name="Value">
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={colors[entry.type]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default Graph2;
