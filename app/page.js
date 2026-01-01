"use client";

import { useState } from "react";
import "./page.css";

export default function Home() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);

    setFiles((prev) => {
      const merged = [...prev, ...newFiles];

      // remove duplicate file names
      return merged.filter(
        (file, index, self) =>
          index === self.findIndex((f) => f.name === file.name)
      );
    });

    e.target.value = null; // allow selecting same file again
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (files.length < 2) {
      alert("Please select at least 2 Excel files");
      return;
    }

    const formData = new FormData();
    files.forEach((file) => formData.append("files", file));

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
        <p>Merge multiple Excel files into one report</p>

        <form onSubmit={handleSubmit}>
          <input
            type="file"
            multiple
            accept=".xlsx,.xls"
            onChange={handleFileChange}
          />

          <div className="file-count">
            Selected Files: {files.length}
          </div>

          <ul className="file-list">
            {files.map((file, index) => (
              <li key={index}>{file.name}</li>
            ))}
          </ul>

          <button type="submit" disabled={loading}>
            {loading ? "Merging..." : "Merge & Download"}
          </button>
        </form>

        <span className="footer-text">Internal Tool – Tata Electronics</span>
      </div>
    </div>
  );
}
