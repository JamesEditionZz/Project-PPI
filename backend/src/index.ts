import { Elysia, t } from "elysia";
import cors from "@elysiajs/cors";
import sql from "mssql";
import path, { join } from "path";
import { readdir } from "fs/promises";
import { existsSync } from "fs";

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

const MOUNT_PATH = "/mnt/mount_path";

const safeString = (value: any): string | null => {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  return str === "" ? null : str;
};

setInterval(() => {
  updatePriceAuto();
}, 21600000);

const app = new Elysia().use(
  cors({
    origin: "*",
    methods: ["GET", "POST"],
  }),
);

app.get("/Get_Products", async () => {
  const pool = await sql.connect(dbconnecting);
  try {
    const result = await pool.query("SELECT * FROM Product_Group");
    // return result.recordset;
  } catch (error) {
    console.error("Database query failed:", error);
    // return { error: "Failed to fetch products" };
  }
});

app.post("/Group_MD", async ({ body }) => {
  const pool = await sql.connect(dbconnecting);

  console.log(body);

  try {
    if (body.split(":")[0] === "Header") {
      const result = await pool
        .request()
        .input("Header", sql.VarChar, body.split(":")[1]).query(`
      SELECT * FROM Product INNER JOIN MD_View ON Product.Product_FG = MD_View.Product_FG WHERE Product_Header = @Header ORDER BY Product.Product_Name ASC
    `);

      return result.recordset;
    } else if (body.split(":")[0] === "Main") {
      const result = await pool
        .request()
        .input("Main", sql.VarChar, body.split(":")[1]).query(`
      SELECT * FROM Product INNER JOIN MD_View ON Product.Product_FG = MD_View.Product_FG WHERE Product_Type_Main = @Main ORDER BY Product.Product_Name ASC
    `);

      return result.recordset;
    } else if (body.split(":")[0] === "Sub") {
      const result = await pool
        .request()
        .input("Sub", sql.VarChar, body.split(":")[1]).query(`
      SELECT * FROM Product INNER JOIN MD_View ON Product.Product_FG = MD_View.Product_FG WHERE Product_Type_Sub = @Sub ORDER BY Product.Product_Name ASC
    `);

      return result.recordset;
    } else if (body.split(":")[0] === "Sub2") {
      const result = await pool
        .request()
        .input("Sub2", sql.VarChar, body.split(":")[1]).query(`
      SELECT * FROM Product INNER JOIN MD_View ON Product.Product_FG = MD_View.Product_FG WHERE Product_Type_Sub2 = @Sub2 ORDER BY Product.Product_Name ASC
    `);

      return result.recordset;
    } else if (body.split(":")[0] === "Sub3") {
      const result = await pool
        .request()
        .input("Sub3", sql.VarChar, body.split(":")[1]).query(`
      SELECT * FROM Product INNER JOIN MD_View ON Product.Product_FG = MD_View.Product_FG WHERE Product_Type_Sub3 = @Sub3 ORDER BY Product.Product_Name ASC
    `);

      return result.recordset;
    } else if (body.split(":")[0] === "Sub4") {
      const result = await pool
        .request()
        .input("Sub4", sql.VarChar, body.split(":")[1]).query(`
      SELECT * FROM Product INNER JOIN MD_View ON Product.Product_FG = MD_View.Product_FG WHERE Product_Type_Sub4 = @Sub4 ORDER BY Product.Product_Name ASC
    `);

      return result.recordset;
    } else if (body.split(":")[0] === "Serie") {
      const result = await pool
        .request()
        .input("Serie", sql.VarChar, body.split(":")[1]).query(`
      SELECT * FROM Product INNER JOIN MD_View ON Product.Product_FG = MD_View.Product_FG WHERE Product_Serie = @Serie ORDER BY Product.Product_Name ASC
    `);

      return result.recordset;
    } else if (body.split(":")[0] === "Product") {
      const result = await pool
        .request()
        .input("Product", sql.VarChar, body.split(":")[1]).query(`
      SELECT * FROM Product INNER JOIN MD_View ON Product.Product_FG = MD_View.Product_FG WHERE Product_name = @Product ORDER BY Product.Product_Name ASC
    `);

      return result.recordset;
    }
  } catch (error) {
    console.error("Database query failed:", error);
    return { error: "Failed to fetch products" };
  }
});

