import { connect } from "bun";
import { Elysia } from "elysia";
import cors from "@elysiajs/cors";
import sql from "mssql";
import path from "path";
import fs from "fs/promises";
import * as xlsx from "xlsx";
import mime from "mime";

const app = new Elysia().use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
  }),
);

const dbconnecting = {
  user: "sa",
  password: "P@55w0rd",
  server: "192.168.199.20",
  port: 1433,
  database: "Easy_Product_Guide_V2",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

// app.get("/updatePrice", async () => {
//   const pool = await sql.connect(dbconnecting);
//   const result = await pool.request().query(`SELECT * FROM Product`);

//   for (const row of result.recordset) {
//     if (row.Product_FG != null) {
//       const response = await fetch(
//         `http://192.168.199.104:9083/jderest/v3/orchestrator/Data_Price_PPI`,
//         {
//           method: "POST",
//           headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({
//             username: "its102575",
//             password: "its102575",
//             Item_Number_1: row.Product_FG,
//           }),
//         },
//       );

//       const updatePrice = await response.json();

//       const rowset =
//         updatePrice.ServiceRequest1.fs_DATABROWSE_V4106C.data.gridData.rowset;

//       rowset.sort(
//         (a: { F4106_UPRC: number }, b: { F4106_UPRC: number }) =>
//           b.F4106_UPRC - a.F4106_UPRC,
//       );

//       const Data = rowset[0];

//       if (Data) {
//         const year = Data.F4106_EXDJ.slice(0, 4);
//         const month = Data.F4106_EXDJ.slice(4, 6);
//         const day = Data.F4106_EXDJ.slice(6, 8);

//         await pool
//           .request()
//           .input("Product_FG", sql.VarChar, row.Product_FG)
//           .input("Price_Validity", sql.DateTime, `${year}-${month}-${day}`)
//           .input("Product_price", sql.Int, Data.F4106_UPRC)
//           .query(
//             `Update Product SET Product_price = @Product_price,
//             Price_Validity = @Price_Validity
//             WHERE Product_FG = @Product_FG`,
//           );
//       }
//     }
//   }
// });

const MOUNT_PATH = "/mnt/mount_path";

// กำหนด path ของไฟล์ Excel ที่ต้องการอ่าน
// const excelFilePath =
//   "/mnt/mount_path/EASY PRODUCT GUIDE_PRODUCT&VIEW v.2.xlsx";

// ฟังก์ชันสำหรับอ่านข้อมูลจากไฟล์ Excel
// const readExcelFileByName = (filePath: string, sheetName: string) => {
//   try {
//     const workbook = xlsx.readFile(filePath);

//     if (!workbook.SheetNames.includes(sheetName)) {
//       throw new Error(`Sheet "${sheetName}" not found`);
//     }

//     const worksheet = workbook.Sheets[sheetName];
//     return xlsx.utils.sheet_to_json(worksheet);
//   } catch (error) {
//     console.error("Error reading Excel file:", error);
//     return null;
//   }
// };

const safeString = (value: any): string | null => {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  return str === "" ? null : str;
};

// const updateDatabase = async ({ dataMain }: { dataMain: any[] }) => {
//   try {
//     const pool2 = await new sql.ConnectionPool(dbconnecting).connect();

//     // SELECT เช็คว่ามีใน DB ไหม
//     const res_Product2 = await pool2.request().query("SELECT * FROM Product");

//     for (const row of dataMain) {
//       const productFG = row.Product_FG ? String(row.Product_FG).trim() : null;

//       const filter_res = res_Product2.recordset.filter(
//         (item: { Product_FG: string | null }) => productFG === item.Product_FG,
//       );
//     }

//     await pool2.request().query("DELETE Product");

//     for (const row of dataMain) {
//       const productFG = row.Product_FG ? String(row.Product_FG).trim() : null;

//       // INSERT
//       await pool2
//         .request()
//         .input("Product_FG", sql.VarChar, safeString(productFG))
//         .input("Product_Serie", sql.VarChar, safeString(row.Product_Serie))
//         .input("Product_name", sql.VarChar, safeString(row.Product_NAME))
//         .input("Product_Code", sql.VarChar, safeString(row.Product_CODE))
//         .input(
//           "Product_price",
//           sql.Int,
//           row.Product_price ? Number(row.Product_price) : null,
//         )
//         .input(
//           "Product_Path_img",
//           sql.VarChar,
//           safeString(row["PRODUCT_PATH-PDF"]),
//         )
//         .input("Product_Family", sql.VarChar, safeString(row.Product_Serie))
//         .query(`
//               INSERT INTO Product
//               (Product_FG, Product_Serie, Product_name, Product_Code, Product_price, Product_Path_img, Product_Family)
//               VALUES
//               (@Product_FG, @Product_Serie, @Product_name, @Product_Code, @Product_price, @Product_Path_img, @Product_Family)
//           `);
//       await updatePrice(productFG);
//     }
//   } catch (error) {
//     console.error("❌ Database update failed:", error);
//   } finally {
//     console.log("✅ update Success");
//   }
// };

setInterval(() => {
  updatePriceAuto();
}, 21600000); // 6 ชั่วโมง = 21,600,000 ms

app.get("/api/updatePrice", async () => {
  const pool = await sql.connect(dbconnecting);

  const res = await pool.request().query(`SELECT Product_FG FROM Product`);
  const dataFG = res.recordset;

  for (const row of dataFG) {
    try {
      const response = await fetch(
        "http://192.168.199.104:9083/jderest/v3/orchestrator/Data_Price_PPI",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "its102575",
            password: "its102575",
            Item_Number_1: row.Product_FG,
          }),
        },
      );

      const updatePrice = await response.json();

      const rowset =
        updatePrice?.ServiceRequest1?.fs_DATABROWSE_V4106C?.data?.gridData
          ?.rowset ?? [];

      if (rowset.length === 0) continue;

      // หา price สูงสุด
      const Data = rowset.sort(
        (a: any, b: any) => Number(b.F4106_UPRC) - Number(a.F4106_UPRC),
      )[0];

      if (!Data?.F4106_EXDJ) continue;

      const date = new Date(
        `${Data.F4106_EXDJ.slice(0, 4)}-${Data.F4106_EXDJ.slice(4, 6)}-${Data.F4106_EXDJ.slice(6, 8)}`,
      );

      await pool
        .request()
        .input("Product_FG", sql.VarChar, row.Product_FG)
        .input("Price_Validity", sql.DateTime, date)
        .input("Product_price", sql.Decimal(18, 2), Data.F4106_UPRC).query(`
          UPDATE Product
          SET Product_price = @Product_price,
              Price_Validity = @Price_Validity
          WHERE Product_FG = @Product_FG
        `);

      console.log(`Update Price Success ${row.Product_FG}`);
    } catch (err) {
      console.log(`Error ${row.Product_FG}`, err);
    }
  }

  return { message: "Update process completed" };
});

