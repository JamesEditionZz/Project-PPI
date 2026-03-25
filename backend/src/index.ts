import { Elysia, t } from "elysia";
import cors from "@elysiajs/cors";
import sql from "mssql";
import path, { join } from "path";
import { readdir } from "fs/promises";

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
    return result.recordset;
  } catch (error) {
    console.error("Database query failed:", error);
    return { error: "Failed to fetch products" };
  }
});

app.get("/Group_MD", async ({ body }) => {
  const pool = await sql.connect(dbconnecting);

  try {
    const result = await pool.request().query(`
      SELECT * FROM Product INNER JOIN MD_View ON Product.Product_FG = MD_View.Product_FG ORDER BY Product.Product_Name ASC
    `);

    return result.recordset;
  } catch (error) {
    console.error("Database query failed:", error);
    return { error: "Failed to fetch products" };
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
      const targetFolder = "W:\\Easy Product Guide\\All Product\\Cover_Photo";
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
      const targetFolder = join(
        "W:\\Easy Product Guide\\All Product",
        serie,
        code,
      );

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
      const targetFolder = join(
        "W:\\Easy Product Guide\\All Product",
        serie,
        code,
      );

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
      const targetFolder = join(
        "W:\\Easy Product Guide\\All Product",
        serie,
        code,
      );

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
      const targetFolder = join("W:\\Easy Product Guide\\Materials", Main);

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
      "W:\\Easy Product Guide\\All Product",
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
