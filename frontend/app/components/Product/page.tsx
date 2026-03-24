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
  }, []);

  const uniqueProductTypes = Array.from(
    new Set(
      view_MD.map(
        (item: any) => `${item.Product_name}`,
      ),
    ),
  );

  const SelectProduct = (ToggleProduct: string) => {
    onUpdate(ToggleProduct.split("|")[0]);
  };

  return (
    <div className="grid grid-cols-5 gap-5 text-lg font-bold p-8 max-[500px]:grid-cols-1 max-[500px]:gap-2 max-[800px]:grid-cols-2 max-[800px]:gap-2 max-[1200px]:grid-cols-3 max-[1200px]:gap-2 max-[1600px]:grid-cols-4 max-[1600px]:gap-2">
      {[...uniqueProductTypes].sort().map((item, index) => {
        const matched = view_MD.find(
          (p: { Product_Serie: string }) =>
            p.Product_Serie === item.split("|")[0],
        );
        return (
          <div key={index}>
            {item ? (
              <div
                className="cursor-pointer box-size-Images"
                onClick={() => SelectProduct(item)}
              >
                <div>
                  <Image
                    loader={myLoader}
                    src={`${`http://localhost:5005/api/get_image_by_pattern?path=${encodeURIComponent(
                      matched?.Product_Path_img || "",
                    )}&pattern=${encodeURIComponent(item.split("|")[0])}`}`}
                    width={1000}
                    height={1000}
                    alt={`${item}`}
                  />
                </div>
                <div className="text-center text-base/6 p-1 bg-neutral-700 text-white font-normal font-san mt-auto">
                  <div>{item}</div>
                </div>
              </div>
            ) : (
              <></>
            )}
          </div>
        );
      })}
    </div>
  );
}
