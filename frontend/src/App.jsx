// src/App.jsx

import axios from "axios";
import React, { useState, useEffect } from "react";
import { MapContainer, TileLayer, CircleMarker, Popup } from "react-leaflet";
import "leaflet/dist/leaflet.css";

// Map severity levels to colors
const severityColors = {
  1: "#2ca02c", // low severity: green
  2: "#98df8a",
  3: "#ff7f0e", // medium: orange
  4: "#d62728",
  5: "#9467bd", // high: purple
};

// Derive severity: use existing or fallback to confidence-based
function getSeverity(fire) {
  if (fire.severity != null) {
    return fire.severity;
  }
  const conf = parseFloat(fire.confidence);
  if (isNaN(conf)) {
    return null;
  }
  // Map confidence 0–100 to severity 1–5
  const sev = Math.ceil((conf / 100) * 5);
  return Math.min(5, Math.max(1, sev));
}

export default function App() {
  const [fires, setFires] = useState([]);
  const [shelters, setShelters] = useState([]);
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);

  async function fetchFires(q = "") {
    setLoading(true);
    try {
      const { data } = await axios.post("http://localhost:4000/api/search", {
        index: "fires",
        query: q,
        params: { hitsPerPage: 500 },
      });
      setFires(data.hits);
    } catch {
      setFires([]);
    } finally {
      setLoading(false);
    }
  }

  async function fetchShelters() {
    setLoading(true);
    try {
      const { data } = await axios.post("http://localhost:4000/api/search", {
        index: "shelters",
        query: "",
        params: { hitsPerPage: 500 },
      });
      setShelters(data.hits);
    } catch {
      setShelters([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchFires();
    fetchShelters();
  }, []);

  return (
    <div style={{ position: "relative", height: "100vh", width: "100vw" }}>
      {/* Search bar */}
      <div
        style={{
          position: "absolute",
          top: 12,
          right: 12,
          zIndex: 1000,
          background: "rgba(255,255,255,0.9)",
          padding: 8,
          borderRadius: 4,
          boxShadow: "0 1px 4px rgba(0,0,0,0.3)",
          display: "flex",
          gap: 8,
          alignItems: "center",
        }}>
        <input
          type="text"
          placeholder="Filter fires (date or confidence)"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && fetchFires(query)}
          style={{
            width: 200,
            padding: "4px 6px",
            border: "1px solid #ccc",
            borderRadius: 4,
          }}
        />
        <button
          onClick={() => fetchFires(query)}
          style={{
            padding: "6px 12px",
            background: "#1E40AF",
            color: "#fff",
            border: "none",
            borderRadius: 4,
            cursor: "pointer",
          }}>
          Search Fires
        </button>
        {loading && <span style={{ fontSize: 12 }}>Loading…</span>}
      </div>

      {/* Map */}
      <MapContainer
        center={[20, 0]}
        zoom={2}
        style={{ height: "100%", width: "100%" }}>
        <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png" />

        {/* Fires: colored by severity and show summary */}
        {fires.map((f) => {
          const sev = getSeverity(f);
          return (
            <CircleMarker
              key={f.objectID}
              center={[f.latitude, f.longitude]}
              pathOptions={{
                color: severityColors[sev] || "red",
                fillColor: severityColors[sev] || "red",
                fillOpacity: 0.6,
              }}
              radius={6}>
              <Popup>
                <strong>Severity:</strong> {sev != null ? sev : "N/A"}
                <br />
                <strong>Date:</strong> {f.date || "n/a"}
                <br />
                <strong>Confidence:</strong> {f.confidence}
                <br />
                {f.summary && (
                  <>
                    <strong>Summary:</strong> {f.summary}
                  </>
                )}
              </Popup>
            </CircleMarker>
          );
        })}

        {/* Shelters: unchanged blue circles */}
        {shelters.map((s) => (
          <CircleMarker
            key={s.objectID}
            center={[s.latitude, s.longitude]}
            pathOptions={{ color: "blue", fillColor: "blue", fillOpacity: 0.6 }}
            radius={6}>
            <Popup>
              <strong>{s.name}</strong>
              <br />
              {s.address}, {s.city}, {s.state} {s.zip}
              <br />
              <strong>Capacity:</strong> {s.capacity || "N/A"}
              <br />
              {s.capacityRisk != null && (
                <span>
                  <strong>Capacity Risk:</strong>{" "}
                  {s.capacityRisk ? "High" : "Low"}
                </span>
              )}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  );
}
