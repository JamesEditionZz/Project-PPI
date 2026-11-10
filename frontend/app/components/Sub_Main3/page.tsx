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
        body: JSON.stringify(`Sub2:${ValueToggle[7]}`),
      });

      const data = await res.json();

      setView_MD(data);
    };
    fetchData();
  }, []);

  //สร้าง Array ใหม่แล้ว เอาข้อมูลที่ลูปไปเก็บไว้ใน Array ใหม่โดยมีเงื่อนไขว่า ถ้า Arrayที่ลูปไม่เท่ากับ Null ให้เก็บก่อน และค่อยเอา Array ที่เท่ากัน Null ไปเก็บ

  const uniqueProductTypes = Array.from(
    new Set(
      view_MD.map((item: any) => {
        // เช็คว่ามีค่าใน Product_Type_Sub3 หรือไม่ (ไม่เป็น null, undefined, หรือค่าว่าง)
        if (item.Product_Type_Sub3 && item.Product_Type_Sub3 !== "null") {
          return item.Product_Type_Sub3;
        } else {
          // ถ้าไม่มี ให้ใช้ Product_name แทน
          return item.Product_name;
        }
      }),
    ),
  );

  const ProductTypes = view_MD.filter((item, index, self) => {
    return (
      index ===
      self.findIndex(
        (t) => {
          return (
            (t.Product_Type_Sub3 || t.Product_name) ===
            (item.Product_Type_Sub3 || item.Product_name)
          );
        },

        // เช็คเงื่อนไขความซ้ำจากชื่อสินค้า
      )
    );
  });

  const SelectProduct = (ToggleProduct: string) => {
    const Check_Path = view_MD.filter(
      (item) => item.Product_Type_Sub3 === ToggleProduct,
    );

    if (Check_Path.length > 0) {
      onUpdate(`Model:${ToggleProduct.split("|")[0]}`);
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
      onUpdate(`Model:${Value.split("|")[0]}`);
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
          // มึงต้องไปหาต้นฉบับ (Original Item) จาก view_MD เพื่อเอา Serie กับ Name มาโชว์รูป
          const originalItem = view_MD.find(
            (original) =>
              original.Product_Type_Sub3 === item ||
              original.Product_name === item,
          );

          // เช็คว่าไอ้คำที่แสดงอยู่เนี่ย มันมาจาก Sub3 หรือเปล่า
          const isSub3 =
            originalItem?.Product_Type_Sub3 === item &&
            item !== "null" &&
            item !== "";

          return (
            <div key={index}>
              <div
                className="cursor-pointer box-size-Images"
                onClick={() => SelectProduct(item)}
              >
                <div className="flex items-center justify-center h-[270px] w-full bg-white overflow-hidden">
                  {isSub3 ? (
                    /* ถ้าเป็น Sub3 ใช้ API ตัวแรก */
                    <Image
                      loader={myLoader}
                      src={`http://localhost:5005/api/Cover/Photo?Main=${encodeURIComponent(item.split("|")[0])}`}
                      width={1000}
                      height={1000}
                      alt={`${item}`}
                      className="max-h-full max-w-full object-contain"
                    />
                  ) : (
                    /* ถ้าไม่ใช่ Sub3 (แสดงว่าเป็น Product_name) ให้ใช้ API ตัวที่สอง */
                    <Image
                      loader={myLoader}
                      src={`http://localhost:5005/api/Product?serie=${encodeURIComponent(originalItem?.Product_Serie)}&code=${encodeURIComponent(originalItem?.Product_name)}`}
                      width={1000}
                      height={1000}
                      alt={`${originalItem?.Product_name}`}
                      className="max-h-full max-w-full object-contain"
                    />
                  )}
                </div>
                <div className="text-center text-base/6 p-1 bg-neutral-700 text-white font-normal font-san mt-auto">
                  <div>{item}</div>
                </div>
              </div>
            </div>
          );
        })}

      {/* {ProductTypes.map((item, index) => (
        <div key={index}>
          <div
            className="cursor-pointer box-size-Images"
            onClick={() => CheckProductReference(item.Product_name)}
          >
            <div className="flex items-end h-full">
              <Image
                loader={myLoader}
                src={`5005/api/Product?serie=${encodeURIComponent(item.Product_Serie)}&code=${encodeURIComponent(item.Product_name)}`}
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
      ))} */}
    </div>
  );
}