const updatePriceAuto = async () => {
  const pool = await sql.connect(dbconnecting);

  const res = await pool.request().query(`SELECT Product_FG FROM Product`);
  const dataFG = res.recordset;

  for (const row of dataFG) {
    try {
      const response = await fetch(
        "http://192.168.199.104:9083/jderest/v3/orchestrator/Data_Price_PPI",
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            username: "its102575",
            password: "its102575",
            Item_Number_1: row.Product_FG,
          }),
        },
      );

      const updatePrice = await response.json();

      const rowset =
        updatePrice?.ServiceRequest1?.fs_DATABROWSE_V4106C?.data?.gridData
          ?.rowset ?? [];

      if (rowset.length === 0) continue;

      // หา price สูงสุด
      const Data = rowset.sort(
        (a: any, b: any) => Number(b.F4106_UPRC) - Number(a.F4106_UPRC),
      )[0];

      if (!Data?.F4106_EXDJ) continue;

      const date = new Date(
        `${Data.F4106_EXDJ.slice(0, 4)}-${Data.F4106_EXDJ.slice(4, 6)}-${Data.F4106_EXDJ.slice(6, 8)}`,
      );

      await pool
        .request()
        .input("Product_FG", sql.VarChar, row.Product_FG)
        .input("Price_Validity", sql.DateTime, date)
        .input("Product_price", sql.Decimal(18, 2), Data.F4106_UPRC).query(`
          UPDATE Product
          SET Product_price = @Product_price,
              Price_Validity = @Price_Validity
          WHERE Product_FG = @Product_FG
        `);

      console.log(`Update Price Success ${row.Product_FG}`);
    } catch (err) {
      console.log(`Error ${row.Product_FG}`, err);
    }
  }

  return { message: "Update process completed" };
};

const updatePrice = async (productFG: string | null) => {
  const pool = await new sql.ConnectionPool(dbconnecting).connect();
  const response = await fetch(
    `http://192.168.199.104:9083/jderest/v3/orchestrator/Data_Price_PPI`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        username: "its102575",
        password: "its102575",
        Item_Number_1: productFG,
      }),
    },
  );

  const updatePrice = await response.json();

  // เช็คก่อน
  const rowset =
    updatePrice?.ServiceRequest1?.fs_DATABROWSE_V4106C?.data?.gridData?.rowset;

  if (!rowset) {
    console.warn("rowset is undefined for Product_FG:", productFG);
    return;
  }

  // sort
  rowset.sort(
    (a: { F4106_UPRC: number }, b: { F4106_UPRC: number }) =>
      b.F4106_UPRC - a.F4106_UPRC,
  );

  const Data = rowset[0];

  if (Data) {
    const year = Data.F4106_EXDJ.slice(0, 4);
    const month = Data.F4106_EXDJ.slice(4, 6);
    const day = Data.F4106_EXDJ.slice(6, 8);

    await pool
      .request()
      .input("Product_FG", sql.VarChar, productFG)
      .input("Price_Validity", sql.DateTime, `${year}-${month}-${day}`)
      .input("Product_price", sql.Int, Data.F4106_UPRC)
      .query(
        `UPDATE Product SET Product_price = @Product_price, 
       Price_Validity = @Price_Validity 
       WHERE Product_FG = @Product_FG`,
      );

    console.log(`Update Price Success ${productFG}`);
  }
};

// const runDailyUpdate = async () => {
//   let pool;
//   try {
//     pool = await sql.connect(dbconnecting);
//     console.log("Starting Daily Price Update...");

//     const result = await pool.request().query(`SELECT Product_FG FROM Product`);
//     const products = result.recordset;

