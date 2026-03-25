"use client";
import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
import Image from "next/image";

export default function DataAdminPage() {
  // --- [State เดิมของพี่] ---
  const [GetData, setGetData] = React.useState<any[]>([]);
  const [backupData, setBackupData] = React.useState<any[]>([]);
  const [filterData, setFilterData] = React.useState<any[]>([]);
  const [ModelFG, setModelFG] = React.useState(false);
  const [ModelSerie, setModelSerie] = React.useState(false);
  const [ModelName, setModelName] = React.useState(false);
  const [ModelCode, setModelCode] = React.useState(false);
  const [ModelValidity, setModelPriceValidity] = React.useState(false);
  const [selectFG, setSelectFG] = React.useState<string[]>([]);
  const [selectSerie, setSelectSerie] = React.useState<string[]>([]);
  const [selectname, setSelectname] = React.useState<string[]>([]);
  const [selectCode, setSelectCode] = React.useState<string[]>([]);
  const [menuaction, setMenuAction] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [progress, setProgress] = React.useState(0);
  const [currentPage, setCurrentPage] = React.useState(1);
  const rowsPerPage = 20;
  const [priceLoading, setPriceLoading] = React.useState(false);

  const myLoader = ({ src }: { src: string }) => src;

  // --- [Logic เดิม: Fetch & Filter] ---
  useEffect(() => {
    const datafecth = async () => {
      const res = await fetch("http://192.168.10.23:5005/API/Product");
      const data = await res.json();
      setGetData(data);
      setBackupData(data);
    };
    datafecth();
  }, []);

  useEffect(() => {
    Finalfilter();
  }, [selectFG, selectSerie, selectname, selectCode, backupData]);

  const Finalfilter = () => {
    if (
      selectFG.length > 0 ||
      selectSerie.length > 0 ||
      selectname.length > 0 ||
      selectCode.length > 0
    ) {
      const filtered = backupData.filter((item: any) => {
        const fgMatch =
          selectFG.length === 0 || selectFG.includes(item?.Product_FG);
        const serieMatch =
          selectSerie.length === 0 || selectSerie.includes(item?.Product_Serie);
        const nameMatch =
          selectname.length === 0 || selectname.includes(item?.Product_name);
        const codeMatch =
          selectCode.length === 0 || selectCode.includes(item?.Product_Code);
        return fgMatch && serieMatch && nameMatch && codeMatch;
      });
      setGetData(filtered);
    } else {
      setGetData(backupData);
    }
  };

  // --- [Import / Export Logic ของพี่ (ยกมาวางให้ทำงานได้จริง)] ---
  const checkProgress = () => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("http://192.168.10.23:5005/upload-progress");
        const data = await res.json();
        setProgress(data.progress);
        if (data.progress >= 100) {
          clearInterval(interval);
          setLoading(false);
          alert("บันทึกลง SQL Server สำเร็จ!");
        }
      } catch (err) {
        clearInterval(interval);
      }
    }, 1000);
  };

  const importExcel = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx,.xls";
    input.onchange = async (e: any) => {
      const file = e.target.files?.[0];
      if (!file) return;
      setLoading(true);
      setProgress(0);
      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });
        const rows = XLSX.utils.sheet_to_json(
          workbook.Sheets[workbook.SheetNames[5]],
        );
        checkProgress();
        await fetch("http://192.168.10.23:5005/upload-excel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: rows }),
        });
      } catch (error) {
        alert("เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
        setLoading(false);
      }
    };
    input.click();
  };

  const ExportExcel = () => {
    if (!GetData.length) return alert("ไม่มีข้อมูล");
    const ws = XLSX.utils.json_to_sheet(GetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "export.xlsx");
  };

  const API_Test_Price = async () => {
    setPriceLoading(true); // เริ่มหมุน
    try {
      const res = await fetch("http://192.168.10.23:5005/api/updatePrice");
      const data = await res.json();
      setPriceLoading(false); // หยุดหมุน
      alert(`Update Price สำเร็จ: ${data.message}`);
    } catch (err) {
      setPriceLoading(false);
      alert("Update Price ล้มเหลว กรุณาเช็ค API");
    }
  };

  // UI Control
  const FCTFilter = (valuefilter: string) => {
    const unique = Array.from(
      new Set(GetData.map((item: any) => item[valuefilter])),
    ).map((val) => GetData.find((item: any) => item[valuefilter] === val));
    setFilterData(unique);
  };

  const ShowModel = (value: string) => {
    CloseAllModel();
    if (value === "Product_FG") setModelFG(true);
    else if (value === "Product_Serie") setModelSerie(true);
    else if (value === "Product_name") setModelName(true);
    else if (value === "Product_Code") setModelCode(true);
  };

  const CloseAllModel = () => {
    setModelFG(false);
    setModelSerie(false);
    setModelName(false);
    setModelCode(false);
  };

  const totalPages = Math.ceil(GetData.length / rowsPerPage);
  const currentData = GetData.slice(
    (currentPage - 1) * rowsPerPage,
    currentPage * rowsPerPage,
  );

  return (
    <div
      className="min-h-screen bg-gray-100 p-4 font-sans text-sm"
      onClick={CloseAllModel}
    >
      {/* Loading Overlay */}
      {priceLoading && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-md z-[1000] flex items-center justify-center">
          <div className="bg-white p-10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 flex flex-col items-center">
            {/* Custom Spinner สวยๆ */}
            <div className="relative w-16 h-16 mb-4">
              <div className="absolute inset-0 border-4 border-blue-100 rounded-full"></div>
              <div className="absolute inset-0 border-4 border-blue-600 rounded-full border-t-transparent animate-spin"></div>
            </div>
            <h3 className="text-gray-800 font-bold text-lg animate-pulse">
              กำลังคำนวณราคาสินค้า...
            </h3>
            <p className="text-gray-400 text-xs mt-2 uppercase tracking-widest">
              System Processing
            </p>
          </div>
        </div>
      )}
      {loading && (
        <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center w-full max-w-sm">
            <h3 className="font-bold text-lg mb-4">กำลัง Import Excel...</h3>
            <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden mb-2">
              <div
                className="bg-blue-600 h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="text-blue-600 font-bold">{progress}%</div>
          </div>
        </div>
      )}

      {/* Main Header */}
      <div className="bg-white rounded-t-xl shadow-sm p-4 border-b flex justify-between items-center sticky top-0 z-40">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold text-gray-800 uppercase tracking-tight">
            Data Management
          </h1>
          <span className="bg-blue-100 text-blue-600 text-[10px] px-2 py-0.5 rounded-full font-bold">
            {GetData.length} ROWS
          </span>
        </div>
        <div className="flex gap-2">
          <button
            className="bg-white border text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-all font-medium"
            onClick={(e) => {
              e.stopPropagation();
              setMenuAction(!menuaction);
            }}
          >
            Filter Group
          </button>
          <button
            className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all font-bold cursor-pointer"
            onClick={importExcel}
          >
            Import
          </button>
          <button
            className="bg-emerald-500 text-white px-5 py-2 rounded-lg shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all font-bold cursor-pointer"
            onClick={ExportExcel}
          >
            Export
          </button>
          <button
            className="bg-orange-500 text-white px-5 py-2 rounded-lg shadow-lg shadow-orange-100 hover:bg-orange-600 transition-all font-bold cursor-pointer"
            onClick={API_Test_Price}
          >
            Manual Update Price
          </button>
        </div>
      </div>

      {/* Side Menu (Header Filter) */}
      {menuaction && (
        <div
          className="fixed right-0 top-0 h-full w-72 bg-white shadow-2xl z-[100] p-6 border-l animate-in slide-in-from-right duration-300"
          onClick={(e) => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-6">
            <h2 className="font-bold text-lg">เลือกกลุ่มสินค้า</h2>
            <button
              onClick={() => setMenuAction(false)}
              className="text-2xl hover:text-red-500"
            >
              &times;
            </button>
          </div>
          <div className="space-y-1 overflow-y-auto h-[65vh] pr-2">
            {Array.from(new Set(backupData.map((i) => i.Product_Header))).map(
              (header: any, idx) => (
                <label
                  key={idx}
                  className="flex items-center gap-3 p-3 hover:bg-blue-50 rounded-xl cursor-pointer group transition-colors"
                >
                  <input
                    type="radio"
                    name="Header"
                    className="w-4 h-4 text-blue-600"
                    onChange={() => {
                      const response = backupData.filter(
                        (item: any) => item.Product_Header === header,
                      );
                      setGetData(response);
                      setCurrentPage(1);
                    }}
                  />
                  <span className="text-gray-600 group-hover:text-blue-700 font-medium">
                    {header}
                  </span>
                </label>
              ),
            )}
          </div>
        </div>
      )}

      {/* Table Data */}
      <div className="bg-white shadow-sm overflow-hidden border-x border-b rounded-b-xl">
        <table className="w-full text-left border-collapse min-w-[1000px] overflow-DataAdmin">
          <thead>
            <tr className="bg-gray-50/80 border-b text-gray-500 uppercase text-[10px] font-black tracking-widest">
              <th className="p-4 text-center w-20">No.</th>
              {[
                "Product_FG",
                "Product_Serie",
                "Product_name",
                "Product_Code",
              ].map((key) => (
                <th key={key} className="p-4 relative">
                  <div
                    className="flex items-center gap-2 cursor-pointer hover:text-blue-600 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      FCTFilter(key);
                      ShowModel(key);
                    }}
                  >
                    {key.replace("Product_", "")}{" "}
                    <span className="opacity-30">▼</span>
                  </div>
                  {/* Dropdown กรองข้อมูล (Logic เดิมพี่เป๊ะ) */}
                  {((key === "Product_FG" && ModelFG) ||
                    (key === "Product_Serie" && ModelSerie) ||
                    (key === "Product_name" && ModelName) ||
                    (key === "Product_Code" && ModelCode)) && (
                    <div
                      className="absolute top-full left-0 mt-1 w-64 bg-white shadow-2xl border rounded-xl z-50 p-4 normal-case font-normal animate-in fade-in zoom-in-95 duration-100"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <div className="max-h-60 overflow-y-auto space-y-1 custom-scrollbar">
                        {filterData.map((item, i) => (
                          <label
                            key={i}
                            className="flex items-center gap-3 hover:bg-gray-50 p-2 rounded-lg cursor-pointer"
                          >
                            <input
                              type="checkbox"
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                              checked={
                                key === "Product_FG"
                                  ? selectFG.includes(item[key])
                                  : key === "Product_Serie"
                                    ? selectSerie.includes(item[key])
                                    : key === "Product_name"
                                      ? selectname.includes(item[key])
                                      : selectCode.includes(item[key])
                              }
                              onChange={() => {
                                const val = item[key];
                                if (key === "Product_FG")
                                  setSelectFG((prev) =>
                                    prev.includes(val)
                                      ? prev.filter((x) => x !== val)
                                      : [...prev, val],
                                  );
                                if (key === "Product_Serie")
                                  setSelectSerie((prev) =>
                                    prev.includes(val)
                                      ? prev.filter((x) => x !== val)
                                      : [...prev, val],
                                  );
                                if (key === "Product_name")
                                  setSelectname((prev) =>
                                    prev.includes(val)
                                      ? prev.filter((x) => x !== val)
                                      : [...prev, val],
                                  );
                                if (key === "Product_Code")
                                  setSelectCode((prev) =>
                                    prev.includes(val)
                                      ? prev.filter((x) => x !== val)
                                      : [...prev, val],
                                  );
                              }}
                            />
                            <span className="text-xs text-gray-700">
                              {item[key]}
                            </span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}
                </th>
              ))}
              <th className="p-4 text-right">Price</th>
              <th className="p-4 text-center">Preview</th>
              <th className="p-4 text-center">Files</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {currentData.map((item, index) => (
              <tr
                key={index}
                className="hover:bg-blue-50/30 transition-colors group"
              >
                <td className="p-4 text-center text-gray-400 font-mono text-xs">
                  {(currentPage - 1) * rowsPerPage + index + 1}
                </td>
                <td className="p-4 text-gray-600 font-medium">
                  {item.Product_FG}
                </td>
                <td className="p-4 text-gray-500 italic text-xs">
                  {item.Product_Serie}
                </td>
                <td className="p-4 font-bold text-gray-800">
                  {item.Product_name}
                </td>
                <td className="p-4">
                  <span className="bg-gray-100 px-2 py-1 rounded text-[10px] font-mono text-gray-500">
                    {item.Product_Code}
                  </span>
                </td>
                <td className="p-4 text-right font-black text-blue-600">
                  {item.Product_price?.toLocaleString()}
                </td>
                <td className="p-4">
                  <div className="w-12 h-12 mx-auto relative border rounded-lg overflow-hidden bg-white group-hover:scale-125 transition-transform duration-200">
                    <Image
                      loader={myLoader}
                      src={`http://192.168.10.23:5005/api/get_image_by_pattern?path=${encodeURIComponent(item.Product_Path_img || "")}&pattern=${encodeURIComponent(item.Product_name?.split("|")[0])}`}
                      fill
                      alt="p"
                      className="object-contain p-1"
                    />
                  </div>
                </td>
                <td className="p-4 text-center">
                  <span
                    className={`inline-block w-2 h-2 rounded-full ${item.Product_Path_img ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-rose-500"}`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="mt-6 flex justify-center items-center gap-2">
        <button
          className="p-2 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-30"
          onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
          disabled={currentPage === 1}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div className="flex gap-1">
          {[...Array(totalPages)]
            .slice(
              Math.max(0, currentPage - 3),
              Math.min(totalPages, currentPage + 2),
            )
            .map((_, i) => {
              const p = i + Math.max(1, currentPage - 2);
              return (
                <button
                  key={i}
                  onClick={() => setCurrentPage(p)}
                  className={`w-10 h-10 rounded-lg border font-bold transition-all ${currentPage === p ? "bg-blue-600 text-white border-blue-600 shadow-lg shadow-blue-100" : "bg-white hover:border-blue-500 text-gray-600"}`}
                >
                  {p}
                </button>
              );
            })}
        </div>
        <button
          className="p-2 bg-white border rounded-lg hover:bg-gray-50 disabled:opacity-30"
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
          disabled={currentPage === totalPages}
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 5l7 7-7 7"
            />
          </svg>
        </button>
      </div>
    </div>
  );
}
