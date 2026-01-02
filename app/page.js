"use client";

import { useRef, useState } from "react";
import "./page.css";

export default function Home() {
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const fileInputRef = useRef(null);

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

    // allow selecting same file again
    e.target.value = null;
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

    try {
      const res = await fetch("/api/merge", {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        alert("Merge failed");
        return;
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const a = document.createElement("a");
      a.href = url;
      a.download = "merged-report.xlsx";
      a.click();

      window.URL.revokeObjectURL(url);

      // ✅ CLEAR AFTER SUCCESS
      setFiles([]);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch (err) {
      alert("Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container">
      <div className="card">
        <h1>Excel Merge Tool</h1>
        <p>Merge multiple Excel files into one report</p>

        <form onSubmit={handleSubmit}>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept=".xlsx,.xls"
            onChange={handleFileChange}
          />

          {files.length > 0 && (
            <>
              <div className="file-count">
                Selected Files: {files.length}
              </div>

              <ul className="file-list">
                {files.map((file, index) => (
                  <li key={index}>{file.name}</li>
                ))}
              </ul>
            </>
          )}

          <button type="submit" disabled={loading}>
            {loading ? "Merging..." : "Merge & Download"}
          </button>
        </form>

        <span className="footer-text">
          Internal Tool – Tata Electronics
        </span>
      </div>
    </div>
  );
}
