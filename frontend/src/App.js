import { useEffect, useState } from "react";

import axios from "axios";

function App() {
  const [file, setFile] = useState(null);

  const [assetId, setAssetId] = useState(null);

  const [progress, setProgress] = useState(0);

  const [assets, setAssets] = useState([]);

  async function loadAssets() {
    const { data } = await axios.get("http://localhost:3000/assets");

    setAssets(data);
  }

  async function upload() {
    const { data } = await axios.post(
      "http://localhost:3000/upload",

      file,

      {
        headers: {
          "Content-Type": "application/octet-stream",
        },
      },
    );

    setAssetId(data.assetId);

    setProgress(0);
  }

  useEffect(() => {
    loadAssets();

    const interval = setInterval(
      async () => {
        await loadAssets();

        if (!assetId) {
          return;
        }

        const { data } = await axios.get(
          `http://localhost:3000/assets/${assetId}`,
        );

        if (data.status === "queued") {
          setProgress(25);
        }

        if (data.status === "processing") {
          setProgress(50);
        }

        if (data.status === "completed") {
          setProgress(100);
        }
      },

      1000,
    );

    return () => {
      clearInterval(interval);
    };
  }, [assetId]);

  return (
    <div
      style={{
        padding: 40,
      }}
    >
      <h1>Creative Platform</h1>

      <input
        type="file"
        onChange={(e) => {
          setFile(e.target.files[0]);
        }}
      />

      <button onClick={upload}>Upload</button>

      <h2>Progress: {progress}%</h2>

      <div
        style={{
          width: 300,

          height: 20,

          border: "1px solid black",
        }}
      >
        <div
          style={{
            width: `${progress}%`,

            height: "100%",
          }}
        />
      </div>

      <h2>Assets</h2>

      {assets.map((asset) => (
        <div key={asset._id}>
          {asset.fileName}

          {" - "}

          {asset.status}
        </div>
      ))}
    </div>
  );
}

export default App;