//     for (const row of products) {
//       updatePrice(row.Product_FG.trim());
//     }

//     console.log(`Updated products successfully.`);
//   } catch (err) {
//     console.error("Daily Update Error:", err);
//   } finally {
//     if (pool) await pool.close();
//     // ตั้งเวลาให้ทำงานอีกครั้งในอีก 24 ชั่วโมงข้างหน้า
//     setTimeout(runDailyUpdate, 86400000);
//     console.log(`Updated products successfully.`);
//   }
// };

// runDailyUpdate();

// let isUpdating = false;

// const updateViewMD = async ({ dataMD }: { dataMD: any[] }) => {
//   try {
//     if (isUpdating) return;
//     isUpdating = true;

//     const pool2 = await new sql.ConnectionPool(dbconnecting).connect();

//     await pool2.request().query(`DELETE MD_View`);

//     for (const row of dataMD) {
//       // โค้ดส่วน INSERT
//       await pool2
//         .request()
//         .input("Product_FG", sql.VarChar, safeString(row.Product_FG))
//         .input("Product_Header", sql.VarChar, safeString(row.STS_Product_HEAD))
//         .input(
//           "Product_Type_Main",
//           sql.VarChar,
//           safeString(row["STS_Product_MAIN TYPE"]),
//         )
//         .input(
//           "Product_Type_Sub",
//           sql.VarChar,
//           safeString(row["STS_Product_SUB TYPE 1"]),
//         )
//         .input(
//           "Product_Type_Sub2",
//           sql.VarChar,
//           safeString(row["STS_Product_SUB TYPE 2"]),
//         )
//         .input("Sub_Product_1", sql.VarChar, safeString(row["Sub_Product 1"]))
//         .input("Sub_Product_2", sql.VarChar, safeString(row["Sub_Product 2"]))
//         .input("Sub_Product_3", sql.VarChar, safeString(row["Sub_Product 3"]))
//         .input("Sub_Product_4", sql.VarChar, safeString(row["Sub_Product 4"]))
//         .input("Sub_Product_5", sql.VarChar, safeString(row["Sub_Product 5"]))
//         .input(
//           "Product_Type_Main_TH",
//           sql.VarChar,
//           safeString(row["Product_MAIN TYPE_TH"]),
//         )
//         .input(
//           "Product_Type_Sub_TH",
//           sql.VarChar,
//           safeString(row["Product_SUB TYPE 1_TH"]),
//         )
//         .input(
//           "Product_Type_Sub2_TH",
//           sql.VarChar,
//           safeString(row["Product_SUB TYPE 2_TH"]),
//         ).query(`
//         INSERT INTO MD_View
//         (Product_FG, Product_Header, Product_Type_Main, Product_Type_Sub, Product_Type_Sub2,
//          Sub_Product_1, Sub_Product_2, Sub_Product_3, Sub_Product_4, Sub_Product_5, Product_Type_Main_TH, Product_Type_Sub_TH, Product_Type_Sub2_TH)
//         VALUES
//         (@Product_FG, @Product_Header, @Product_Type_Main, @Product_Type_Sub, @Product_Type_Sub2,
//          @Sub_Product_1, @Sub_Product_2, @Sub_Product_3, @Sub_Product_4, @Sub_Product_5, @Product_Type_Main_TH, @Product_Type_Sub_TH, @Product_Type_Sub2_TH)
//       `);
//     }
//   } catch (error) {
//     console.error("❌ Database update failed:", error);
//   } finally {
//     isUpdating = false;
//   }
// };

// const updatematerial = async ({ dataMaterial }: { dataMaterial: any[] }) => {
//   try {
//     const pool2 = await new sql.ConnectionPool(dbconnecting).connect();

//     await pool2.request().query(`DELETE Material`);

//     for (const row of dataMaterial) {
//       // โค้ดส่วน INSERT
//       await pool2
//         .request()
//         .input("Product_FG", sql.VarChar, safeString(row.Product_FG))
//         .input("COLOUR_EPOXY", sql.Float, safeString(row[`COLOUR - EPOXY`]))
//         .input(
//           "COLOUR_DYE",
//           sql.Float,
//           safeString(row[`COLOUR - DYE AND SPRAY PAINT`]),
//         )
//         .input(
//           "COLOUR_MELAMINE",
//           sql.Float,
//           safeString(row[`COLOUR - MELAMINE RESIN FILM`]),
//         )
//         .input("COLOUR_HPL", sql.Float, safeString(row[`COLOUR - HPL`]))
//         .input("COLOUR_LINO", sql.Float, safeString(row[`COLOUR - LINO`]))
//         .input(
//           "COLOUR_PVC",
//           sql.Float,
//           safeString(row[`COLOUR - PVC MEMBRANE`]),
//         )
//         .input("COLOUR_FABRIC", sql.Float, safeString(row[`COLOUR - FABRIC`]))
//         .input(
//           "COLOUR_MESH",
//           sql.Float,
//           safeString(row[`COLOUR - MESH FABRIC`]),
//         )
//         .input(
//           "COLOUR_SCIENTIFIC",
//           sql.Float,
//           safeString(row[`COLOUR - SCIENTIFIC LEATHER`]),
//         )
//         .input("SEWING_PATTERN", sql.Float, safeString(row[`SEWING PATTERN`]))
//         .query(`
//         INSERT INTO Material
//         (Product_FG, [COLOUR - EPOXY], [COLOUR - DYE AND SPRAY PAINT], [COLOUR - MELAMINE RESIN FILM], [COLOUR - HPL], [COLOUR - LINO],
//          [COLOUR - PVC MEMBRANE], [COLOUR - FABRIC], [COLOUR - MESH FABRIC], [COLOUR - SCIENTIFIC LEATHER], [SEWING PATTERN])
//         VALUES
//         (@Product_FG, @COLOUR_EPOXY, @COLOUR_DYE, @COLOUR_MELAMINE, @COLOUR_HPL, @COLOUR_LINO,
//           @COLOUR_PVC, @COLOUR_FABRIC, @COLOUR_MESH, @COLOUR_SCIENTIFIC, @SEWING_PATTERN)
//       `);
//     }
//   } catch (error) {
//     console.error("❌ Database update failed:", error);
//   } finally {
//     console.log("✅ update Success");
//   }
// };

