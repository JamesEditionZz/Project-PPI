"use client";
import React, { useState, useRef, useEffect } from "react";

export default function AddProductModal({
  isOpen,
  onClose,
  onRefresh,
}: {
  isOpen: boolean;
  onClose: () => void;
  onRefresh: () => void;
}) {
  const [formData, setFormData] = React.useState({
    Product_Group: "",
    Product_FG: "",
    Product_Header: "",
    Product_Type_Main: "",
    Product_Type_Sub: "",
    Product_Type_Sub2: "",
    Product_Type_Sub3: "",
    Product_Type_Sub4: "",
    Product_Type_Sub5: "",
    Product_Header_TH: "",
    Product_Type_Main_TH: "",
    Product_Type_Sub_TH: "",
    Product_Type_Sub2_TH: "",
    Product_Type_Sub3_TH: "",
    Product_Type_Sub4_TH: "",
    Product_Type_Sub5_TH: "",
    Product_Serie: "",
    Product_name: "",
    Product_Code: "",
    Product_price: "",
    Description: "",
    Product_Path_img: "",
    Price_Validity: "",
    Sub_Product_1: "",
    Sub_Product_2: "",
    Sub_Product_3: "",
    Sub_Product_4: "",
    Sub_Product_5: "",
  });

  const [loading, setLoading] = React.useState(false);

  // Param รับข้อมูลจากการ Fecth Data
  const [groupOptions, setGroupOptions] = React.useState<any[]>([]);
  const [groupData, setGroupData] = React.useState<any[]>([]);
  const [groupMainOptions, setGroupMainOptions] = React.useState<any[]>([]);
  const [product_Type_Main, setProduct_Type_Main] = React.useState<any[]>([]);
  const [product_Type_Sub, setProduct_Type_Sub] = React.useState<any[]>([]);
  const [product_Type_Sub2, setProduct_Type_Sub2] = React.useState<any[]>([]);
  const [product_Type_Sub3, setProduct_Type_Sub3] = React.useState<any[]>([]);
  const [product_Type_Sub4, setProduct_Type_Sub4] = React.useState<any[]>([]);
  const [product_Type_Sub5, setProduct_Type_Sub5] = React.useState<any[]>([]);

  // 1. ตัวแปรสถานะเปิด/ปิด Dropdown ของแต่ละช่อง
  const [isOpens, setIsOpens] = React.useState(false);
  const [isCodeOpen, setIsCodeOpen] = React.useState(false);
  const [isMainOpen, setIsMainOpen] = useState(false);
  const [isSubOpen, setIsSubOpen] = useState(false);
  const [isSub2Open, setIsSub2Open] = useState(false);
  const [isSub3Open, setIsSub3Open] = useState(false);
  const [isSub4Open, setIsSub4Open] = useState(false);
  const [isSub5Open, setIsSub5Open] = useState(false);

  // 2. Ref สำหรับเช็คคลิกนอกกรอบ (ถ้าต้องการให้คลิกปิดอัตโนมัติ)
  const dropdownRef = useRef<HTMLDivElement>(null);
  const codeDropdownRef = useRef<HTMLDivElement>(null);
  const mainRef = useRef<HTMLDivElement>(null);
  const subRef = useRef<HTMLDivElement>(null);
  const sub2Ref = useRef<HTMLDivElement>(null);
  const sub3Ref = useRef<HTMLDivElement>(null);
  const sub4Ref = useRef<HTMLDivElement>(null);
  const sub5Ref = useRef<HTMLDivElement>(null);

  // ฟิลด์ที่ต้องเคลียร์เมื่อ Group Product เปลี่ยน
  const CLEAR_ON_GROUP_CHANGE = {
    Product_Serie: "",
    Product_Type_Main: "",
    Product_Type_Sub: "",
    Product_Type_Sub2: "",
    Product_Type_Sub3: "",
    Product_Type_Sub4: "",
    Product_Type_Sub5: "",
  };

  // ฟิลด์ที่ต้องเคลียร์เมื่อ Product Serie เปลี่ยน
  const CLEAR_ON_SERIE_CHANGE = {
    Product_Type_Main: "",
    Product_Type_Sub: "",
    Product_Type_Sub2: "",
    Product_Type_Sub3: "",
    Product_Type_Sub4: "",
    Product_Type_Sub5: "",
  };

  // ฟังก์ชันดึงข้อมูล Group Product จาก API
  useEffect(() => {
    if (isOpen) {
      const fetchGroupProducts = async () => {
        try {
          const res = await fetch(`http://localhost:5005/Get_Products`);
          const result = await res.json();
          // สมมติว่า result ที่ได้มาเป็น Array ของชื่อ FG หรืออิงตามโครงสร้างข้อมูลจริง
          setGroupOptions(result);
        } catch (error) {
          console.error("Failed to fetch products:", error);
        }
      };
      fetchGroupProducts();
    }
  }, [isOpen]);

  useEffect(() => {
    if (formData) {
      const fecthform = async () => {
        try {
          const res = await fetch(`http://localhost:5005/API/FindAdd`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ formData }),
          });

          const result = await res.json();
          const uniqueSeries = Array.from(
            new Set(
              result.map((item: any) => item.Product_Serie).filter(Boolean),
            ),
          );

          const unique_Type_Main = Array.from(
            new Set(
              result.map((item: any) => item.Product_Type_Main).filter(Boolean),
            ),
          );

          const Product_Type_Sub = Array.from(
            new Set(
              result.map((item: any) => item.Product_Type_Sub).filter(Boolean),
            ),
          );
          const Product_Type_Sub2 = Array.from(
            new Set(
              result.map((item: any) => item.Product_Type_Sub2).filter(Boolean),
            ),
          );
          const Product_Type_Sub3 = Array.from(
            new Set(
              result.map((item: any) => item.Product_Type_Sub3).filter(Boolean),
            ),
          );
          const Product_Type_Sub4 = Array.from(
            new Set(
              result.map((item: any) => item.Product_Type_Sub4).filter(Boolean),
            ),
          );
          const Product_Type_Sub5 = Array.from(
            new Set(
              result.map((item: any) => item.Product_Type_Sub5).filter(Boolean),
            ),
          );
          setGroupData(result);
          setGroupMainOptions(uniqueSeries);
          setProduct_Type_Main(unique_Type_Main);
          setProduct_Type_Sub(Product_Type_Sub);
          setProduct_Type_Sub2(Product_Type_Sub2);
          setProduct_Type_Sub3(Product_Type_Sub3);
          setProduct_Type_Sub4(Product_Type_Sub4);
          setProduct_Type_Sub5(Product_Type_Sub5);
        } catch (error) {
          console.error("Error fetching form:", error);
        }
      };

      fecthform();
    }
  }, [formData]);

  // ฟังก์ชันอัปเดตค่าเมื่อพิมพ์ใน Input
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // ฟังก์ชันกดบันทึกส่งข้อมูลไป Backend
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const response = await fetch("http://localhost:5005/API/Add_Product", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await response.json();
      if (response.ok) {
        alert("บันทึกข้อมูลสำเร็จ!");
        onRefresh();
        onClose();
      } else {
        alert("เกิดข้อผิดพลาด: " + (result.message || "ไม่สามารถบันทึกได้"));
      }
    } catch (error) {
      console.error("Error submitting form:", error);
      alert("ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้");
    } finally {
      setLoading(false);
    }
  };

  // ปิด Dropdown เมื่อคลิกนอกคอมโพเนนต์
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      const pairs: [
        React.RefObject<HTMLDivElement | null>,
        (v: boolean) => void,
      ][] = [
        [dropdownRef, setIsOpens],
        [codeDropdownRef, setIsCodeOpen],
        [mainRef, setIsMainOpen],
        [subRef, setIsSubOpen],
        [sub2Ref, setIsSub2Open],
        [sub3Ref, setIsSub3Open],
        [sub4Ref, setIsSub4Open],
        [sub5Ref, setIsSub5Open],
      ];
      pairs.forEach(([ref, setter]) => {
        if (ref.current && !ref.current.contains(target)) setter(false);
      });
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [
    formData.Product_Group,
    formData.Product_Serie,
    formData.Product_Type_Main,
    formData.Product_Type_Sub,
    formData.Product_Type_Sub2,
    formData.Product_Type_Sub3,
    formData.Product_Type_Sub4,
    formData.Product_Type_Sub5,
  ]);

  // เปลี่ยนค่า Group Product (ใช้ทั้งตอนพิมพ์และตอนเลือก)
  const changeGroup = (value: string) => {
    setFormData((prev) => {
      if (prev.Product_Group === value) return prev; // ไม่เปลี่ยนจริง ไม่ต้องเคลียร์
      return { ...prev, Product_Group: value, ...CLEAR_ON_GROUP_CHANGE };
    });
  };

  // เปลี่ยนค่า Product Serie (ใช้ทั้งตอนพิมพ์และตอนเลือก)
  const changeSerie = (value: string) => {
    setFormData((prev) => {
      if (prev.Product_Serie === value) return prev;
      return { ...prev, Product_Serie: value, ...CLEAR_ON_SERIE_CHANGE };
    });
  };

  if (!isOpen) return null;

  const filteredOptions = groupOptions?.filter((item: any) =>
    String(item?.Product_Type || "")
      ?.toLowerCase()
      ?.includes((formData?.Product_Group || "")?.toLowerCase()),
  );
  const filteredCodes = groupMainOptions?.filter((item) =>
    item
      ?.toLowerCase()
      ?.includes((formData?.Product_Serie || "")?.toLowerCase()),
  );
  // 1. กรองสำหรับ Type Main
  const filteredMainOptions = product_Type_Main.filter((item: string) =>
    item
      .toLowerCase()
      .includes(formData.Product_Type_Main?.toLowerCase() || ""),
  );

  // 2. กรองสำหรับ Type Sub
  const filteredSubOptions = product_Type_Sub.filter((item: string) =>
    item.toLowerCase().includes(formData.Product_Type_Sub?.toLowerCase() || ""),
  );

  // 3. กรองสำหรับ Type Sub 2
  const filteredSub2Options = product_Type_Sub2.filter((item: string) =>
    item
      .toLowerCase()
      .includes(formData.Product_Type_Sub2?.toLowerCase() || ""),
  );

  // (ทำแบบเดียวกันนี้ต่อให้กับ Sub 3, Sub 4, Sub 5)
  const filteredSub3Options = product_Type_Sub3.filter((item: string) =>
    item
      .toLowerCase()
      .includes(formData.Product_Type_Sub3?.toLowerCase() || ""),
  );

  const filteredSub4Options = product_Type_Sub4.filter((item: string) =>
    item
      .toLowerCase()
      .includes(formData.Product_Type_Sub4?.toLowerCase() || ""),
  );

  const filteredSub5Options = product_Type_Sub5.filter((item: string) =>
    item
      .toLowerCase()
      .includes(formData.Product_Type_Sub5?.toLowerCase() || ""),
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col my-8">
        {/* Modal Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100">
          <div className="text-xl font-bold text-gray-800">Add New Product</div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 font-bold text-xl px-2 rounded-lg hover:bg-gray-100 transition-all"
          >
            &times;
          </button>
        </div>

        {/* Modal Body (Scrollable Form) */}
        <form
          onSubmit={handleSubmit}
          className="p-6 overflow-y-auto space-y-6 flex-1"
        >
          {/* Main Product / Searchable Inputs */}
          <div>
            <h3 className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-3">
              Main Product Selection
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative" ref={dropdownRef}>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Group Product
                </label>
                <input
                  type="text"
                  name="Product_Group"
                  value={formData.Product_Group}
                  onChange={(e) => {
                    changeGroup(e.target.value);
                    setIsOpens(true);
                  }}
                  onFocus={() => setIsOpens(true)}
                  autoComplete="off"
                  placeholder="ระบุหรือค้นหา FG..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                />
                {isOpens && filteredOptions.length > 0 && (
                  <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredOptions.map((option: any, index: number) => (
                      <li
                        key={index}
                        onClick={() => {
                          changeGroup(option.Product_Type);
                          setIsOpens(false);
                        }}
                        className="px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition-colors"
                      >
                        {option.Product_Type} {/* แสดงผล Property นั้น */}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {/* Product Code Searchable Input */}
              <div className="relative" ref={codeDropdownRef}>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Product Serie
                </label>
                <input
                  type="text"
                  name="Product_Serie"
                  value={formData.Product_Serie}
                  onChange={(e) => {
                    changeSerie(e.target.value);
                    setIsCodeOpen(true);
                  }}
                  onFocus={() => setIsCodeOpen(true)}
                  autoComplete="off"
                  placeholder="ระบุหรือค้นหา Code..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white disabled:bg-gray-100 disabled:text-gray-400 disabled:cursor-not-allowed disabled:border-gray-200"
                  disabled={formData.Product_Group === ""}
                />
                {isCodeOpen && filteredCodes.length > 0 && (
                  <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredCodes.map((option: string, index: number) => (
                      <li
                        key={index}
                        onClick={() => {
                          changeSerie(option);
                          setIsCodeOpen(false);
                        }}
                        className="px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition-colors"
                      >
                        {option}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Section 1: General Information */}
          <div>
            <h3 className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-3">
              1. General Information
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Product FG
                </label>
                <input
                  type="text"
                  name="Product_FG"
                  value={formData.Product_FG}
                  onChange={handleChange}
                  placeholder="ระบุรหัสสินค้า..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Product Name
                </label>
                <input
                  type="text"
                  name="Product_name"
                  value={formData.Product_name}
                  onChange={handleChange}
                  placeholder="ระบุชื่อสินค้า..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Product Code
                </label>
                <input
                  type="text"
                  name="Product_Code"
                  value={formData.Product_Code}
                  onChange={handleChange}
                  placeholder="ระบุโค้ดสินค้า..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Header & Types (English) */}
          <div>
            <h3 className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-3">
              2. Header & Categories (EN)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* 1. Type Main */}
              <div className="relative" ref={mainRef}>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Type Main
                </label>
                <input
                  type="text"
                  name="Product_Type_Main"
                  value={formData.Product_Type_Main}
                  onChange={(e) => {
                    handleChange(e);
                    setIsMainOpen(true);
                  }}
                  onFocus={() => setIsMainOpen(true)}
                  autoComplete="off"
                  placeholder="ระบุหรือค้นหา Type Main..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                />
                {isMainOpen && filteredMainOptions?.length > 0 && (
                  <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredMainOptions.map((option: any, index: number) => (
                      <li
                        key={index}
                        onClick={() => {
                          setFormData((prev: any) => ({
                            ...prev,
                            Product_Type_Main: option, // ปรับ Property ตามโครงสร้างข้อมูลของคุณ
                          }));
                          setIsMainOpen(false);
                        }}
                        className="px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition-colors"
                      >
                        {option}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* 2. Type Sub */}
              <div className="relative" ref={subRef}>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Type Sub
                </label>
                <input
                  type="text"
                  name="Product_Type_Sub"
                  value={formData.Product_Type_Sub}
                  onChange={(e) => {
                    handleChange(e);
                    setIsSubOpen(true);
                  }}
                  onFocus={() => setIsSubOpen(true)}
                  autoComplete="off"
                  placeholder="ระบุหรือค้นหา Type Sub..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                />
                {isSubOpen && filteredSubOptions?.length > 0 && (
                  <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredSubOptions.map((option: any, index: number) => (
                      <li
                        key={index}
                        onClick={() => {
                          setFormData((prev: any) => ({
                            ...prev,
                            Product_Type_Sub: option,
                          }));
                          setIsSubOpen(false);
                        }}
                        className="px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition-colors"
                      >
                        {option}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* 3. Type Sub 2 */}
              <div className="relative" ref={sub2Ref}>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Type Sub 2
                </label>
                <input
                  type="text"
                  name="Product_Type_Sub2"
                  value={formData.Product_Type_Sub2}
                  onChange={(e) => {
                    handleChange(e);
                    setIsSub2Open(true);
                  }}
                  onFocus={() => setIsSub2Open(true)}
                  autoComplete="off"
                  placeholder="ระบุหรือค้นหา Type Sub 2..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                />
                {isSub2Open && filteredSub2Options?.length > 0 && (
                  <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredSub2Options.map((option: any, index: number) => (
                      <li
                        key={index}
                        onClick={() => {
                          setFormData((prev: any) => ({
                            ...prev,
                            Product_Type_Sub2: option,
                          }));
                          setIsSub2Open(false);
                        }}
                        className="px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition-colors"
                      >
                        {option}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* 4. Type Sub 3 */}
              <div className="relative" ref={sub3Ref}>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Type Sub 3
                </label>
                <input
                  type="text"
                  name="Product_Type_Sub3"
                  value={formData.Product_Type_Sub3}
                  onChange={(e) => {
                    handleChange(e);
                    setIsSub3Open(true);
                  }}
                  onFocus={() => setIsSub3Open(true)}
                  autoComplete="off"
                  placeholder="ระบุหรือค้นหา Type Sub 3..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                />
                {isSub3Open && filteredSub3Options?.length > 0 && (
                  <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredSub3Options.map((option: any, index: number) => (
                      <li
                        key={index}
                        onClick={() => {
                          setFormData((prev: any) => ({
                            ...prev,
                            Product_Type_Sub3: option,
                          }));
                          setIsSub3Open(false);
                        }}
                        className="px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition-colors"
                      >
                        {option}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* 5. Type Sub 4 */}
              <div className="relative" ref={sub4Ref}>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Type Sub 4
                </label>
                <input
                  type="text"
                  name="Product_Type_Sub4"
                  value={formData.Product_Type_Sub4}
                  onChange={(e) => {
                    handleChange(e);
                    setIsSub4Open(true);
                  }}
                  onFocus={() => setIsSub4Open(true)}
                  autoComplete="off"
                  placeholder="ระบุหรือค้นหา Type Sub 4..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                />
                {isSub4Open && filteredSub4Options?.length > 0 && (
                  <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredSub4Options.map((option: any, index: number) => (
                      <li
                        key={index}
                        onClick={() => {
                          setFormData((prev: any) => ({
                            ...prev,
                            Product_Type_Sub4: option,
                          }));
                          setIsSub4Open(false);
                        }}
                        className="px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition-colors"
                      >
                        {option}
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {/* 6. Type Sub 5 */}
              <div className="relative" ref={sub5Ref}>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Type Sub 5
                </label>
                <input
                  type="text"
                  name="Product_Type_Sub5"
                  value={formData.Product_Type_Sub5}
                  onChange={(e) => {
                    handleChange(e);
                    setIsSub5Open(true);
                  }}
                  onFocus={() => setIsSub5Open(true)}
                  autoComplete="off"
                  placeholder="ระบุหรือค้นหา Type Sub 5..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                />
                {isSub5Open && filteredSub5Options?.length > 0 && (
                  <ul className="absolute z-50 w-full mt-1 bg-white border border-gray-200 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                    {filteredSub5Options.map((option: any, index: number) => (
                      <li
                        key={index}
                        onClick={() => {
                          setFormData((prev: any) => ({
                            ...prev,
                            Product_Type_Sub5: option,
                          }));
                          setIsSub5Open(false);
                        }}
                        className="px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 cursor-pointer transition-colors"
                      >
                        {option}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Header & Types (Thai) */}
          <div>
            <h3 className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-3">
              3. Header & Categories (TH)
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Header (TH)
                </label>
                <input
                  type="text"
                  name="Product_Header_TH"
                  value={formData.Product_Header_TH}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Type Main (TH)
                </label>
                <input
                  type="text"
                  name="Product_Type_Main_TH"
                  value={formData.Product_Type_Main_TH}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Type Sub (TH)
                </label>
                <input
                  type="text"
                  name="Product_Type_Sub_TH"
                  value={formData.Product_Type_Sub_TH}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Type Sub 2 (TH)
                </label>
                <input
                  type="text"
                  name="Product_Type_Sub2_TH"
                  value={formData.Product_Type_Sub2_TH}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Type Sub 3 (TH)
                </label>
                <input
                  type="text"
                  name="Product_Type_Sub3_TH"
                  value={formData.Product_Type_Sub3_TH}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Type Sub 4 (TH)
                </label>
                <input
                  type="text"
                  name="Product_Type_Sub4_TH"
                  value={formData.Product_Type_Sub4_TH}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Type Sub 5 (TH)
                </label>
                <input
                  type="text"
                  name="Product_Type_Sub5_TH"
                  value={formData.Product_Type_Sub5_TH}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Section 5: Image, Path & Validity */}
          <div>
            <h3 className="text-sm font-semibold text-indigo-600 uppercase tracking-wider mb-3">
              4. Additional Details
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Product Path Image
                </label>
                <input
                  type="text"
                  name="Product_Path_img"
                  value={formData.Product_Path_img}
                  onChange={handleChange}
                  placeholder="/images/product..."
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">
                  Price Validity (วันหมดอายุราคา)
                </label>
                <input
                  type="date"
                  name="Price_Validity"
                  value={formData.Price_Validity}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-xs font-medium text-gray-700 mb-1">
                Description (รายละเอียด)
              </label>
              <textarea
                name="Description"
                value={formData.Description}
                onChange={handleChange}
                rows={3}
                placeholder="ระบุรายละเอียดสินค้า..."
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Modal Footer (Buttons) */}
          <div className="flex justify-end gap-3 pt-4 border-t border-gray-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-50 transition-all"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-sm font-medium shadow-sm transition-all disabled:opacity-50"
            >
              {loading ? "กำลังบันทึก..." : "บันทึกข้อมูล"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
