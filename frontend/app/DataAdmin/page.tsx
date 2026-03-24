"use client";
import React, { useEffect } from "react";
import "./DataAdmin.css";
import * as XLSX from "xlsx";
import Image from "next/image";

export default function page() {
  const [GetData, setGetData] = React.useState<any>([]);
  const [backupData, setBackupData] = React.useState<any>([]);
  const [filterData, setFilterData] = React.useState<any>([]);
  const [ModelFG, setModelFG] = React.useState<boolean>(false);
  const [ModelSerie, setModelSerie] = React.useState<boolean>(false);
  const [ModelName, setModelName] = React.useState<boolean>(false);
  const [ModelCode, setModelCode] = React.useState<boolean>(false);
  const [ModelValidity, setModelPriceValidity] = React.useState<boolean>(false);
  const [selectFG, setSelectFG] = React.useState<string[]>([]);
  const [selectSerie, setSelectSerie] = React.useState<string[]>([]);
  const [selectname, setSelectname] = React.useState<string[]>([]);
  const [selectCode, setSelectCode] = React.useState<string[]>([]);
  const [menuaction, setMenuAction] = React.useState<boolean>(false);
  const [cssAction, setCssAction] = React.useState<boolean>(false);
  const [loading, setLoading] = React.useState<boolean>(false);
  const [progress, setProgress] = React.useState<number>(0);

  const myLoader = ({ src }: { src: string }) => src;

  const [currentPage, setCurrentPage] = React.useState(1);
  const rowsPerPage = 20;

  const indexOfLastRow = currentPage * rowsPerPage;
  const indexOfFirstRow = indexOfLastRow - rowsPerPage;

  const currentData = GetData.slice(indexOfFirstRow, indexOfLastRow);

  useEffect(() => {
    const datafecth = async () => {
      const res = await fetch("http://192.168.10.23:5005/API/Product");
      const data = await res.json();

      setGetData(data);
      setBackupData(data);
    };
    datafecth();
  }, []);

  useEffect(() => {
    Finalfilter();
  }, [selectFG, selectSerie, selectname, selectCode, backupData]);

  const Finalfilter = () => {
    if (
      selectFG.length > 0 ||
      selectSerie.length > 0 ||
      selectname.length > 0 ||
      selectCode.length > 0
    ) {
      const filtered = backupData.filter((item: any) => {
        const fgMatch =
          selectFG.length === 0 || selectFG.includes(item?.Product_FG);
        const serieMatch =
          selectSerie.length === 0 || selectSerie.includes(item?.Product_Serie);
        const nameMatch =
          selectname.length === 0 || selectname.includes(item?.Product_name);
        const codeMatch =
          selectCode.length === 0 || selectCode.includes(item?.Product_Code);
        return fgMatch && serieMatch && nameMatch && codeMatch;
      });
      setGetData(filtered);
    } else {
      setGetData(backupData);
    }
  };

  const FCTFilter = (valuefilter: string) => {
    if (valuefilter === "Product_FG") {
      const uniqueFG = Array.from(
        new Set(GetData.map((item: any) => item.Product_FG)),
      ).map((fg) => {
        return GetData.find((item: any) => item.Product_FG === fg);
      });
      setFilterData(uniqueFG);
    } else if (valuefilter === "Product_Serie") {
      const uniqueSerie = Array.from(
        new Set(GetData.map((item: any) => item.Product_Serie)),
      ).map((serie) => {
        return GetData.find((item: any) => item.Product_Serie === serie);
      });
      setFilterData(uniqueSerie);
    } else if (valuefilter === "Product_name") {
      const uniqueName = Array.from(
        new Set(GetData.map((item: any) => item.Product_name)),
      ).map((name) => {
        return GetData.find((item: any) => item.Product_name === name);
      });
      setFilterData(uniqueName);
    } else if (valuefilter === "Product_Code") {
      const uniqueCode = Array.from(
        new Set(GetData.map((item: any) => item.Product_Code)),
      ).map((code) => {
        return GetData.find((item: any) => item.Product_Code === code);
      });
      setFilterData(uniqueCode);
    } else if (valuefilter === "Product_price") {
      const uniquePrice = Array.from(
        new Set(GetData.map((item: any) => item.Product_price)),
      ).map((price) => {
        return GetData.find((item: any) => item.Product_price === price);
      });
      setFilterData(uniquePrice);
    } else if (valuefilter === "Price_Validity") {
      const uniqueValidity = Array.from(
        new Set(GetData.map((item: any) => item.Price_Validity)),
      ).map((validity) => {
        return GetData.find((item: any) => item.Price_Validity === validity);
      });
      setFilterData(uniqueValidity);
    }
  };

  const SearchFG = (text: string, filterType: string) => {
    if (text === "") {
      FCTFilter(filterType);
    } else {
      const filtered = GetData.filter((item: any) =>
        item?.[filterType]?.includes(text),
      );
      setFilterData(filtered);
    }
  };

  const HandleFilter = (text: string) => {
    setSelectFG((prev) => {
      if (prev.includes(text)) {
        return prev.filter((item) => item !== text);
      } else {
        return [...prev, text];
      }
    });
  };

  const HandleFilterSerie = (text: string) => {
    setSelectSerie((prev) => {
      if (prev.includes(text)) {
        return prev.filter((item) => item !== text);
      } else {
        return [...prev, text];
      }
    });
  };

  const HandleFilterCode = (text: string) => {
    setSelectCode((prev) => {
      if (prev.includes(text)) {
        return prev.filter((item) => item !== text);
      } else {
        return [...prev, text];
      }
    });
  };

  const HandleFilterName = (text: string) => {
    setSelectname((prev) => {
      if (prev.includes(text)) {
        return prev.filter((item) => item !== text);
      } else {
        return [...prev, text];
      }
    });
  };

  const ActionActive = (value: boolean) => {
    setCssAction(value);
    setTimeout(() => {
      setMenuAction(value);
    }, 500);
  };

  const checkProgress = () => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch("http://192.168.10.23:5005/upload-progress");
        const data = await res.json();

        setProgress(data.progress);

        if (data.progress >= 100) {
          clearInterval(interval);
          setLoading(false);
          alert("บันทึกลง SQL Server สำเร็จ!");
        }
      } catch (err) {
        console.error(err);
        clearInterval(interval);
      }
    }, 1000);
  };

  const importExcel = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = ".xlsx,.xls";

    input.onchange = async (e) => {
      const target = e.target as HTMLInputElement;
      const file = target.files?.[0];
      if (!file) return;

      setLoading(true);
      setProgress(0);

      try {
        const data = await file.arrayBuffer();
        const workbook = XLSX.read(data, { type: "array" });

        const rows = XLSX.utils.sheet_to_json(
          workbook.Sheets[workbook.SheetNames[5]],
        );

        // เริ่มฟัง Progress
        checkProgress();

        // Upload
        await fetch("http://192.168.10.23:5005/upload-excel", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ data: rows }),
        });
      } catch (error) {
        console.error(error);
        alert("เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
        setLoading(false);
      }
    };

    input.click();
  };

  const ExportExcel = () => {
    if (!GetData.length) return alert("ไม่มีข้อมูล");

    const ws = XLSX.utils.json_to_sheet(GetData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Sheet1");
    XLSX.writeFile(wb, "export.xlsx");
  };

  const ModelInput = () => {};

  const ShowModel = (value: string) => {
    setModelFG(false);
    setModelSerie(false);
    setModelName(false);
    setModelCode(false);
    setModelPriceValidity(false);

    if (value === "Product_FG") {
      setModelFG(true);
    } else if (value === "Product_Serie") {
      setModelSerie(true);
    } else if (value === "Product_name") {
      setModelName(true);
    } else if (value === "Product_Code") {
      setModelCode(true);
    } else if (value === "Price_Validity") {
      setModelPriceValidity(true);
    }
  };

  const CloseAllModel = () => {
    setModelFG(false);
    setModelSerie(false);
    setModelName(false);
    setModelCode(false);
    setModelPriceValidity(false);
  };

  const totalPages = Math.ceil(GetData.length / rowsPerPage);

  const filterDataHeader = (value: any) => {
    const response = backupData.filter(
      (item: any) => item.Product_Header === value,
    );

    setGetData(response);
  };

  const API_Test_Price = async () => {
    const res = await fetch("http://192.168.10.23:5005/api/updatePrice");
    const data = await res.json();

    alert(`Update Price สำเร็จ: ${data.message}`);
  };

  return (
    <div>
      {loading && (
        <div className="loading-overlay">
          <div className="loading-box">
            <h3>กำลัง Import Excel...</h3>

            {/* Progress Bar */}
            <div className="progress-bar">
              <div
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>

            {/* Percent Text */}
            <div className="percent-text">{progress}%</div>
          </div>
        </div>
      )}
      {menuaction ? (
        <div
          className={`menu-active ${cssAction ? "movementshow" : "movementhide"}`}
        >
          <button className="btn-primary mt-2" onClick={() => importExcel()}>
            Import
          </button>
          <button className="btn-success mt-2" onClick={() => ExportExcel()}>
            Export
          </button>
          <button className="btn-danger mt-2" onClick={() => ModelInput()}>
            Input
          </button>
          <div className="mt-3 menu_header">
            <div className="text-center text-header">เลือกกลุ่มสินค้า</div>
            {backupData
              .filter(
                (item: { Product_Header: any }, index: any, self: any[]) =>
                  index ===
                  self.findIndex(
                    (t) => t.Product_Header === item.Product_Header,
                  ),
              )
              .map(
                (
                  item: {
                    Product_Header:
                      | string
                      | number
                      | bigint
                      | boolean
                      | React.ReactElement<
                          unknown,
                          string | React.JSXElementConstructor<any>
                        >
                      | Iterable<React.ReactNode>
                      | React.ReactPortal
                      | Promise<
                          | string
                          | number
                          | bigint
                          | boolean
                          | React.ReactPortal
                          | React.ReactElement<
                              unknown,
                              string | React.JSXElementConstructor<any>
                            >
                          | Iterable<React.ReactNode>
                          | null
                          | undefined
                        >
                      | null
                      | undefined;
                  },
                  index: React.Key | null | undefined,
                ) => (
                  <div key={index}>
                    <input
                      type="radio"
                      name="Header"
                      onClick={() => filterDataHeader(item.Product_Header)}
                    />
                    <span className="mx-2">{item.Product_Header}</span>
                  </div>
                ),
              )}
          </div>
          <div className="">
            <button
              className="btn-warning mt-2"
              onClick={() => API_Test_Price()}
            >
              Manual Update Price
            </button>
          </div>
        </div>
      ) : (
        <div className="menu-unactive" onClick={() => ActionActive(true)}>
          <div className="scroll-arrow"></div>
        </div>
      )}

      <div
        onClick={() => {
          (CloseAllModel(), ActionActive(false));
        }}
      >
        <table className="align-center" width="95%">
          <thead>
            <tr>
              <th>ลำดับ</th>
              <th>
                FG{" "}
                <span
                  className="arrow-container"
                  onClick={(e) => {
                    FCTFilter("Product_FG");
                    ShowModel("Product_FG");
                    e.stopPropagation();
                  }}
                >
                  <span className="down-arrow"></span>
                </span>
                {ModelFG && (
                  <div
                    className="model-filter"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {filterData.map((item: any, index: number) => (
                      <div className="text-start" key={index}>
                        <input
                          type="checkbox"
                          className="me-3"
                          checked={selectFG.includes(item.Product_FG)}
                          onChange={() => HandleFilter(item.Product_FG)}
                        />
                        {item.Product_FG}
                      </div>
                    ))}
                    {filterData.map(
                      (item: any, index: React.Key | null | undefined) => (
                        <div className="text-start" key={index}>
                          <input
                            type="checkbox"
                            className="me-3"
                            onClick={() => HandleFilter(item.Product_FG)}
                          />
                          {item.Product_FG}
                        </div>
                      ),
                    )}
                  </div>
                )}
              </th>
              <th>
                Serie(Family){" "}
                <span
                  className="arrow-container"
                  onClick={(e) => {
                    FCTFilter("Product_Serie");
                    ShowModel("Product_Serie");
                    e.stopPropagation();
                  }}
                >
                  <span className="down-arrow"></span>
                </span>
                {ModelSerie && (
                  <div
                    className="model-filter"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {filterData.map((item: any, index: number) => (
                      <div className="text-start" key={index}>
                        <input
                          type="checkbox"
                          className="me-3"
                          checked={selectSerie.includes(item.Product_Serie)}
                          onChange={() => HandleFilterSerie(item.Product_Serie)}
                        />
                        {item.Product_Serie}
                      </div>
                    ))}
                    {filterData.map((item: any, index: number) => (
                      <div className="text-start" key={index}>
                        <input type="checkbox" className="me-3" />
                        {item.Product_Serie}
                      </div>
                    ))}
                  </div>
                )}
              </th>
              <th>
                Name{" "}
                <span
                  className="arrow-container"
                  onClick={(e) => {
                    FCTFilter("Product_name");
                    ShowModel("Product_name");
                    e.stopPropagation();
                  }}
                >
                  <span className="down-arrow"></span>
                </span>
                {ModelName && (
                  <div
                    className="model-filter"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {filterData.map((item: any, index: number) => (
                      <div className="text-start" key={index}>
                        <input
                          type="checkbox"
                          className="me-3"
                          checked={selectname.includes(item.Product_name)}
                          onChange={() => HandleFilterName(item.Product_name)}
                        />
                        {item.Product_name}
                      </div>
                    ))}
                    {filterData.map((item: any, index: number) => (
                      <div className="text-start" key={index}>
                        <input type="checkbox" className="me-3" />
                        {item.Product_name}
                      </div>
                    ))}
                  </div>
                )}
              </th>
              <th>
                Code{" "}
                <span
                  className="arrow-container"
                  onClick={(e) => {
                    FCTFilter("Product_Code");
                    ShowModel("Product_Code");
                    e.stopPropagation();
                  }}
                >
                  <span className="down-arrow"></span>
                </span>
                {ModelCode && (
                  <div
                    className="model-filter"
                    onClick={(e) => e.stopPropagation()}
                  >
                    {filterData.map((item: any, index: number) => (
                      <div className="text-start" key={index}>
                        <input
                          type="checkbox"
                          className="me-3"
                          checked={selectCode.includes(item.Product_Code)}
                          onChange={() => HandleFilterCode(item.Product_Code)}
                        />
                        {item.Product_Code}
                      </div>
                    ))}
                  </div>
                )}
              </th>
              <th>Price </th>
              <th>
                Date Validity{" "}
                <span
                  className="arrow-container"
                  onClick={(e) => {
                    FCTFilter("Price_Validity");
                    ShowModel("Price_Validity");
                    e.stopPropagation();
                  }}
                >
                  <span className="down-arrow"></span>
                </span>
                {ModelValidity && (
                  <div
                    className="model-filter"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div>
                      <input
                        className="form-control"
                        placeholder="Serach"
                        onChange={(e) =>
                          SearchFG(e.target.value, "Price_Validity")
                        }
                      />
                    </div>
                    {filterData.map((item: any, index: number) => (
                      <div className="text-start" key={index}>
                        <input type="checkbox" className="me-3" />
                        {item.Price_Validity?.split("T")[0]}
                      </div>
                    ))}
                  </div>
                )}
              </th>
              <th>Product_Path </th>
              <th>Check_Img </th>
              <th>Check_File </th>
            </tr>
          </thead>
          <tbody>
            {currentData.map((item: any, index: number) => {
              const matched = currentData.find(
                (p: { Product_Serie: string }) =>
                  p.Product_Serie === item?.Product_Serie?.split("|")[0],
              );

              const hasImage = !!item.Product_Path_img;

              return (
                <tr key={index}>
                  <td className="text-center">{indexOfFirstRow + index + 1}</td>
                  <td className="text-center">{item.Product_FG}</td>
                  <td className="text-center">{item.Product_Serie}</td>
                  <td className="text-center">{item.Product_name}</td>
                  <td>{item.Product_Code}</td>
                  <td className="text-center">
                    {item.Product_price?.toLocaleString()}
                  </td>
                  <td className="text-center">
                    {item.Price_Validity?.split("T")[0]}
                  </td>
                  <td className="text-center">{item.Product_Path_img}</td>
                  <td>
                    <Image
                      loader={myLoader}
                      src={`${`http://192.168.10.23:5005/api/get_image_by_pattern?path=${encodeURIComponent(
                        matched?.Product_Path_img || "",
                      )}&pattern=${encodeURIComponent(item?.Product_name?.split("|")[0])}`}`}
                      width={80}
                      height={80}
                      alt="Product"
                    />
                  </td>
                  <td className="text-center bg-danger"></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <div className="pagination">
        <button onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}>
          Prev
        </button>

        {[...Array(totalPages)].map((_, i) => (
          <button
            key={i}
            onClick={() => setCurrentPage(i + 1)}
            className={currentPage === i + 1 ? "active" : ""}
          >
            {i + 1}
          </button>
        ))}

        <button
          onClick={() =>
            setCurrentPage((prev) => Math.min(prev + 1, totalPages))
          }
        >
          Next
        </button>
      </div>
    </div>
  );
}
