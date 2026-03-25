import Image from "next/image";
import React, { useEffect, useState } from "react";

interface MainProps {
  ValueToggle: any[];
  onUpdate: (value: string) => void;
}

export default function page({ ValueToggle, onUpdate }: MainProps) {
  const [view_MD, setView_MD] = React.useState<any[]>([]);
  const myLoader = ({ src }: { src: string }) => src;

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("http://localhost:5005/Group_MD");
      const data = await res.json();

      const filterData = data.filter((item: any) => {
        const searchTerm = ValueToggle && ValueToggle[7];
        if (searchTerm && item.Product_Type_Sub2) {
          return item.Product_Type_Sub2.includes(searchTerm);
        }
        return false;
      });

      setView_MD(filterData);
    };
    fetchData();
  }, [ValueToggle]); // เพิ่ม dependency เพื่อให้กรองใหม่เมื่อ ValueToggle เปลี่ยน

  // กรองให้เหลือแค่รายการที่ชื่อไม่ซ้ำกัน
  const uniqueProductTypes = Array.from(
    new Map(view_MD.map((item: any) => [item.Product_name, item])).values(),
  );

  const SelectProduct = (item: any) => {
    // ส่งค่า Product_name หรือค่าที่พี่จะเอาไปใช้ต่อในหน้าถัดไป
    onUpdate(item.Product_name);
  };

  return (
    <div className="grid grid-cols-5 gap-5 text-lg font-bold p-8 max-[500px]:grid-cols-1 max-[500px]:gap-2 max-[800px]:grid-cols-2 max-[800px]:gap-2 max-[1200px]:grid-cols-3 max-[1200px]:gap-2 max-[1600px]:grid-cols-4 max-[1600px]:gap-2">
      {uniqueProductTypes.map((item: any, index) => {
        return (
          <div key={index}>
            {/* {item.split("|")[0] !== "null" ? ( */}
              <div
                className="cursor-pointer box-size-Images"
                onClick={() => SelectProduct(item)}
              >
                <div>
                  <Image
                    loader={myLoader}
                    // ค้นหาตาม Product_Serie และ Product_name ตามที่พี่ต้องการ
                    src={`http://localhost:5005/api/Product?serie=${encodeURIComponent(item.Product_Serie)}&code=${encodeURIComponent(item.Product_name)}`}
                    width={200} // ปรับขนาดลงหน่อยเพื่อความเร็ว (Next.js จะช่วยจัดการให้)
                    height={200}
                    className="align-center justify-content-center"
                    alt={item.Product_name}
                  />
                </div>
                <div className="text-center text-base/6 p-2 bg-neutral-700 text-white font-normal font-san mt-auto">
                  <div>{item.Product_name}</div>
                </div>
              </div>
            {/* ) : ( */}
              <>
                {/* {view_MD.map((item, index) => (
                  <div key={index}>
                    <Image
                      loader={myLoader}
                      src={`http://localhost:5005/api/Product?serie=${encodeURIComponent(item.Product_Serie)}&code=${encodeURIComponent(item.Product_name)}`}
                      width={1000}
                      height={1000}
                      alt={`${item.Product_Serie}`}
                    />
                  </div>
                ))} */}
              </>
            {/* )} */}
          </div>
        );
      })}
    </div>
  );
}