// setTimeout(async () => {
//   await updateFromFile();
//   return { message: "Update process completed" };
// }, 43200000);

// // API Endpoint
// app.get("/update-from-file", async () => {
//   await updateFromFile();
//   return { message: "Update process completed" };
// });

// async function updateFromFile() {
//   try {
//     const dataMain = readExcelFileByName(excelFilePath, "STANDARD PRODUCT");
//     const dataMD = readExcelFileByName(excelFilePath, "MD VIEW");
//     const dataMaterial = readExcelFileByName(excelFilePath, "MATERIAL VIEW");

//     await updateDatabase({ dataMain });
//     await updateViewMD({ dataMD });
//     await updatematerial({ dataMaterial });
//   } catch (error) {
//     console.error("Processing failed:", error);
//   }
// }

app.get("/Get_Products", async () => {
  const pool = await sql.connect(dbconnecting);
  try {
    const result = await pool.query("SELECT * FROM Product_Group");
    return result.recordset;
  } catch (error) {
    console.error("Database query failed:", error);
    return { error: "Failed to fetch products" };
  }
});

app.post("/ProductModal", async ({ body }) => {
  const pool = await sql.connect(dbconnecting);

  const productBody = body as string[];

  try {
    const productHeader = productBody[0] ? `%${productBody[0]}%` : null;
    const productTypeMain = productBody[1] ? `%${productBody[1]}%` : null;
    const productTypeSub = productBody[2] ? `%${productBody[2]}%` : null;
    const productTypeSub2 = productBody[3] ? `%${productBody[3]}%` : null;
    const productserie = productBody[4] ? `${productBody[4]}` : null;

    const result = await pool
      .request()
      .input("Product_Header", sql.VarChar, productHeader)
      .input("Product_Type_Main", sql.VarChar, productTypeMain)
      .input("Product_Type_Sub", sql.VarChar, productTypeSub)
      .input("Product_Type_Sub2", sql.VarChar, productTypeSub2)
      .input("Product_Family", sql.VarChar, productserie).query(`
      SELECT *
      FROM Product
      INNER JOIN MD_View ON Product.Product_FG = MD_View.Product_FG
      WHERE 
        (@Product_Header IS NULL OR MD_View.Product_Header LIKE @Product_Header)
        AND (@Product_Type_Main IS NULL OR MD_View.Product_Type_Main LIKE @Product_Type_Main)
        AND (@Product_Type_Sub IS NULL OR MD_View.Product_Type_Sub LIKE @Product_Type_Sub)
        AND (@Product_Type_Sub2 IS NULL OR MD_View.Product_Type_Sub2 LIKE @Product_Type_Sub2)
        AND (@Product_Family IS NULL OR Product.Product_Serie = @Product_Family)
        ORDER BY Product.Product_Name ASC
    `);

    return result.recordset;
  } catch (error) {
    console.error("Database query failed:", error);
    return { error: "Failed to fetch products" };
  }
});

app.get("/api/list_directory", async ({ query, set }) => {
  const dirPathParam = query.path || "";
  const decodedPath = decodeURIComponent(dirPathParam as string);
  const fullPath = path.join(MOUNT_PATH, decodedPath);
  const pattern = query.pattern as string | undefined;

  // Directory traversal protection
  if (!fullPath.startsWith(MOUNT_PATH)) {
    set.status = 400;
    return { error: "Invalid path" };
  }

  try {
    const files = await fs.readdir(fullPath, { withFileTypes: true });

    const filteredFiles = files.filter((dirent) => {
      if (!pattern) {
        return true;
      }
      if (!dirent.name.startsWith(pattern)) {
        return false;
      }
      const nextChar = dirent.name[pattern.length];
      if (nextChar && /\d|\./.test(nextChar)) {
        return false;
      }
      return true;
    });

    const fileList = filteredFiles.map((dirent) => ({
      name: dirent.name,
      isDirectory: dirent.isDirectory(),
    }));
    return { path: decodedPath, files: fileList };
  } catch (error) {
    console.error("Error listing directory:", error);
    set.status = 500;
    return { error: "Failed to list directory" };
  }
});

