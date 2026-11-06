"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import Reference from "../Reference/page";

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
        body: JSON.stringify(`Sub3:${ValueToggle[9]}`),
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
            item.Product_Type_Sub4 !== null &&
            item.Product_Type_Sub4 !== "null" &&
            item.Product_Type_Sub4 !== "",
        )
        // 2. นำรายการที่ผ่านการกรองมาสร้าง String สำหรับ Set
        .map((item: any) => `${item.Product_Type_Sub4}`),
    ),
  );

  const ProductTypes = view_MD.filter(
    (item, index, self) =>
      index ===
      self.findIndex(
        (t) =>
          // เช็คเงื่อนไขความซ้ำจากชื่อสินค้า
          (t.Product_Type_Sub4 || t.Product_name) ===
          (item.Product_Type_Sub4 || item.Product_name),
      ),
  );

  const SelectProduct = (ToggleProduct: string) => {
    onUpdate(`Special:${ToggleProduct.split("|")[0]}`);
  };

  const CheckProductReference = (Value: string) => {
    const Check_FG = view_MD.filter((item) => item.Product_name === Value);

    if (
      Check_FG[0]?.Product_FG[0].includes("FG") ||
      Check_FG[0]?.Product_FG[0].includes("FM") ||
      Check_FG[0]?.Product_FG[0].includes("FP")
    ) {
      onUpdate(`Special:${Value.split("|")[0]}`);
    } else {
      onReference(Check_FG[0]?.Product_Serie);
    }
  };

  return (
    <div className="grid grid-cols-5 gap-5 text-lg font-bold p-8 max-[600px]:grid-cols-1 max-[600px]:gap-2 max-[800px]:grid-cols-2 max-[800px]:gap-2 max-[1200px]:grid-cols-3 max-[1200px]:gap-2 max-[1600px]:grid-cols-4 max-[1600px]:gap-2">
      {[...uniqueProductTypes].sort().map((item, index) => {
        return (
          <div key={index}>
            <div
              className="cursor-pointer box-size-Images"
              onClick={() => SelectProduct(item)}
            >
              <div className="flex items-end h-full">
                <Image
                  loader={myLoader}
                  src={`${`http://localhost:5005/api/Picture/Product?serie=${encodeURIComponent(item)}&code=${encodeURIComponent(item)}`}`}
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

      {ProductTypes.map((item, index) => (
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
    </div>
  );
}