app.get("/API/Full_Product", async ({ query }) => {
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

    const products = res.recordset;

    // --- วนลูปเช็คไฟล์ PDF ของแต่ละตัว ---
    const results = await Promise.all(
      products.map(async (product: any) => {
        let FileMaterial = false;
        let FileCatalog = false;
        let FileDrawing = false;
        let FileReference = false;
        let refCount = 0;

        try {
          // ใช้ค่า Product_FG (หรือ Product_name ตามที่พี่ตั้งชื่อโฟลเดอร์ไว้)
          // ในที่นี้ผมสมมติว่าชื่อโฟลเดอร์ตรงกับ Product_FG นะครับ
          const cleanFolderName = product.Product_Header
            ? product.Product_Header.replace(/^\d+\s+/, "")
            : "";
          const targetFolderMaterial = join(
            MOUNT_PATH,
            "Materials",
            cleanFolderName,
          );
          const targetFolderCatalog = join(
            MOUNT_PATH,
            "All Product",
            product.Product_Serie,
            product.Product_name,
          );
          const targetFolderDrawing = join(
            MOUNT_PATH,
            "All Product",
            product.Product_Serie,
            product.Product_name,
            "Drawing",
          );
          const targetFolderReference = join(
            MOUNT_PATH,
            "All Product",
            product.Product_Serie,
            product.Product_name,
            "Project Reference",
          );

          if (existsSync(targetFolderMaterial)) {
            const files = await readdir(targetFolderMaterial);
            // เช็คว่ามีไฟล์ .pdf ไหม
            FileMaterial = files.some((file) =>
              file.toLowerCase().endsWith(".pdf"),
            );
          }

          if (existsSync(targetFolderCatalog)) {
            const files = await readdir(targetFolderCatalog);
            // เช็คว่ามีไฟล์ .pdf ไหม
            FileCatalog = files.some((file) =>
              file.toLowerCase().endsWith(".pdf"),
            );
          }

          if (existsSync(targetFolderDrawing)) {
            const files = await readdir(targetFolderDrawing);
            // เช็คว่ามีไฟล์ .pdf ไหม
            FileDrawing = files.some((file) =>
              file.toLowerCase().endsWith(".pdf"),
            );
          }

          if (existsSync(targetFolderReference)) {
            const filesRef = await readdir(targetFolderReference);
            // กรองนับเฉพาะไฟล์รูปภาพ
            const imageFiles = filesRef.filter((file) => {
              const ext = file.toLowerCase();
              return (
                ext.endsWith(".jpg") ||
                ext.endsWith(".jpeg") ||
                ext.endsWith(".png") ||
                ext.endsWith(".webp")
              );
            });
            refCount = imageFiles.length;
          }
        } catch (err) {
          // ถ้าโฟลเดอร์ไม่มี หรือเข้าไม่ได้ ให้เป็น false
          FileMaterial = false;
          FileCatalog = false;
          FileDrawing = false;
        }

        // คืนค่า Object เดิม + สถานะไฟล์
        return {
          ...product,
          Material: FileMaterial,
          Catalog: FileCatalog,
          Drawing: FileDrawing,
          Reference: refCount,
        };
      }),
    );

    return results; // ส่ง Array ที่รวมสถานะไฟล์แล้วไปให้ Frontend
  } catch (error) {
    console.error(error);
  }
});

