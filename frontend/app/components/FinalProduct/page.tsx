import Image from "next/image";
import React, { useEffect, useState } from "react";

interface MainProps {
  ValueToggle: any[];
}

export default function page({ ValueToggle }: MainProps) {
  const [view_MD, setView_MD] = React.useState<any[]>([]);
  const [sub2, setSub2] = React.useState<any[]>([]);
  const myLoader = ({ src }: { src: string }) => src;
  const [product_Serie_Toggle, setProduct_Serie_Toggle] =
    React.useState<string>("");
  const [product_Code_Toggle, setProduct_Code_Toggle] =
    React.useState<string>("");
  const [product_Header_Toggle, setProduct_Header_Toggle] =
    React.useState<string>("");
  const [modelCatalog, setModelCatalog] = React.useState<boolean>();
  const [modelColor, setModelColor] = React.useState<boolean>();

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("http://localhost:5005/Group_MD");
      const data = await res.json();

      const filterData = data.filter((item: any) => {
        const searchTerm = ValueToggle && ValueToggle[9];

        if (searchTerm && item.Product_Code) {
          return item.Product_Code.includes(searchTerm);
        }

        return false;
      });

      const DataSub2 = data.filter((item: any) => {
        if (ValueToggle[9] && item.Product_Code) {
          return item.Product_Serie === ValueToggle[9].split("-")[0];
        }

        return false;
      });

      setView_MD(filterData);
      setSub2(DataSub2);
    };
    fetchData();
  }, []);

  const uniqueProductTypes = Array.from(
    new Set(view_MD.map((item: any) => `${item.Product_name}`)),
  );

  const Product_Model = Array.from(
    new Map(view_MD.map((item: any) => [item.Product_Code, item])).values(),
  );

  const Product_Family = Array.from(
    new Map(sub2.map((item: any) => [item.Product_name, item])).values(),
  );

  React.useEffect(() => {
    if (Product_Model && Product_Model.length > 0) {
      setProduct_Serie_Toggle(Product_Model[0]?.Product_Serie);
      setProduct_Code_Toggle(Product_Model[0]?.Product_name);
      setProduct_Header_Toggle(Product_Model[0]?.Product_Header);
    }
  }, [Product_Model]);

  const PDFCatalog = (value: any) => {
    setModelCatalog(true);
    setProduct_Code_Toggle(value);
  };

  const PDFColor = (value: any) => {
    setModelColor(true);
    setProduct_Header_Toggle(value);
  };

  console.log(product_Header_Toggle);
  

  return (
    <div className="mt-5">
      {uniqueProductTypes.map((item, index) => {
        const matched = view_MD.find(
          (p: { Product_name: string }) => p.Product_name === item,
        );

        return (
          <div key={index}>
            <div className="flex w-full gap-4 max-[500px]:block max-[800px]:block">
              <div className="font-bold text-3xl text-neutral-700 p-3 max-[500px]:text-center max-[800px]:text-center">
                <span>{item}</span>
              </div>
            </div>
            <div className="flex w-full gap-4 max-[500px]:block max-[800px]:block ">
              <div className="flex items-center justify-center max-[800]:border-b max-[1200]:mb-3">
                <div className="">
                  <Image
                    loader={myLoader}
                    className="Images-Group-final"
                    src={`${`http://localhost:5005/api/Picture/Product?serie=${encodeURIComponent(product_Serie_Toggle)}&code=${encodeURIComponent(product_Code_Toggle)}&pattern=${encodeURIComponent(product_Code_Toggle)}`}`}
                    width={1000}
                    height={1000}
                    alt={`${item}`}
                  />
                </div>
              </div>
              <div className="w-full flex justify-between max-[1600]:block max-[500]:justify-start">
                <div className="grid grid-flow-col grid-rows-1 max-[1200px]:grid-flow-row max-[1200px]:grid-cols-3 max-[1200]:mb-3">
                  <div className="text-center mx-5">
                    <div>รหัสสินค้า</div>
                    {Product_Model.map((item, index) => (
                      <div key={index}>{item.Product_Code}</div>
                    ))}
                  </div>
                  <div className="text-center mx-5">
                    <div>รหัสกลาง</div>
                    {Product_Model.map((item, index) => (
                      <div key={index}>{item.Product_FG[0]}</div>
                    ))}
                  </div>
                  <div className="text-center mx-5">
                    <div>ราคาขาย</div>
                    {Product_Model.map((item, index) => (
                      <div key={index}>{item.Product_price}</div>
                    ))}
                  </div>
                  <div className="mx-5">
                    <div>รายละเอียด</div>
                    {Product_Model.map((item, index) => (
                      <div key={index}>{item.Product_Description}</div>
                    ))}
                  </div>
                </div>
                <div className="disabous">
                  <div className="grid grid-cols-2 gap-4 justify-items-end max-[1200]:grid-cols-2 max-[1200]:justify-items-start max-[1600]:grid-cols-4 max-[1600]:mt-3">
                    <div className="border border-neutral-400 h-48 w-full">
                      <div className="bg-neutral-400 text-white text-base text-center font-sans font-medium p-2">
                        Catalogue
                      </div>
                      <div className="flex justify-center items-center h-35 bg-white">
                        <div className="flex justify-center p-2">
                          <div
                            className="flex justify-center cursor-pointer"
                            onClick={() => PDFCatalog(item)}
                          >
                            <Image
                              src={"/Icon/pdf.png"}
                              width={80}
                              height={80}
                              alt={item}
                            />
                          </div>
                        </div>
                      </div>
                      {modelCatalog && (
                        <div
                          className="modelCatalog"
                          onClick={() => setModelCatalog(false)}
                        >
                          <div
                            className="model-content-Catalog"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <iframe
                              className="iframepdf"
                              src={`http://localhost:5005/api/Document/Product?serie=${encodeURIComponent(product_Serie_Toggle)}&code=${encodeURIComponent(product_Code_Toggle)}&pattern=${encodeURIComponent(product_Code_Toggle)}`}
                              title="pdf"
                            ></iframe>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className="border border-neutral-400 h-48 w-full">
                      <div className="bg-neutral-400 text-white text-base text-center font-sans font-medium p-2">
                        Material Colour
                      </div>
                      <div className="flex justify-center items-center h-35 bg-white">
                        <div className="flex justify-center p-2">
                          <div
                            className="flex justify-center cursor-pointer"
                            onClick={() => PDFColor(item)}
                          >
                            <Image
                              src={"/Icon/pdf.png"}
                              width={80}
                              height={80}
                              alt={item}
                            />
                          </div>
                        </div>
                      </div>
                      {modelColor && (
                        <div
                          className="modelCatalog"
                          onClick={() => setModelColor(false)}
                        >
                          <div
                            className="model-content-Catalog"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <iframe
                              className="iframepdf"
                              src={`http://192.168.10.23:5005/api/Color?path=${encodeURIComponent(
                                `Materials//`,
                              )}`}
                              title="pdf"
                            ></iframe>
                          </div>
                        </div>
                      )}
                    </div>
                    <div className={`border border-neutral-400 w-full`}>
                      <div className="bg-neutral-400 text-white text-base text-center font-sans font-medium p-2">
                        Drawing
                      </div>
                      <div className="flex justify-center items-center mx-5 p-2 h-30"></div>
                    </div>
                    <div className="border border-neutral-400 h-48 w-full overflow-picture">
                      <div className="bg-neutral-400 text-white text-base text-center font-sans font-medium p-2">
                        Reference
                      </div>
                      <div className="grid grid-cols-2 cursor-pointer max-[700]:grid-cols-2 max-[1200]:grid-cols-3"></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <hr className="mt-5 border-b border-gray-300" />
            <div className="font-bold font-fam text-neutral-700 p-3">
              Product Family
            </div>
            <div className="box-overflow">
              <div className="flex items-end justify-start">
                {Product_Family.map((item, index) => (
                  <div key={index}>
                    <Image
                      loader={myLoader}
                      className="Images-Group-final"
                      src={`${`http://192.168.10.23:5005/api/get_image_by_pattern?path=${encodeURIComponent(
                        matched?.Product_Path_img || "",
                      )}&pattern=${encodeURIComponent(item?.Product_name.split("|")[0])}`}`}
                      width={1000}
                      height={1000}
                      alt={`${item}`}
                    />
                    <span>{item.Product_name}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
