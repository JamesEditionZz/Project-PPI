"use client";
import Image from "next/image";
import React, { useEffect, useState, useMemo } from "react";

interface MainProps {
  ValueToggle: any[];
}

export default function Page({ ValueToggle }: MainProps) {
  const [view_MD, setView_MD] = useState<any[]>([]);
  const [sub2, setSub2] = useState<any[]>([]);
  const myLoader = ({ src }: { src: string }) => src;

  // --- States สำหรับตัวเลือกปัจจุบัน ---
  const [product_Serie_Toggle, setProduct_Serie_Toggle] = useState<string>("");
  const [product_Code_Toggle, setProduct_Code_Toggle] = useState<string>("");
  const [product_name_Toggle, setProduct_name_Toggle] = useState<string>("");
  const [product_Header_Toggle, setProduct_Header_Toggle] =
    useState<string>("");

  const [getHeader, setGetHeader] = useState<string>("");
  const [modelCatalog, setModelCatalog] = useState<boolean>(false);
  const [modelColor, setModelColor] = useState<boolean>(false);
  const [modelDrawing, setModelDrawing] = useState<boolean>(false);
  const [modelSpec, setModelSpec] = useState<boolean>(false);
  const [modelSeller, setModelSeller] = useState<boolean>(false);
  const [hasDefaultSet, setHasDefaultSet] = useState(false);

  const [drawingFiles, setDrawingFiles] = useState<any[]>([]);
  const [specFiles, setSpecFiles] = useState<any[]>([]);
  const [sellerFiles, setSellerFiles] = useState<any[]>([]);
  const [selectedPdf, setSelectedPdf] = useState("");
  const [catalogFiles, setCatalogFiles] = useState<any[]>([]);
  const [selectedCatalogPdf, setSelectedCatalogPdf] = useState<any>(null);
  const [colorFiles, setColorFiles] = useState<any[]>([]);
  const [selectedColorPdf, setSelectedColorPdf] = useState<any>(null);

  // --- States สำหรับ Reference Modal ---
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [selectedImgIndex, setSelectedImgIndex] = useState<number | null>(null);

  const [targetProduct, setTargetProduct] = useState<any>([]);

  // 1. โหลดข้อมูลครั้งแรก
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch("http://localhost:5005/Group_MD", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(`Final_Product:${ValueToggle[13]}`),
      });

      const data = await res.json();

      setView_MD(data);

      // กรองหา Family เริ่มต้นจาก ValueToggle[13] (ชื่อ Serie)
      if (ValueToggle && ValueToggle[13]) {
        const filterfamilyData = data?.filter(
          (item: any) => item?.Product_Serie === data[0]?.Product_Serie,
        );

        const TargetProduct = data.find(
          (item: any) =>
            item?.Product_Serie === ValueToggle[13] ||
            item?.Product_name === ValueToggle[13] ||
            item?.Product_Code === ValueToggle[13] ||
            item?.Product_Type_Main === ValueToggle[13] ||
            item?.Product_Type_Sub === ValueToggle[13] ||
            item?.Product_Type_Sub2 === ValueToggle[13] ||
            item?.Product_Type_Sub3 === ValueToggle[13] ||
            item?.Product_Type_Sub4 === ValueToggle[13] ||
            item?.Product_Type_Sub5 === ValueToggle[13],
        );

        const matchedItem = data.find(
          (item: any) =>
            item?.Product_Serie === ValueToggle[13] ||
            item?.Product_name === ValueToggle[13] ||
            item?.Product_Code === ValueToggle[13] ||
            item?.Product_Type_Main === ValueToggle[13] ||
            item?.Product_Type_Sub === ValueToggle[13] ||
            item?.Product_Type_Sub2 === ValueToggle[13] ||
            item?.Product_Type_Sub3 === ValueToggle[13] ||
            item?.Product_Type_Sub4 === ValueToggle[13] ||
            item?.Product_Type_Sub5 === ValueToggle[13],
        );

        setProduct_Serie_Toggle(matchedItem?.Product_Serie);
        setProduct_Code_Toggle(matchedItem?.Product_Code);
        setProduct_name_Toggle(matchedItem?.Product_name);
        setProduct_Header_Toggle(matchedItem?.Product_Header);

        setSub2(filterfamilyData);
        setTargetProduct(TargetProduct);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  // 2. คำนวณรหัสสินค้าที่มีทั้งหมด (ตารางข้อมูล)
  const Product_Model = useMemo(() => {
    const searchTerm = product_name_Toggle || (ValueToggle && ValueToggle[13]);
    if (!searchTerm) return [];

    // กรองเอาเฉพาะตัวที่รหัสตรงกับชื่อรุ่นที่เลือก
    const filtered = view_MD.filter(
      (item: any) =>
        (item?.Product_Code && item?.Product_Code.includes(searchTerm)) ||
        (item?.Product_Serie && item?.Product_Serie.includes(searchTerm)),
    );

    // ทำ Unique ตาม Product_Code
    return Array.from(
      new Map(
        filtered.map((item: any) => [item?.Product_Code.trim(), item]),
      ).values(),
    );
  }, [view_MD, product_name_Toggle, ValueToggle]);

  // 3. คำนวณสินค้าในตระกูลเดียวกัน (Product Family)
  const Product_Family = useMemo(() => {
    return Array.from(
      new Map(sub2.map((item: any) => [item?.Product_name, item])).values(),
    );
  }, [sub2]);

  // 4. ตั้งค่า Default เมื่อ Product_Model โหลดมาครั้งแรก
  useEffect(() => {
    if (Product_Model.length > 0 && !hasDefaultSet) {
      const firstItem = Product_Model[0];
      setProduct_Serie_Toggle(firstItem?.Product_Serie);
      setProduct_Code_Toggle(firstItem?.Product_Code);
      setProduct_name_Toggle(firstItem?.Product_name);
      setProduct_Header_Toggle(firstItem?.Product_Header);
      setHasDefaultSet(true);
    }
  }, [Product_Model, hasDefaultSet]);

  // 5. ดึงรูป Reference เมื่อมีการเปลี่ยนสินค้า
  const currentShowName =
    product_name_Toggle || (ValueToggle && ValueToggle[13]);

  useEffect(() => {
    const getReferences = async () => {
      if (product_Serie_Toggle && currentShowName) {
        try {
          const res = await fetch(
            `http://localhost:5005/api/Picture/Reference?serie=${encodeURIComponent(product_Serie_Toggle)}&code=${encodeURIComponent(currentShowName)}`,
          );
          const data = await res.json();

          console.log(currentShowName);

          setReferenceImages(Array.isArray(data) ? data : []);
        } catch (err) {
          setReferenceImages([]);
        }
      }
    };
    getReferences();
  }, [product_Serie_Toggle, currentShowName]);

  // --- Handlers ---
  const handlePrev = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImgIndex((prev) =>
      prev !== null && prev > 0 ? prev - 1 : referenceImages.length - 1,
    );
  };

  const handleNext = (e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedImgIndex((prev) =>
      prev !== null && prev < referenceImages.length - 1 ? prev + 1 : 0,
    );
  };

  const PDFColor = (value: string) => {
    setModelColor(true);
    if (value) setGetHeader(value.substring(value.indexOf(" ") + 1));
  };

  const Product_Detail = useMemo(() => {
    const searchTerm = product_name_Toggle || (ValueToggle && ValueToggle[13]);
    if (!searchTerm) return [];

    // กรองเอาเฉพาะตัวที่รหัสตรงกับชื่อรุ่นที่เลือก
    const filtered = view_MD.filter(
      (item: any) =>
        item?.Product_Code === searchTerm || item?.Product_name === searchTerm,
    );

    // ทำ Unique ตาม Product_Code
    return Array.from(
      new Map(
        filtered.map((item: any) => [item?.Product_Code.trim(), item]),
      ).values(),
    );
  }, [view_MD, product_name_Toggle, ValueToggle]);

  return (
    <div className="mt-5 p-4 bg-white min-h-screen">
      {/* ส่วนหัวชื่อสินค้า */}
      <div className="flex w-full mb-6 border-b pb-2">
        <div className="font-bold text-3xl text-neutral-800">
          <span>{currentShowName}</span>
        </div>
      </div>
      {/* Main Content Area */}
      <div className="flex flex-col xl:flex-row w-full gap-8">
        {/* รูปสินค้าหลัก */}
        <div className="w-full xl:w-1/3 flex items-center justify-center rounded-xl p-4 border border-gray-100 shadow-sm">
          <div className="relative w-full aspect-square items-center">
            <Image
              loader={myLoader}
              src={`http://localhost:5005/api/Picture/Product?serie=${encodeURIComponent(product_Serie_Toggle)}&code=${encodeURIComponent(currentShowName)}`}
              fill
              className="object-contain object-center"
              alt={currentShowName}
              unoptimized
            />
          </div>
        </div>

        {/* ตารางข้อมูลสินค้า */}
        <div className="flex-1 flex flex-col gap-6">
          <div className="overflow-x-auto shadow-sm border border-gray-100 rounded-lg bg-white overflow-data">
            <table className="w-full text-sm text-left text-gray-600">
              <thead className="text-xs text-gray-700 uppercase bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-center">รหัสสินค้า</th>
                  <th className="px-4 py-3 text-center">รหัสกลาง</th>
                  <th className="px-4 py-3 text-center">ราคาขาย</th>
                  <th className="px-4 py-3">รายละเอียด</th>
                </tr>
              </thead>
              <tbody>
                {Product_Detail?.map((item: any, idx) => {
                  const dateToday = new Date();
                  const validityDate = new Date(item?.Price_Validity);
                  const isExpired = validityDate <= dateToday;

                  return (
                    <tr
                      key={idx}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="px-4 py-3 text-center font-medium text-gray-900">
                        {item?.Product_Code}
                      </td>
                      <td className="px-4 py-3 text-center text-gray-500">
                        {item?.Product_FG?.[0] || "-"}
                      </td>
                      <td className="px-4 py-3 text-center font-bold">
                        {!isExpired ? (
                          item?.Product_FG?.[0].slice(-1) === "#" ? (
                            <span className="text-red-600">
                              {item?.Product_price}
                            </span>
                          ) : (
                            <span>{item?.Product_price.toLocaleString()}</span>
                          )
                        ) : null}
                      </td>
                      <td className="px-4 py-3 text-gray-500">
                        {item?.Description}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ปุ่ม PDF & Reference */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {/* Catalog */}
            <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow">
              <div className="bg-neutral-600 text-white text-xs text-center py-2 font-medium">
                Catalogue
              </div>
              <div
                className="flex justify-center items-center h-32 cursor-pointer"
                onClick={async () => {
                  try {
                    const res = await fetch(
                      `http://localhost:5005/api/Document/Product?serie=${encodeURIComponent(product_Serie_Toggle)}&code=${encodeURIComponent(currentShowName)}`,
                    );

                    if (!res.ok) {
                      setCatalogFiles([]);
                      setSelectedCatalogPdf(null);
                      setModelCatalog(true);
                      return;
                    }

                    const data = await res.json();
                    setCatalogFiles(data);

                    // ถ้ามีไฟล์ส่งกลับมา ให้เลือกไฟล์แรกเป็นค่าเริ่มต้น
                    if (Array.isArray(data) && data.length > 0) {
                      setSelectedCatalogPdf(
                        `http://localhost:5005${data[0].url}`,
                      );
                    } else {
                      setSelectedCatalogPdf(null);
                    }
                  } catch (error) {
                    console.error("Error fetching catalog:", error);
                    setCatalogFiles([]);
                    setSelectedCatalogPdf(null);
                  } finally {
                    setModelCatalog(true);
                  }
                }}
              >
                <Image src="/Icon/pdf.png" width={60} height={60} alt="pdf" />
              </div>
            </div>

            {/* Material Color */}
            <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow">
              <div className="bg-neutral-600 text-white text-xs text-center py-2 font-medium">
                Material Colour
              </div>
              <div
                className="flex justify-center items-center h-32 cursor-pointer"
                onClick={async () => {
                  try {
                    const res = await fetch(
                      `http://localhost:5005/api/Material?Main=${encodeURIComponent(product_Header_Toggle)}`,
                    );

                    if (!res.ok) {
                      setColorFiles([]);
                      setSelectedColorPdf(null);
                      setModelColor(true);
                      return;
                    }

                    const data = await res.json();
                    setColorFiles(data);

                    if (Array.isArray(data) && data.length > 0) {
                      setSelectedColorPdf(
                        `http://localhost:5005${data[0].url}`,
                      );
                    } else {
                      setSelectedColorPdf(null);
                    }
                  } catch (error) {
                    console.error("Error fetching Material Colour:", error);
                    setColorFiles([]);
                    setSelectedColorPdf(null);
                  } finally {
                    setModelColor(true);
                  }
                }}
              >
                <Image src="/Icon/pdf.png" width={60} height={60} alt="pdf" />
              </div>
            </div>

            {/* Drawing */}
            <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow">
              <div className="bg-neutral-600 text-white text-xs text-center py-2 font-medium">
                Drawing
              </div>
              <div
                className="flex justify-center items-center h-32 cursor-pointer"
                onClick={async () => {
                  const res = await fetch(
                    `http://localhost:5005/api/Drawing?serie=${encodeURIComponent(product_Serie_Toggle)}&code=${encodeURIComponent(currentShowName)}`,
                  );

                  const data = await res.json();

                  setDrawingFiles(data);

                  if (data.length > 0) {
                    setSelectedPdf(`http://localhost:5005${data[0].url}`);
                  }

                  setModelDrawing(true);
                }}
              >
                <Image src="/Icon/pdf.png" width={60} height={60} alt="pdf" />
              </div>
            </div>

            {/* Reference (Grid) */}
            <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white flex flex-col">
              <div className="bg-neutral-600 text-white text-xs text-center py-2 font-medium">
                Reference
              </div>
              <div className="grid grid-cols-2 gap-1 p-1 overflow-y-auto max-h-32">
                {referenceImages?.map((base64, idx) => (
                  <div
                    key={idx}
                    className="aspect-square relative cursor-pointer align-center"
                    onClick={() => setSelectedImgIndex(idx)}
                  >
                    <img
                      src={base64}
                      className="align-center object-cover rounded-sm hover:opacity-80"
                      width={80}
                      alt={`ref-${idx}`}
                    />
                  </div>
                ))}
              </div>
            </div>

            <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow">
              <div className="bg-neutral-600 text-white text-xs text-center py-2 font-medium">
                Spec
              </div>
              <div
                className="flex justify-center items-center h-32 cursor-pointer"
                onClick={async () => {
                  const res = await fetch(
                    `http://localhost:5005/api/Spec?serie=${encodeURIComponent(product_Serie_Toggle)}`,
                  );
                  const data = await res.json();

                  setSpecFiles(data);

                  if (data.length > 0) {
                    setSelectedPdf(`http://localhost:5005${data[0].url}`);
                  }

                  setModelSpec(true);
                }}
              >
                <Image src="/Icon/pdf.png" width={60} height={60} alt="pdf" />
              </div>
            </div>

            <div className="border border-neutral-200 rounded-lg overflow-hidden bg-white hover:shadow-md transition-shadow">
              <div className="bg-neutral-600 text-white text-xs text-center py-2 font-medium">
                Seller
              </div>
              <div
                className="flex justify-center items-center h-32 cursor-pointer"
                onClick={async () => {
                  const res = await fetch(
                    `http://localhost:5005/api/Seller?serie=${encodeURIComponent(product_Serie_Toggle)}`,
                  );
                  const data = await res.json();

                  setSellerFiles(data);

                  if (data.length > 0) {
                    setSelectedPdf(`http://localhost:5005${data[0].url}`);
                  }

                  setModelSeller(true);
                }}
              >
                <Image src="/Icon/pdf.png" width={60} height={60} alt="pdf" />
              </div>
            </div>
          </div>
        </div>
      </div>
      {/* --- Product Family Section --- */}
      <div className="mt-12">
        <hr className="border-gray-200 mb-6" />
        <div className="font-bold text-xl text-neutral-700 mb-4 px-2 italic">
          Product Family
        </div>
        <div className="overflow-x-auto pb-4 custom-scrollbar">
          <div className="flex gap-4 px-2">
            {Product_Family?.map((item: any, index) => {
              const isActive = currentShowName === item?.Product_name;
              return (
                <div
                  key={index}
                  className={`flex-shrink-0 cursor-pointer p-2 transition-all rounded-xl mt-3 ${
                    isActive
                      ? "ring-2 ring-gray-400 bg-gray-50 scale-105"
                      : "hover:bg-gray-50 border border-transparent"
                  }`}
                  onClick={() => {
                    setProduct_Serie_Toggle(item?.Product_Serie);
                    setProduct_name_Toggle(item?.Product_name);
                    setProduct_Code_Toggle(item?.Product_Code);
                    setProduct_Header_Toggle(item?.Product_Header);
                  }}
                >
                  <div className="w-[160px] h-[160px] relative bg-white rounded-lg overflow-hidden shadow-sm">
                    <Image
                      loader={myLoader}
                      src={`http://localhost:5005/api/Picture/Product?serie=${encodeURIComponent(item?.Product_Serie)}&code=${encodeURIComponent(item?.Product_name)}`}
                      width={160}
                      height={160}
                      className="object-contain w-full h-full"
                      alt={item?.Product_name}
                      unoptimized
                    />
                  </div>
                  <div
                    className={`text-center text-sm mt-3 font-medium ${isActive ? "text-neutral-900" : "text-gray-500"}`}
                  >
                    {item?.Product_name}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
      {/* --- Modals (PDF & Image Preview) --- */}
      {/* Catalog Modal */}
      {modelCatalog && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center"
          onClick={() => setModelCatalog(false)}
        >
          <div
            className="w-[90vw] h-[90vh] bg-white rounded-lg overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            {catalogFiles.length > 0 ? (
              <div className="flex h-full">
                <div className="w-20 border-r overflow-y-auto">
                  {catalogFiles?.map((pdf) => (
                    <div
                      key={pdf.name}
                      onClick={() =>
                        setSelectedCatalogPdf(
                          `http://localhost:5005${pdf.url}`,
                        )
                      }
                      className={`p-3 cursor-pointer hover:bg-gray-100 border-b ${
                        selectedCatalogPdf?.includes(
                          encodeURIComponent(pdf.name),
                        )
                          ? "bg-blue-50 font-medium text-blue-600"
                          : ""
                      }`}
                    >
                      {pdf.name}
                    </div>
                  ))}
                </div>

                {/* แสดง PDF ใน iframe */}
                <div className="flex-1">
                  {selectedCatalogPdf && (
                    <iframe
                      className="w-full h-full border-none"
                      title="catalog"
                      src={selectedCatalogPdf}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="text-3xl text-center mt-50">
                ไม่มีไฟล์ Catalog
              </div>
            )}
          </div>
        </div>
      )}
      {/* Color Modal */}
      {modelColor && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center"
          onClick={() => setModelColor(false)}
        >
          <div
            className="w-[90vw] h-[90vh] bg-white rounded-lg overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            {colorFiles.length > 0 ? (
              <div className="flex h-full">
                {/* รายชื่อ PDF ด้านซ้าย */}
                <div className="w-20 border-r overflow-y-auto">
                  {colorFiles?.map((pdf) => (
                    <div
                      key={pdf.name}
                      onClick={() =>
                        setSelectedColorPdf(
                          `http://localhost:5005${pdf.url}`,
                        )
                      }
                      className={`p-3 cursor-pointer hover:bg-gray-100 border-b ${
                        selectedColorPdf?.includes(encodeURIComponent(pdf.name))
                          ? "bg-blue-50 font-medium text-blue-600"
                          : ""
                      }`}
                    >
                      {pdf.name}
                    </div>
                  ))}
                </div>

                {/* แสดง PDF ด้านขวา */}
                <div className="flex-1">
                  {selectedColorPdf && (
                    <iframe
                      className="w-full h-full border-none"
                      title="color"
                      src={selectedColorPdf}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="text-3xl text-center mt-50">
                ไม่มีไฟล์ Material Colour
              </div>
            )}
          </div>
        </div>
      )}
      {modelDrawing && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center"
          onClick={() => setModelDrawing(false)}
        >
          <div
            className="w-[90vw] h-[90vh] bg-white rounded-lg overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            {/* ปุ่มปิดเล็กๆ มุมขวาเผื่อคนหาที่คลิกนอกไม่เจอ */}
            {/* <button
              className="absolute top-2 right-4 text-2xl font-bold text-gray-500 hover:text-black z-[110]"
              onClick={() => setModelDrawing(false)}
            >
              &times;
            </button> */}
            {drawingFiles.length > 0 ? (
              <div className="flex h-full">
                {/* รายชื่อ PDF */}
                <div className="border-r overflow-y-auto">
                  {drawingFiles?.map((pdf) => (
                    <div
                      key={pdf.name}
                      onClick={() =>
                        setSelectedPdf(`http://localhost:5005${pdf.url}`)
                      }
                      className="p-3 cursor-pointer hover:bg-gray-100 border-b"
                    >
                      {pdf.name}
                    </div>
                  ))}
                </div>

                {/* แสดง PDF */}
                <div className="flex-1">
                  {selectedPdf && (
                    <iframe
                      className="w-full h-full border-none"
                      title="drawing"
                      src={selectedPdf}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="text-3xl text-center mt-50">
                ไม่มีไฟล์ Drawing
              </div>
            )}
          </div>
        </div>
      )}
      {/* Image Reference Modal Full Screen */}
      {selectedImgIndex !== null && (
        <div
          className="fixed inset-0 z-[999] bg-black flex items-center justify-center"
          onClick={() => setSelectedImgIndex(null)}
        >
          <button className="absolute top-5 right-10 text-white text-5xl font-bold z-50 hover:text-red-500">
            &times;
          </button>
          <div
            className="absolute left-0 top-0 bottom-0 w-[15%] flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group z-40"
            onClick={handlePrev}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-40 group-hover:opacity-100"
            >
              <path d="m15 18-6-6 6-6" />
            </svg>
          </div>
          <div
            className="absolute inset-0 flex items-center justify-center z-30"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={referenceImages[selectedImgIndex]}
              className="max-w-full max-h-full object-contain"
              alt="Large preview"
            />
            <div className="absolute bottom-5 left-1/2 -translate-x-1/2 text-white bg-black/50 px-4 py-1.5 rounded-full z-50">
              {selectedImgIndex + 1} / {referenceImages.length}
            </div>
          </div>
          <div
            className="absolute right-0 top-0 bottom-0 w-[15%] flex items-center justify-center bg-white/5 hover:bg-white/10 transition-colors cursor-pointer group z-40"
            onClick={handleNext}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="48"
              height="48"
              viewBox="0 0 24 24"
              fill="none"
              stroke="white"
              strokeWidth="2.5"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="opacity-40 group-hover:opacity-100"
            >
              <path d="m9 18 6-6-6-6" />
            </svg>
          </div>
        </div>
      )}
      {/* Modal Spec */}
      {modelSpec && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center"
          onClick={() => setModelSpec(false)}
        >
          <div
            className="w-[90vw] h-[90vh] bg-white rounded-lg overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            {specFiles.length > 0 ? (
              <div className="flex h-full">
                {/* รายชื่อ PDF */}
                <div className="w-20 border-r overflow-y-auto">
                  {specFiles.map((pdf) => (
                    <div
                      key={pdf.name}
                      onClick={() =>
                        setSelectedPdf(`http://localhost:5005${pdf.url}`)
                      }
                      className={`p-3 cursor-pointer hover:bg-gray-100 border-b ${
                        selectedPdf === `http://localhost:5005${pdf.url}`
                          ? "bg-blue-50 font-medium text-blue-600"
                          : ""
                      }`}
                    >
                      {console.log(selectedPdf)}
                      {pdf.name}
                    </div>
                  ))}
                </div>

                {/* แสดง PDF */}
                <div className="flex-1">
                  {selectedPdf && (
                    <iframe
                      className="w-full h-full border-none"
                      title="Spec"
                      src={selectedPdf}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="text-3xl text-center mt-50">ไม่มีไฟล์ Spec</div>
            )}
          </div>
        </div>
      )}
      {/* Modal Seller */}
      {modelSeller && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center"
          onClick={() => setModelSeller(false)}
        >
          <div
            className="w-[90vw] h-[90vh] bg-white rounded-lg overflow-hidden relative"
            onClick={(e) => e.stopPropagation()}
          >
            {sellerFiles.length > 0 ? (
              <div className="flex h-full">
                {/* รายชื่อ PDF */}
                <div className="border-r overflow-y-auto">
                  {sellerFiles.map((pdf) => (
                    <div
                      key={pdf.name}
                      onClick={() =>
                        setSelectedPdf(`http://localhost:5005${pdf.url}`)
                      }
                      className={`p-3 cursor-pointer hover:bg-gray-100 border-b ${
                        selectedPdf === `http://localhost:5005${pdf.url}`
                          ? "bg-blue-50 font-medium text-blue-600"
                          : ""
                      }`}
                    >
                      {pdf.name}
                    </div>
                  ))}
                </div>

                {/* แสดง PDF */}
                <div className="flex-1">
                  {selectedPdf && (
                    <iframe
                      className="w-full h-full border-none"
                      title="Seller"
                      src={selectedPdf}
                    />
                  )}
                </div>
              </div>
            ) : (
              <div className="text-3xl text-center mt-50">
                ไม่มีไฟล์ประกาศขาย
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
