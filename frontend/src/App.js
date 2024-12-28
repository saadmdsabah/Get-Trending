import React, { useState } from "react";
import axios from "axios";

function App() {
  const [loading, setLoading] = useState(false);
  const [topics, setTopics] = useState([]);
  const [ipAddress, setIpAddress] = useState("N/A");

  const fetchTrending = async () => {
    setLoading(true);
    setTopics([]);

    try {
      const response = await axios.get("http://localhost:5000/get_trending");
      if (response.status === 200) {
        const data = response.data;
        const topicsData = Array.isArray(data) ? data : data.topics || [];
        setIpAddress(topicsData[0]?.proxyIP || "N/A");
        setTopics(topicsData);
      }
    } catch (err) {
      alert(`Error: ${err.message}`);
    } finally {
      setLoading(false);
    }
  };

  const currentDate = new Date().toLocaleString();

  return (
    <div
      style={{ fontFamily: "Arial, sans-serif", margin: "20px", color: "#333" }}
    >
      <button
        onClick={fetchTrending}
        style={{
          padding: "10px 20px",
          background: "#007bff",
          color: "white",
          border: "none",
          cursor: "pointer",
          borderRadius: "5px",
        }}
      >
        Click here to run the script.
      </button>

      {loading && (
        <div style={{ fontSize: "1.2em", color: "#555" }}>Loading...</div>
      )}

      {!loading && topics.length > 0 && (
        <div style={{ marginTop: "20px" }}>
          <p>
            These are the most happening topics as of{" "}
            <strong>{currentDate}</strong>:
          </p>
          <ul>
            {topics.slice(0, 5).map((topic, index) => (
              <li key={index}>
                Name of trend{index + 1}:{" "}
                <strong>{topic?.topic || "N/A"}</strong>
              </li>
            ))}
          </ul>
          <p>
            The IP address used for this query was <strong>{ipAddress}</strong>.
          </p>
          <p>Here’s a JSON extract of this record from the MongoDB:</p>
          <pre>{JSON.stringify(topics, null, 2)}</pre>

          <button
            onClick={fetchTrending}
            style={{
              padding: "10px 20px",
              background: "#007bff",
              color: "white",
              border: "none",
              cursor: "pointer",
              borderRadius: "5px",
            }}
          >
            Click here to run the query again.
          </button>
        </div>
      )}
    </div>
  );
}

export default App;
