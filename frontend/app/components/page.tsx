"use client";
import Image from "next/image";
import React, { useEffect } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Header from "./Header/page";
import Main from "./Main/page";
import Sub from "./Sub_Main/page";
import Sub2 from "./Sub_Main2/page";
import Sub3 from "./Sub_Main3/page";
import Sub4 from "./Sub_Main4/page";
import Product from "./Product/page";
import FinalProduct from "./FinalProduct/page";
import IdleLogoutTimer from "../CheckAction/page";

useEffect(() => {
  IdleLogoutTimer();
});

export default function Page() {
  const [selectedFilters, setSelectedFilters] = React.useState<
    Record<number, string[]>
  >({
    0: [], // Product_Header
    1: [], // Product_Type_Main
    2: [], // Product_Type_Sub
    3: [], // Product_Type_Sub2
    4: [], // Product_Type_Sub3
  });
  const [dataProductFull, setDataProductFull] = React.useState<any[]>([]);
  const [isOpen, setIsOpen] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState<boolean>(false);
  const [filterData, setFilterData] = React.useState<any[]>([]);
  const [Toggle, setToggle] = React.useState<any[]>([]);
  const [valueSearch, SetValueSearch] = React.useState<string>("");
  const [model_Report_Problem, setModel_Report_Problem] =
    React.useState<number>(0);
  const [problemDescription, setProblemDescription] =
    React.useState<string>("");
  const [status, setStatus] = React.useState<string>("");
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);

  const myLoader = ({ src }: { src: string }) => src;

  const searchParams = useSearchParams();
  const router = useRouter();

  const SessionID = searchParams.get("id");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:5005/api/Check_Login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ SessionID }),
        });

        const data = await res.json();

        if (!data.Status) {
          router.replace("/");
        } else {
          setStatus(data.Permission);
        }
      } catch (err) {
        console.error("Fetch Error:", err);
      }
    };
    fetchData();
  }, []);

  const FILTER_KEYS = [
    { key: "Product_Header", label: "Product" },
    { key: "Product_Type_Main", label: "Type Main" },
    { key: "Product_Type_Sub", label: "Type Sub" },
    { key: "Product_Type_Sub2", label: "Type Sub 2" },
    { key: "Product_Type_Sub3", label: "Type Sub 3" },
  ] as const;

  const PRICE_MIN = 0;
  const PRICE_MAX = 1000000;
  const [minVal, setMinVal] = React.useState(PRICE_MIN);
  const [maxVal, setMaxVal] = React.useState(PRICE_MAX);

  const getPercent = (value: number) =>
    Math.round(((value - PRICE_MIN) / (PRICE_MAX - PRICE_MIN)) * 100);

  const minPercent = getPercent(minVal);
  const maxPercent = getPercent(maxVal);

  const handleMinChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, "");
    const value = Math.min(Number(raw), maxVal - 1);
    if (!isNaN(value)) setMinVal(value);
  };

  const handleMaxChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value.replace(/,/g, "");
    const value = Math.max(Number(raw));
    if (!isNaN(value)) setMaxVal(value);
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch("http://localhost:5005/API/Full_Product", {
          method: "GET",
          headers: { "Content-Type": "application/json" },
        });

        const data = await res.json();
        setDataProductFull(data);
      } catch (err) {
        console.error("Fetch Error:", err);
      }
    };
    fetchData();
  }, []);

  const SelectProduct = (productType: string) => {
    const parts = productType;
    if (parts && parts.includes(":")) {
      const splitParts = productType.split(":");
      const type = splitParts[0].trim();
      const data = splitParts[1].trim();
      if (type === "Sub2") {
        setToggle((prev) => [...prev, "", "", "", "", "", "", " > ", data]);
      } else if (type === "Model") {
        setToggle((prev) => [...prev, "", "", "", "", " > ", data]);
      } else if (type === "Special") {
        setToggle((prev) => [...prev, "", "", " > ", data]);
      }
    } else {
      setToggle((prev) => [...prev, " > ", parts]);
    }
  };

  const SelectProductFilter = (productType: string) => {
    const filter = filterData.filter((item) =>
      item.Product_name.includes(productType),
    );

    const f = filter[0];
    if (!f) return;

    // ← เพิ่มบรรทัดนี้
    setFilterData([]);

    if (f.Product_Type_Sub2 != null && f.Product_Type_Sub3 != null) {
      setToggle([
        " > ",
        f.Product_Header,
        " > ",
        f.Product_Type_Main,
        " > ",
        f.Product_Type_Sub,
        " > ",
        f.Product_Type_Sub2,
        " > ",
        f.Product_Type_Sub3,
        "",
        "",
        " > ",
        productType,
      ]);
    } else if (f.Product_Type_Sub2 != null) {
      setToggle([
        " > ",
        f.Product_Header,
        " > ",
        f.Product_Type_Main,
        " > ",
        f.Product_Type_Sub,
        " > ",
        f.Product_Type_Sub2,
        "",
        "",
        "",
        "",
        " > ",
        productType,
      ]);
    } else if (f.Product_Type_Sub != null) {
      setToggle([
        " > ",
        f.Product_Header,
        " > ",
        f.Product_Type_Main,
        " > ",
        f.Product_Type_Sub,
        "",
        "",
        "",
        "",
        "",
        "",
        " > ",
        productType,
      ]);
    } else {
      setToggle([
        " > ",
        f.Product_Header,
        " > ",
        f.Product_Type_Main,
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        "",
        " > ",
        productType,
      ]);
    }
  };

  const handleBreadcrumbClick = (index: number) => {
    const newToggle = Toggle.slice(0, index + 1);
    if (newToggle[newToggle.length - 1] === " > ") {
      newToggle.pop();
    }
    setSelectedFilters([]);
    setToggle(newToggle);
  };

  const ShowReference = async (ValueReference: any) => {
    try {
      const serie = ValueReference?.Product_Serie;
      const res = await fetch(
        `http://localhost:5005/api/Picture/ReferenceNonFG?serie=${encodeURIComponent(serie)}`,
      );
      if (!res.ok) {
        return;
      }
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
      }
    } catch (err) {
      console.error(err);
    } finally {
    }
  };

  const FilterProduct = async (filters: Record<number, string[]>) => {
    if (!filters[0]?.length) {
      setFilterData([]);
      return;
    }
    setIsLoading(true);
    try {
      let result = [...dataProductFull];
      for (let level = 0; level < FILTER_KEYS.length; level++) {
        const selected = filters[level];
        if (!selected?.length) break;
        const key = FILTER_KEYS[level].key;
        result = result.filter((product: any) => {
          const val = product[key]?.toString().toUpperCase().trim() ?? "";
          return selected.some((s) => val.includes(s.toUpperCase().trim()));
        });
      }

      // กรองราคา
      result = result.filter((product: any) => {
        const price = Number(product.Product_price ?? 0);
        return price >= minVal && price <= maxVal;
      });

      const unique = result.filter(
        (item: any, i: number, self: any[]) =>
          i === self.findIndex((t) => t.Product_name === item.Product_name),
      );

      setFilterData(unique);
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheck = (level: number, name: string, checked: boolean) => {
    // if (checked) {
    const updated: Record<number, string[]> = { ...selectedFilters };
    updated[level] = checked
      ? [...(selectedFilters[level] || []), name]
      : selectedFilters[level].filter((x) => x !== name);

    for (let i = level + 1; i < FILTER_KEYS.length; i++) {
      updated[i] = [];
    }

    console.log(updated[0].length);

    if (updated[0].length > 0) {
      setSelectedFilters(updated);
      FilterProduct(updated);
    } else {
      setToggle([]);
      setFilterData([]);
      setSelectedFilters([]);
    }
  };

  // เรียงตาม numeric prefix เช่น "2.1.6.3"
  const sortByPrefix = (a: string, b: string): number => {
    const getPrefix = (str: string) => str.match(/^[\d.]+/)?.[0] ?? "";

    const partsA = getPrefix(a).split(".").map(Number);
    const partsB = getPrefix(b).split(".").map(Number);

    for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
      const diff = (partsA[i] ?? 0) - (partsB[i] ?? 0);
      if (diff !== 0) return diff;
    }
    return 0;
  };

  const getDisplayName = (value: string): string => {
    return value.replace(/^[\d.]+\s*/, "").trim();
  };

  const getOptionsForLevel = (level: number): string[] => {
    if (level === 0) {
      return Array.from(
        new Set(
          dataProductFull
            .map((item: any) => item[FILTER_KEYS[0].key]?.toString().trim())
            .filter(Boolean),
        ),
      ).sort(sortByPrefix); // ← เพิ่ม sort ที่ level 0 ด้วย
    }

    let result = [...dataProductFull];
    for (let i = 0; i < level; i++) {
      const selected = selectedFilters[i];
      if (!selected?.length) return [];
      const key = FILTER_KEYS[i].key;
      result = result.filter((product: any) => {
        const val = product[key]?.toString().toUpperCase().trim() ?? "";
        return selected.some((s) => val.includes(s.toUpperCase().trim()));
      });
    }

    return Array.from(
      new Set(
        result
          .map((item: any) => item[FILTER_KEYS[level].key]?.toString().trim())
          .filter(Boolean),
      ),
    ).sort(sortByPrefix); // ← เปลี่ยนจาก parseInt เป็น sortByPrefix
  };

  const SearchProduct = async () => {
    setToggle([]);
    try {
      if (valueSearch != "") {
        setIsLoading(true);
        const search = dataProductFull.filter(
          (item: { Product_Serie: string | string[] }) =>
            item.Product_Serie.includes(
              valueSearch.toString().toLocaleUpperCase(),
            ),
        );

        const uniqueProducts = search.filter(
          (item: any, index: number, self: any[]) =>
            index ===
            self.findIndex((t) => t.Product_name === item.Product_name),
        );
        setFilterData(uniqueProducts);
      } else {
        setToggle([]);
        setFilterData([]);
      }
    } catch (error) {
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const SearchKey = (e: any) => {
    setToggle([]);
    if (e.key == "Enter") {
      if (valueSearch.length > 0) {
        const searchTerm = valueSearch.toString().toLocaleUpperCase();

        const search = dataProductFull.filter(
          (item: {
            Product_Serie?: string;
            Product_Code?: string;
            Product_FG?: string;
            Product_name?: string;
          }) => {
            const serie = item.Product_Serie?.toLocaleUpperCase() || "";
            const code = item.Product_Code?.toLocaleUpperCase() || "";
            const fg = item.Product_FG?.toLocaleUpperCase() || "";
            const name = item.Product_name?.toLocaleUpperCase() || "";

            return (
              serie.includes(searchTerm) ||
              code.includes(searchTerm) ||
              fg.includes(searchTerm) ||
              name.includes(searchTerm)
            );
          },
        );

        const uniqueProducts = search.filter(
          (item: any, index: number, self: any[]) =>
            index ===
            self.findIndex((t) => t.Product_name === item.Product_name),
        );
        setFilterData(uniqueProducts);
      } else {
        setToggle([]);
        setFilterData([]);
      }
    }
  };

  const Backdrop = () => {
    setToggle((prev) => {
      let arr = [...prev];

      while (arr.length > 0 && arr[arr.length - 1] === "") {
        arr.pop();
      }

      if (arr.length >= 2) {
        arr.pop();
        arr.pop();
      }

      while (arr.length > 0 && arr[arr.length - 1] === "") {
        arr.pop();
      }

      return arr;
    });
  };

  const SubmitReport = async () => {
    try {
      // 2. ใช้ FormData เพื่อส่งทั้งข้อความและไฟล์ไปพร้อมกัน
      const formData = new FormData();
      formData.append("problemDescription", problemDescription || "");
      formData.append("SessionID", SessionID || "");

      if (selectedFile) {
        formData.append("file", selectedFile); // แนบไฟล์ถ้ามี
      }

      const res = await fetch("http://localhost:5005/api/report_problem", {
        method: "POST",
        body: formData,
      });

      if (res.ok) {
        setModel_Report_Problem(2); // ส่งสำเร็จ
        setSelectedFile(null); // เคลียร์ไฟล์
      } else {
        alert("เกิดข้อผิดพลาดในการส่งข้อมูล");
      }
    } catch (error) {
      console.error(error);
      alert("ไม่สามารถเชื่อมต่อกับ Server ได้");
    }
  };

  return (
    <>
      {(SessionID?.length ?? 0) > 0 && (
        <div className="fixed bottom-4 right-4 z-50">
          <button
            type="button"
            className="fixed bottom-6 right-6 z-50 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white font-bold w-12 h-12 rounded-full shadow-lg shadow-orange-500/30 flex items-center justify-center text-lg transition-all duration-300 hover:scale-110 active:scale-95 cursor-pointer group"
            onClick={() => setModel_Report_Problem(1)}
            title="ข้อเสนอ/แนะนำ/ปรับปรุง"
          >
            {/* ไอคอนกระดิ่งหรือเครื่องหมาย พร้อม Animation กระพริบเบาๆ */}
            <span className="group-hover:rotate-12 transition-transform duration-200">
              💡
            </span>
            {/* จุดแดงแจ้งเตือนเล็กๆ (ถ้าต้องการเปิดปิดสามารถลบออกได้) */}
            <span className="absolute top-0 right-0 w-3.5 h-3.5 bg-red-500 border-2 border-white rounded-full animate-pulse"></span>
          </button>
        </div>
      )}
      {model_Report_Problem === 1 ? (
        <div className="box-problem">
          <div className="box-problem-content shadow-2xl border border-gray-100 animate-in fade-in zoom-in-95 duration-200">
            <div className="box-problem-header">
              {/* Header Title & Close Button */}
              <div className="flex justify-between items-center mb-3 pb-2 border-b border-gray-100">
                <span className="font-bold text-gray-800 text-base flex items-center gap-1.5">
                  <span>💡</span> ข้อเสนอ/แนะนำ/ปรับปรุง
                </span>
                <button
                  type="button"
                  className="w-7 h-7 rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-800 flex items-center justify-center font-bold text-lg transition-all cursor-pointer"
                  onClick={() => setModel_Report_Problem(0)}
                >
                  &times;
                </button>
              </div>

              {/* Form Content */}
              <div className="space-y-3">
                <div>
                  <textarea
                    placeholder="กรอกรายละเอียดข้อเสนอแนะ หรือแจ้งปัญหา..."
                    className="w-full border border-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent rounded-xl p-3 text-sm h-28 resize-none bg-gray-50/50 focus:bg-white transition-all text-gray-700"
                    onChange={(e) => setProblemDescription(e.target.value)}
                  />
                </div>

                {/* Custom File Input */}
                <div>
                  <label className="block text-xs font-semibold text-gray-500 mb-1">
                    แนบไฟล์รูปภาพ (ถ้ามี)
                  </label>
                  <input
                    type="file"
                    onChange={(e) =>
                      setSelectedFile(e.target.files?.[0] ?? null)
                    }
                    className="w-full text-xs text-gray-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 cursor-pointer file:transition-all"
                  />
                </div>

                {/* Submit Button */}
                <div className="pt-1">
                  <button
                    type="button"
                    className="w-full bg-blue-600 hover:bg-blue-700 active:scale-[0.98] text-white font-semibold py-2.5 px-4 rounded-xl shadow-md shadow-blue-200 transition-all cursor-pointer text-sm"
                    onClick={() => SubmitReport()}
                  >
                    ส่งข้อเสนอแนะ 🚀
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        model_Report_Problem === 2 && (
          <div className="box-problem">
            <div className="box-problem-content">
              <div className="box-problem-header">
                <div className=" mb-2">
                  <div className="flex justify-between">
                    <span className="text-xl">ส่งเรื่องสำเร็จ</span>
                    <span
                      className="text-2xl"
                      style={{ cursor: "pointer" }}
                      onClick={() => setModel_Report_Problem(0)}
                    >
                      &times;
                    </span>
                  </div>
                </div>
                <div>
                  <p className="text-gray-700">
                    ส่งเรื่องให้กับแอดมินเรียบร้อยแล้ว
                    เราจะนำเรื่องไปพิจารณาเพื่อปรับปรุงการให้บริการที่ดีขึ้น
                  </p>
                </div>
              </div>
            </div>
          </div>
        )
      )}
      {isOpen && (
        <>
          <div onClick={() => setIsOpen(false)} className="vericaltalbar" />

          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              height: "100%",
              width: 300,
              background: "#fff",
              borderRight: "1px solid #e5e7eb",
              transform: isOpen ? "translateX(0)" : "translateX(-100%)",
              transition: "transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)",
              display: "flex",
              flexDirection: "column",
              overflow: "auto",
              zIndex: "1000",
            }}
          >
            {status === "Admin" && (
              <div
                style={{ cursor: "pointer" }}
                onClick={() => setModel_Report_Problem(0)}
                className=""
              >
                <button
                  className="btn-admin-browser"
                  onClick={() => window.location.assign("./DataProduct")}
                >
                  Admin Browser
                </button>
              </div>
            )}
            {selectedFilters[0]?.length > 0 && (
              <>
                <div style={{ padding: "10px 20px 15px" }}>
                  <div
                    style={{
                      fontSize: 15,
                      fontWeight: 700,
                      textAlign: "center",
                      paddingBottom: 10,
                      marginBottom: 14,
                    }}
                  >
                    <div>Price Rate</div>
                  </div>

                  {/* แสดงค่าที่เลือกอยู่ */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 10,
                    }}
                  >
                    <span
                      style={{
                        fontSize: 13,
                        color: "#3b82f6",
                        fontWeight: 600,
                      }}
                    >
                      <span>
                        ฿
                        <input
                          className="input-customize"
                          value={minVal.toLocaleString()}
                          onChange={(e) => handleMinChange(e)}
                        />
                      </span>
                    </span>
                    <span
                      style={{
                        fontSize: 13,
                        color: "#3b82f6",
                        fontWeight: 600,
                      }}
                    >
                      <span>
                        ฿
                        <input
                          className="input-customize"
                          value={maxVal.toLocaleString()}
                          onChange={(e) => handleMaxChange(e)}
                        />
                      </span>
                    </span>
                  </div>

                  {/* Dual Range Slider */}
                  <div
                    style={{
                      position: "relative",
                      height: 24,
                      marginBottom: 6,
                    }}
                  >
                    {/* Track พื้นหลัง */}
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        transform: "translateY(-50%)",
                        left: 0,
                        right: 0,
                        height: 4,
                        borderRadius: 4,
                        backgroundColor: "#e5e7eb",
                      }}
                    />
                    {/* Active Track */}
                    <div
                      style={{
                        position: "absolute",
                        top: "50%",
                        transform: "translateY(-50%)",
                        left: `${minPercent}%`,
                        width: `${maxPercent - minPercent}%`,
                        height: 4,
                        borderRadius: 4,
                        backgroundColor: "#3b82f6",
                      }}
                    />
                    {/* Min Thumb */}
                    <input
                      type="range"
                      min={PRICE_MIN}
                      max={PRICE_MAX}
                      step={500}
                      value={minVal}
                      onChange={handleMinChange}
                      className="price-thumb"
                      style={{
                        position: "absolute",
                        width: "100%",
                        height: 4,
                        top: "50%",
                        transform: "translateY(-50%)",
                        appearance: "none",
                        background: "transparent",
                        pointerEvents: "none",
                        zIndex: minVal > PRICE_MAX - 1000 ? 5 : 3,
                      }}
                    />
                    {/* Max Thumb */}
                    <input
                      type="range"
                      min={PRICE_MIN}
                      max={PRICE_MAX}
                      step={500}
                      value={maxVal}
                      onChange={handleMaxChange}
                      className="price-thumb"
                      style={{
                        position: "absolute",
                        width: "100%",
                        height: 4,
                        top: "50%",
                        transform: "translateY(-50%)",
                        appearance: "none",
                        background: "transparent",
                        pointerEvents: "none",
                        zIndex: 4,
                      }}
                    />
                  </div>

                  {/* Min / Max Label */}
                  <div
                    style={{
                      display: "flex",
                      justifyContent: "space-between",
                      marginBottom: 12,
                    }}
                  >
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>
                      ฿{PRICE_MIN.toLocaleString()}
                    </span>
                    <span style={{ fontSize: 11, color: "#9ca3af" }}>
                      ฿{PRICE_MAX.toLocaleString()}
                    </span>
                  </div>

                  {/* Apply Button */}
                  <button
                    onClick={() => FilterProduct(selectedFilters)}
                    style={{
                      width: "100%",
                      padding: "7px 0",
                      background: "#3b82f6",
                      color: "#fff",
                      border: "none",
                      borderRadius: 6,
                      fontSize: 13,
                      cursor: "pointer",
                      fontWeight: 600,
                    }}
                  >
                    Apply Filter
                  </button>
                </div>
                <div className="border-b border-gray-200 pt-2"></div>
              </>
            )}
            {/* Price Rate Section */}

            {FILTER_KEYS.map((filter, level) => {
              // แสดง level นี้เมื่อ level ก่อนหน้าเลือกไว้แล้ว
              if (level > 0 && !selectedFilters[level - 1]?.length) return null;

              const options = getOptionsForLevel(level);
              if (!options.length) return null;

              return (
                <div key={level} className="border-gray-200 pt-2">
                  <div className="px-3 font-semibold text-gray-700 text-sm mb-2">
                    {filter.label}
                  </div>

                  {isLoading && level > 0 ? (
                    <div className="text-center py-2 text-xs text-gray-500 animate-pulse">
                      Loading...
                    </div>
                  ) : (
                    <div className="overflow-y-auto max-h-[40vh]">
                      {options.map((type, index) => {
                        const displayName = getDisplayName(type);
                        return (
                          <div
                            className="mx-3 my-1 flex items-center"
                            key={index}
                          >
                            <input
                              type="checkbox"
                              checked={
                                selectedFilters[level]?.includes(type) ?? false
                              }
                              onChange={(e) =>
                                handleCheck(level, type, e.target.checked)
                              }
                            />
                            <span className="mx-2 text-sm text-gray-600">
                              {displayName}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      <div className="flex justify-between items-center px-4 bg-gray-50 border-b border-gray-200">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className={`hamburger ${isOpen ? "open" : ""}`}
        >
          <span className="bar"></span>
          <span className="bar"></span>
          <span className="bar"></span>
        </button>
        <div className="text-red-600 font-[600] font-mono text-2xl">
          <span className="max-[950px]:inline hidden">PPI</span>
          <span className="max-[950px]:hidden inline">
            Practika Product Information
          </span>
        </div>

        <div className="relative flex items-center max-[950px]:px-5">
          <input
            className="form-control"
            placeholder="Search..."
            onChange={(e) => SetValueSearch(e.target.value)}
            onKeyDown={(e) => SearchKey(e)}
          />
          <div
            className="magnifier"
            style={{ cursor: "pointer" }}
            onClick={() => SearchProduct()}
          >
            <div className="lens"></div>
            <div className="handle"></div>
          </div>
        </div>
      </div>
      <div className="container m-auto opacity mt-4 response-500">
        <div className="text-lg text-neutral-600 mb-3 mx-5">
          <div className="w-full px-5 mx-5 bg-white sticky top-0 z-50 max-[500px]:pt-4">
            {Toggle.length > 0 && (
              <span
                style={{
                  position: "absolute",
                  marginLeft: "-45px",
                  cursor: "pointer",
                }}
              >
                <Image
                  src={"/Icon/arrow.png"}
                  width={40}
                  height={40}
                  alt="back"
                  onClick={() => Backdrop()}
                />
              </span>
            )}
            <span
              className="cursor-pointer font-semibold"
              onClick={() => {
                (setToggle([]), setSelectedFilters([]), setFilterData([]));
              }}
            >
              Product
            </span>
            {Toggle.map((item, index) => (
              <span
                key={index}
                className={`${item !== " > " ? "cursor-pointer text-blue-600 ml-1" : "text-gray-400 ml-1"}`}
                onClick={() => {
                  if (item !== " > ") handleBreadcrumbClick(index);
                }}
              >
                {item}
              </span>
            ))}
            <hr className="text-neutral-500 border-1 my-3" />
          </div>
          {filterData.length === 0 ? (
            <>
              {Toggle.length === 0 ? (
                <Header onUpdate={SelectProduct} />
              ) : Toggle.length === 2 ? (
                <Main ValueToggle={Toggle} onUpdate={SelectProduct} />
              ) : Toggle.length === 4 ? (
                <Sub ValueToggle={Toggle} onUpdate={SelectProduct} />
              ) : Toggle.length === 6 ? (
                <Sub2
                  ValueToggle={Toggle}
                  onUpdate={SelectProduct}
                  onReference={ShowReference}
                />
              ) : Toggle.length === 8 ? (
                <Sub3
                  ValueToggle={Toggle}
                  onUpdate={SelectProduct}
                  onReference={ShowReference}
                />
              ) : Toggle.length === 10 ? (
                <Sub4
                  ValueToggle={Toggle}
                  onUpdate={SelectProduct}
                  onReference={ShowReference}
                />
              ) : Toggle.length === 12 ? (
                <Product ValueToggle={Toggle} onUpdate={SelectProduct} />
              ) : (
                Toggle.length === 14 && <FinalProduct ValueToggle={Toggle} />
              )}
            </>
          ) : (
            <div className="grid grid-cols-5 gap-5 text-lg font-bold p-8 max-[600px]:grid-cols-1 max-[600px]:gap-2 max-[800px]:grid-cols-2 max-[800px]:gap-2 max-[1200px]:grid-cols-3 max-[1200px]:gap-2 max-[1600px]:grid-cols-4 max-[1600px]:gap-2">
              {filterData.map((item: any, index) => {
                return (
                  <div
                    key={index}
                    className="border border-gray-200 rounded shadow-sm hover:shadow-md bg-white"
                  >
                    <div
                      className="cursor-pointer box-size-Images"
                      onClick={() => SelectProductFilter(item.Product_name)}
                    >
                      <div className="p-2 flex justify-center bg-white">
                        <Image
                          loader={myLoader}
                          src={`http://localhost:5005/api/Product?serie=${encodeURIComponent(item.Product_Serie)}&code=${encodeURIComponent(item.Product_name)}`}
                          width={200}
                          height={200}
                          className="align-center justify-content-center size-image-picture object-contain"
                          alt={item.Product_name || "product"}
                        />
                      </div>
                      <div className="text-center text-base p-2 bg-neutral-700 text-white font-normal mt-auto">
                        <div>{item.Product_name}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
