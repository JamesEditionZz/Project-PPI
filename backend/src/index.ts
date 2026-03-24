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
  "/api/Picture/Product",
  async ({ query, set }) => {
    const { serie, code } = query; // รับแค่ serie กับ code

    try {
      const targetFolder = join(
        "Z:\\Easy Product Guide\\All Product",
        serie,
        code
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
  }
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
        "Z:\\Easy Product Guide\\All Product",
        serie,
        code
      );

      const files = await readdir(targetFolder);

      // ค้นหาไฟล์แรกที่เป็น .pdf โดยไม่สนชื่อไฟล์
      const pdfFile = files.find((file) => 
        file.toLowerCase().endsWith(".pdf")
      );

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
  }
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
      // 2. สร้าง Path วิ่งไปที่ Z:\Easy Product Guide\Materials\[ค่าที่ส่งมา]
      const targetFolder = join(
        "Z:\\Easy Product Guide\\Materials",
        Main
      );

      console.log("Searching PDF in:", targetFolder);

      const files = await readdir(targetFolder);

      // 3. หาไฟล์ .pdf ใบแรกที่เจอในโฟลเดอร์นั้น
      const pdfFile = files.find((file) => 
        file.toLowerCase().endsWith(".pdf")
      );

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
  }
);

app.listen(5005);
console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