app.get("/api/get_image_by_pattern", async ({ query, set }) => {
  const { path: dirPath, pattern } = query;

  if (!dirPath || !pattern) {
    set.status = 400;
    return { error: "Missing path or pattern" };
  }

  try {
    const decodedDirPath = decodeURIComponent(dirPath as string);
    const decodedPattern = decodeURIComponent(pattern as string);

    let fullDirPath = path.join(MOUNT_PATH, decodedDirPath);

    // ป้องกัน Directory Traversal Attack
    if (!fullDirPath.startsWith(MOUNT_PATH)) {
      set.status = 400;
      return { error: "Invalid path" };
    }

    // ฟังก์ชันช่วยค้นหารูป
    const findImage = (files: string[], pattern: string) => {
      return files.find((f) => {
        const lower = f.toLowerCase();
        const isImage =
          lower.endsWith(".jpg") ||
          lower.endsWith(".jpeg") ||
          lower.endsWith(".png") ||
          lower.endsWith(".gif");

        return isImage && lower.startsWith(pattern.toLowerCase());
      });
    };

    // ----------------------------------------
    // 1) หาในโฟลเดอร์ย่อยก่อน
    // ----------------------------------------
    let files: string[] = [];
    try {
      const stats = await fs.stat(fullDirPath);
      if (!stats.isDirectory()) {
        set.status = 404;
        return { error: "Path is not a directory" };
      }
      files = await fs.readdir(fullDirPath);
    } catch (err: any) {
      if (err.code === "ENOENT") {
        set.status = 404;
        return { error: "Directory not found" };
      }
      throw err;
    }

    let foundFile = findImage(files, decodedPattern);

    // ----------------------------------------
    // 2) ถ้าไม่เจอ → หาในโฟลเดอร์แม่
    // ----------------------------------------
    if (!foundFile) {
      const parentDir = path.dirname(fullDirPath);

      // ป้องกันหลุดออกนอก MOUNT_PATH
      if (parentDir.startsWith(MOUNT_PATH)) {
        try {
          const parentFiles = await fs.readdir(parentDir);
          const parentFound = findImage(parentFiles, decodedPattern);

          if (parentFound) {
            foundFile = parentFound;
            fullDirPath = parentDir; // ปรับ path ให้ถูกต้อง
          }
        } catch (e) {
          // ignore
        }
      }
    }

    // ----------------------------------------
    // 3) ถ้ายังไม่เจอ → 404
    // ----------------------------------------
    if (!foundFile) {
      set.status = 404;
      return { error: "File not found" };
    }

    // path สุดท้าย
    const finalPath = path.join(fullDirPath, foundFile);

    const mimeType = mime.getType(finalPath) || "application/octet-stream";
    set.headers["Content-Type"] = mimeType;

    const buffer = await fs.readFile(finalPath);
    return buffer;
  } catch (err: any) {
    console.error("Error fetching image:", {
      message: err.message,
      code: err.code,
    });
    set.status = 500;
    return { error: "Internal Server Error" };
  }
});

app.get("/api/Family", async ({ query, set }) => {
  const { path: dirPath, pattern } = query;

  if (!dirPath || !pattern) {
    set.status = 400;
    return { error: "Missing path or pattern" };
  }

  try {
    const decodedDirPath = decodeURIComponent(dirPath as string);
    const decodedPattern = decodeURIComponent(pattern as string);
    const fullDirPath = path.join(MOUNT_PATH, decodedDirPath);

    if (!fullDirPath.startsWith(MOUNT_PATH)) {
      set.status = 400;
      return { error: "Invalid path" };
    }

    const stats = await fs.stat(fullDirPath);
    if (!stats.isDirectory()) {
      set.status = 404;
      return { error: "Path is not a directory" };
    }

    const files = await fs.readdir(fullDirPath);

    // ✅ Match ชื่อไฟล์ตรงเป๊ะ (ไม่ใช่แค่ขึ้นต้น)
    const foundFile = files.find((f) => {
      const lowerCaseFilename = f.toLowerCase();
      const nameWithoutExt = lowerCaseFilename.replace(/\.[^/.]+$/, "");
      const isImage =
        lowerCaseFilename.endsWith(".jpg") ||
        lowerCaseFilename.endsWith(".jpeg") ||
        lowerCaseFilename.endsWith(".png") ||
        lowerCaseFilename.endsWith(".gif");
      const isPatternMatch = nameWithoutExt === decodedPattern.toLowerCase();
      return isPatternMatch && isImage;
    });

    if (!foundFile) {
      set.status = 404;
      return { error: "File not found" };
    }

    const finalPath = path.join(fullDirPath, foundFile);
    const mimeType = mime.getType(finalPath) || "application/octet-stream";
    set.headers["Content-Type"] = mimeType;

    const buffer = await fs.readFile(finalPath);
    return buffer;
  } catch (err: any) {
    console.error("Error fetching image:", {
      message: err.message,
      code: err.code,
    });
    set.status = 500;
    return { error: "Internal Server Error" };
  }
});

