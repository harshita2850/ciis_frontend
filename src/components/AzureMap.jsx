import React, { useEffect, useRef, useState } from "react";
import * as atlas from "azure-maps-control";
import MapboxDraw from "@mapbox/mapbox-gl-draw";
import * as turf from "@turf/turf";
import { 
  Square, 
  MapPin, 
  Minus, 
  Trash2, 
  Search,
  ChevronDown,
  ChevronUp
} from "lucide-react";
import './AzureMap.css'
import "azure-maps-control/dist/atlas.min.css";
import "@mapbox/mapbox-gl-draw/dist/mapbox-gl-draw.css";
const key = process.env.REACT_APP_AZURE_MAPS_KEY;
export default function AzureMap({area, setArea, data, setData}) {
  const mapRef = useRef(null);
  const drawRef = useRef(null);
  const mapInstanceRef = useRef(null);
  const [searchText, setSearchText] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [isInfoExpanded, setIsInfoExpanded] = useState(true);
  const subscriptionKey = key;

  useEffect(() => {
    console.log(area);
  }, [area]);
   
  useEffect(() => {
    navigator.geolocation.getCurrentPosition(
      (position) => {
        const userCoords = [
          position.coords.longitude,
          position.coords.latitude,
        ];
        initializeMap(userCoords);
      },
      (error) => {
        console.warn("Geolocation failed, using default location.", error);
        const defaultCoords = [77.5946, 12.9716];
        initializeMap(defaultCoords);
      }
    );

    function initializeMap(centerCoords) {
      const map = new atlas.Map(mapRef.current, {
        center: centerCoords,
        zoom: 19,
        view: "Auto",
        style: "satellite",
        authOptions: {
          authType: "subscriptionKey",
          subscriptionKey: subscriptionKey,
        },
      });

      mapInstanceRef.current = map;

      map.events.add("ready", () => {
        const maplibreMap = map.map;

        const draw = new MapboxDraw({
          displayControlsDefault: false,
          controls: {},
        });
        drawRef.current = draw;
        maplibreMap.addControl(draw);

        function updateInfo() {
          const temp = draw.getAll();
          setData(temp);
          const areaBox = document.getElementById("area-box");
          const coordsBox = document.getElementById("coords-box");

          if (temp.features.length > 0) {
            const polygons = temp.features.filter(
              (f) => f.geometry.type === "Polygon"
            );
            if (polygons.length > 0) {
              const areatemp = turf.area({
                type: "FeatureCollection",
                features: polygons,
              });
              setArea(areatemp);
              const rounded = Math.round(areatemp * 100) / 100;
              if (areaBox) areaBox.textContent = `${rounded} m²`;
            } else {
              if (areaBox) areaBox.textContent = "—";
            }

            if (coordsBox) coordsBox.textContent = JSON.stringify(temp, null, 2);
          } else {
            if (areaBox) areaBox.textContent = "";
            if (coordsBox) coordsBox.textContent = "";
          }
        }

        maplibreMap.on("draw.create", updateInfo);
        maplibreMap.on("draw.update", updateInfo);
        maplibreMap.on("draw.delete", updateInfo);

        // Set up button handlers
        const setupButton = (id, mode) => {
          const btn = document.getElementById(id);
          if (btn) {
            btn.onclick = () => draw.changeMode(mode);
          }
        };

        setupButton("btn-polygon", "draw_polygon");
        setupButton("btn-point", "draw_point");
        setupButton("btn-line", "draw_line_string");
        
        const deleteBtn = document.getElementById("btn-delete");
        if (deleteBtn) {
          deleteBtn.onclick = () => {
            draw.trash();
            const areaBox = document.getElementById("area-box");
            const coordsBox = document.getElementById("coords-box");
            if (areaBox) areaBox.textContent = "";
            if (coordsBox) coordsBox.textContent = "";
          };
        }
      });
    }

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.dispose();
      }
    };
  }, [setArea, setData]);
    
  const fetchSuggestions = async (query) => {
    const url = `https://atlas.microsoft.com/search/address/json?api-version=1.0&subscription-key=${subscriptionKey}&query=${encodeURIComponent(
      query
    )}`;

    try {
      const response = await fetch(url);
      const result = await response.json();
      if (result && result.results) {
        setSuggestions(result.results);
      }
    } catch (error) {
      console.error("Error fetching suggestions:", error);
      setSuggestions([]);
    }
  };

  const handleSearchChange = (e) => {
    const value = e.target.value;
    setSearchText(value);

    if (value.length > 2) {
      fetchSuggestions(value);
    } else {
      setSuggestions([]);
    }
  };

  const handleSuggestionClick = (position) => {
    if (mapInstanceRef.current) {
      mapInstanceRef.current.setCamera({
        center: [position.lon, position.lat],
        zoom: 15,
      });
    }
    setSearchText("");
    setSuggestions([]);
  };

  return (
    <div className="map-container">
      {/* Floating Drawing Tools */}
      <div className="floating-controls">
        <button
          id="btn-polygon"
          className="control-btn"
          title="Draw Polygon"
        >
          <Square size={18} />
        </button>
        <button 
          id="btn-line" 
          className="control-btn"
          title="Draw Line"
        >
          <Minus size={18} />
        </button>
        <button 
          id="btn-point" 
          className="control-btn"
          title="Draw Point"
        >
          <MapPin size={18} />
        </button>
        <button 
          id="btn-delete" 
          className="control-btn delete-btn"
          title="Delete All"
        >
          <Trash2 size={18} />
        </button>
      </div>

      {/* Search Bar - Top Right */}
      <div className="search-container">
        <div className="search-input-wrapper">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            value={searchText}
            onChange={handleSearchChange}
            placeholder="Search for a location..."
            className="search-input"
          />
        </div>

        {suggestions.length > 0 && (
          <div className="suggestions-dropdown">
            {suggestions.map((item, index) => (
              <div
                key={`${item.id}-${index}`}
                className="suggestion-item"
                onClick={() => handleSuggestionClick(item.position)}
              >
                {item.address.freeformAddress}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Info Panel - Bottom Left */}
      <div className="info-panel">
        <button 
          className="info-toggle"
          onClick={() => setIsInfoExpanded(!isInfoExpanded)}
        >
          <span>Map Info</span>
          {isInfoExpanded ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </button>
        
        {isInfoExpanded && (
          <div className="info-content">
            <div className="info-section">
              <span className="info-label">Area:</span>
              <span id="area-box" className="info-value">—</span>
            </div>
            
            <div className="info-section">
              <span className="info-label">Coordinates:</span>
              <pre
                id="coords-box"
                className="coords-display"
              />
            </div>
          </div>
        )}
      </div>

      {/* Map Container */}
      <div ref={mapRef} className="map" />
    </div>
  );
}