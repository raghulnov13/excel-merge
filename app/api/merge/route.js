import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function POST(req) {
  try {
    const formData = await req.formData();
    const files = formData.getAll("files");

    if (!files || files.length < 2) {
      return NextResponse.json(
        { error: "At least 2 files required" },
        { status: 400 }
      );
    }

    let mergedData = [];

    for (const file of files) {
      const buffer = Buffer.from(await file.arrayBuffer());
      const workbook = XLSX.read(buffer, { type: "buffer" });

      const sheetName = workbook.SheetNames[0];
      const sheet = workbook.Sheets[sheetName];

      const json = XLSX.utils.sheet_to_json(sheet, { defval: "" });
      mergedData.push(...json);
    }

    const newWorkbook = XLSX.utils.book_new();
    const newSheet = XLSX.utils.json_to_sheet(mergedData);

    XLSX.utils.book_append_sheet(newWorkbook, newSheet, "Merged");

    const excelBuffer = XLSX.write(newWorkbook, {
      type: "buffer",
      bookType: "xlsx",
    });

    return new NextResponse(excelBuffer, {
      status: 200,
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "Content-Disposition": "attachment; filename=merged-report.xlsx",
      },
    });
  } catch (err) {
    console.error("MERGE ERROR:", err);
    return NextResponse.json(
      { error: "Server merge failed" },
      { status: 500 }
    );
  }
}
