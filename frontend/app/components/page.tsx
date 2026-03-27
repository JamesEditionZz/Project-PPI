"use client";
import Image from "next/image";
import React, { useEffect } from "react";
import Header from "./Header/page";
import Main from "./Main/page";
import Sub from "./Sub_Main/page";
import Sub2 from "./Sub_Main2/page";
import Sub3 from "./Sub_Main3/page";
import Sub4 from "./Sub_Main4/page";
import Product from "./Product/page";
import FinalProduct from "./FinalProduct/page";

export default function page() {
  const [logo, setLogo] = React.useState(false);
  const [dataProductGroup, setDataProductGroup] = React.useState<any[]>([]);
  const [Toggle, setToggle] = React.useState<any[]>([]);
  const [modelSlideReferenct, setModelSlideReferenct] =
    React.useState<boolean>(false);
  const [isLoadingRef, setIsLoadingRef] = React.useState<boolean>(false);
  const [refImages, setRefImages] = React.useState<string[]>([]); // เก็บ Array ของ Base64
  const [currentIdx, setCurrentIdx] = React.useState<number>(0);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("http://192.168.10.23:5005/Get_Products");
      const data = await res.json();
      setDataProductGroup(data);
    };
    fetchData();
  }, []);

  const SelectProduct = (productType: string) => {
    const parts = productType;
    console.log(parts);

    if (parts && parts.includes(":")) {
      const parts = productType.split(":");
      const type = parts[0].trim(); // เช่น "Model"
      const data = parts[1].trim(); // เช่นชื่อรุ่นสินค้า

      if (type === "Model") {
        // console.log(prev.split(':')[1]);
        setToggle((prev) => [...prev, "", ""]);
        setToggle((prev) => [...prev, "", ""]);
        setToggle((prev) => [...prev, " > ", data]);
      } else if (type === "Special") {
        setToggle((prev) => [...prev, "", ""]);
        setToggle((prev) => [...prev, " > ", data]);
      }
    } else {
      setToggle((prev) => [...prev, " > ", parts]);
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    // ตัด Array ให้เหลือแค่ถึงตำแหน่งที่เราคลิก (index + 1)
    const newToggle = Toggle.slice(0, index + 1);

    // ถ้าตัวสุดท้ายดันไปจบที่ " > " ให้ตัดออกอีกหนึ่งตัวเพื่อความสวยงาม
    if (newToggle[newToggle.length - 1] === " > ") {
      newToggle.pop();
    }

    setToggle(newToggle);
  };

  const ShowReference = async (ValueReference: any) => {
    // 1. เริ่มทำงาน: เปิด Modal และโชว์ Loading ทันที
    setModelSlideReferenct(true);
    setIsLoadingRef(true);
    setRefImages([]); // ล้างรูปเก่ากันสับสน
    setCurrentIdx(0);

    try {
      // 2. ดึงค่าจาก Object ที่ส่งมา
      const serie = ValueReference?.Product_Serie;
      const code = ValueReference?.Product_name;

      // 3. ยิงไปที่ API ReferenceNonFG ที่พี่เขียนไว้
      const res = await fetch(
        `http://192.168.10.23:5005/api/Picture/ReferenceNonFG?serie=${encodeURIComponent(serie)}`,
      );

      if (!res.ok) {
        const text = await res.text(); // อ่านเป็น text มาดูว่า Error อะไร
        // console.error("Server error:", text);
        setIsLoadingRef(false);
        return;
      }

      const data = await res.json();

      if (Array.isArray(data) && data.length > 0) {
        setRefImages(data); // เอารูป Base64 ลง State
      } else {
        console.warn("ไม่พบรูปภาพในโฟลเดอร์ Project Reference");
        // ถ้าไม่มีรูป พี่อาจจะสั่ง setModelSlideReferenct(false) ปิดไปเลยก็ได้
      }
    } catch (err) {
      console.error("Fetch Error:", err);
    } finally {
      // 4. ทำงานเสร็จ (ไม่ว่าจะสำเร็จหรือพัง): ปิด Loading
      setIsLoadingRef(false);
    }
  };

  console.log(Toggle);

  return (
    <>
      {modelSlideReferenct && (
        <div className="fixed inset-0 z-[999] bg-black/90 flex flex-col items-center justify-center">
          {/* ปุ่มปิด Modal */}
          <button
            className="absolute top-5 right-10 text-white text-5xl cursor-poiter-red"
            onClick={() => setModelSlideReferenct(false)}
          >
            &times;
          </button>

          {isLoadingRef ? (
            // --- จังหวะที่ isLoadingRef เป็น true ให้โชว์ Loading ---
            <div className="text-white text-xl flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
              <p>กำลังดึงรูปภาพ Reference...</p>
            </div>
          ) : (
            // --- จังหวะที่โหลดเสร็จแล้ว (isLoadingRef เป็น false) ให้โชว์รูป ---
            <div className="relative w-full max-w-4xl h-[70vh] flex flex-col items-center">
              {refImages.length > 0 ? (
                <>
                  <img
                    src={refImages[currentIdx]}
                    className="max-w-full max-h-full object-contain"
                    alt="Reference"
                  />
                  {/* ปุ่มเลื่อนซ้าย-ขวา */}
                  <button
                    className="absolute left-0 top-1/2 text-white text-4xl p-4"
                    onClick={() =>
                      setCurrentIdx(
                        currentIdx > 0 ? currentIdx - 1 : refImages.length - 1,
                      )
                    }
                  >
                    &lt;
                  </button>
                  <button
                    className="absolute right-0 top-1/2 text-white text-4xl p-4"
                    onClick={() =>
                      setCurrentIdx(
                        currentIdx < refImages.length - 1 ? currentIdx + 1 : 0,
                      )
                    }
                  >
                    &gt;
                  </button>
                </>
              ) : (
                <div className="text-white text-lg">ไม่มีข้อมูลรูปภาพ</div>
              )}
            </div>
          )}
        </div>
      )}
      {!logo ? (
        <div className="body-logo">
          <div className="floating-particles">
            <div className="particle"></div>
            <div className="particle"></div>
            <div className="particle"></div>
            <div className="particle"></div>
            <div className="particle"></div>
            <div className="particle"></div>
            <div className="particle"></div>
            <div className="particle"></div>
            <div className="particle"></div>
          </div>

          <div className="main-content">
            <Image
              className="Logo-image"
              src={"/PPI.png"}
              width={1000}
              height={1000}
              alt="Logo"
            />
            <div className="welcome-text">
              <button className="btn-Inside" onClick={() => setLogo(true)}>
                เข้าสู่ระบบ
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="container m-auto mt-10 opacity">
          <div className="text-lg text-neutral-600 mb-3">
            <span className="cursor-pointer" onClick={() => setToggle([])}>
              Product
            </span>
            {Toggle.map((item, index) => (
              <span
                key={index}
                className={`${item !== " > " ? "cursor-pointer" : ""}`}
                onClick={() => {
                  if (item !== " > ") {
                    handleBreadcrumbClick(index);
                  }
                }}
              >
                {item}
              </span>
            ))}
            <hr className="text-neutral-500 border-1 mb-3" />
            {Toggle.length === 0 ? (
              <>
                <Header onUpdate={SelectProduct} />
              </>
            ) : Toggle.length === 2 ? (
              <>
                <Main ValueToggle={Toggle} onUpdate={SelectProduct} />
              </>
            ) : Toggle.length === 4 ? (
              <>
                <Sub ValueToggle={Toggle} onUpdate={SelectProduct} />
              </>
            ) : Toggle.length === 6 ? (
              <>
                <Sub2 ValueToggle={Toggle} onUpdate={SelectProduct} />
              </>
            ) : Toggle.length === 8 ? (
              <>
                <Sub3
                  ValueToggle={Toggle}
                  onUpdate={SelectProduct}
                  onReference={ShowReference}
                />
              </>
            ) : Toggle.length === 10 ? (
              <>
                <Sub4
                  ValueToggle={Toggle}
                  onUpdate={SelectProduct}
                  onReference={ShowReference}
                />
              </>
            ) : Toggle.length === 12 ? (
              <>
                <Product ValueToggle={Toggle} onUpdate={SelectProduct} />
              </>
            ) : (
              Toggle.length === 14 && (
                <>
                  <FinalProduct ValueToggle={Toggle} />
                </>
              )
            )}
          </div>
        </div>
      )}
    </>
  );
}
