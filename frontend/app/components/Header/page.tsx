"use client";
import Image from "next/image";
import React, { useEffect } from "react";
import Main from "../Main/page";
import Sub from "../Sub_Main/page";
import Sub2 from "../Sub_Main2/page";
import Product from "../Product/page";
import FinalProduct from "../FinalProduct/page";

export default function page() {
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
      <div className="container m-auto mt-10">
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
            <div className="grid grid-cols-5 gap-4 text-lg p-8 max-[500px]:grid-cols-1 max-[500px]:gap-2 max-[800px]:grid-cols-2 max-[800px]:gap-2 max-[1200px]:grid-cols-3 max-[1200px]:gap-2 max-[1600px]:grid-cols-4 max-[1600px]:gap-2">
              {dataProductGroup.map((item: any, index: number) => (
                <div
                  key={index}
                  className="cursor-pointer"
                  onClick={() => {
                    SelectProduct(item.Product_Type);
                  }}
                >
                  <div>
                    <Image
                      className="Images-Group"
                      src={`/ImageFront/${item.Product_Type}.jpg`}
                      width={1000}
                      height={1000}
                      alt={item.Product_Type}
                    />
                  </div>
                  <div className="text-center text-base/6 p-1 bg-neutral-700 text-white font-normal font-sans">
                    <div className="font-12">
                      {item.Product_Name.split("|")[0]}
                    </div>
                  </div>
                  <div className="text-center text-base/6 p-1 bg-neutral-500 text-white font-th font-sans">
                    {item.Product_Name.split("|")[1]}
                  </div>
                </div>
              ))}
            </div>
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
                <FinalProduct ValueToggle={Toggle} onUpdate={SelectProduct} />
              </>
            )
          )}
        </div>
      </div>
    </>
  );
}