app.post("/FindFileProduct", async ({ body, set }) => {
  try {
    const pool = await sql.connect(dbconnecting);
    const result = await pool
      .request()
      .input("Product_Family", sql.VarChar, body.Product_Family)
      .query("SELECT * FROM Product WHERE Product_Family = @Product_Family");

    const Material = await pool
      .request()
      .input("Product_Family", sql.VarChar, body.Product_Family).query(`
    SELECT Product.Product_FG, [Colour - Epoxy], [COLOUR - DYE AND SPRAY PAINT], [Colour - Melamine Resin Film], [Colour - HPL],
    [Colour - Lino], [Colour - PVC Membrane], [Colour - Fabric], [Colour - Mesh Fabric], [Colour - Scientific Leather], [Sewing Pattern]
    FROM Material
    INNER JOIN Product ON Material.Product_FG = Product.Product_FG
    WHERE Product.Product_Family = @Product_Family
  `);

    const columns = [
      "Colour - Epoxy",
      "COLOUR - DYE AND SPRAY PAINT",
      "Colour - Melamine Resin Film",
      "Colour - HPL",
      "Colour - Lino",
      "Colour - PVC Membrane",
      "Colour - Fabric",
      "Colour - Mesh Fabric",
      "Colour - Scientific Leather",
      "Sewing Pattern",
    ];

    let ColorPDF: string[] = [];

    Material.recordset.forEach((item: any) => {
      columns.forEach((col) => {
        if (item[col]) {
          ColorPDF.push(col); // เก็บค่าที่ไม่ว่าง
        }
      });
    });

    // กรองค่าซ้ำออก
    ColorPDF = [...new Set(ColorPDF)];

    if (result.recordset.length === 0) {
      set.status = 404;
      return { message: "No products found." };
    }

    const productsWithFiles = await Promise.all(
      result.recordset.map(async (product) => {
        const familyFolder = product.Product_Family;
        const fullDirPath = path.join(MOUNT_PATH, "All Product", familyFolder);

        // 1. หาไฟล์ PDF ในโฟลเดอร์หลัก
        let files: string[] = [];
        try {
          const stats = await fs.stat(fullDirPath);
          if (stats.isDirectory()) {
            const items = await fs.readdir(fullDirPath, {
              withFileTypes: true,
            });
            files = items
              .filter(
                (item) =>
                  item.isFile() && item.name.toLowerCase().endsWith(".pdf"),
              )
              .map((item) => item.name);
          }
        } catch (err) {
          if (err.code !== "ENOENT") {
            console.error(`Error checking directory '${fullDirPath}':`, err);
          }
        }

        // 2. เข้าไปโฟลเดอร์ Project Reference เพื่อหาไฟล์ .jpg
        let projectReferenceFiles: string[] = [];
        const projectRefDir = path.join(fullDirPath, "Project Reference");
        try {
          const stats = await fs.stat(projectRefDir);
          if (stats.isDirectory()) {
            const items = await fs.readdir(projectRefDir, {
              withFileTypes: true,
            });
            projectReferenceFiles = items
              .filter(
                (item) =>
                  item.isFile() && item.name.toLowerCase().endsWith(".jpg"),
              )
              .map((item) => item.name);
          }
        } catch (err) {
          if (err.code !== "ENOENT") {
            console.error(`Error checking directory '${projectRefDir}':`, err);
          }
        }

        let Drawing: string[] = [];
        const DrawingRefDir = path.join(fullDirPath, "Drawing");
        try {
          const stats = await fs.stat(DrawingRefDir);
          if (stats.isDirectory()) {
            const items = await fs.readdir(DrawingRefDir, {
              withFileTypes: true,
            });
            Drawing = items
              .filter(
                (item) =>
                  item.isFile() && item.name.toLowerCase().endsWith(".pdf"),
              )
              .map((item) => item.name);
          }
        } catch (err) {
          if (err.code !== "ENOENT") {
            console.error(`Error checking directory '${DrawingRefDir}':`, err);
          }
        }

        return {
          productData: product,
          fullDirPath,
          files,
          projectReferenceFiles,
          Drawing,
          Material: ColorPDF,
        };
      }),
    );

    return productsWithFiles;
  } catch (err: any) {
    console.error("Error in /FindFileProduct:", err);
    set.status = 500;
    return { error: "Internal Server Error", detail: err.message };
  }
});

app.get("/api/pdf", async ({ query, set }) => {
  const filePathParam = query.path;

  // 1. ตรวจสอบว่ามี parameter "path" ส่งมาหรือไม่
  if (!filePathParam) {
    set.status = 400;
    return { error: "Missing path" };
  }

  const decodedPath = decodeURIComponent(filePathParam);
  const fullPath = path.join(MOUNT_PATH, decodedPath);

  // 2. ป้องกัน Directory Traversal Attack
  if (!fullPath.startsWith(MOUNT_PATH)) {
    set.status = 403;
    return { error: "Invalid path" };
  }

  try {
    // 3. ตรวจสอบว่ามีไฟล์อยู่จริงหรือไม่
    const stats = await fs.stat(fullPath);
    if (!stats.isFile()) {
      set.status = 404;
      return { error: "File not found" };
    }
    // 4. ส่งไฟล์กลับไป
    set.headers["Content-Type"] = "application/pdf";
    set.headers["Content-Disposition"] = `inline; filename="${path.basename(
      fullPath,
    )}"`; // Optional: เพื่อให้ไฟล์แสดงในเบราว์เซอร์

    // อ่านไฟล์และส่งกลับไป
    const fileStream = await fs.readFile(fullPath);

    return new Response(fileStream, { headers: set.headers });
  } catch (err) {
    console.error(err);

    // จัดการข้อผิดพลาด เช่น ไฟล์ไม่มีอยู่จริง, ไม่มีสิทธิ์เข้าถึง ฯลฯ
    if (err.code === "ENOENT") {
      set.status = 404;
      return { error: "File not found" };
    }
    set.status = 500;
    return { error: "Internal Server Error" };
  }
});

