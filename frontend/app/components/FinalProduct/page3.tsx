"use client";
import Image from "next/image";
import React, { useEffect, useState, useMemo, useCallback } from "react";

const API = "http://localhost:5005";

interface MainProps {
  ValueToggle: any[];
}

type DocKind = "catalog" | "color" | "drawing" | "spec" | "seller";

interface PdfFile {
  name: string;
  url: string;
}

interface DocState {
  kind: DocKind;
  files: PdfFile[];
  selected: string | null;
  loading: boolean;
}

const DOC_CONFIG: Record<DocKind, { label: string; empty: string }> = {
  catalog: { label: "Catalogue", empty: "ไม่มีไฟล์ Catalogue" },
  color: { label: "Material Colour", empty: "ไม่มีไฟล์ Material Colour" },
  drawing: { label: "Drawing", empty: "ไม่มีไฟล์ Drawing" },
  spec: { label: "Spec", empty: "ไม่มีไฟล์ Spec" },
  seller: { label: "Seller", empty: "ไม่มีไฟล์ประกาศขาย" },
};

const DOC_ORDER: DocKind[] = ["catalog", "color", "drawing", "spec", "seller"];

const focusRing =
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-teal-600 focus-visible:ring-offset-2";

/* ---------------------------------- */
/*  PDF modal (ใช้ร่วมกันทุกประเภท)     */
/* ---------------------------------- */
function PdfModal({
  title,
  files,
  selected,
  loading,
  emptyText,
  onSelect,
  onClose,
}: {
  title: string;
  files: PdfFile[];
  selected: string | null;
  loading: boolean;
  emptyText: string;
  onSelect: (url: string) => void;
  onClose: () => void;
}) {
  const hasFiles = files.length > 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-stretch justify-center bg-neutral-950/70 backdrop-blur-sm sm:items-center sm:p-4"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div
        className="flex h-dvh w-full flex-col overflow-hidden bg-white sm:h-[92dvh] sm:max-w-[1400px] sm:rounded-2xl sm:shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between gap-3 border-b border-neutral-200 px-4 py-3 pt-[max(0.75rem,env(safe-area-inset-top))] sm:pt-3">
          <h2 className="truncate text-base font-semibold text-neutral-900">
            {title}
          </h2>
          <div className="flex shrink-0 items-center gap-2">
            {selected && (
              <a
                href={selected}
                target="_blank"
                rel="noopener noreferrer"
                className={`rounded-lg border border-neutral-300 px-3 py-1.5 text-sm text-neutral-700 transition-colors hover:bg-neutral-100 ${focusRing}`}
              >
                เปิดในแท็บใหม่
              </a>
            )}
            <button
              onClick={onClose}
              aria-label="ปิด"
              className={`flex h-9 w-9 items-center justify-center rounded-lg text-neutral-500 transition-colors hover:bg-neutral-100 hover:text-neutral-900 ${focusRing}`}
            >
              <svg
                width="20"
                height="20"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Body */}
        {loading ? (
          <div className="flex flex-1 items-center justify-center text-neutral-500">
            <span className="h-6 w-6 animate-spin rounded-full border-2 border-neutral-300 border-t-teal-700" />
            <span className="ml-3">กำลังโหลด...</span>
          </div>
        ) : !hasFiles ? (
          <div className="flex flex-1 items-center justify-center px-6 text-center text-lg text-neutral-500 sm:text-2xl">
            {emptyText}
          </div>
        ) : (
          <div className="flex min-h-0 flex-1 flex-col md:flex-row">
            {/* รายชื่อไฟล์: มือถือเป็นแถบเลื่อนแนวนอน / จอใหญ่เป็นแถบข้าง */}
            {files.length > 1 && (
              <div className="flex shrink-0 gap-2 overflow-x-auto border-b border-neutral-200 bg-neutral-50 p-2 md:w-64 md:flex-col md:gap-1 md:overflow-y-auto md:overflow-x-hidden md:border-b-0 md:border-r lg:w-72">
                {files.map((pdf) => {
                  const url = `${API}${pdf.url}`;
                  const active = selected === url;
                  return (
                    <button
                      key={pdf.name}
                      onClick={() => onSelect(url)}
                      title={pdf.name}
                      className={`shrink-0 rounded-lg px-3 py-2 text-left text-sm transition-colors max-md:max-w-[220px] max-md:truncate md:w-full md:break-words ${focusRing} ${
                        active
                          ? "bg-teal-700 font-medium text-white"
                          : "text-neutral-700 hover:bg-neutral-200/70"
                      }`}
                    >
                      {pdf.name}
                    </button>
                  );
                })}
              </div>
            )}

            <div className="min-h-0 flex-1 bg-neutral-100 pb-[env(safe-area-inset-bottom)]">
              {selected && (
                <iframe
                  className="h-full w-full border-none"
                  title={title}
                  src={selected}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

/* ---------------------------------- */
/*  Page                               */
/* ---------------------------------- */
export default function Page({ ValueToggle }: MainProps) {
  const [view_MD, setView_MD] = useState<any[]>([]);
  const [sub2, setSub2] = useState<any[]>([]);
  const myLoader = ({ src }: { src: string }) => src;

  // --- ตัวเลือกปัจจุบัน ---
  const [product_Serie_Toggle, setProduct_Serie_Toggle] = useState<string>("");
  const [product_name_Toggle, setProduct_name_Toggle] = useState<string>("");
  const [product_Header_Toggle, setProduct_Header_Toggle] =
    useState<string>("");
  const [hasDefaultSet, setHasDefaultSet] = useState(false);

  // --- PDF modal (รวมเป็น state เดียว) ---
  const [doc, setDoc] = useState<DocState | null>(null);

  // --- Reference ---
  const [referenceImages, setReferenceImages] = useState<string[]>([]);
  const [selectedImgIndex, setSelectedImgIndex] = useState<number | null>(null);
  const [touchStartX, setTouchStartX] = useState<number | null>(null);

  // 1. โหลดข้อมูลครั้งแรก
  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchData = async () => {
    try {
      const res = await fetch(`${API}/Group_MD`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(`Final_Product:${ValueToggle[13]}`),
      });

      const data = await res.json();
      setView_MD(data);

      if (ValueToggle && ValueToggle[13]) {
        const key = ValueToggle[13];
        const filterfamilyData = data?.filter(
          (item: any) => item?.Product_Serie === data[0]?.Product_Serie,
        );

        const matchedItem = data.find(
          (item: any) =>
            item?.Product_Serie === key ||
            item?.Product_name === key ||
            item?.Product_Code === key ||
            item?.Product_Type_Main === key ||
            item?.Product_Type_Sub === key ||
            item?.Product_Type_Sub2 === key ||
            item?.Product_Type_Sub3 === key ||
            item?.Product_Type_Sub4 === key ||
            item?.Product_Type_Sub5 === key,
        );

        setProduct_Serie_Toggle(matchedItem?.Product_Serie);
        setProduct_name_Toggle(matchedItem?.Product_name);
        setProduct_Header_Toggle(matchedItem?.Product_Header);
        setSub2(filterfamilyData);
      }
    } catch (err) {
      console.error("Fetch error:", err);
    }
  };

  // 2. รหัสสินค้าที่มีทั้งหมด
  const Product_Model = useMemo(() => {
    const searchTerm = product_name_Toggle || (ValueToggle && ValueToggle[13]);
    if (!searchTerm) return [];

    const filtered = view_MD.filter(
      (item: any) =>
        (item?.Product_Code && item?.Product_Code.includes(searchTerm)) ||
        (item?.Product_Serie && item?.Product_Serie.includes(searchTerm)),
    );

    return Array.from(
      new Map(
        filtered.map((item: any) => [item?.Product_Code.trim(), item]),
      ).values(),
    );
  }, [view_MD, product_name_Toggle, ValueToggle]);

  // 3. Product Family
  const Product_Family = useMemo(() => {
    return Array.from(
      new Map(sub2.map((item: any) => [item?.Product_name, item])).values(),
    );
  }, [sub2]);

  // 4. ค่า Default
  useEffect(() => {
    if (Product_Model.length > 0 && !hasDefaultSet) {
      const firstItem = Product_Model[0];
      setProduct_Serie_Toggle(firstItem?.Product_Serie);
      setProduct_name_Toggle(firstItem?.Product_name);
      setProduct_Header_Toggle(firstItem?.Product_Header);
      setHasDefaultSet(true);
    }
  }, [Product_Model, hasDefaultSet]);

  // 5. Reference images
  const currentShowName =
    product_name_Toggle || (ValueToggle && ValueToggle[13]);

  useEffect(() => {
    const getReferences = async () => {
      if (product_Serie_Toggle && currentShowName) {
        try {
          const res = await fetch(
            `${API}/api/Picture/Reference?serie=${encodeURIComponent(product_Serie_Toggle)}&code=${encodeURIComponent(currentShowName)}`,
          );
          const data = await res.json();
          setReferenceImages(Array.isArray(data) ? data : []);
        } catch (err) {
          setReferenceImages([]);
        }
      }
    };
    getReferences();
  }, [product_Serie_Toggle, currentShowName]);

  const Product_Detail = useMemo(() => {
    const searchTerm = product_name_Toggle || (ValueToggle && ValueToggle[13]);
    if (!searchTerm) return [];

    const filtered = view_MD.filter(
      (item: any) =>
        item?.Product_Code === searchTerm || item?.Product_name === searchTerm,
    );

    return Array.from(
      new Map(
        filtered.map((item: any) => [item?.Product_Code.trim(), item]),
      ).values(),
    );
  }, [view_MD, product_name_Toggle, ValueToggle]);

  // --- เปิดเอกสาร PDF ---
  const openDoc = useCallback(
    async (kind: DocKind) => {
      const serie = encodeURIComponent(product_Serie_Toggle);
      const code = encodeURIComponent(currentShowName);

      const endpoint: Record<DocKind, string> = {
        catalog: `/api/Document/Product?serie=${serie}&code=${code}`,
        color: `/api/Material?Main=${encodeURIComponent(product_Header_Toggle)}`,
        drawing: `/api/Drawing?serie=${serie}&code=${code}`,
        spec: `/api/Spec?serie=${serie}`,
        seller: `/api/Seller?serie=${serie}`,
      };

      setDoc({ kind, files: [], selected: null, loading: true });

      try {
        const res = await fetch(`${API}${endpoint[kind]}`);
        if (!res.ok) throw new Error(String(res.status));
        const data = await res.json();
        const files: PdfFile[] = Array.isArray(data) ? data : [];
        setDoc({
          kind,
          files,
          selected: files.length > 0 ? `${API}${files[0].url}` : null,
          loading: false,
        });
      } catch (error) {
        console.error(`Error fetching ${kind}:`, error);
        setDoc({ kind, files: [], selected: null, loading: false });
      }
    },
    [product_Serie_Toggle, product_Header_Toggle, currentShowName],
  );

  // --- Lightbox ---
  const handlePrev = useCallback(() => {
    setSelectedImgIndex((prev) =>
      prev !== null && prev > 0 ? prev - 1 : referenceImages.length - 1,
    );
  }, [referenceImages.length]);

  const handleNext = useCallback(() => {
    setSelectedImgIndex((prev) =>
      prev !== null && prev < referenceImages.length - 1 ? prev + 1 : 0,
    );
  }, [referenceImages.length]);

  // คีย์บอร์ด (Esc / ลูกศร) + ล็อกการเลื่อนหน้าเบื้องหลังตอนเปิด modal
  const anyModalOpen = doc !== null || selectedImgIndex !== null;

  useEffect(() => {
    if (!anyModalOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setDoc(null);
        setSelectedImgIndex(null);
      }
      if (selectedImgIndex !== null) {
        if (e.key === "ArrowLeft") handlePrev();
        if (e.key === "ArrowRight") handleNext();
      }
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
    };
  }, [anyModalOpen, selectedImgIndex, handlePrev, handleNext]);

  // --- ราคา ---
  const renderPrice = (item: any) => {
    const expired = new Date(item?.Price_Validity) <= new Date();
    if (expired || item?.Product_price == null) return "-";
    const isSpecial = String(item?.Product_FG ?? "").slice(-1) === "#";
    return (
      <span className={isSpecial ? "text-red-600" : "text-neutral-900"}>
        {isSpecial
          ? item.Product_price
          : Number(item.Product_price).toLocaleString()}
      </span>
    );
  };

  const productImg = `${API}/api/Picture/Product?serie=${encodeURIComponent(product_Serie_Toggle)}&code=${encodeURIComponent(currentShowName)}`;

  return (
    <div className="min-h-dvh bg-white">
      <div className="mx-auto w-full max-w-[1400px] px-4 py-6 sm:px-6 lg:px-8 lg:py-10">
        {/* ชื่อสินค้า */}
        <header className="mb-6 border-b border-neutral-200 pb-4 lg:mb-8">
          <h1 className="text-2xl font-semibold tracking-tight text-neutral-900 sm:text-3xl lg:text-4xl">
            {currentShowName}
          </h1>
          {product_Serie_Toggle && (
            <p className="mt-1 text-sm text-neutral-500">
              Series {product_Serie_Toggle}
            </p>
          )}
        </header>

        {/* เนื้อหาหลัก */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-10">
          {/* รูปสินค้า */}
          <div className="lg:sticky lg:top-6 lg:self-start">
            <div className="mx-auto w-full max-w-sm rounded-2xl border border-neutral-200 bg-neutral-50 p-3 sm:max-w-md sm:p-5 lg:max-w-none">
              <div className="relative aspect-square w-full">
                <Image
                  loader={myLoader}
                  src={productImg}
                  fill
                  sizes="(min-width: 1024px) 40vw, 90vw"
                  className="object-contain object-center"
                  alt={currentShowName || "product"}
                  unoptimized
                />
              </div>
            </div>
          </div>

          {/* ข้อมูล + เอกสาร */}
          <div className="flex min-w-0 flex-col gap-6">
            {/* ตาราง (จอ md ขึ้นไป) */}
            <div className="hidden overflow-hidden rounded-2xl border border-neutral-200 md:block">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-sm text-neutral-600">
                  <thead className="bg-neutral-50 text-neutral-700">
                    <tr className="border-b border-neutral-200">
                      <th className="px-4 py-3 text-center font-medium">
                        รหัสสินค้า
                      </th>
                      <th className="px-4 py-3 text-center font-medium">
                        รหัสกลาง
                      </th>
                      <th className="px-4 py-3 text-center font-medium">
                        ราคาขาย
                      </th>
                      <th className="px-4 py-3 font-medium">รายละเอียด</th>
                    </tr>
                  </thead>
                  <tbody>
                    {Product_Detail?.map((item: any, idx) => (
                      <tr
                        key={idx}
                        className="border-b border-neutral-100 last:border-0 hover:bg-neutral-50"
                      >
                        <td className="px-4 py-3 text-center font-medium text-neutral-900">
                          {item?.Product_Code}
                        </td>
                        <td className="px-4 py-3 text-center text-neutral-500">
                          {item?.Product_FG || "-"}
                        </td>
                        <td className="px-4 py-3 text-center font-semibold tabular-nums">
                          {renderPrice(item)}
                        </td>
                        <td className="px-4 py-3 text-neutral-500">
                          {item?.Description}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* การ์ดข้อมูล (มือถือ) */}
            <div className="flex flex-col gap-3 md:hidden">
              {Product_Detail?.map((item: any, idx) => (
                <div
                  key={idx}
                  className="rounded-2xl border border-neutral-200 p-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="break-words font-semibold text-neutral-900">
                        {item?.Product_Code}
                      </div>
                      <div className="mt-0.5 text-xs text-neutral-500">
                        รหัสกลาง: {item?.Product_FG || "-"}
                      </div>
                    </div>
                    <div className="shrink-0 text-lg font-semibold tabular-nums">
                      {renderPrice(item)}
                    </div>
                  </div>
                  {item?.Description && (
                    <p className="mt-3 border-t border-neutral-100 pt-3 text-sm leading-relaxed text-neutral-600">
                      {item.Description}
                    </p>
                  )}
                </div>
              ))}
            </div>

            {/* เอกสาร */}
            <section aria-label="เอกสารสินค้า">
              <h2 className="mb-3 text-base font-semibold text-neutral-900">
                เอกสารสินค้า
              </h2>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-5">
                {DOC_ORDER.map((kind) => (
                  <button
                    key={kind}
                    onClick={() => openDoc(kind)}
                    className={`group flex min-h-[112px] flex-col items-center justify-center gap-2 rounded-2xl border border-neutral-200 bg-white p-3 text-center transition-colors hover:border-teal-600 hover:bg-teal-50/40 active:bg-teal-50 ${focusRing}`}
                  >
                    <Image
                      src="/Icon/pdf.png"
                      width={40}
                      height={40}
                      alt=""
                      className="transition-transform group-hover:scale-105"
                    />
                    <span className="text-sm font-medium text-neutral-800">
                      {DOC_CONFIG[kind].label}
                    </span>
                  </button>
                ))}
              </div>
            </section>

            {/* Reference */}
            {referenceImages.length > 0 && (
              <section aria-label="Reference">
                <h2 className="mb-3 text-base font-semibold text-neutral-900">
                  Reference
                  <span className="ml-2 text-sm font-normal text-neutral-400">
                    {referenceImages.length} รูป
                  </span>
                </h2>
                <div className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-5 xl:grid-cols-6">
                  {referenceImages.map((src, idx) => (
                    <button
                      key={idx}
                      onClick={() => setSelectedImgIndex(idx)}
                      className={`relative aspect-square overflow-hidden rounded-xl border border-neutral-200 bg-neutral-50 ${focusRing}`}
                      aria-label={`ดูรูป Reference ที่ ${idx + 1}`}
                    >
                      <img
                        src={src}
                        alt={`ref-${idx}`}
                        loading="lazy"
                        className="h-full w-full object-cover transition-opacity hover:opacity-80"
                      />
                    </button>
                  ))}
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Product Family */}
        {Product_Family.length > 0 && (
          <section className="mt-10 border-t border-neutral-200 pt-6 lg:mt-14">
            <h2 className="mb-4 text-lg font-semibold text-neutral-900">
              Product Family
            </h2>
            <div className="-mx-4 overflow-x-auto px-4 pb-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 [scrollbar-width:thin]">
              <div className="flex snap-x gap-3 sm:gap-4">
                {Product_Family.map((item: any, index) => {
                  const isActive = currentShowName === item?.Product_name;
                  return (
                    <button
                      key={index}
                      onClick={() => {
                        setProduct_Serie_Toggle(item?.Product_Serie);
                        setProduct_name_Toggle(item?.Product_name);
                        setProduct_Header_Toggle(item?.Product_Header);
                      }}
                      aria-current={isActive}
                      className={`w-[120px] shrink-0 snap-start rounded-2xl border p-2 text-center transition-colors sm:w-[150px] lg:w-[170px] ${focusRing} ${
                        isActive
                          ? "border-teal-700 bg-teal-50/60"
                          : "border-neutral-200 hover:border-neutral-400"
                      }`}
                    >
                      <div className="relative aspect-square w-full overflow-hidden rounded-xl bg-white">
                        <Image
                          loader={myLoader}
                          src={`${API}/api/Picture/Product?serie=${encodeURIComponent(item?.Product_Serie)}&code=${encodeURIComponent(item?.Product_name)}`}
                          fill
                          sizes="170px"
                          className="object-contain"
                          alt={item?.Product_name}
                          unoptimized
                        />
                      </div>
                      <div
                        className={`mt-2 line-clamp-2 break-words text-xs font-medium sm:text-sm ${
                          isActive ? "text-teal-800" : "text-neutral-600"
                        }`}
                      >
                        {item?.Product_name}
                      </div>
                    </button>
                )})}
              </div>
            </div>
          </section>
        )}
      </div>

      {/* PDF modal */}
      {doc && (
        <PdfModal
          title={DOC_CONFIG[doc.kind].label}
          files={doc.files}
          selected={doc.selected}
          loading={doc.loading}
          emptyText={DOC_CONFIG[doc.kind].empty}
          onSelect={(url) => setDoc((d) => (d ? { ...d, selected: url } : d))}
          onClose={() => setDoc(null)}
        />
      )}

      {/* Lightbox รูป Reference */}
      {selectedImgIndex !== null && referenceImages[selectedImgIndex] && (
        <div
          className="fixed inset-0 z-[999] flex items-center justify-center bg-black"
          onClick={() => setSelectedImgIndex(null)}
          onTouchStart={(e) => setTouchStartX(e.touches[0].clientX)}
          onTouchEnd={(e) => {
            if (touchStartX === null) return;
            const dx = e.changedTouches[0].clientX - touchStartX;
            if (Math.abs(dx) > 50 && referenceImages.length > 1) {
              dx > 0 ? handlePrev() : handleNext();
            }
            setTouchStartX(null);
          }}
          role="dialog"
          aria-modal="true"
          aria-label="ดูรูป Reference"
        >
          <img
            src={referenceImages[selectedImgIndex]}
            alt="Large preview"
            className="max-h-dvh max-w-full select-none object-contain"
            onClick={(e) => e.stopPropagation()}
            draggable={false}
          />

          <button
            onClick={() => setSelectedImgIndex(null)}
            aria-label="ปิด"
            className="absolute right-3 top-[max(0.75rem,env(safe-area-inset-top))] flex h-11 w-11 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          >
            <svg
              width="22"
              height="22"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
            >
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>

          {referenceImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handlePrev();
                }}
                aria-label="รูปก่อนหน้า"
                className="absolute left-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:left-5 sm:h-12 sm:w-12"
              >
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m15 18-6-6 6-6" />
                </svg>
              </button>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleNext();
                }}
                aria-label="รูปถัดไป"
                className="absolute right-2 top-1/2 flex h-11 w-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/25 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white sm:right-5 sm:h-12 sm:w-12"
              >
                <svg
                  width="26"
                  height="26"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="m9 18 6-6-6-6" />
                </svg>
              </button>
            </>
          )}

          <div className="absolute bottom-[max(1.25rem,env(safe-area-inset-bottom))] left-1/2 -translate-x-1/2 rounded-full bg-black/60 px-4 py-1.5 text-sm text-white">
            {selectedImgIndex + 1} / {referenceImages.length}
          </div>
        </div>
      )}
    </div>
  );
}
