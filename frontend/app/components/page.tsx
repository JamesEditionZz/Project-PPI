"use client";
import React, { useEffect } from "react";
import Image from "next/image";

interface MainProps {
  onUpdate: (value: string) => void;
}

export default function page({ onUpdate }: MainProps) {
  const [dataProductGroup, setDataProductGroup] = React.useState<any[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("http://localhost:5005/Get_Products");
      const data = await res.json();
      setDataProductGroup(data);
    };
    fetchData();
  }, []);

  const SelectProduct = (ToggleProduct: string) => {
    onUpdate(ToggleProduct);
  };

  return (
    <div>
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
              <div className="font-12">{item.Product_Name.split("|")[0]}</div>
            </div>
            <div className="text-center text-base/6 p-1 bg-neutral-500 text-white font-th font-sans">
              {item.Product_Name.split("|")[1]}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
