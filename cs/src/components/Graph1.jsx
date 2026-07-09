import React, { useState, useEffect } from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

function Graph1({ tweets }) {
  const [chartData, setChartData] = useState([]);

  useEffect(() => {
    const calculateHourlyAverages = () => {
      const dayHours = Array(13).fill(0).map(() => ({ total: 0, count: 0 }));
      const nightHours = Array(13).fill(0).map(() => ({ total: 0, count: 0 }));

      tweets.forEach(tweet => {
        const date = new Date(tweet.Post_DateTime);
        const hour = date.getHours();
        const score = parseFloat(tweet.Anti_India_Score) || 0;

        if (hour >= 0 && hour <= 12) {
          dayHours[hour].total += score;
          dayHours[hour].count += 1;
        } else {
          const nightHour = hour - 12;
          if (nightHour >= 1 && nightHour <= 12) {
            nightHours[nightHour].total += score;
            nightHours[nightHour].count += 1;
          }
        }
      });

      const dayAverages = dayHours.map((hour, idx) => ({
        hour: idx,
        score: hour.count > 0 ? hour.total / hour.count : 0
      }));

      const nightAverages = nightHours.map((hour, idx) => ({
        hour: idx,
        score: hour.count > 0 ? hour.total / hour.count : 0
      }));

      return { dayAverages, nightAverages };
    };

    const { dayAverages, nightAverages } = calculateHourlyAverages();

    const mergedData = Array.from({ length: 13 }, (_, i) => ({
      hour: i,
      Day: dayAverages[i]?.score || 0,
      Night: nightAverages[i]?.score || 0
    }));

    setChartData(mergedData);
  }, [tweets]); // runs every time tweets updates

  return (
    <div style={{ width: "100%", height: 350 }}>
      <ResponsiveContainer>
        <LineChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke="#555" />
          <XAxis dataKey="hour" label={{ value: "Hour", position: "insideBottom", dy: 10 }} />
          <YAxis domain={[0, 1]} label={{ value: "Negativity Score", angle: -90, position: "insideLeft" }} />
          <Tooltip
            contentStyle={{ backgroundColor: "#222", borderRadius: "8px", color: "#fff" }}
            labelFormatter={(h) => `Hour: ${h}`}
          />
          <Legend verticalAlign="top" height={36} />
          <Line
            type="monotone"
            dataKey="Day"
            stroke="#4caf50"
            strokeWidth={3}
            activeDot={{ r: 8 }}
            dot={{ r: 4 }}
          />
          <Line
            type="monotone"
            dataKey="Night"
            stroke="#f44336"
            strokeWidth={3}
            activeDot={{ r: 8 }}
            dot={{ r: 4 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default Graph1;
