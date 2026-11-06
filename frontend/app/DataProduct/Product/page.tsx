"use client";
import React, { useEffect, useState } from "react";
import * as XLSX from "xlsx";
// @ts-expect-error CSS side-effect imports are handled by Next.js.
import "./product.css";

export default function page({ ParamSelect }: { ParamSelect: string }) {
  const [dataProduct, setDataProduct] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [loadingimport, setLoadingImport] = useState<boolean>(false);
  const [loadingexport, setLoadingExport] = useState<boolean>(false);

  const [progress, setProgress] = React.useState(0);
  const [priceLoading, setPriceLoading] = React.useState(false);
  const [searchTerm, setSearchTerm] = useState<string>("");

  // 👉 State สำหรับเปิด-ปิด Modal ดูข้อมูลใน Serie
  const [selectedSeries, setSelectedSeries] = useState<string | null>(null);
  const [isSeriesModalOpen, setIsSeriesModalOpen] = useState<boolean>(false);

  const [currentPage, setCurrentPage] = useState<number>(1);
  const rowsPerPage = 30;

  const [pageGroupIndex, setPageGroupIndex] = useState<number>(0);
  const pagesPerGroup = 10;

  const fetchProducts = async () => {
    if (ParamSelect === "") return;
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:5005/API/Full_Product`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ParamSelect }),
      });
      const result = await response.json();
      setDataProduct(result);
      setCurrentPage(1);
      setPageGroupIndex(0);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  // 1. กรองข้อมูลตามคำค้นหา
  const filteredProducts = dataProduct.filter((item) => {
    const search = searchTerm.toLowerCase();
    return (
      item.Product_name?.toLowerCase().includes(search) ||
      item.Product_FG?.toLowerCase().includes(search) ||
      item.Product_Serie?.toLowerCase().includes(search) ||
      item.Product_price?.toString().includes(search) ||
      item.Price_Validity?.toLowerCase().includes(search) ||
      item.Product_Path_img?.toLowerCase().includes(search) ||
      item.Catalog?.toString().includes(search) ||
      item.Meterial?.toString().includes(search) ||
      item.Drawing?.toString().includes(search) ||
      item.Reference?.toString().includes(search) ||
      item.Spec?.toString().includes(search) ||
      item.Seller?.toString().includes(search)
    );
  });

  // 2. จัดกลุ่มข้อมูลตาม Product_Serie (เอาไว้ดึงดูใน Modal)
  const groupedBySeries = filteredProducts.reduce((acc: any, item: any) => {
    const serie = item.Product_Serie || "Unspecified Series";
    if (!acc[serie]) {
      acc[serie] = [];
    }
    acc[serie].push(item);
    return acc;
  }, {});

  const selectedSeriesProducts = selectedSeries
    ? groupedBySeries[selectedSeries] || []
    : [];
  const seriesFileSummary = selectedSeriesProducts.reduce(
    (summary, item: any) => ({
      Catalog: summary.Catalog || Boolean(item.Catalog),
      Meterial: summary.Meterial || Boolean(item.Meterial),
      Drawing: summary.Drawing || Boolean(item.Drawing),
      Spec: summary.Spec || Boolean(item.Spec),
      Seller: summary.Seller || Boolean(item.Seller),
      Reference: summary.Reference + (Number(item.Reference) || 0),
    }),
    {
      Catalog: false,
      Meterial: false,
      Drawing: false,
      Spec: false,
      Seller: false,
      Reference: 0,
    },
  );

  // 3. 👉 คัดเฉพาะตัวแทนของแต่ละ Serie ให้ไม่ซ้ำกัน (Distinct Product_Serie) สำหรับแสดงในตารางหลัก
  const uniqueSeriesRows = Object.keys(groupedBySeries).map((serieName) => {
    return {
      serieName,
      totalItems: groupedBySeries[serieName].length,
      sampleItem: groupedBySeries[serieName][0], // เอาข้อมูลตัวแรกมาโชว์ตัวอย่าง
    };
  });

  useEffect(() => {
    setCurrentPage(1);
    setPageGroupIndex(0);
  }, [searchTerm]);

  useEffect(() => {
    fetchProducts();
  }, [ParamSelect]);

  // 👉 คำนวณการแบ่งหน้าจาก uniqueSeriesRows แทน
  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;
  const currentRows = uniqueSeriesRows.slice(indexOfFirstRow, indexOfLastRow);

  const totalPages = Math.ceil(uniqueSeriesRows.length / rowsPerPage);

  const startPage = pageGroupIndex * pagesPerGroup + 1;
  const endPage = Math.min(startPage + pagesPerGroup - 1, totalPages);

  const pageNumbers = [];
  for (let i = startPage; i <= endPage; i++) {
    pageNumbers.push(i);
  }

  const handleNextGroup = () => {
    if ((pageGroupIndex + 1) * pagesPerGroup < totalPages) {
      setPageGroupIndex((prev) => prev + 1);
    }
  };

  const handlePrevGroup = () => {
    if (pageGroupIndex > 0) {
      setPageGroupIndex((prev) => prev - 1);
    }
  };

  const checkProgress = () => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("http://localhost:5005/upload-progress");
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
      setLoadingImport(true);
      setProgress(0);
      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });
        const rows = XLSX.utils.sheet_to_json(
          workbook.Sheets[workbook.SheetNames[0]],
        );

        checkProgress();
        await fetch("http://localhost:5005/upload-excel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: rows }),
        });
      } catch (error) {
        alert("เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
        setLoadingImport(false);
      }
    };
    input.click();

    const res = await fetch("http://localhost:5005/API/Full_Product");
    const data = await res.json();
    setDataProduct(data);
  };

  const ExportExcel = async () => {
    setLoadingExport(true);
    setProgress(10);
    const res = await fetch("http://localhost:5005/API/All_Product");
    const data = await res.json();

    setProgress(40);

    if (!data.length) return alert("ไม่มีข้อมูล");
    setProgress(80);
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    setProgress(100);
    XLSX.writeFile(wb, "export.xlsx");
    setLoadingExport(false);
  };

  const API_Test_Price = async () => {
    setPriceLoading(true);
    try {
      const res = await fetch("http://localhost:5005/api/updatePrice");
      const data = await res.json();
      setPriceLoading(false);
      alert(`Update Price สำเร็จ: ${data.message}`);
    } catch (err) {
      setPriceLoading(false);
      alert("Update Price ล้มเหลว กรุณาเช็ค API");
    }
  };

  return (
    <>
      {loadingexport && (
        <div className="fixed inset-0 bg-black/50 z-[999] flex items-center justify-center p-4">
          <div className="bg-white p-8 rounded-2xl shadow-2xl text-center w-full max-w-sm">
            <h3 className="font-bold text-lg mb-4">กำลัง Export Excel...</h3>
            <div className="w-full bg-gray-200 h-3 rounded-full overflow-hidden mb-2">
              <div
                className="bg-blue-600 h-full transition-all duration-300"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>
      )}
      {priceLoading && (
        <div className="fixed inset-0 bg-white/30 backdrop-blur-md z-[1000] flex items-center justify-center">
          <div className="bg-white p-10 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.1)] border border-gray-100 flex flex-col items-center">
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

      {loadingimport && (
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

      {/* 👉 Modal เปิดแสดงรายการสินค้าทั้งหมดภายใต้ Serie ที่กดเลือก */}
      {isSeriesModalOpen && selectedSeries && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-5xl max-h-[90vh] flex flex-col overflow-hidden">
            <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-gray-50">
              <div>
                <h3 className="font-bold text-lg text-gray-800">
                  รายการสินค้าใน Serie:{" "}
                  <span className="text-indigo-600">{selectedSeries}</span>
                </h3>
                <p className="text-xs text-gray-500 mt-0.5">
                  พบข้อมูลทั้งหมด {groupedBySeries[selectedSeries]?.length || 0}{" "}
                  รายการ
                </p>
              </div>
              <div>
                <button
                  onClick={() => setIsSeriesModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 text-2xl font-bold px-3 py-1 rounded-lg hover:bg-gray-200 transition-all cursor-pointer"
                >
                  &times;
                </button>
              </div>
            </div>

            <div className="p-6 overflow-y-auto flex-1">
              <table className="w-full border-collapse text-center text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-600 uppercase text-xs bg-gray-50">
                    <th className="py-3 px-4">No.</th>
                    <th className="py-3 px-4">FG</th>
                    <th className="py-3 px-4 text-left">Name</th>
                    <th className="py-3 px-4 text-right">Price</th>
                    <th className="py-3 px-4">Price_Validity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {groupedBySeries[selectedSeries]?.map(
                    (item: any, idx: number) => (
                      <tr key={idx} className="hover:bg-gray-50">
                        <td className="py-2.5 px-4 font-medium text-gray-900">
                          {idx + 1}
                        </td>
                        <td className="py-2.5 px-4">{item.Product_FG}</td>
                        <td className="py-2.5 px-4 text-left font-medium text-gray-800">
                          {item.Product_name}
                        </td>
                        <td className="py-2.5 px-4 text-right font-semibold text-gray-900">
                          {item.Price_Validity >= new Date().toISOString() ? (
                            <div className="text-green-500">
                              {item.Product_price?.toLocaleString()}
                            </div>
                          ) : (
                            <div className="text-red-500">
                              {item.Product_price?.toLocaleString()}
                            </div>
                          )}
                        </td>
                        <td className="py-2.5 px-4">
                          {item.Price_Validity?.split("T")[0] || "-"}
                        </td>
                      </tr>
                    ),
                  )}
                </tbody>
              </table>
              <table className="w-full border-collapse text-center text-sm">
                <thead>
                  <tr className="border-b border-gray-200 text-gray-600 uppercase text-xs bg-gray-50">
                    <th className="py-3.5 px-4 font-semibold">Catalog</th>
                    <th className="py-3.5 px-4 font-semibold">Meterial</th>
                    <th className="py-3.5 px-4 font-semibold">Drawing</th>
                    <th className="py-3.5 px-4 font-semibold">Spec</th>
                    <th className="py-3.5 px-4 font-semibold">Seller</th>
                    <th className="py-3.5 px-4 font-semibold">Reference</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {selectedSeriesProducts.length > 0 && (
                    <tr className="hover:bg-gray-50">
                      {(
                        [
                          "Catalog",
                          "Meterial",
                          "Drawing",
                          "Spec",
                          "Seller",
                        ] as const
                      ).map((fileType) => (
                        <td key={fileType} className="py-2.5 px-3">
                          <span
                            className={`inline-block w-3.5 h-3.5 rounded-full shadow-sm ${seriesFileSummary[fileType] ? "bg-emerald-500" : "bg-rose-500"}`}
                            title={
                              seriesFileSummary[fileType]
                                ? `มีไฟล์ ${fileType} ใน Serie`
                                : `ไม่มีไฟล์ ${fileType} ใน Serie`
                            }
                          ></span>
                        </td>
                      ))}
                      <td className="py-2.5 px-4">
                        {seriesFileSummary.Reference || "-"}
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="p-4 border-t border-gray-100 bg-gray-50 flex justify-end">
              <button
                onClick={() => setIsSeriesModalOpen(false)}
                className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl font-medium text-sm transition-all cursor-pointer"
              >
                ปิดหน้าต่าง
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="p-5 font-sans">
        <div className="flex justify-between items-center mb-4 gap-4">
          <div className="text-xl font-semibold text-gray-800">
            {ParamSelect === "__ALL_PRODUCTS__" ? "ดูทั้งหมด" : ParamSelect}
          </div>

          <div className="flex gap-2">
            <div>
              <input
                type="text"
                placeholder="Search products..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="border border-gray-300 rounded-lg py-2 px-4 focus:outline-none focus:ring-2 focus:ring-blue-500 w-full md:w-64 transition-all"
              />
            </div>
            <button
              className="bg-blue-600 text-white px-5 py-2 rounded-lg shadow-lg shadow-blue-200 hover:bg-blue-700 transition-all font-bold cursor-pointer"
              onClick={importExcel}
            >
              Import
            </button>
            <button
              className="bg-emerald-500 text-white px-5 py-2 rounded-lg shadow-lg shadow-emerald-100 hover:bg-emerald-600 transition-all font-bold cursor-pointer"
              onClick={() => {
                ExportExcel();
              }}
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

        {/* 👉 ตารางหลักที่จะโชว์ Product Serie แบบไม่ซ้ำกันขึ้นมาแถวเดียว */}
        <div className="overflow-DataAdmin shadow-md rounded-xl border border-gray-200 bg-white">
          <table className="w-full border-collapse">
            <thead className="text-center sticky top-0 bg-gray-50 text-gray-700 uppercase text-xs tracking-wider border-b border-gray-200 z-10">
              <tr>
                <th className="py-3 px-4">No.</th>
                <th className="py-3 px-4">Product Serie</th>
                <th className="py-3 px-4">จำนวนรายการ</th>
                <th className="py-3 px-4">FG (ตัวอย่าง)</th>
                <th className="py-3 px-4">Name (ตัวอย่าง)</th>
                <th className="py-3 px-4">Price (ตัวอย่าง)</th>
                <th className="py-3 px-4">วันที่หมดอายุ (ตัวอย่าง)</th>
                <th className="py-3 px-4"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-sm text-gray-600 text-center">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                      <p className="text-gray-500 font-medium text-sm animate-pulse">
                        กำลังโหลดข้อมูล กรุณารอสักครู่...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : currentRows.length > 0 ? (
                currentRows.map((row: any, index: number) => {
                  const item = row.sampleItem;
                  return (
                    <tr
                      key={row.serieName}
                      className="hover:bg-indigo-50/50 transition-colors cursor-pointer text-center"
                      onClick={() => {
                        setSelectedSeries(row.serieName);
                        setIsSeriesModalOpen(true);
                      }}
                    >
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {indexOfFirstRow + index + 1}
                      </td>
                      <td className="py-3 px-4 font-bold text-indigo-600 text-base">
                        {row.serieName}
                      </td>
                      <td className="py-3 px-4">
                        <span className="inline-block bg-indigo-100 text-indigo-700 font-semibold px-2.5 py-0.5 rounded-full text-xs">
                          {row.totalItems} รายการ
                        </span>
                      </td>
                      <td className="py-3 px-4">{item.Product_FG || "-"}</td>
                      <td className="py-3 px-4 font-medium text-gray-900">
                        {item.Product_name || "-"}
                      </td>
                      <td className="py-3 px-4">
                        {item.Product_price
                          ? item.Product_price.toLocaleString()
                          : "-"}
                      </td>
                      <td className="py-3 px-4">
                        {item.Price_Validity
                          ? item.Price_Validity.split("T")[0]
                          : "-"}
                      </td>
                      <td className="py-3 px-4">
                        <button
                          type="button"
                          className="px-3 py-1.5 bg-indigo-600 text-white text-xs font-semibold rounded-lg shadow hover:bg-indigo-700 transition-all cursor-pointer"
                          onClick={(e) => {
                            e.stopPropagation(); // กันไม่ให้ trigger tr onClick ซ้ำ
                            setSelectedSeries(row.serieName);
                            setIsSeriesModalOpen(true);
                          }}
                        >
                          รายละเอียด &rarr;
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-gray-400">
                    ไม่มีข้อมูลสำหรับแสดงผล
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ส่วน Pagination คำนวณตามจำนวน Serie ที่ไม่ซ้ำ */}
        {!loading && uniqueSeriesRows.length > 0 && (
          <div className="flex flex-col md:flex-row justify-between items-center mt-6 gap-4 text-sm text-gray-600">
            <div className="bg-gray-50 px-4 py-2 rounded-lg border border-gray-200">
              แสดงหน้า{" "}
              <span className="font-semibold text-gray-900">{currentPage}</span>{" "}
              จาก{" "}
              <span className="font-semibold text-gray-900">
                {totalPages || 1}
              </span>
              <span className="text-gray-400 mx-2">|</span>
              รวมทั้งหมด{" "}
              <span className="font-semibold text-gray-900">
                {uniqueSeriesRows.length}
              </span>{" "}
              Serie (รวม {dataProduct.length} สินค้า)
            </div>

            <div className="flex items-center gap-1 bg-white p-1.5 rounded-xl shadow-sm border border-gray-200">
              <button
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30 disabled:hover:bg-transparent transition-all font-bold"
                onClick={handlePrevGroup}
                disabled={pageGroupIndex === 0}
                title="10 หน้าก่อนหน้า"
              >
                &laquo;
              </button>

              <button
                className="px-3 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-700 disabled:opacity-30 disabled:hover:bg-transparent transition-all font-medium text-xs uppercase tracking-wider"
                onClick={() => {
                  setCurrentPage((prev) => Math.max(prev - 1, 1));
                  if (currentPage - 1 < startPage && pageGroupIndex > 0) {
                    setPageGroupIndex((prev) => prev - 1);
                  }
                }}
                disabled={currentPage === 1}
              >
                Prev
              </button>

              <div className="flex items-center gap-1 px-1">
                {pageNumbers.map((num) => (
                  <button
                    key={num}
                    className={`w-9 h-9 flex items-center justify-center rounded-lg text-sm font-semibold transition-all shadow-sm ${
                      currentPage === num
                        ? "bg-indigo-600 text-white shadow-indigo-100"
                        : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-100"
                    }`}
                    onClick={() => setCurrentPage(num)}
                  >
                    {num}
                  </button>
                ))}
              </div>

              <button
                className="px-3 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-700 disabled:opacity-30 disabled:hover:bg-transparent transition-all font-medium text-xs uppercase tracking-wider"
                onClick={() => {
                  setCurrentPage((prev) => Math.min(prev + 1, totalPages));
                  if (
                    currentPage + 1 > endPage &&
                    (pageGroupIndex + 1) * pagesPerGroup < totalPages
                  ) {
                    setPageGroupIndex((prev) => prev + 1);
                  }
                }}
                disabled={currentPage === totalPages || totalPages === 0}
              >
                Next
              </button>

              <button
                className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-500 disabled:opacity-30 disabled:hover:bg-transparent transition-all font-bold"
                onClick={handleNextGroup}
                disabled={(pageGroupIndex + 1) * pagesPerGroup >= totalPages}
                title="10 หน้าถัดไป"
              >
                &raquo;
              </button>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
