"use client";
import Image from "next/image";
import React, { useEffect, useState } from "react";
import Reference from "../Reference/page";

interface MainProps {
  ValueToggle: any[];
  onUpdate: (value: string) => void;
}

export default function page({ ValueToggle, onUpdate }: MainProps) {
  const [view_MD, setView_MD] = React.useState<any[]>([]);
  const myLoader = ({ src }: { src: string }) => src;

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("http://localhost:5005/Group_MD", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(`Main:${ValueToggle[3]}`),
      });

      const data = await res.json();

      setView_MD(data);
    };
    fetchData();
  }, []);

  const uniqueProductTypes = Array.from(
    new Set(
      view_MD.map(
        (item: any) => `${item.Product_Type_Sub}|${item.Product_Type_Sub_TH}`,
      ),
    ),
  );

  const SelectProduct = (ToggleProduct: string) => {
    onUpdate(ToggleProduct.split("|")[0]);
  };

  return (
    <div className="grid grid-cols-5 gap-5 text-lg font-bold p-8 max-[500px]:grid-cols-1 max-[500px]:gap-2 max-[800px]:grid-cols-2 max-[800px]:gap-2 max-[1200px]:grid-cols-3 max-[1200px]:gap-2 max-[1600px]:grid-cols-4 max-[1600px]:gap-2">
      {[...uniqueProductTypes].sort().map((item, index) => {
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
                  src={`${`http://192.168.10.23:5005/api/Cover/Photo?Main=${encodeURIComponent(item.split("|")[0])}`}`}
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
            {/* ) : ( */}
            <>
              {/* {view_MD.map((item, index) => (
                  <div key={index}>
                    <Image
                      loader={myLoader}
                      src={`http://192.168.10.23:5005/api/Product?serie=${encodeURIComponent(item.Product_Serie)}&code=${encodeURIComponent(item.Product_name)}`}
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