app.get("/api/image", async ({ query, set }) => {
  try {
    // กำหนดโฟลเดอร์ Project Reference โดยตรง
    const fullDirPath = path.join(MOUNT_PATH, "Project Reference");

    // ป้องกัน Directory Traversal Attack
    if (!fullDirPath.startsWith(MOUNT_PATH)) {
      set.status = 400;
      return { error: "Invalid path" };
    }

    let files;
    try {
      const stats = await fs.stat(fullDirPath);
      if (!stats.isDirectory()) {
        set.status = 404;
        return { error: "Path is not a directory" };
      }
      files = await fs.readdir(fullDirPath);
    } catch (err) {
      if (err.code === "ENOENT") {
        set.status = 404;
        return { error: "Directory not found" };
      }
      throw err;
    }

    // ค้นหาไฟล์ .jpg เท่านั้น
    const foundFile = files.find((f) => f.toLowerCase().endsWith(".jpg"));

    if (!foundFile) {
      set.status = 404;
      return { error: "File not found" };
    }

    const finalPath = path.join(fullDirPath, foundFile);

    const mimeType = mime.getType(finalPath) || "application/octet-stream";
    set.headers["Content-Type"] = mimeType;

    const buffer = await fs.readFile(finalPath);
    return buffer;
  } catch (err: any) {
    console.error("Error fetching image:", {
      message: err.message,
      code: err.code,
    });
    set.status = 500;
    return { error: "Internal Server Error" };
  }
});

app.get("/api/Color", async ({ query, set }) => {
  try {
    const requestedPath = query.path;

    if (!requestedPath) {
      set.status = 400;
      return { error: "Missing path" };
    }

    const finalPath = path.normalize(path.join(MOUNT_PATH, requestedPath));
    if (!finalPath.startsWith(MOUNT_PATH)) {
      set.status = 400;
      return { error: "Invalid path" };
    }

    let stats;
    try {
      stats = await fs.stat(finalPath);
    } catch {
      set.status = 404;
      return { error: "File not found" };
    }

    let filePath = finalPath;

    if (stats.isDirectory()) {
      // ถ้าเป็นโฟลเดอร์ → หา PDF ข้างใน
      const files = await fs.readdir(finalPath);
      const pdfFile = files.find((f) => f.toLowerCase().endsWith(".pdf"));
      if (!pdfFile) {
        set.status = 404;
        return { error: "No PDF file found in directory" };
      }
      filePath = path.join(finalPath, pdfFile);
    }

    const mimeType = mime.getType(filePath) || "application/pdf";
    set.headers["Content-Type"] = mimeType;

    return await fs.readFile(filePath);
  } catch (err: any) {
    console.error("Error fetching file:", err);
    set.status = 500;
    return { error: "Internal Server Error" };
  }
});

app.get("/api/file/360", async ({ query, set }) => {
  try {
    const dirPath = query.path as string | undefined;

    if (!dirPath) {
      set.status = 400;
      return { error: "Missing path" };
    }

    const decodedDirPath = decodeURIComponent(dirPath);
    const fullDirPath = path.join(MOUNT_PATH, decodedDirPath);

    // ป้องกัน Directory Traversal Attack
    if (!fullDirPath.startsWith(MOUNT_PATH)) {
      set.status = 400;
      return { error: "Invalid path" };
    }

    // ตรวจสอบว่าเป็น directory
    try {
      const stats = await fs.stat(fullDirPath);
      if (!stats.isDirectory()) {
        set.status = 404;
        return { error: "Path is not a directory" };
      }
    } catch (err: any) {
      if (err.code === "ENOENT") {
        set.status = 404;
        return { error: "Directory not found" };
      }
      throw err;
    }

    // อ่านไฟล์ใน directory
    const files = await fs.readdir(fullDirPath);

    // หาไฟล์ .glb ตัวแรก
    const foundFile = files.find((f) => f.toLowerCase().endsWith(".glb"));
    if (!foundFile) {
      set.status = 404;
      return { error: "File not found" };
    }

    const finalPath = path.join(fullDirPath, foundFile);

    // MIME type
    const mimeType = mime.getType(finalPath) || "application/octet-stream";

    // ตั้ง header
    set.headers = {
      "Content-Type": mimeType,
      "Content-Disposition": `inline; filename="${foundFile}"`,
      "Access-Control-Allow-Origin": "*", // รองรับ CORS
    };

    // ส่งไฟล์เป็น binary
    const fileBuffer = await fs.readFile(finalPath);
    return fileBuffer;
  } catch (err: any) {
    console.error("Error fetching 3D file:", err);
    set.status = 500;
    return { error: "Internal Server Error" };
  }
});

app.post("/API/SelectFamily", async ({ body }) => {
  try {
    const pool = await sql.connect(dbconnecting);

    const res = await pool
      .request()
      .input("Product_name", sql.VarChar, body.Serie)
      .query("SELECT * FROM Product WHERE Product_name = @Product_name");

    console.log(res.recordset);

    return res.recordset;
  } catch (error) {
    console.error(error);
  }
});

