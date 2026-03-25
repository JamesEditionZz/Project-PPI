"use client";
import Image from "next/image";
import React, { useEffect } from "react";
import Header from "./Header/page";
import Main from "./Main/page";
import Sub from "./Sub_Main/page";
import Sub2 from "./Sub_Main2/page";
import Product from "./Product/page";
import FinalProduct from "./FinalProduct/page";

export default function page() {
  const [logo, setLogo] = React.useState(false);
  const [dataProductGroup, setDataProductGroup] = React.useState<any[]>([]);
  const [Toggle, setToggle] = React.useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("http://localhost:5005/Get_Products");
      const data = await res.json();
      setDataProductGroup(data);
    };
    fetchData();
  }, []);

  const SelectProduct = (productType: string) => {
    const parts = productType;

    if (!Toggle.includes(parts)) {
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

  return (
    <>
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
                <Product ValueToggle={Toggle} onUpdate={SelectProduct} />
              </>
            ) : (
              Toggle.length === 10 && (
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