app.get(
  "/api/Cover/Photo",
  async ({ query, set }) => {
    const { Main } = query;

    if (!Main) {
      set.status = 400;
      return "Missing Main parameter";
    }

    try {
      // Path หลักที่เก็บรูป Cover ทั้งหมด
      const targetFolder = join(MOUNT_PATH, "All Product", "Cover_Photo");
      const files = await readdir(targetFolder);

      // ค้นหาไฟล์ที่ชื่อ (ไม่รวมนามสกุล) ตรงกับค่า Main ที่ส่งมา
      // เช่น ส่ง Main="BLOOM" ให้หาไฟล์ชื่อ "BLOOM.jpg" หรือ "BLOOM.png"
      const targetFile = files.find((file) => {
        const fileNameWithoutExt = file.substring(0, file.lastIndexOf("."));
        return fileNameWithoutExt.toLowerCase() === Main.toLowerCase();
      });

      if (targetFile) {
        const finalPath = join(targetFolder, targetFile);
        return Bun.file(finalPath);
      }

      set.status = 404;
      return `No image found for: ${Main}`;
    } catch (error) {
      set.status = 500;
      return "Folder access denied";
    }
  },
  {
    query: t.Object({
      Main: t.String(),
    }),
  },
);

app.get(
  "/api/Product",
  async ({ query, set }) => {
    const { serie, code } = query; // รับแค่ serie กับ code

    try {
      const targetFolder = join(MOUNT_PATH, "All Product", serie, code);

      console.log(targetFolder);

      const files = await readdir(targetFolder);

      // ค้นหาไฟล์แรกที่เป็นนามสกุลรูปภาพ (jpg, png, webp, etc.)
      // โดยไม่สนว่าชื่อไฟล์จะเป็นอะไร
      const imageFile = files.find((file) => {
        const lowerFile = file.toLowerCase();
        return /\.(jpg|jpeg|png|webp|gif)$/.test(lowerFile);
      });

      if (imageFile) {
        const finalPath = join(targetFolder, imageFile);
        return Bun.file(finalPath);
      }

      set.status = 404;
      return "No image found in this folder";
    } catch (error) {
      set.status = 500;
      return "Folder access error";
    }
  },
  {
    query: t.Object({
      serie: t.String(),
      code: t.String(),
      // pattern: t.Optional(t.String()) // ปรับเป็น Optional หรือลบออกไปเลยก็ได้
    }),
  },
);

app.get(
  "/api/Picture/Product",
  async ({ query, set }) => {
    const { serie, code } = query; // รับแค่ serie กับ code

    try {
      const targetFolder = join(MOUNT_PATH, "All Product", serie, code);

      const files = await readdir(targetFolder);

      // ค้นหาไฟล์แรกที่เป็นนามสกุลรูปภาพ (jpg, png, webp, etc.)
      // โดยไม่สนว่าชื่อไฟล์จะเป็นอะไร
      const imageFile = files.find((file) => {
        const lowerFile = file.toLowerCase();
        return /\.(jpg|jpeg|png|webp|gif)$/.test(lowerFile);
      });

      if (imageFile) {
        const finalPath = join(targetFolder, imageFile);
        return Bun.file(finalPath);
      }

      set.status = 404;
      return "No image found in this folder";
    } catch (error) {
      set.status = 500;
      return "Folder access error";
    }
  },
  {
    query: t.Object({
      serie: t.String(),
      code: t.String(),
      // pattern: t.Optional(t.String()) // ปรับเป็น Optional หรือลบออกไปเลยก็ได้
    }),
  },
);

app.get(
  "/api/Document/Product",
  async ({ query, set }) => {
    const { serie, code } = query; // รับแค่ serie กับ code ก็พอ (pattern ไม่ต้องใช้แล้ว)

    if (!serie || !code) {
      set.status = 400;
      return "Missing serie or code";
    }

    try {
      const targetFolder = join(MOUNT_PATH, "All Product", serie, code);

      const files = await readdir(targetFolder);

      // ค้นหาไฟล์แรกที่เป็น .pdf โดยไม่สนชื่อไฟล์
      const pdfFile = files.find((file) => file.toLowerCase().endsWith(".pdf"));

      if (pdfFile) {
        const finalPath = join(targetFolder, pdfFile);
        return Bun.file(finalPath);
      }

      set.status = 404;
      return "No PDF file found in this folder";
    } catch (error) {
      console.error(error);
      set.status = 500;
      return "Folder not found or access denied";
    }
  },
  {
    query: t.Object({
      serie: t.String(),
      code: t.String(),
    }),
  },
);

