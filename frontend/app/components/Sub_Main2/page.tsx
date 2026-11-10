"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";

interface MainProps {
  ValueToggle: any[];
  onUpdate: (value: string) => void;
  onReference: (value: string) => void;
}

export default function page({
  ValueToggle,
  onUpdate,
  onReference,
}: MainProps) {
  const [view_MD, setView_MD] = React.useState<any[]>([]);
  const myLoader = ({ src }: { src: string }) => src;

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("http://localhost:5005/Group_MD", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(`Sub:${ValueToggle[5]}`),
      });

      const data = await res.json();

      setView_MD(data);
    };
    fetchData();
  }, []);

  const uniqueProductTypes = Array.from(
    new Set(
      view_MD
        .filter(
          (item: any) =>
            item.Product_Type_Sub2 !== null &&
            item.Product_Type_Sub2 !== "null" &&
            item.Product_Type_Sub2 !== "",
        )
        // 2. นำรายการที่ผ่านการกรองมาสร้าง String สำหรับ Set
        .map((item: any) => `${item.Product_Type_Sub2}`),
    ),
  );

  const terminalProducts = view_MD.filter((item, index, self) => {
    const sub2 = item.Product_Type_Sub2?.toString().trim();
    return (
      (!sub2 || sub2.toLowerCase() === "null") &&
      index === self.findIndex((candidate) => candidate.Product_name === item.Product_name)
    );
  });

  const ProductTypes = view_MD.filter((item, index, self) => {
    // 1. เงื่อนไขแรก: เลือกเฉพาะรายการที่เป็น "3 Storage"
    // (ตรวจสอบชื่อ Property อีกครั้งว่า Product_Header หรือ Header นะครับ)
    const isStorage = item.Product_Header === "3 STORAGE";
    const isSpace = item.Product_Header === "4 SPACE DIVIDER";
    
    // 2. เงื่อนไขที่สอง: เช็คความซ้ำ (Unique)
    const isUnique =
      index ===
      self.findIndex(
        (t) =>
          (t.Product_Type_Sub2 || t.Product_name) ===
          (item.Product_Type_Sub2 || item.Product_name),
      );

    // ต้องผ่านทั้งสองเงื่อนไขถึงจะเอาข้อมูลชุดนี้ไปใช้งาน
    const hasSub2 = Boolean(
      item.Product_Type_Sub2 && item.Product_Type_Sub2 !== "null",
    );
    return hasSub2 && (isStorage || (isSpace && isUnique));
  });

  const SelectProduct = (ToggleProduct: string) => {
    const Check_Path = view_MD.find(
      (item) => item.Product_Type_Sub2 === ToggleProduct,
    );

    if (Check_Path?.Product_Type_Sub2) {
      onUpdate(ToggleProduct);
    } else {
      onUpdate(`Final_Product:${ToggleProduct.split("|")[0]}`);
    }
  };

  const CheckProductReference = (Value: string) => {
    const Check_FG = view_MD.filter((item) => item.Product_name === Value);
    const product = Check_FG[0];

    if (!product) return;

    if (
      product.Product_FG?.[0]?.includes("FG") ||
      product.Product_FG?.[0]?.includes("FM") ||
      product.Product_FG?.[0]?.includes("FP")
    ) {
      onUpdate(`Sub2:${Value.split("|")[0]}`);
    } else {
      onReference(product);
    }
  };

  return (
    <div className="grid grid-cols-5 gap-5 text-lg font-bold p-8 max-[600px]:grid-cols-1 max-[600px]:gap-2 max-[800px]:grid-cols-2 max-[800px]:gap-2 max-[1200px]:grid-cols-3 max-[1200px]:gap-2 max-[1600px]:grid-cols-4 max-[1600px]:gap-2">
      {[...uniqueProductTypes]
        .sort((a, b) =>
          a.localeCompare(b, undefined, { numeric: true, sensitivity: "base" }),
        )
        .map((item, index) => {
          return (
            <div key={index}>
              {/* {item.split("|")[0] !== "null" ? ( */}
              <div
                className="cursor-pointer box-size-Images"
                onClick={() => SelectProduct(item)}
              >
                <div className="flex items-end h-full">
                  <Image
                    loader={myLoader}
                    src={`http://localhost:5005/api/Cover/Photo?Main=${encodeURIComponent(item.split("|")[0])}`}
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
          );
        })}

      {ProductTypes.filter(
        (item, index, self) =>
          index === self.findIndex((t) => t.Product_name === item.Product_name),
      ).map((item, index) => (
        <div key={index}>
          <div
            className="cursor-pointer box-size-Images"
            onClick={() => CheckProductReference(item.Product_name)}
          >
            <div className="flex items-end h-full">
              <Image
                loader={myLoader}
                src={`http://localhost:5005/api/Product?serie=${encodeURIComponent(item.Product_Serie)}&code=${encodeURIComponent(item.Product_name)}`}
                width={1000}
                height={1000}
                alt={`${item.Product_name}`}
              />
            </div>
            <div className="text-center text-base/6 p-1 bg-neutral-700 text-white font-normal font-san mt-auto">
              <div>{item.Product_name}</div>
            </div>
          </div>
        </div>
      ))}
      {terminalProducts.map((item, index) => (
        <div key={`terminal-${item.Product_name}-${index}`}>
          <div
            className="cursor-pointer box-size-Images"
            onClick={() => onUpdate(`Final_Product:${item.Product_name}`)}
          >
            <div className="flex items-end h-full">
              <Image
                loader={myLoader}
                src={`http://localhost:5005/api/Product?serie=${encodeURIComponent(item.Product_Serie)}&code=${encodeURIComponent(item.Product_name)}`}
                width={1000}
                height={1000}
                alt={item.Product_name}
              />
            </div>
            <div className="text-center text-base/6 p-1 bg-neutral-700 text-white font-normal font-san mt-auto">
              {item.Product_name}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
