"use client";

import { useState } from "react";
import "./page.css";

export default function Home() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (files.length < 2) {
      alert("Please select at least 2 Excel files");
      return;
    }

    const formData = new FormData();
    for (let file of files) {
      formData.append("files", file);
    }

    setLoading(true);

    const res = await fetch("/api/merge", {
      method: "POST",
      body: formData,
    });

    if (!res.ok) {
      alert("Merge failed");
      setLoading(false);
      return;
    }

    const blob = await res.blob();
    const url = window.URL.createObjectURL(blob);

    const a = document.createElement("a");
    a.href = url;
    a.download = "merged-report.xlsx";
    a.click();

    window.URL.revokeObjectURL(url);
    setLoading(false);
  };

  return (
    <div className="container">
      <div className="card">
        <h1>Excel Merge Tool</h1>
        <p>Merge 13 or more Excel files into one report</p>

        <form onSubmit={handleSubmit}>
          <input
            type="file"
            multiple
            accept=".xlsx,.xls"
            onChange={(e) => setFiles(e.target.files)}
          />

          <button type="submit" disabled={loading}>
            {loading ? "Merging..." : "Merge & Download"}
          </button>
        </form>
      </div>
    </div>
  );
}
