"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";

export default function page() {
  const [getProblem, setGetProblem] = useState<any[]>([]);
  const [loading, setLoading] = useState<boolean>(false);

  // 👉 State สำหรับเปิด-ปิด Modal ดูรูปภาพขนาดใหญ่
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const datafecth = async () => {
    try {
      const res = await fetch("http://localhost:5005/api/Get_Problem");
      const data = await res.json();
      setGetProblem(Array.isArray(data) ? data : []);
    } catch (error) {
      console.error("Fetch error:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setLoading(true);
    datafecth();
  }, []);

  return (
    <>
      {/* 👉 Modal Lightbox สำหรับแสดงรูปภาพขนาดใหญ่เมื่อกดคลิก */}
      {previewImage && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4"
          onClick={() => setPreviewImage(null)}
        >
          <div className="relative max-w-4xl max-h-[90vh]">
            <img
              src={`http://localhost:5005${previewImage}`} // ชี้ไปที่ Server backend (เช่น http://localhost:5005/Image_Problem/xxx.jpg)
              alt="Problem Attachment"
              className="max-w-full max-h-[85vh] rounded-2xl shadow-2xl object-contain border border-white/10"
            />
            <button
              className="absolute -top-4 -right-4 w-10 h-10 rounded-full bg-white text-gray-800 font-bold text-xl shadow-lg flex items-center justify-center hover:bg-gray-100 cursor-pointer"
              onClick={() => setPreviewImage(null)}
            >
              &times;
            </button>
          </div>
        </div>
      )}

      <div>
        <div className="p-5 font-sans text-xl font-semibold text-gray-800">
          Problem & Suggestions
        </div>
        <div className="shadow-md rounded-xl border border-gray-200 bg-white mx-5 overflow-hidden">
          <table className="w-full border-collapse">
            <thead className="text-center sticky top-0 bg-gray-50 text-gray-700 uppercase text-xs tracking-wider border-b border-gray-200 z-10">
              <tr>
                <th className="py-3 px-4">No.</th>
                <th className="py-3 px-4 text-left">ข้อเสนอแนะ</th>
                <th className="py-3 px-4">วันเดือนปี</th>
                <th className="py-3 px-4">รูปภาพแนบ</th>
                <th className="py-3 px-4">User</th>
              </tr>
            </thead>

            <tbody className="divide-y divide-gray-100 text-sm text-gray-600 text-center">
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-20 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                      <p className="text-gray-500 font-medium text-sm animate-pulse">
                        กำลังโหลดข้อมูล กรุณารอสักครู่...
                      </p>
                    </div>
                  </td>
                </tr>
              ) : getProblem.length > 0 ? (
                getProblem.map((item: any, index: number) => (
                  <tr
                    key={index}
                    className="hover:bg-gray-50 transition-colors"
                  >
                    <td className="py-3 px-4 font-medium text-gray-900">
                      {index + 1}
                    </td>
                    <td className="py-3 px-4 text-left font-medium text-gray-800">
                      {item.Problem}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {item.Date_Problem
                        ? item.Date_Problem.includes("T")
                          ? item.Date_Problem.split("T")[0] +
                            " " +
                            item.Date_Problem.split("T")[1].split(".")[0]
                          : item.Date_Problem
                        : "-"}
                    </td>
                    <td className="py-3 px-4 flex justify-center">
                      {item.Path_Image ? (
                        <img
                          src={`http://localhost:5005${item.Path_Image}`}
                          width={150}
                          height={150}
                          onClick={() => setPreviewImage(item.Path_Image)}
                          alt="Problem Attachment"
                          className="object-cover curser-pointer"
                        />
                      ) : (
                        <span className="text-gray-400 text-xs italic">
                          ไม่มีรูปภาพ
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4">************</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-gray-400">
                    ไม่มีข้อมูลสำหรับแสดงผล
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