app.get(
  "/api/Material",
  async ({ query, set }) => {
    // 1. รับค่า Main ตัวเดียวตามที่ Frontend ส่งมา
    const { Main } = query;

    if (!Main) {
      set.status = 400;
      return "Missing Main parameter";
    }

    try {
      // 2. สร้าง Path วิ่งไปที่ W:\Easy Product Guide\Materials\[ค่าที่ส่งมา]
      const targetFolder = join(MOUNT_PATH, "Materials", Main);

      console.log("Searching PDF in:", targetFolder);

      const files = await readdir(targetFolder);

      // 3. หาไฟล์ .pdf ใบแรกที่เจอในโฟลเดอร์นั้น
      const pdfFile = files.find((file) => file.toLowerCase().endsWith(".pdf"));

      if (pdfFile) {
        const finalPath = join(targetFolder, pdfFile);
        return Bun.file(finalPath);
      }

      set.status = 404;
      return "No PDF file found in this folder";
    } catch (error) {
      console.error(error);
      set.status = 500;
      return "Folder not found or access denied";
    }
  },
  {
    // 4. แก้ Validation ให้ตรวจเช็คค่า Main
    query: t.Object({
      Main: t.String(),
    }),
  },
);

app.get(
  "/api/Picture/Reference",
  async ({ query, set }) => {
    const { serie, code } = query;

    const targetFolder = join(
      MOUNT_PATH,
      "All Product",
      serie,
      code,
      "Project Reference",
    );

    try {
      const files = await readdir(targetFolder);

      // กรองไฟล์รูปทั้งหมด
      const imageFiles = files.filter((file) =>
        /\.(jpg|jpeg|png|webp|gif)$/.test(file.toLowerCase()),
      );

      // อ่านไฟล์ทั้งหมดพร้อมกัน (Parallel) แล้วแปลงเป็น Base64
      const imagesData = await Promise.all(
        imageFiles.map(async (file) => {
          const filePath = join(targetFolder, file);
          const buffer = await Bun.file(filePath).arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");

          // หานามสกุลไฟล์เพื่อทำ Data URI
          const ext = file.split(".").pop();
          return `data:image/${ext};base64,${base64}`;
        }),
      );

      return imagesData; // คืนค่าเป็น [ "data:image/jpg;base64,...", "..." ]
    } catch (error) {
      return []; // ถ้าไม่มีโฟลเดอร์หรือ Error ให้คืน Array ว่าง
    }
  },
  {
    query: t.Object({
      serie: t.String(),
      code: t.String(),
    }),
  },
);

app.get(
  "/api/Picture/ReferenceNonFG",
  async ({ query, set }) => {
    const { serie } = query;

    const targetFolder = join(
      MOUNT_PATH,
      "All Product",
      serie,
      "Project Reference",
    );

    try {
      const files = await readdir(targetFolder);

      // กรองไฟล์รูปทั้งหมด
      const imageFiles = files.filter((file) =>
        /\.(jpg|jpeg|png|webp|gif)$/.test(file.toLowerCase()),
      );

      // อ่านไฟล์ทั้งหมดพร้อมกัน (Parallel) แล้วแปลงเป็น Base64
      const imagesData = await Promise.all(
        imageFiles.map(async (file) => {
          const filePath = join(targetFolder, file);
          const buffer = await Bun.file(filePath).arrayBuffer();
          const base64 = Buffer.from(buffer).toString("base64");

          // หานามสกุลไฟล์เพื่อทำ Data URI
          const ext = file.split(".").pop();
          return `data:image/${ext};base64,${base64}`;
        }),
      );

      return imagesData;
    } catch (error) {
      console.error(error);
      return [];
    }
  },
  {
    query: t.Object({
      serie: t.String(),
      code: t.String(),
    }),
  },
);

// 1. ตัวแปรเก็บสถานะ Progress (ประกาศไว้นอก Route)
let currentProgress = 0;

