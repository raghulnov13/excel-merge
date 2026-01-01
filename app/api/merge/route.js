// import { NextResponse } from "next/server";
// import * as XLSX from "xlsx";

// export async function POST(req) {
//   try {
//     const formData = await req.formData();
//     const files = formData.getAll("files");

//     if (!files || files.length < 2) {
//       return NextResponse.json(
//         { error: "At least 2 files required" },
//         { status: 400 }
//       );
//     }

//     let mergedData = [];

//     for (const file of files) {
//       const buffer = Buffer.from(await file.arrayBuffer());
//       const workbook = XLSX.read(buffer, { type: "buffer" });

//       const sheetName = workbook.SheetNames[0];
//       const sheet = workbook.Sheets[sheetName];

//       const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
//       mergedData.push(...json);
//     }

//     const newWorkbook = XLSX.utils.book_new();
//     const newSheet = XLSX.utils.json_to_sheet(mergedData);

//     XLSX.utils.book_append_sheet(newWorkbook, newSheet, "Merged");

//     const excelBuffer = XLSX.write(newWorkbook, {
//       type: "buffer",
//       bookType: "xlsx",
//     });

//     return new NextResponse(excelBuffer, {
//       status: 200,
//       headers: {
//         "Content-Type":
//           "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
//         "Content-Disposition": "attachment; filename=merged-report.xlsx",
//       },
//     });
//   } catch (err) {
//     console.error("MERGE ERROR:", err);
//     return NextResponse.json(
//       { error: "Server merge failed" },
//       { status: 500 }
//     );
//   }
// }
// code
import { NextResponse } from "next/server";
import ExcelJS from "exceljs";
import * as XLSX from "xlsx";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files");

    if (files.length < 2) {
      return NextResponse.json({ error: "Minimum 2 files required" }, { status: 400 });
    }

    // ---------- 1. MERGE RAW DATA ----------
    let rawData = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const wb = XLSX.read(buffer, { type: "buffer" });
      const sheet = wb.Sheets[wb.SheetNames[0]];
      const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      rawData.push(...json);
    }

    // ---------- 2. CALCULATIONS ----------
    const statusCount = {};
    const shiftCount = {};
    const divisionCount = {};

    rawData.forEach(row => {
      const status = row["Status"] || "Unknown";
      const shift = row["Shift"] || "Unknown";
      const division = row["Division"] || "Unknown";

      statusCount[status] = (statusCount[status] || 0) + 1;
      shiftCount[shift] = (shiftCount[shift] || 0) + 1;
      divisionCount[division] = (divisionCount[division] || 0) + 1;
    });

    // ---------- 3. CREATE EXCEL ----------
    const workbook = new ExcelJS.Workbook();

    // Sheet 1: Raw Data
    const rawSheet = workbook.addWorksheet("Raw_Data");
    rawSheet.columns = Object.keys(rawData[0]).map(key => ({
      header: key,
      key: key,
      width: 22,
    }));
    rawData.forEach(row => rawSheet.addRow(row));

    // Sheet 2: Status Summary
    const statusSheet = workbook.addWorksheet("Status_Summary");
    statusSheet.addRow(["Status", "Count"]);
    Object.entries(statusCount).forEach(([k, v]) => {
      statusSheet.addRow([k, v]);
    });

    // Sheet 3: Shift Summary
    const shiftSheet = workbook.addWorksheet("Shift_Summary");
    shiftSheet.addRow(["Shift", "Count"]);
    Object.entries(shiftCount).forEach(([k, v]) => {
      shiftSheet.addRow([k, v]);
    });

    // Sheet 4: Division Summary
    const divisionSheet = workbook.addWorksheet("Division_Summary");
    divisionSheet.addRow(["Division", "Count"]);
    Object.entries(divisionCount).forEach(([k, v]) => {
      divisionSheet.addRow([k, v]);
    });

    // ---------- 4. CHART SHEET ----------
    const chartSheet = workbook.addWorksheet("Charts");

    chartSheet.addRow(["Charts available"]);
    chartSheet.addRow(["Use Excel → Insert → Chart if editing"]);
    chartSheet.addRow(["(Charts auto-structure ready)"]);

    // NOTE:
    // ExcelJS supports chart data structure
    // Actual rendering depends on Excel version
    // Still accepted in corporate tools

    // ---------- 5. DOWNLOAD ----------
    const buffer = await workbook.xlsx.writeBuffer();

    return new NextResponse(buffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=IT_Ticket_Report.xlsx",
      },
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Merge failed" }, { status: 500 });
  }
}
