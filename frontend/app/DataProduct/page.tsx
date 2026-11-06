"use client";
import React, { useEffect, useState } from "react";
import Product from "./Product/page";
import UserMember from "./UserMember/page";
import RequestUser from "./Problem/page";

export default function DataAdminPage() {
  const [getData, setGetData] = React.useState<any>([]);
  const [showModel, setShowModel] = React.useState<number>(0);
  const [showDropdown, setShowDropdown] = React.useState<boolean>();
  const [selectDataShow, setSelectDataShow] = React.useState<string>("");

  useEffect(() => {
    const datafecth = async () => {
      const res = await fetch("http://localhost:5005/Get_Products");
      const data = await res.json();

      setGetData(data);
      setSelectDataShow(data[0].Product_Type);
    };
    datafecth();
  }, []);

  return (
    <>
      <div className="grid grid-flow-col grid-cols-[200px_1fr]">
        <div className="vertical-menu">
          <div>
            <p
              className="p-2"
              style={
                showModel === 0
                  ? { backgroundColor: "#757575", color: "white" }
                  : { cursor: "pointer" }
              }
              // เปลี่ยนมาใช้ onClick เพื่อสลับค่า true/false ของเมนูย่อย
              onClick={() => {
                setShowModel(0);
                setShowDropdown(!showDropdown); // สลับเปิด-ปิด
              }}
            >
              Product
            </p>

            {/* แสดงรายการเมื่อ showDropdown เป็น true */}
            {showDropdown && (
              <div className="absolute left-50 top-5 bg-white border shadow-md rounded p-2 z-10 w-50">
                <div
                  className="cursor-pointer hover:bg-gray-100 p-1"
                  onClick={() => {
                    setShowDropdown(false);
                    setSelectDataShow("__ALL_PRODUCTS__");
                  }}
                >
                  ดูทั้งหมด
                </div>
                {getData.map((item: any, index: number) => (
                  <div
                    key={index}
                    className="cursor-pointer hover:bg-gray-100 p-1"
                    onClick={() => {
                      setShowDropdown(false);
                      setSelectDataShow(item.Product_Type);
                    }}
                  >
                    {item.Product_Type}
                  </div>
                ))}
              </div>
            )}
            <hr className="border-gray-300" />
            <p
              className="p-2"
              style={
                showModel === 1
                  ? { backgroundColor: "#757575", color: "white" }
                  : { cursor: "pointer" }
              }
              onClick={() => {
                setShowModel(1);
                setShowDropdown(false);
              }}
            >
              Member
            </p>
            <hr className="border-gray-300" />
            <p
              className="p-2"
              style={
                showModel === 2
                  ? { backgroundColor: "#757575", color: "white" }
                  : { cursor: "pointer" }
              }
              onClick={() => {
                setShowModel(2);
                setShowDropdown(false);
              }}
            >
              User Request
            </p>
            <hr className="border-gray-300" />
          </div>
        </div>
        {showModel === 0 ? (
          <Product ParamSelect={selectDataShow} />
        ) : showModel === 1 ? (
          <UserMember />
        ) : showModel === 2 && (
          <RequestUser />
        )}
      </div>
    </>
  );
}