// --- Endpoint สำหรับให้ FrontEnd มา Get ค่า Progress ---
app.get("/upload-progress", () => {
  return { progress: currentProgress };
});

// --- Endpoint หลักที่ใช้บันทึกข้อมูลลง SQL ---
app.post("/API/Save_To_SQL", async ({ body, set }) => {
  try {
    const dataArray = body as any[]; // สมมติว่าส่ง Array มาบันทึกเยอะๆ
    const total = dataArray.length;
    currentProgress = 0; // Reset progress ก่อนเริ่มงานใหม่

    const pool = await sql.connect(dbconnecting);

    for (let i = 0; i < total; i++) {
      // Logic การบันทึก SQL ของพี่
      await pool
        .request()
        .input("val", dataArray[i].someValue)
        .query("INSERT INTO YourTable ...");

      // 2. คำนวณ % และอัปเดตตัวแปรกลาง
      currentProgress = Math.round(((i + 1) / total) * 100);

      // (Optional) console.log เพื่อเช็คที่ฝั่ง Server
      // console.log(`Progress: ${currentProgress}%`);
    }

    // เมื่อเสร็จสิ้น มั่นใจว่า 100%
    currentProgress = 100;
    return { success: true };
  } catch (error) {
    console.error(error);
    currentProgress = 0; // ถ้าพังให้รีเซ็ต
    set.status = 500;
    return { error: "Failed to save" };
  }
});

app.post("/upload-excel", async ({ body }) => {
  try {
    const { data } = body;
    let pool = await sql.connect(dbconnecting);
    const total = data.length;

    await pool.request().query("DELETE Product");
    await pool.request().query("DELETE MD_View");

    currentProgress = 0;

    for (let i = 0; i < total; i++) {
      const row = data[i];

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
        .input(
          "Product_Type_Sub3",
          sql.VarChar,
          safeString(row["STS_Product_SUB TYPE 3"]),
        )
        .input(
          "Product_Type_Sub4",
          sql.VarChar,
          safeString(row["STS_Product_SUB TYPE 4"]),
        )
        .input(
          "Product_Type_Sub5",
          sql.VarChar,
          safeString(row["STS_Product_SUB TYPE 5"]),
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
        )
        .input(
          "Product_Type_Sub3_TH",
          sql.VarChar,
          safeString(row["Product_SUB TYPE 3_TH"]),
        )
        .input(
          "Product_Type_Sub4_TH",
          sql.VarChar,
          safeString(row["Product_SUB TYPE 4_TH"]),
        )
        .input(
          "Product_Type_Sub5_TH",
          sql.VarChar,
          safeString(row["Product_SUB TYPE 5_TH"]),
        ).query(`
        INSERT INTO MD_View
        (Product_FG, Product_Header, Product_Type_Main, Product_Type_Sub, Product_Type_Sub2, Product_Type_Sub3, Product_Type_Sub4, Product_Type_Sub5,
         Sub_Product_1, Sub_Product_2, Sub_Product_3, Sub_Product_4, Sub_Product_5, 
         Product_Type_Main_TH, Product_Type_Sub_TH, Product_Type_Sub2_TH, Product_Type_Sub3_TH, Product_Type_Sub4_TH, Product_Type_Sub5_TH)
        VALUES
        (@Product_FG, @Product_Header, @Product_Type_Main, @Product_Type_Sub, @Product_Type_Sub2, @Product_Type_Sub3, @Product_Type_Sub4, @Product_Type_Sub5,
         @Sub_Product_1, @Sub_Product_2, @Sub_Product_3, @Sub_Product_4, @Sub_Product_5, 
         @Product_Type_Main_TH, @Product_Type_Sub_TH, @Product_Type_Sub2_TH, @Product_Type_Sub3_TH, @Product_Type_Sub4_TH, @Product_Type_Sub5_TH)
      `);

      currentProgress = Math.round(((i + 1) / total) * 100);
    }
  } catch (err) {
    console.error(err);
    return err;
  }
});

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

app.listen(5005);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
