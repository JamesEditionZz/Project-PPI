"use client";
import Image from "next/image";
import React, { Suspense, useEffect, useRef } from "react";
// import * as THREE from "three";
// import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader";
// import { OrbitControls } from "three/examples/jsm/controls/OrbitControls";

export default function page() {
  const [dataProductGroup, setDataProductGroup] = React.useState<any>([]);
  const [selectedProduct, setSelectedProduct] = React.useState<any>([]);
  const [toggle, setToggle] = React.useState<any>([]);
  const [dataProduct, setDataProduct] = React.useState<any>([]);
  const [showProductModel, setShowProductModel] = React.useState<any>("");
  const [modelShowPhoto, setModelShowPhoto] = React.useState<any>(false);
  const [dataFile, setDataFile] = React.useState<any>([]);
  const myLoader = ({ src }: { src: string }) => src;
  const [modelCatalog, setModelCatalog] = React.useState<any>(false);
  const [modelDrawing, setModelDrawing] = React.useState<any>(false);
  const [modelColor, setModelColor] = React.useState<any>(false);
  const [catalogPDF, setCatalogPDF] = React.useState<any>("");
  const [currentIndex, setCurrentIndex] = React.useState<any>(0);
  const [showMenuSelect, setShowMenuSelect] = React.useState<any>(false);
  const [model3D, setModel3D] = React.useState<any>(false);
  const [slideNextProduct, setSlideNextProduct] = React.useState(0);
  const [filter_Product_Serie, setFilter_Product_Serie] = React.useState<any>(
    [],
  );

  const mountRef = useRef<HTMLDivElement>(null);

  // Initialize uniqueProductTypes as an empty array

  let uniqueProductTypes: string[] = [];

  useEffect(() => {
    // เพิ่ม state ปัจจุบันลง history
    window.history.replaceState({ page: 1 }, "");

    const handlePopState = (event: PopStateEvent) => {
      // ลบ element ล่าสุดแทนที่จะไปหน้าอื่น
      setToggle((prev: string | any[]) => prev.slice(0, prev.length - 1));
      // เพิ่ม state ใหม่กลับเข้า history เพื่อป้องกัน back ซ้ำแล้วเปลี่ยนหน้า
      window.history.pushState({ page: 1 }, "");
    };

    window.addEventListener("popstate", handlePopState);

    return () => {
      window.removeEventListener("popstate", handlePopState);
    };
  }, []);

  // useEffect(() => {
  //   if (!model3D || !mountRef.current) return;

  //   const scene = new THREE.Scene();
  //   scene.background = new THREE.Color(0xeeeeee);

  //   const camera = new THREE.PerspectiveCamera(
  //     75,
  //     mountRef.current.clientWidth / mountRef.current.clientHeight,
  //     0.1,
  //     1000,
  //   );
  //   camera.position.z = 5;

  //   const renderer = new THREE.WebGLRenderer({ antialias: true });
  //   renderer.setSize(
  //     mountRef.current.clientWidth,
  //     mountRef.current.clientHeight,
  //   );
  //   mountRef.current.appendChild(renderer.domElement);

  //   // Lights
  //   const ambientLight = new THREE.AmbientLight(0xffffff, 0.8);
  //   scene.add(ambientLight);
  //   const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
  //   directionalLight.position.set(5, 10, 5);
  //   scene.add(directionalLight);

  //   // Controls
  //   const controls = new OrbitControls(camera, renderer.domElement);
  //   controls.enableDamping = true;
  //   controls.dampingFactor = 0.05;
  //   controls.enableZoom = true;
  //   controls.autoRotate = false;
  //   controls.target.set(0, 1, 0);

  //   // Loader
  //   const loader = new GLTFLoader();
  //   const loadedModels: THREE.Object3D[] = [];

  //   loader.load(
  //     "http://192.168.10.23:5005/api/file/360?path=All%20Product/COOK",
  //     (gltf: { scene: any }) => {
  //       const model = gltf.scene;
  //       const box = new THREE.Box3().setFromObject(model);
  //       const center = box.getCenter(new THREE.Vector3());
  //       model.position.x -= center.x;
  //       model.position.y -= center.y;
  //       model.position.z -= center.z;

  //       // ปรับขนาด
  //       model.scale.set(5, 5, 5);

  //       // ถ้าต้องการหมุน
  //       model.rotation.y = Math.PI;

  //       // เพิ่มลง scene
  //       scene.add(model);
  //       loadedModels.push(model);
  //       animate();
  //     },
  //     undefined,
  //     (error: any) => console.error(error),
  //   );

  //   function animate() {
  //     requestAnimationFrame(animate);
  //     controls.update(); // สำคัญถ้าใช้ damping
  //     renderer.render(scene, camera);
  //   }

  //   return () => {
  //     // Cleanup models
  //     loadedModels.forEach((m) => scene.remove(m));

  //     // Cleanup controls & renderer
  //     controls.dispose();
  //     renderer.dispose();

  //     // Cleanup DOM
  //     if (mountRef.current) mountRef.current.innerHTML = "";
  //   };
  // }, [model3D]);

  // useEffect(() => {
  //   const fetchRes = async () => {
  //     const res = await fetch(`http://192.168.10.23:5005/update-from-file`, {
  //       method: "POST",
  //     });
  //   };

  //   fetchRes();

  // }, []);

  useEffect(() => {
    const fetchData = async () => {
      const res = await fetch("http://192.168.10.23:5005/Get_Products");
      const data = await res.json();
      setDataProductGroup(data);
    };
    fetchData();
  }, []);

  useEffect(() => {
    if (dataProduct && dataProduct.length > 0) {
      const productSerieSet = new Set(
        dataProduct.map((item: any) => item.Product_Serie),
      );

      if (productSerieSet.size === 1) {
        setShowProductModel(dataProduct);
      }
    }
  }, [dataProduct]);

  const SelectProduct = (value: string) => {
    setFilter_Product_Serie([]);
    setSlideNextProduct(1);
    setTimeout(() => {
      setSlideNextProduct(2);

      const formattedValue = " > " + value;

      let newToggle: string[];
      let newSelected: string[];

      if (selectedProduct.includes(formattedValue)) {
        newSelected = selectedProduct.filter(
          (item: string) => item !== formattedValue,
        );
        newToggle = toggle.filter((item: string) => item !== value);
      } else {
        newSelected = [...selectedProduct, formattedValue];
        newToggle = [...toggle, value];
      }
      setSelectedProduct(newSelected);
      setToggle(newToggle);

      // ใช้ค่าใหม่แทน toggle เก่า
      findProduct(newToggle);
    }, 700);
  };

  const findProduct = async (newToggle: string[]) => {
    const res = await fetch("http://192.168.10.23:5005/ProductModal", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(newToggle),
    });

    const data = await res.json();

    setDataProduct(data);
  };

  if (selectedProduct.length === 1) {
    uniqueProductTypes = Array.from(
      new Set(
        dataProduct.map(
          (item: any) =>
            `${item.Product_Type_Main}|${item.Product_Type_Main_TH}`,
        ),
      ),
    );
  } else if (selectedProduct.length === 2) {
    uniqueProductTypes = Array.from(
      new Set(
        dataProduct.map(
          (item: any) => `${item.Product_Type_Sub}|${item.Product_Type_Sub_TH}`,
        ),
      ),
    );
  } else if (selectedProduct.length === 3) {
    uniqueProductTypes = Array.from(
      new Set(
        dataProduct.map(
          (item: any) =>
            `${item.Product_Type_Sub2}|${item.Product_Type_Sub2_TH}`,
        ),
      ),
    );
  } else if (selectedProduct.length === 4) {
    uniqueProductTypes = Array.from(
      new Set(dataProduct.map((item: any) => `${item.Product_Serie}`)),
    );
  }

  useEffect(() => {
    const fetchFileProduct = async () => {
      if (showProductModel.length > 0) {
        const res = await fetch("http://192.168.10.23:5005/FindFileProduct", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            Product_Family: dataProduct[0]?.Product_Serie,
          }),
        });
        const data = await res.json();

        setDataFile(data);
      }
    };
    fetchFileProduct();
  }, [showProductModel]);

  type ProductData = {
    [x: string]: any;
    Product_FG: string;
    Product_Path_img?: string;
    Product_name?: string;
    Product_price?: number;
    Description?: string;
    // add other fields as needed
  };

  type DataFileItem = {
    [x: string]: any;
    productData: ProductData;
    files?: {
      catalogFiles?: string[];
      materialFiles?: string[];
      referenceFiles?: string[];
    };
  };

  const uniqueDataFile: DataFileItem[] = Array.isArray(dataFile)
    ? Array.from(
        new Map(
          (dataFile as DataFileItem[]).map((item) => [
            item.productData.Product_FG,
            item,
          ]),
        ).values(),
      )
    : [];

  const PDFCatalog = (value: any) => {
    setModelCatalog(true);
    setCatalogPDF(value);
  };

  const PDFDrawing = (value: any) => {
    setModelDrawing(true);
    setCatalogPDF(value);
  };

  const PDFColor = (value: any) => {
    setModelColor(true);
    setCatalogPDF(value);
  };

  const uniqueProducts = uniqueDataFile.filter(
    (product, index, self) =>
      index ===
      self.findIndex(
        (p) =>
          p.fullDirPath === product.fullDirPath &&
          p.projectReferenceFiles.join(",") ===
            product.projectReferenceFiles.join(","),
      ),
  );

  const images = uniqueProducts.flatMap((product) =>
    product.projectReferenceFiles
      .filter((file: string) => file !== "Thumbs.db")
      .map((file: any) => ({
        productFamily: product.productData.Product_Serie,
        fileName: file,
        fullDirPath: product.fullDirPath,
      })),
  );

  const openModal = (index: any) => {
    setCurrentIndex(index);
    setModelShowPhoto(true);
  };

  const nextSlide = () => {
    setCurrentIndex((prev: any) => (prev + 1) % images.length);
  };

  const prevSlide = () => {
    setCurrentIndex((prev: any) => (prev - 1 + images.length) % images.length);
  };

  const flatData = uniqueDataFile[0];

  const AnimationSlide = (newSelected: any, newToggle: any) => {
    setSlideNextProduct(3);
    setTimeout(() => {
      setSelectedProduct(newSelected);
      setToggle(newToggle);
      setShowProductModel("");
      findProduct(newToggle);
      setSlideNextProduct(4);
    }, 700);
  };

  const BackslideGroup = () => {
    setSlideNextProduct(3);
    setTimeout(() => {
      setSelectedProduct([]);
      setToggle([]);
      setDataProduct([]);
      setShowProductModel("");
      setShowMenuSelect(false);
      setSlideNextProduct(4);
    }, 700);
  };

  const SwiftSelectProduct = async (value: any) => {
    setToggle((prev: string | any[]) => [...prev.slice(0, -1), " > " + value]);
    setSelectedProduct((prev: string | any[]) => [
      ...prev.slice(0, -1),
      " > " + value,
    ]);

    const res = await fetch(`http://192.168.10.23:5005/API/SelectFamily`, {
      method: "POST",
      headers: { "Content-Type": "applicaiton/json" },
      body: JSON.stringify({ Serie: value }),
    });

    const response = await res.json();

    setFilter_Product_Serie(response);
  };

  const uniqueSeries = Array.from(
    new Set(uniqueDataFile.map((i: any) => i?.productData?.Product_name)),
  );

  const resulttoggle = toggle[0]?.substring(toggle[0].indexOf(" ") + 1);

  return (
    <>
      {/* {showMenuSelect && (
        <>
          <div className="Position-Menu mx-2">
            <div
              className="text-neutral-600 cursor-pointer"
              onClick={() => {
                // เมื่อคลิกที่ "Product" ให้ล้างค่าทั้งหมดและย้อนกลับไปหน้าแรก
                setSelectedProduct([]);
                setToggle([]);
                setDataProduct([]);
                setShowProductModel("");
                setShowMenuSelect(false);
              }}
            >
              Product
            </div>
            <div className="mx-4 text-neutral-600 w-40">
              {selectedProduct.map((item, index) => (
                <div
                  key={index}
                  className="cursor-pointer p-1"
                  onClick={() => {
                    // เมื่อคลิกที่รายการใด ให้ตัด array ให้เหลือแค่รายการนั้น
                    const newSelected = selectedProduct.slice(0, index + 1);
                    setSelectedProduct(newSelected);
                    // และตัด array toggle ให้ตรงกันเพื่อใช้ในการเรียก API
                    const newToggle = toggle.slice(0, index + 1);
                    setToggle(newToggle);
                    // เรียก findProduct ด้วยค่าใหม่
                    findProduct(newToggle);
                    // เคลียร์ข้อมูลที่อาจจะแสดงอยู่
                    setShowProductModel("");
                  }}
                >
                  {item}
                  <hr />
                </div>
              ))}
            </div>
          </div>
        </>
      )} */}
      {modelCatalog && (
        <div className="modelCatalog" onClick={() => setModelCatalog(false)}>
          <div
            className="model-content-Catalog"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              className="iframepdf"
              src={`http://192.168.10.23:5005/api/pdf?path=${encodeURIComponent(
                `All Product/${catalogPDF[0]?.split(".")[0]}/${catalogPDF[0]}`,
              )}`}
              title="pdf"
            ></iframe>
          </div>
        </div>
      )}
      {modelDrawing && (
        <div className="modelCatalog" onClick={() => setModelDrawing(false)}>
          <div
            className="model-content-Catalog"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              className="iframepdf"
              src={`http://192.168.10.23:5005/api/pdf?path=${encodeURIComponent(
                `All Product/${uniqueDataFile[0]?.productData?.Product_Serie}/Drawing/${catalogPDF}`,
              )}`}
              title="pdf"
            ></iframe>
          </div>
        </div>
      )}
      {modelColor && (
        <div className="modelCatalog" onClick={() => setModelColor(false)}>
          <div
            className="model-content-Catalog"
            onClick={(e) => e.stopPropagation()}
          >
            <iframe
              className="iframepdf"
              src={`http://192.168.10.23:5005/api/Color?path=${encodeURIComponent(
                `Materials/${resulttoggle}/${catalogPDF}`,
              )}`}
              title="pdf"
            ></iframe>
          </div>
        </div>
      )}
      {model3D && (
        <div className="modelCatalog" onClick={() => setModel3D(false)}>
          <div
            className="model-content-Modal3D"
            onClick={(e) => e.stopPropagation()}
            ref={mountRef}
            style={{ width: "1000px", height: "600px" }}
          ></div>
        </div>
      )}
      {modelShowPhoto && (
        <div
          className="model-show-Photo fixed top-0 left-0 w-full h-full bg-black bg-opacity-70 flex items-center justify-center z-50"
          onClick={() => setModelShowPhoto(false)}
        >
          <div
            className="model-content-show-Photo relative"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="slider-container relative overflow-hidden w-[1000px] h-[1000px]">
              <div
                className="slider-wrapper flex transition-transform duration-300"
                style={{ transform: `translateX(-${currentIndex * 100}%)` }}
              >
                {images.map((item, index) => {
                  // path ของ folder
                  const folderPath = `All Product/${item.productFamily}/Project Reference`;
                  const encodedFolder = encodeURIComponent(folderPath);

                  // pattern คือชื่อไฟล์
                  const encodedPattern = encodeURIComponent(item.fileName);

                  return (
                    <div
                      key={index}
                      className="slide flex-shrink-0 w-[1000px] h-[1000px] max-[1200]:shrink"
                    >
                      <Image
                        loader={myLoader}
                        src={`http://192.168.10.23:5005/api/get_image_by_pattern?path=${encodedFolder}&pattern=${encodedPattern}`}
                        width={1000}
                        height={1000}
                        alt={item.fileName}
                        className="slide-img object-contain"
                      />
                    </div>
                  );
                })}
              </div>

              {/* ปุ่มซ้ายขวา */}
              <button
                onClick={prevSlide}
                className="nav-btn prev absolute top-1/2 left-2 transform -translate-y-1/2 text-white text-3xl"
              >
                ❮
              </button>
              <button
                onClick={nextSlide}
                className="nav-btn next absolute top-1/2 right-2 transform -translate-y-1/2 text-white text-3xl"
              >
                ❯
              </button>

              {/* จุด indicator */}
              <div className="dots absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
                {images.map((_, i) => (
                  <span
                    key={i}
                    className={`dot w-3 h-3 rounded-full ${
                      i === currentIndex ? "bg-white" : "bg-gray-500"
                    }`}
                    onClick={() => setCurrentIndex(i)}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      )}
      <div className="container m-auto mt-10">
        <div className="text-lg text-neutral-600 mb-3">
          {/* ส่วนของ "Product" */}
          <span
            className="cursor-pointer"
            onClick={() => {
              BackslideGroup();
            }}
          >
            Product
          </span>
          {selectedProduct.map((item: string, index: number) => (
            <span
              key={index}
              className="cursor-pointer"
              onClick={() => {
                const newSelected = selectedProduct.slice(0, index + 1);
                const newToggle = toggle.slice(0, index + 1);
                AnimationSlide(newSelected, newToggle);
              }}
            >
              {item}
            </span>
          ))}
        </div>
        <hr className="text-neutral-500 border-1 mb-3" />
        {selectedProduct.length > 0 && showProductModel.length === 0 ? (
          <div
            className={`grid grid-cols-5 gap-5 text-lg font-bold p-8 max-[500px]:grid-cols-1 max-[500px]:gap-2 max-[800px]:grid-cols-2 max-[800px]:gap-2 max-[1200px]:grid-cols-3 max-[1200px]:gap-2 max-[1600px]:grid-cols-4 max-[1600px]:gap-2 ${
              slideNextProduct === 1
                ? "NextProduct"
                : slideNextProduct === 2
                  ? "PrevNextProduct"
                  : slideNextProduct === 3
                    ? "BackProduct"
                    : slideNextProduct === 4 && "PrevBackProduct"
            }`}
          >
            {[...uniqueProductTypes].sort().map((item, index) => {
              const matched = dataProduct.find(
                (p: { Product_Serie: string }) =>
                  p.Product_Serie === item.split("|")[0],
              );

              return (
                <div key={index}>
                  <div
                    className="cursor-pointer box-size-Images"
                    onClick={() => SelectProduct(item.split("|")[0])}
                  >
                    <div>
                      <Image
                        loader={myLoader}
                        className={`${
                          selectedProduct.length === 4
                            ? "Images-Product"
                            : "Images-Group"
                        }`}
                        src={`${
                          selectedProduct.length === 4
                            ? `http://192.168.10.23:5005/api/get_image_by_pattern?path=${encodeURIComponent(
                                matched?.Product_Path_img || "",
                              )}&pattern=${encodeURIComponent(
                                item.split("|")[0],
                              )}`
                            : `http://192.168.10.23:5005/api/get_image_by_pattern?path=${encodeURIComponent(
                                "All Product/Cover_Photo",
                              )}&pattern=${encodeURIComponent(
                                item.split("|")[0].split(" ")[0],
                              )}`
                        }`}
                        width={1000}
                        height={1000}
                        alt="Product"
                      />
                    </div>
                    <div className="text-center text-base/6 p-1 bg-neutral-700 text-white font-normal font-san mt-auto">
                      {toggle.length === 4 ? (
                        item
                      ) : (
                        <div>
                          {item.split("|")[0].split(" ").slice(1).join(" ")}
                        </div>
                      )}
                    </div>
                    {toggle.length === 4 ? null : (
                      <div className="text-center text-base/6 p-1 bg-neutral-500 text-white font-normal font-san">
                        {item.split("|")[1]}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        ) : showProductModel.length > 0 ? (
          <div
            className={`col-span-12${
              slideNextProduct === 1 ? (
                "NextProduct"
              ) : slideNextProduct === 2 ? (
                "PrevNextProduct"
              ) : slideNextProduct === 3 ? (
                "BackProduct"
              ) : slideNextProduct === 4 ? (
                "PrevBackProduct"
              ) : (
                <></>
              )
            }`}
          >
            {uniqueDataFile[0]?.productData?.Product_FG.slice(0, 2) === "FG" ? (
              <>
                <div className="font-bold text-3xl text-neutral-700 p-3 max-[500px]:text-center max-[800px]:text-center">
                  {filter_Product_Serie.length > 0
                    ? filter_Product_Serie[0]?.Product_name
                    : uniqueDataFile[0]?.productData?.Product_name}
                </div>
                <div className="flex w-full gap-4 max-[500px]:block max-[800px]:block ">
                  {/* ✅ รูปแสดงครั้งเดียว */}
                  <div className="flex items-center justify-center max-[800]:border-b max-[1200]:mb-3">
                    <div className="">
                      <Image
                        loader={myLoader}
                        className="Images-Group-final"
                        src={`http://192.168.10.23:5005/api/Family?path=${encodeURIComponent(
                          `${
                            filter_Product_Serie.length > 0
                              ? filter_Product_Serie[0]?.Product_Path_img
                              : uniqueDataFile[0]?.productData?.Product_Path_img
                          }`,
                        )}&pattern=${encodeURIComponent(
                          `${
                            filter_Product_Serie.length > 0
                              ? filter_Product_Serie[0]?.Product_name?.replace(
                                  /\//g,
                                  "-",
                                )
                              : uniqueDataFile[0]?.productData?.Product_name?.replace(
                                  /\//g,
                                  "-",
                                )
                          }`,
                        )}`}
                        width={1000}
                        height={1000}
                        alt="ProductModal"
                      />
                    </div>
                  </div>

                  {/* ✅ ตารางแสดงข้อมูลซ้ำได้ */}
                  <div className="w-full flex justify-between max-[1600]:block max-[500]:justify-start">
                    <div className="grid grid-flow-col grid-rows-1 max-[1200px]:grid-flow-row max-[1200px]:grid-cols-3 max-[1200]:mb-3">
                      <div className="text-center mx-5">
                        <div>รหัสสินค้า</div>
                        {uniqueDataFile.map((item: any, index: number) => (
                          <div key={index}>
                            {filter_Product_Serie.length > 0 ? (
                              <>
                                {item?.productData?.Product_name ===
                                  filter_Product_Serie[0].Product_name &&
                                  item?.productData?.Product_Code}
                              </>
                            ) : (
                              uniqueDataFile[0]?.productData?.Product_name ===
                                item.productData?.Product_name &&
                              item.productData?.Product_Code
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="text-center mx-5">
                        <div>รหัสกลาง</div>
                        {uniqueDataFile.map((item: any, index: number) => (
                          <div key={index}>
                            {filter_Product_Serie.length > 0 ? (
                              <>
                                {item?.productData?.Product_name ===
                                  filter_Product_Serie[0].Product_name &&
                                  item?.productData?.Product_FG}
                              </>
                            ) : (
                              uniqueDataFile[0]?.productData?.Product_name ===
                                item.productData?.Product_name &&
                              item.productData?.Product_FG
                            )}
                          </div>
                        ))}
                      </div>
                      <div className="text-center mx-5">
                        <div>ราคาขาย</div>
                        <div>
                          {uniqueDataFile.map((item: any, index: number) => {
                            const DayToday = new Date();
                            const dd = String(DayToday.getDate()).padStart(
                              2,
                              "0",
                            );
                            const mm = String(DayToday.getMonth() + 1).padStart(
                              2,
                              "0",
                            );
                            const yyyy = DayToday.getFullYear();

                            // const [YearValidity, MonthValidity, DayValidity] =
                            //   item?.productData?.Price_Validity?.split("-");

                            return (
                              <div key={index}>
                                {filter_Product_Serie.length > 0 ? (
                                  <>
                                    {/* {YearValidity === String(yyyy) &&
                                      MonthValidity >= String(mm) &&
                                      DayValidity >= dd && ( */}
                                        <>
                                          {item?.productData?.Product_name ===
                                            filter_Product_Serie[0]
                                              .Product_name &&
                                            item?.productData?.Product_price}
                                        </>
                                      {/* )} */}
                                  </>
                                ) : (
                                  item?.productData?.Price_Validity?.split(
                                    "-",
                                  )[0] === yyyy && (
                                    <>
                                      {uniqueDataFile[0]?.productData
                                        ?.Product_name ===
                                        item.productData?.Product_name &&
                                        item.productData?.Product_price}
                                    </>
                                  )
                                )}
                              </div>
                            );
                          })}
                        </div>
                      </div>
                      <div className="text-center grid-cols-1 description-font max-[1200]:mt-3 max-[500]:text-center max-[500]:mx-0 max-[800]:text-center max-[800]:mx-5 max-[1600]:mb-5 max-[1600]:text-center">
                        <div className="mx-5">รายละเอียด</div>
                        <div className="text-start mx-5">
                          {uniqueDataFile[0]?.productData?.Description
                            ? `${
                                uniqueDataFile[0]?.productData?.Description.split(
                                  "|",
                                )[0]
                                  ? `- ${
                                      uniqueDataFile[0]?.productData?.Description.split(
                                        "|",
                                      )[0]
                                    }`
                                  : ""
                              }`
                            : ""}
                        </div>
                        <div className="text-start">
                          {uniqueDataFile[0]?.productData?.Description
                            ? `${
                                uniqueDataFile[0]?.productData?.Description.split(
                                  "|",
                                )[1]
                                  ? `- ${
                                      uniqueDataFile[0]?.productData?.Description.split(
                                        "|",
                                      )[1]
                                    }`
                                  : ""
                              }`
                            : ""}
                        </div>
                        <div className="text-start">
                          {uniqueDataFile[0]?.productData?.Description
                            ? `${
                                uniqueDataFile[0]?.productData?.Description.split(
                                  "|",
                                )[2]
                                  ? `- ${
                                      uniqueDataFile[0]?.productData?.Description.split(
                                        "|",
                                      )[2]
                                    }`
                                  : ""
                              }`
                            : ""}
                        </div>
                        <div className="text-start">
                          {uniqueDataFile[0]?.productData?.Description
                            ? `${
                                uniqueDataFile[0]?.productData?.Description.split(
                                  "|",
                                )[3]
                                  ? `- ${
                                      uniqueDataFile[0]?.productData?.Description.split(
                                        "|",
                                      )[3]
                                    }`
                                  : ""
                              }`
                            : ""}
                        </div>
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
                              {uniqueDataFile[0]?.files ? (
                                <div
                                  className="cursor-pointer"
                                  onClick={() =>
                                    PDFCatalog(uniqueDataFile[0]?.files)
                                  }
                                >
                                  <>
                                    <div className="flex justify-center">
                                      <Image
                                        src={"/Icon/pdf.png"}
                                        width={60}
                                        height={60}
                                        alt="pdf"
                                      />
                                    </div>
                                    {/*<div>{uniqueDataFile[0]?.files[0]}</div>*/}
                                  </>
                                </div>
                              ) : (
                                <div className="h-23"></div>
                              )}
                            </div>
                          </div>
                        </div>
                        <div className="border border-neutral-400 h-48 w-full">
                          <div className="bg-neutral-400 text-white text-base text-center font-sans font-medium p-2">
                            Material Colour
                          </div>
                          {uniqueDataFile[0]?.files ? (
                            <>
                              <div className="flex justify-center items-center h-35 bg-white">
                                <div
                                  className="mb-2"
                                  onClick={() => PDFColor(resulttoggle)}
                                >
                                  <div className="flex justify-center mt-2">
                                    <Image
                                      src={"/Icon/pdf.png"}
                                      width={60}
                                      height={60}
                                      alt="pdf"
                                      className="cursor-pointer"
                                    />
                                  </div>
                                  {/* <div className="text-xs text-center">
                                    {uniqueDataFile[0]?.split(" ")[2]}
                                  </div> */}
                                </div>
                              </div>
                            </>
                          ) : (
                            <div className="h-30 text-center pt-12 align-center">
                              <div>มาตรฐานขายสีเดียวเท่านั้น</div>
                            </div>
                          )}
                        </div>
                        <div className={`border border-neutral-400 w-full`}>
                          <div className="bg-neutral-400 text-white text-base text-center font-sans font-medium p-2">
                            Drawing
                          </div>
                          <div className="flex justify-center items-center mx-5 p-2 h-30">
                            {uniqueDataFile[0]?.Drawing[0] ? (
                              <div
                                className="m-auto p-2 cursor-pointer"
                                onClick={() =>
                                  PDFDrawing(uniqueDataFile[0]?.Drawing[0])
                                }
                              >
                                <>
                                  <div className="flex justify-center">
                                    <Image
                                      src={"/Icon/pdf.png"}
                                      width={50}
                                      height={50}
                                      alt="pdf"
                                    />
                                  </div>
                                  <div>{uniqueDataFile[0]?.Drawing[0]}</div>
                                </>
                              </div>
                            ) : (
                              <div>
                                <span className="font-NA">N</span>
                                <span className="font-NA">/</span>
                                <span className="font-NA">A</span>
                              </div>
                            )}
                          </div>
                        </div>
                        <div
                          className="border border-neutral-400 h-48 w-full overflow-picture"
                          onClick={() => setModelShowPhoto(true)}
                        >
                          <div className="bg-neutral-400 text-white text-base text-center font-sans font-medium p-2">
                            Reference
                          </div>
                          <div className="grid grid-cols-2 cursor-pointer max-[700]:grid-cols-2 max-[1200]:grid-cols-3">
                            {images.map((item, index) => {
                              const folderPath = `All Product/${item.productFamily}/Project Reference`;
                              const encodedFolder =
                                encodeURIComponent(folderPath);
                              const encodedPattern = encodeURIComponent(
                                item.fileName,
                              );

                              // แสดงเฉพาะ 5 รูปแรก
                              if (index < 3) {
                                return (
                                  <div
                                    key={`${item.fullDirPath}-${index}`}
                                    className="cursor-pointer flex justify-center"
                                    onClick={() => openModal(index)}
                                  >
                                    <Image
                                      loader={myLoader}
                                      src={`http://192.168.10.23:5005/api/get_image_by_pattern?path=${encodedFolder}&pattern=${encodedPattern}`}
                                      width={1000}
                                      height={1000}
                                      alt={item.fileName}
                                      className="Image-Photo p-1 w-full"
                                    />
                                  </div>
                                );
                              }

                              // โชว์กล่อง 3+ แค่ครั้งเดียวตอน index === 3
                              if (index === 5) {
                                return (
                                  <div
                                    key={`more-${index}`}
                                    className="bg-neutral-400 align-middle cursor-pointer flex items-center justify-center w-full h-[70px] text-base font-bold"
                                    onClick={() => openModal(index)}
                                  >
                                    3+
                                  </div>
                                );
                              }
                              // ที่เหลือไม่ต้อง return อะไร
                              return null;
                            })}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
                <hr className="mt-3 border-b border-gray-300" />
                <div className="font-bold font-fam text-neutral-700 p-3">
                  Product Family
                </div>
                {/* ✅ รูปแสดงครั้งเดียว */}
                <div className="box-overflow">
                  <div className="flex items-end justify-start">
                    {uniqueSeries.map((name: string, index: number) => {
                      const item = uniqueDataFile.find(
                        (i: any) => i?.productData?.Product_name === name,
                      );

                      if (!item) return null;

                      return (
                        <div
                          className="curser-pointer box-shadow p-5"
                          key={index}
                        >
                          <div
                            className=""
                            onClick={() =>
                              SwiftSelectProduct(
                                item?.productData?.Product_name,
                              )
                            }
                          >
                            <Image
                              loader={myLoader}
                              className="Images-Group-final"
                              src={`http://192.168.10.23:5005/api/Family?path=${encodeURIComponent(
                                item?.productData?.Product_Path_img || "",
                              )}&pattern=${encodeURIComponent(
                                item?.productData?.Product_name?.replace(
                                  /\//g,
                                  "-",
                                ) || "",
                              )}`}
                              width={1000}
                              height={1000}
                              alt="ProductModal"
                            />
                          </div>
                          <div className="text-center">
                            {item?.productData?.Product_name}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              <div className="Reference-slider relative">
                <div
                  className="slider-wrapper flex transition-transform duration-300"
                  style={{ transform: `translateX(-${currentIndex * 100}%)` }}
                >
                  {images.map((item, index) => {
                    // path ของ folder
                    const folderPath = `All Product/${item.productFamily}/Project Reference`;
                    const encodedFolder = encodeURIComponent(folderPath);

                    // pattern คือชื่อไฟล์
                    const encodedPattern = encodeURIComponent(item.fileName);

                    return (
                      <div
                        key={index}
                        className="slide flex-shrink-0 w-[1000px] h-[1000px] max-[1200]:shrink"
                      >
                        <Image
                          loader={myLoader}
                          src={`http://192.168.10.23:5005/api/get_image_by_pattern?path=${encodedFolder}&pattern=${encodedPattern}`}
                          width={1000}
                          height={1000}
                          alt={item.fileName}
                          className="slide-img object-contain"
                        />
                      </div>
                    );
                  })}
                </div>

                {/* ปุ่มซ้ายขวา */}
                <button
                  onClick={prevSlide}
                  className="nav-btn prev absolute top-1/2 left-2 transform -translate-y-1/2 text-white text-3xl"
                >
                  ❮
                </button>
                <button
                  onClick={nextSlide}
                  className="nav-btn next absolute top-1/2 right-2 transform -translate-y-1/2 text-white text-3xl"
                >
                  ❯
                </button>

                {/* จุด indicator */}
                <div className="dots absolute bottom-2 left-1/2 transform -translate-x-1/2 flex space-x-2">
                  {images.map((_, i) => (
                    <span
                      key={i}
                      className={`dot w-3 h-3 rounded-full ${
                        i === currentIndex ? "bg-white" : "bg-gray-500"
                      }`}
                      onClick={() => setCurrentIndex(i)}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* ✅ ตารางแสดงข้อมูลซ้ำได้ */}
            {/* <div className="grid grid-flow-col grid-rows-1 gap-25 border-overflow">
                <div className="text-center">
                  <div>รหัสสินค้า</div>
                  <div className="">
                    {uniqueDataFile.map((item: any, index: number) => (
                      <div key={index}>
                        {uniqueDataFile[0]?.productData?.Product_Serie !==
                        item.productData?.Product_Serie
                          ? item.productData?.Product_name
                          : ""}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-center">
                  <div>รหัสกลาง</div>
                  <div className="">
                    {uniqueDataFile.map((item: any, index: number) => (
                      <div key={index}>
                        {uniqueDataFile[0]?.productData?.Product_Serie !==
                        item.productData?.Product_Serie
                          ? item.productData?.Product_FG
                          : ""}
                      </div>
                    ))}
                  </div>
                </div>
                <div className="text-center">
                  <div>ราคาขาย</div>
                  <div className="">
                    {uniqueDataFile.map((item: any, index: number) => (
                      <div key={index}>
                        {uniqueDataFile[0]?.productData?.Product_Serie !==
                        item.productData?.Product_Serie
                          ? item.productData?.Product_price
                          : ""}
                      </div>
                    ))}
                  </div>
                </div>
              </div> */}
          </div>
        ) : (
          <div
            className={`grid grid-cols-5 gap-4 text-lg p-8 max-[500px]:grid-cols-1 max-[500px]:gap-2 max-[800px]:grid-cols-2 max-[800px]:gap-2 max-[1200px]:grid-cols-3 max-[1200px]:gap-2 max-[1600px]:grid-cols-4 max-[1600px]:gap-2 ${
              slideNextProduct === 1 ? (
                "NextProduct"
              ) : slideNextProduct === 2 ? (
                "PrevNextProduct"
              ) : slideNextProduct === 3 ? (
                "BackProduct"
              ) : slideNextProduct === 4 ? (
                "PrevBackProduct"
              ) : (
                <></>
              )
            }`}
          >
            {dataProductGroup.map((item: any, index: number) => (
              <div
                key={index}
                className="cursor-pointer"
                onClick={() => {
                  SelectProduct(item.Product_Type);
                  setShowMenuSelect(true);
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
                  <div className="font-12">
                    {item.Product_Name.split("|")[0]}
                  </div>
                </div>
                <div className="text-center text-base/6 p-1 bg-neutral-500 text-white font-th font-sans">
                  {item.Product_Name.split("|")[1]}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
