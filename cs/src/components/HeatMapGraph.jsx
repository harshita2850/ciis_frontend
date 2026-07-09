import React, { useEffect, useRef, useState } from "react";
import * as d3 from "d3";

function HeatMapGraph({ tweets }) {
  const svgRef = useRef();
  const [dataMatrix, setDataMatrix] = useState([]);

  useEffect(() => {
    if (!tweets || tweets.length === 0) return;

    // === 1. Helper to bucket by negativity range ===
    const getBin = (score) => {
      if (score <= 0.33) return "0-0.33";
      if (score <= 0.67) return "0.33-0.67";
      return "0.67-1";
    };

    // === 2. Group entities ===
    const processGroup = (items, scoreKey, idKey) => {
      const groups = {};
      items.forEach((tweet) => {
        const id = tweet[idKey];
        if (!id) return;
        if (!groups[id]) {
          groups[id] = { scores: [], count: 0 };
        }
        groups[id].scores.push(tweet[scoreKey] || 0);
        groups[id].count++;
      });

      return Object.values(groups).map((g) => {
        const avg =
          g.scores.reduce((sum, s) => sum + s, 0) / g.scores.length || 0;
        return { avgSentiment: avg, count: g.count };
      });
    };

    const users = processGroup(tweets, "Anti_India_Score", "Comment_Author");
    const comments = processGroup(
      tweets,
      "Comment_Anti_India_Score",
      "Comment_Body"
    );
    const posts = processGroup(tweets, "Post_Anti_India_Score", "Post_Title");

    // === 3. Count distribution in bins ===
    const bins = ["0-0.33", "0.33-0.67", "0.67-1"];
    const entityTypes = ["Users", "Posts", "Comments"];
    const counts = {
      Users: { "0-0.33": 0, "0.33-0.67": 0, "0.67-1": 0 },
      Posts: { "0-0.33": 0, "0.33-0.67": 0, "0.67-1": 0 },
      Comments: { "0-0.33": 0, "0.33-0.67": 0, "0.67-1": 0 },
    };

    users.forEach((u) => counts.Users[getBin(u.avgSentiment)]++);
    posts.forEach((p) => counts.Posts[getBin(p.avgSentiment)]++);
    comments.forEach((c) => counts.Comments[getBin(c.avgSentiment)]++);

    // Convert to matrix for D3
    const matrix = bins.map((bin) =>
      entityTypes.map((entity) => counts[entity][bin])
    );

    setDataMatrix(matrix);
  }, [tweets]);

  // === 4. Render heatmap with D3 ===
  useEffect(() => {
    if (!dataMatrix.length) return;

    const xLabels = ["Users", "Posts", "Comments"];
    const yLabels = ["0-0.33", "0.33-0.67", "0.67-1"];

    const cellSize = 100;
    const margin = { top: 60, right: 40, bottom: 40, left: 100 };
    const width = cellSize * xLabels.length + margin.left + margin.right;
    const height = cellSize * yLabels.length + margin.top + margin.bottom;

    const svg = d3
      .select(svgRef.current)
      .attr("width", width)
      .attr("height", height)
      .style("background", "#f8f9fa")
      .style("border-radius", "8px");

    svg.selectAll("*").remove();

    const maxValue = d3.max(dataMatrix.flat());

    // Better color scale with more contrast
    const colorScale = d3
      .scaleSequential()
      .domain([0, maxValue || 1])
      .interpolator(d3.interpolateBlues);

    // Add title
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", 25)
      .attr("text-anchor", "middle")
      .style("font-size", "16px")
      .style("font-weight", "bold")
      .style("fill", "#2c3e50")
      .text("Anti-India Content Distribution");

    // Cells with better styling
    dataMatrix.forEach((row, rowIndex) => {
      row.forEach((value, colIndex) => {
        const cellX = colIndex * cellSize + margin.left;
        const cellY = rowIndex * cellSize + margin.top;
        
        // Cell background
        svg
          .append("rect")
          .attr("x", cellX)
          .attr("y", cellY)
          .attr("width", cellSize - 2)
          .attr("height", cellSize - 2)
          .attr("fill", colorScale(value))
          .attr("stroke", "#fff")
          .attr("stroke-width", 2)
          .attr("rx", 4)
          .style("cursor", "pointer")
          .on("mouseover", function() {
            d3.select(this)
              .attr("stroke", "#34495e")
              .attr("stroke-width", 3);
          })
          .on("mouseout", function() {
            d3.select(this)
              .attr("stroke", "#fff")
              .attr("stroke-width", 2);
          });

        // Cell values with better contrast
        const textColor = value > maxValue * 0.6 ? "#ffffff" : "#2c3e50";
        
        svg
          .append("text")
          .attr("x", cellX + (cellSize - 2) / 2)
          .attr("y", cellY + (cellSize - 2) / 2)
          .attr("text-anchor", "middle")
          .attr("dominant-baseline", "middle")
          .attr("fill", textColor)
          .style("font-size", "18px")
          .style("font-weight", "bold")
          .style("text-shadow", textColor === "#ffffff" ? "1px 1px 2px rgba(0,0,0,0.3)" : "1px 1px 2px rgba(255,255,255,0.8)")
          .text(value);
      });
    });

    // X labels with better styling
    svg
      .selectAll(".xLabel")
      .data(xLabels)
      .enter()
      .append("text")
      .attr("x", (_, i) => i * cellSize + margin.left + (cellSize - 2) / 2)
      .attr("y", margin.top - 15)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "600")
      .style("fill", "#2c3e50")
      .text((d) => d);

    // Y labels with better styling
    svg
      .selectAll(".yLabel")
      .data(yLabels)
      .enter()
      .append("text")
      .attr("x", margin.left - 15)
      .attr("y", (_, i) => i * cellSize + margin.top + (cellSize - 2) / 2)
      .attr("text-anchor", "end")
      .attr("dominant-baseline", "middle")
      .style("font-size", "14px")
      .style("font-weight", "600")
      .style("fill", "#2c3e50")
      .text((d) => d);

    // Add axis labels
    svg
      .append("text")
      .attr("x", width / 2)
      .attr("y", height - 10)
      .attr("text-anchor", "middle")
      .style("font-size", "14px")
      .style("font-weight", "500")
      .style("fill", "#7f8c8d")
      .text("Entity Types");

    svg
      .append("text")
      .attr("x", 20)
      .attr("y", height / 2)
      .attr("text-anchor", "middle")
      .attr("transform", `rotate(-90, 20, ${height / 2})`)
      .style("font-size", "14px")
      .style("font-weight", "500")
      .style("fill", "#7f8c8d")
      .text("Sentiment Score Range");

  }, [dataMatrix]);

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      padding: '20px',
      backgroundColor: '#ffffff',
      borderRadius: '12px',
      boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
      margin: '10px'
    }}>
      <svg ref={svgRef}></svg>
    </div>
  );
}

export default HeatMapGraph;