app.get("/API/Product", async ({ query }) => {
  try {
    const pool = await sql.connect(dbconnecting);

    const res = await pool.request().query(
      `SELECT Product.Product_FG,
        Product.Product_Serie,
        Product.Product_name,
        Product.Product_Code,
        Product.Description,
        MD_View.Product_Header,
        MD_View.Product_Type_Main,
        MD_View.Product_Type_Sub,
        MD_View.Product_Type_Sub2,
        MD_View.Sub_Product_1,
        MD_View.Sub_Product_2,
        MD_View.Sub_Product_3,
        MD_View.Sub_Product_4,
        MD_View.Sub_Product_5,
        MD_View.Product_Header_TH,
        MD_View.Product_Type_Main_TH,
        MD_View.Product_Type_Sub_TH,
        MD_View.Product_Type_Sub2_TH,
        Product.Product_Path_img,
        Product.Product_price,
        Product.Price_Validity,
        Product.Product_Family
        
        FROM Product INNER JOIN MD_View ON Product.Product_FG = MD_View.Product_FG ORDER BY Product_Name ASC`,
    );    

    return res.recordset;
  } catch (error) {
    console.error(error);
  }
});

let uploadProgress = 0;

app.post("/upload-excel", async ({ body }) => {
  try {
    const { data } = body;
    let pool = await sql.connect(dbconnecting);
    const total = data.length;

    await pool.request().query("DELETE Product");
    await pool.request().query("DELETE MD_View");

    uploadProgress = 0;

    for (let i = 0; i < total; i++) {
      const row = data[i];

      console.log(row);
      

      await pool
        .request()
        .input("Product_FG", sql.VarChar, safeString(row.Product_FG))
        .input("Product_Serie", sql.VarChar, safeString(row.Product_Serie))
        .input("Product_name", sql.VarChar, safeString(row.Product_name))
        .input("Product_Code", sql.VarChar, safeString(row.Product_Code))
        .input(
          "Product_price",
          sql.Int,
          row.Product_price ? Number(row.Product_price) : null,
        )
        .input("Product_Path_img", sql.VarChar, row.Product_Path_img)
        .input("Product_Family", sql.VarChar, safeString(row.Product_Serie))
        .query(`
              INSERT INTO Product
              (Product_FG, Product_Serie, Product_name, Product_Code, Product_price, Product_Path_img, Product_Family)
              VALUES
              (@Product_FG, @Product_Serie, @Product_name, @Product_Code, @Product_price, @Product_Path_img, @Product_Family)
          `);

      await pool
        .request()
        .input("Product_FG", sql.VarChar, safeString(row.Product_FG))
        .input("Product_Header", sql.VarChar, safeString(row.STS_Product_HEAD))
        .input(
          "Product_Type_Main",
          sql.VarChar,
          safeString(row["STS_Product_MAIN TYPE"]),
        )
        .input(
          "Product_Type_Sub",
          sql.VarChar,
          safeString(row["STS_Product_SUB TYPE 1"]),
        )
        .input(
          "Product_Type_Sub2",
          sql.VarChar,
          safeString(row["STS_Product_SUB TYPE 2"]),
        )
        .input("Sub_Product_1", sql.VarChar, safeString(row["Sub_Product 1"]))
        .input("Sub_Product_2", sql.VarChar, safeString(row["Sub_Product 2"]))
        .input("Sub_Product_3", sql.VarChar, safeString(row["Sub_Product 3"]))
        .input("Sub_Product_4", sql.VarChar, safeString(row["Sub_Product 4"]))
        .input("Sub_Product_5", sql.VarChar, safeString(row["Sub_Product 5"]))
        .input(
          "Product_Type_Main_TH",
          sql.VarChar,
          safeString(row["Product_MAIN TYPE_TH"]),
        )
        .input(
          "Product_Type_Sub_TH",
          sql.VarChar,
          safeString(row["Product_SUB TYPE 1_TH"]),
        )
        .input(
          "Product_Type_Sub2_TH",
          sql.VarChar,
          safeString(row["Product_SUB TYPE 2_TH"]),
        ).query(`
        INSERT INTO MD_View
        (Product_FG, Product_Header, Product_Type_Main, Product_Type_Sub, Product_Type_Sub2,
         Sub_Product_1, Sub_Product_2, Sub_Product_3, Sub_Product_4, Sub_Product_5, Product_Type_Main_TH, Product_Type_Sub_TH, Product_Type_Sub2_TH)
        VALUES
        (@Product_FG, @Product_Header, @Product_Type_Main, @Product_Type_Sub, @Product_Type_Sub2,
         @Sub_Product_1, @Sub_Product_2, @Sub_Product_3, @Sub_Product_4, @Sub_Product_5, @Product_Type_Main_TH, @Product_Type_Sub_TH, @Product_Type_Sub2_TH)
      `);

      uploadProgress = Math.round(((i + 1) / total) * 100);
    }
  } catch (err) {
    console.error(err);
    return err;
  }
});

app.get("/upload-progress", () => {
  return { progress: uploadProgress };
});

app.listen(5005);

console.log(`Elysia is running at ${app.server?.hostname}:${app.server?.port}`);
