"use client";
import Image from "next/image";
import React, { useEffect, useState, useMemo } from "react";

interface MainProps {
  ValueToggle: any[];
  onUpdate: (value: string) => void;
}

export default function page({ ValueToggle, onUpdate }: MainProps) {
  const [view_MD, setView_MD] = React.useState<any[]>([]);
  const myLoader = ({ src }: { src: string }) => src;

  // --- States สำหรับ Reference Slide ---
  const [showRefModal, setShowRefModal] = useState(false);
  const [refImages, setRefImages] = useState<string[]>([]);
  const [currentIdx, setCurrentIdx] = useState(0);

  const [isLoadingRef, setIsLoadingRef] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("http://192.168.10.23:5005/Group_MD");
      const data = await res.json();

      const filterData = data.filter((item: any) => {
        const searchTerm = ValueToggle && ValueToggle[5];
        if (searchTerm && item.Product_Type_Sub) {
          return item.Product_Type_Sub.includes(searchTerm);
        }
        return false;
      });

      setView_MD(filterData);
    };
    fetchData();
  }, [ValueToggle]);

  // กรองหมวดหมู่ (Unique Type)
  const uniqueProductTypes = Array.from(
    new Set(
      view_MD.map(
        (item: any) => `${item.Product_Type_Sub2}|${item.Product_Type_Sub2_TH}`,
      ),
    ),
  );

  // --- กรองสินค้าไม่ให้ซ้ำ (Unique by Product_name) ---
  const displayProducts = useMemo(() => {
    return Array.from(
      new Map(view_MD.map((item) => [item.Product_name, item])).values(),
    );
  }, [view_MD]);

  const SelectProduct = (ToggleProduct: string) => {
    onUpdate(ToggleProduct.split("|")[0]);
  };

  const SelectProductReferrence = async (item: any) => {
    setIsLoadingRef(true);
    try {
      const res = await fetch(
        `http://192.168.10.23:5005/api/Picture/Reference?serie=${encodeURIComponent(item.Product_Serie)}&code=${encodeURIComponent(item.Product_name)}`,
      );
      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        setRefImages(data);
        setCurrentIdx(0);
        setShowRefModal(true);
      } else {
        alert("ไม่มีตัวอย่าง Reference");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setIsLoadingRef(false); // โหลดเสร็จ (ไม่ว่าจะสำเร็จหรือพัง)
    }
  };

  return (
    <div className="grid grid-cols-5 gap-5 text-lg font-bold p-8 max-[500px]:grid-cols-1 max-[500px]:gap-2 max-[800px]:grid-cols-2 max-[800px]:gap-2 max-[1200px]:grid-cols-3 max-[1200px]:gap-2 max-[1600px]:grid-cols-4 max-[1600px]:gap-2">
      {/* 1. ส่วนแสดงหมวดหมู่ปกติ */}
      {uniqueProductTypes
        .filter((t) => t.split("|")[0] !== "null")
        .sort()
        .map((item, index) => (
          <div key={index}>
            <div
              className="cursor-pointer box-size-Images"
              onClick={() => SelectProduct(item)}
            >
              <div>
                <Image
                  loader={myLoader}
                  src={`http://192.168.10.23:5005/api/Cover/Photo?Main=${encodeURIComponent(item.split("|")[0])}`}
                  width={1000}
                  height={1000}
                  alt={`${item}`}
                />
              </div>
              <div className="text-center text-base/6 p-1 bg-neutral-700 text-white font-normal font-san mt-auto">
                <div>{item.split("|")[0].split(" ").slice(1).join(" ")}</div>
              </div>
              <div className="text-center text-base/6 p-1 bg-neutral-500 text-white font-normal font-san">
                {item.split("|")[1]}
              </div>
            </div>
          </div>
        ))}

      {/* 2. ส่วนแสดงสินค้า (กระจายตัวตาม Grid และไม่ซ้ำ) */}
      {uniqueProductTypes.some((t) => t.split("|")[0] === "null") &&
        displayProducts.map((prod, pIdx) => (
          <div key={`prod-${pIdx}`} className="mb-10">
            <div
              className="cursor-pointer box-size-Images"
              onClick={() => SelectProductReferrence(prod)}
            >
              <Image
                loader={myLoader}
                src={`http://192.168.10.23:5005/api/Product?serie=${encodeURIComponent(prod.Product_Serie)}&code=${encodeURIComponent(prod.Product_name)}`}
                width={1000}
                height={1000}
                alt={`${prod.Product_Serie}`}
              />
            </div>
            <div className="text-center text-base/6 p-2 bg-neutral-700 text-white font-normal font-san mt-auto">
              <div>{prod.Product_name}</div>
            </div>
          </div>
        ))}

      {isLoadingRef && (
        <div className="fixed inset-0 z-[1002] bg-black/50 flex items-center justify-center backdrop-blur-sm">
          <div className="flex flex-col items-center">
            {/* ตัวหมุน (Spinner) */}
            <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-white mt-4 font-normal">
              กำลังโหลดข้อมูล Reference...
            </p>
          </div>
        </div>
      )}

      {/* --- Reference Modal (Slide & Thumbnails) --- */}
      {showRefModal && (
        <div
          className="fixed inset-0 z-[999] bg-black/90 flex flex-col items-center justify-center"
          onClick={() => setShowRefModal(false)}
        >
          <button className="absolute top-5 right-10 text-white text-5xl z-[1001] cursor-pointer">
            &times;
          </button>
          <div
            className="relative w-full max-w-4xl h-[65vh] flex items-center justify-center"
            onClick={(e) => e.stopPropagation()}
          >
            <img
              src={refImages[currentIdx]}
              className="max-w-full max-h-full object-contain"
              alt="ref"
            />
            <button
              className="absolute left-0 text-white text-4xl p-4 bg-black/20"
              onClick={() =>
                setCurrentIdx(
                  currentIdx > 0 ? currentIdx - 1 : refImages.length - 1,
                )
              }
            >
              &lt;
            </button>
            <button
              className="absolute right-0 text-white text-4xl p-4 bg-black/20"
              onClick={() =>
                setCurrentIdx(
                  currentIdx < refImages.length - 1 ? currentIdx + 1 : 0,
                )
              }
            >
              &gt;
            </button>
          </div>
          <div
            className="flex gap-2 mt-8 overflow-x-auto max-w-full p-2"
            onClick={(e) => e.stopPropagation()}
          >
            {refImages.map((img, idx) => (
              <div
                key={idx}
                className={`w-20 h-20 flex-shrink-0 cursor-pointer border-2 ${currentIdx === idx ? "border-blue-500" : "border-transparent"}`}
                onClick={() => setCurrentIdx(idx)}
              >
                <img
                  src={img}
                  className="w-full h-full object-cover"
                  alt="thumb"
                />
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
