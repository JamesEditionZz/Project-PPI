import { Elysia, t } from "elysia";
import cors from "@elysiajs/cors";
import sql from "mssql";
import path, { join } from "path";
import { readdir } from "fs/promises";
import { existsSync } from "fs";
import bcrypt from "bcrypt";
import { mkdir, writeFile } from "node:fs/promises";
import { staticPlugin } from "@elysiajs/static";
const dbconnecting = {
  user: "sa",
  password: "P@55w0rd",
  server: "192.168.199.20",
  port: 1433,
  database: "dbPractika_Product_Information",
  options: {
    encrypt: false,
    trustServerCertificate: true,
  },
};

const pool = await sql.connect(dbconnecting);

const MOUNT_PATH = "/mnt/mount_path";

const safeString = (value: any): string | null => {
  if (value === null || value === undefined) return null;
  const str = String(value).trim();
  return str === "" ? null : str;
};

setInterval(() => {
  updatePriceAuto();
}, 21600000);

const app = new Elysia()
  .use(
    cors({
      origin: "*",
      methods: ["GET", "POST"],
    }),
  )
  .use(
    staticPlugin({
      assets: "public", // ชี้ไปที่โฟลเดอร์ public
      prefix: "/", // ให้เข้าถึงผ่าน /Image_Problem/... ได้เลย
    }),
  );

// 2. สร้าง Route สำหรับ Login ใน Elysia
app.post(
  "/api/login",
  async ({ body, set }) => {
    const { username, password } = body;

    if (!username || !password) {
      set.status = 400;
      return { success: false, message: "Username and password are required" };
    }

    try {
      // 1. หา User ที่ Active
      const checkUser = await pool
        .request()
        .input("Username", sql.VarChar, username)
        .query(
          `SELECT * FROM Member WHERE Username = @Username AND Status_Action = 'Active'`,
        );

      const userDb = checkUser.recordset[0];

      if (!userDb) {
        set.status = 403;
        return {
          success: false,
          message: "รออนุมัติจาก Admin หรือไม่พบชื่อผู้ใช้นี้",
        };
      }

      // 2. ตรวจรหัสผ่าน
      const isMatch = await bcrypt.compare(password, userDb.Password);
      if (!isMatch) {
        set.status = 400;
        return { success: false, message: "รหัสผ่านไม่ถูกต้อง" };
      }

      // 3. สร้าง Session ใหม่ → ทับของเก่า = เครื่องเก่าโดนเตะ
      const newSessionId = crypto.randomUUID();

      await pool
        .request()
        .input("Username", sql.VarChar, username)
        .input("SessionId", sql.VarChar, newSessionId)
        .query(
          `UPDATE Member SET Session_Id = @SessionId WHERE Username = @Username`,
        );

      // 4. บันทึก Log
      const now = new Date();
      const datePart = now.toLocaleDateString("en-CA", {
        timeZone: "Asia/Bangkok",
      });
      const timePart = now.toLocaleTimeString("en-GB", {
        timeZone: "Asia/Bangkok",
      });

      await pool
        .request()
        .input("Username", sql.VarChar(150), username)
        .input("Date_Time", sql.VarChar(150), `${datePart} ${timePart}`)
        .query(
          `INSERT INTO Log_Login (Username, Date_Time) VALUES (@Username, @Date_Time)`,
        );

      // 5. ส่ง sessionId กลับ
      return {
        success: true,
        message: "Login successful",
        sessionId: newSessionId,
        user: { username },
      };
    } catch (error) {
      console.error("Login error:", error);
      set.status = 500;
      return { success: false, message: "Internal Server Error" };
    }
  },
  {
    body: t.Object({
      username: t.String(),
      password: t.String(),
    }),
  },
);

const protectedRoutes = new Elysia()
  // guard: ตรวจ Session_Id ทุก request ของ route ในกลุ่มนี้
  .onBeforeHandle(async ({ headers, set }) => {
    const username = headers["x-username"];
    const sessionId = headers["x-session-id"];

    if (!username || !sessionId) {
      set.status = 401;
      return { success: false, code: "NO_SESSION", message: "Unauthorized" };
    }

    try {
      const result = await pool
        .request()
        .input("Username", sql.VarChar, username)
        .query(
          `SELECT Session_Id FROM Member WHERE Username = @Username AND Status_Action = 'Active'`,
        );

      const row = result.recordset[0];

      if (!row || row.Session_Id !== sessionId) {
        set.status = 401;
        return {
          success: false,
          code: "SESSION_REPLACED",
          message: "บัญชีนี้ถูกเข้าสู่ระบบจากที่อื่น",
        };
      }
    } catch (error) {
      console.error("Auth guard error:", error);
      set.status = 500;
      return { success: false, message: "Internal Server Error" };
    }
  })

  // ใช้ให้ Frontend polling
  .get("/api/session-check", () => ({ success: true }))

  // ตัวอย่าง API ที่ต้องล็อกอิน (เพิ่ม API จริงของคุณตรงนี้)
  .get("/api/orders", async () => {
    // const result = await pool.request().query(`SELECT * FROM Orders`);
    // return result.recordset;
    return { success: true, data: [] };
  });

app.use(protectedRoutes);

app.post("/api/logout", async ({ headers }) => {
  const username = headers["x-username"];
  const sessionId = headers["x-session-id"];

  if (username && sessionId) {
    await pool
      .request()
      .input("Username", sql.VarChar, username)
      .input("SessionId", sql.VarChar, sessionId)
      // ล้างเฉพาะถ้าเป็น session ของเครื่องนี้จริง ๆ
      .query(
        `UPDATE Member SET Session_Id = NULL WHERE Username = @Username AND Session_Id = @SessionId`,
      );
  }
  return { success: true };
});

app.get("/Get_Products", async () => {
  try {
    const result = await pool.query("SELECT * FROM Product_Group");
    return result.recordset;
  } catch (error) {
    console.error("Database query failed:", error);
    // return { error: "Failed to fetch products" };
  }
});

app.post("/Group_MD", async ({ body }: { body: any }) => {
  try {
    if (body.split(":")[0] === "Header") {
      const result = await pool
        .request()
        .input("Header", sql.VarChar, body.split(":")[1]).query(`
      SELECT * FROM Product WHERE Product_Header = @Header ORDER BY Product.Product_Name ASC
    `);

      return result.recordset;
    } else if (body.split(":")[0] === "Main") {
      const result = await pool
        .request()
        .input("Main", sql.VarChar, body.split(":")[1]).query(`
      SELECT * FROM Product WHERE Product_Type_Main = @Main ORDER BY Product.Product_Name ASC
    `);

      return result.recordset;
    } else if (body.split(":")[0] === "Sub") {
      const result = await pool
        .request()
        .input("Sub", sql.VarChar, body.split(":")[1]).query(`
      SELECT * FROM Product WHERE Product_Type_Sub = @Sub ORDER BY Product.Product_Name ASC
    `);

      return result.recordset;
    } else if (body.split(":")[0] === "Sub2") {
      const result = await pool
        .request()
        .input("Sub2", sql.VarChar, body.split(":")[1]).query(`
      SELECT * FROM Product WHERE Product_Type_Sub2 = @Sub2 ORDER BY Product.Product_Name ASC
    `);

      return result.recordset;
    } else if (body.split(":")[0] === "Sub3") {
      const result = await pool
        .request()
        .input("Sub3", sql.VarChar, body.split(":")[1]).query(`
      SELECT * FROM Product WHERE Product_Type_Sub3 = @Sub3 ORDER BY Product.Product_Name ASC
    `);

      return result.recordset;
    } else if (body.split(":")[0] === "Sub4") {
      const result = await pool
        .request()
        .input("Sub4", sql.VarChar, body.split(":")[1]).query(`
      SELECT * FROM Product WHERE Product_Type_Sub4 = @Sub4 ORDER BY Product.Product_Name ASC
    `);

      return result.recordset;
    } else if (body.split(":")[0] === "Serie") {
      const result = await pool
        .request()
        .input("Serie", sql.VarChar, body.split(":")[1]).query(`
      SELECT * FROM Product WHERE Product_Serie = @Serie ORDER BY Product.Product_Name ASC
    `);

      return result.recordset;
    } else if (body.split(":")[0] === "Final_Product") {
      const result = await pool
        .request()
        .input("Final_Product", sql.VarChar, body.split(":")[1]).query(`
        SELECT * FROM Product 
        WHERE (
            Product_name = @Final_Product OR
            Product_Type_Main = @Final_Product OR
            Product_Type_Sub  = @Final_Product OR
            Product_Type_Sub2 = @Final_Product OR
            Product_Type_Sub3 = @Final_Product OR
            Product_Type_Sub4 = @Final_Product OR
            Product_Type_Sub5 = @Final_Product
        )
        ORDER BY Product.Product_Name ASC
    `);

      const resultProduct = await pool
        .request()
        .input("Final_Product", sql.VarChar, result.recordset[0].Product_Serie)
        .query(`
      SELECT * FROM Product WHERE Product_Serie = @Final_Product ORDER BY Product.Product_Name ASC
    `);

      return resultProduct.recordset;
    }
  } catch (error) {
    console.error("Database query failed:", error);
    return { error: "Failed to fetch products" };
  }
});

app.get("/API/All_Product", async ({ body }: { body: any }) => {
  try {
    const res = await pool.request().query(
      `SELECT Product_FG,
        Product_Serie,
        Product_name,
        Product_Code,
        Description,
        Product_Header,
        Product_Type_Main,
        Product_Type_Sub,
        Product_Type_Sub2,
        Product_Type_Sub3,
        Product_Type_Sub4,
        Product_Type_Sub5,
        Product_Header_TH,
        Product_Type_Main_TH,
        Product_Type_Sub_TH,
        Product_Type_Sub2_TH,
        Product_Type_Sub3_TH,
        Product_Type_Sub4_TH,
        Product_Type_Sub5_TH,
        Product_Path_img,
        Product_price,
        Price_Validity
        FROM Product
        ORDER BY Product_Name ASC`,
    );

    const products = res.recordset;

    // --- วนลูปเช็คไฟล์ PDF ของแต่ละตัว ---
    const results = await Promise.all(
      products.map(async (product: any) => {
        let FileMaterial = false;
        let FileCatalog = false;
        let FileDrawing = false;
        let FileSpec = false;
        let FileSeller = false;
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

          const targetFolderSpec = join(
            MOUNT_PATH,
            "All Product",
            product.Product_Serie,
            product.Product_name,
            "Project Reference",
          );

          const targetFolderSeller = join(
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

          if (existsSync(targetFolderSpec)) {
            const files = await readdir(targetFolderSpec);
            // เช็คว่ามีไฟล์ .pdf ไหม
            FileSpec = files.some((file) =>
              file.toLowerCase().endsWith(".pdf"),
            );
          }

          if (existsSync(targetFolderSeller)) {
            const files = await readdir(targetFolderSeller);
            // เช็คว่ามีไฟล์ .pdf ไหม
            FileSeller = files.some((file) =>
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
          FileSpec = false;
          FileSeller = false;
        }

        // คืนค่า Object เดิม + สถานะไฟล์
        return {
          ...product,
          Material: FileMaterial,
          Catalog: FileCatalog,
          Drawing: FileDrawing,
          Spec: FileSpec,
          Seller: FileSeller,
          Reference: refCount,
        };
      }),
    );

    return results; // ส่ง Array ที่รวมสถานะไฟล์แล้วไปให้ Frontend
  } catch (error) {
    console.error(error);
  }
});

app.post("/API/Full_Product", async ({ body }: { body: any }) => {
  try {
    const res = await pool
      .request()
      .input("group", sql.VarChar, body.ParamSelect)
      .query(
        `SELECT Product_FG,
        Product_Serie,
        Product_name,
        Product_Code,
        Description,
        Product_Header,
        Product_Type_Main,
        Product_Type_Sub,
        Product_Type_Sub2,
        Product_Type_Sub3,
        Product_Type_Sub4,
        Product_Type_Sub5,
        Product_Header_TH,
        Product_Type_Main_TH,
        Product_Type_Sub_TH,
        Product_Type_Sub2_TH,
        Product_Type_Sub3_TH,
        Product_Type_Sub4_TH,
        Product_Type_Sub5_TH,
        Product_Path_img,
        Product_price,
        Price_Validity
        FROM Product
        WHERE @group = '__ALL_PRODUCTS__' OR Product_Header = @group
        ORDER BY Product_Name ASC`,
      );

    const products = res.recordset;

    // --- วนลูปเช็คไฟล์ PDF ของแต่ละตัว ---
    const results = await Promise.all(
      products.map(async (product: any) => {
        let FileMaterial = false;
        let FileCatalog = false;
        let FileDrawing = false;
        let FileSpec = false;
        let FileSeller = false;
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

          const targetFolderSpec = join(
            MOUNT_PATH,
            "All Product",
            product.Product_Serie,
            product.Product_name,
            "Project Reference",
          );

          const targetFolderSeller = join(
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

          if (existsSync(targetFolderSpec)) {
            const files = await readdir(targetFolderSpec);
            // เช็คว่ามีไฟล์ .pdf ไหม
            FileSpec = files.some((file) =>
              file.toLowerCase().endsWith(".pdf"),
            );
          }

          if (existsSync(targetFolderSeller)) {
            const files = await readdir(targetFolderSeller);
            // เช็คว่ามีไฟล์ .pdf ไหม
            FileSeller = files.some((file) =>
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
          FileSpec = false;
          FileSeller = false;
        }

        // คืนค่า Object เดิม + สถานะไฟล์
        return {
          ...product,
          Material: FileMaterial,
          Catalog: FileCatalog,
          Drawing: FileDrawing,
          Spec: FileSpec,
          Seller: FileSeller,
          Reference: refCount,
        };
      }),
    );

    return results; // ส่ง Array ที่รวมสถานะไฟล์แล้วไปให้ Frontend
  } catch (error) {
    console.error(error);
  }
});

app.post("/API/AddProductSerie", async ({ body }: { body: any }) => {
  try {
    const res = await pool
      .request()
      .input("Product", sql.VarChar, body.Product)
      .input("Product_Header", sql.VarChar, body.Product_Header)
      .query(
        `SELECT Product_FG,
        Product_Serie,
        Product_name,
        Product_Code,
        Description,
        Product_Header,
        Product_Type_Main,
        Product_Type_Sub,
        Product_Type_Sub2,
        Product_Type_Sub3,
        Product_Type_Sub4,
        Product_Type_Sub5,
        Product_Header_TH,
        Product_Type_Main_TH,
        Product_Type_Sub_TH,
        Product_Type_Sub2_TH,
        Product_Type_Sub3_TH,
        Product_Type_Sub4_TH,
        Product_Type_Sub5_TH,
        Product_Path_img,
        Product_price,
        Price_Validity
        FROM Product
        WHERE Product_Serie = @Product AND Product_Header = @Product_Header
        ORDER BY Product_Name ASC`,
      );

    const products = res.recordset;

    // --- วนลูปเช็คไฟล์ PDF ของแต่ละตัว ---
    const results = await Promise.all(
      products.map(async (product: any) => {
        let FileMaterial = false;
        let FileCatalog = false;
        let FileDrawing = false;
        let FileSpec = false;
        let FileSeller = false;
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

          const targetFolderSpec = join(
            MOUNT_PATH,
            "All Product",
            product.Product_Serie,
            product.Product_name,
            "Project Reference",
          );

          const targetFolderSeller = join(
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

          if (existsSync(targetFolderSpec)) {
            const files = await readdir(targetFolderSpec);
            // เช็คว่ามีไฟล์ .pdf ไหม
            FileSpec = files.some((file) =>
              file.toLowerCase().endsWith(".pdf"),
            );
          }

          if (existsSync(targetFolderSeller)) {
            const files = await readdir(targetFolderSeller);
            // เช็คว่ามีไฟล์ .pdf ไหม
            FileSeller = files.some((file) =>
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
          FileSpec = false;
          FileSeller = false;
        }

        // คืนค่า Object เดิม + สถานะไฟล์
        return {
          ...product,
          Material: FileMaterial,
          Catalog: FileCatalog,
          Drawing: FileDrawing,
          Spec: FileSpec,
          Seller: FileSeller,
          Reference: refCount,
        };
      }),
    );

    return results; // ส่ง Array ที่รวมสถานะไฟล์แล้วไปให้ Frontend
  } catch (error) {
    console.error(error);
  }
});

app.get("/API/Full_Product", async () => {
  try {
    const result = await pool.query("SELECT * FROM Product");
    return result.recordset;
  } catch (error) {
    console.error("Database query failed:", error);
    // return { error: "Failed to fetch products" };
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
      // 1. ดึงเลขออกมาให้ครบทุกจุด (เช่น "2.1.1", "10", "7")
      // ใช้ Regex จับกลุ่มตัวเลขที่มีจุดคั่นกี่ชุดก็ได้
      const numberMatch = Main.match(/\d+(\.\d+)*/);
      const targetNumber = numberMatch ? numberMatch[0] : null;

      if (!targetNumber) {
        set.status = 404;
        return "No number found in Main string";
      }

      const targetFolder = join(MOUNT_PATH, "All Product", "Cover_Photo");
      const files = await readdir(targetFolder);

      // 2. ค้นหาไฟล์ที่ชื่อไฟล์ "เป๊ะ" กับเลขที่ดึงมา
      const targetFile = files.find((file) => {
        const lastDotIndex = file.lastIndexOf(".");
        if (lastDotIndex === -1) return false;

        // แยกเอาแค่ชื่อไฟล์มาเช็ค (เช่น "2.1.1.jpg" -> "2.1.1")
        const fileNameOnly = file.substring(0, lastDotIndex).trim();

        // เทียบเป๊ะๆ แบบไม่สนตัวเล็กตัวใหญ่
        return fileNameOnly.toLowerCase() === targetNumber.toLowerCase();
      });

      if (targetFile) {
        const finalPath = join(targetFolder, targetFile);
        return Bun.file(finalPath);
      }

      // ถ้าไม่เจอไฟล์ที่ชื่อเป็นเลขเป๊ะๆ ลองหาแบบ "ขึ้นต้นด้วย" (เผื่อมึงตั้งชื่อไฟล์ 2.1.1_CHAIR.jpg)
      const fallbackFile = files.find((file) => {
        return file.startsWith(targetNumber);
      });

      if (fallbackFile) {
        const finalPath = join(targetFolder, fallbackFile);
        return Bun.file(finalPath);
      }

      set.status = 404;
      return `Image not found for number: ${targetNumber}`;
    } catch (error) {
      console.error(error);
      set.status = 500;
      return "Internal Server Error";
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

app.post(
  "/api/Picture/ReferenceBackData",
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
  "/api/Drawing",
  async ({ query, set }) => {
    const { serie, code } = query;
    if (!serie) {
      set.status = 400;
      return "Missing serie";
    }

    const targetFolder = join(
      MOUNT_PATH,
      "All Product",
      serie,
      code,
      "Drawing",
    );

    try {
      const files = await readdir(targetFolder);

      // ค้นหาไฟล์แรกที่เป็น รูป หรือ PDF
      const targetFile = files.find((file) =>
        /\.(pdf)$/.test(file.toLowerCase()),
      );

      if (targetFile) {
        const finalPath = join(targetFolder, targetFile);
        return Bun.file(finalPath);
      }

      set.status = 404;
      return "No Drawing file found";
    } catch (error) {
      console.error(error);
      set.status = 500;
      return "Folder not found or access denied";
    }
  },
  {
    query: t.Object({
      serie: t.String(),
      code: t.Optional(t.String()),
    }),
  },
);

app.get(
  "/api/Picture/ReferenceNonFG",
  async ({ query, set }) => {
    const { serie } = query;

    if (!serie) {
      set.status = 400;
      return "Missing serie";
    }

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
      code: t.Optional(t.String()),
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

app.post("/upload-excel", async ({ body }: { body: any }) => {
  try {
    const { data } = body;
    let pool = await sql.connect(dbconnecting);
    const total = data.length;

    await pool.request().query("DELETE Product");

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
        .input("Description", sql.VarChar, safeString(row.Description) || null)
        .input("Product_FG", sql.VarChar, safeString(row.Product_FG))
        .input(
          "Product_Header",
          sql.VarChar,
          safeString(row.STS_Product_HEAD)?.toLocaleUpperCase(),
        )
        .input(
          "Product_Type_Main",
          sql.VarChar,
          safeString(row["STS_Product_MAIN TYPE"])?.toLocaleUpperCase(),
        )
        .input(
          "Product_Type_Sub",
          sql.VarChar,
          safeString(row["STS_Product_SUB TYPE 1"])?.toLocaleUpperCase(),
        )
        .input(
          "Product_Type_Sub2",
          sql.VarChar,
          safeString(row["STS_Product_SUB TYPE 2"])?.toLocaleUpperCase(),
        )
        .input(
          "Product_Type_Sub3",
          sql.VarChar,
          safeString(row["STS_Product_SUB TYPE 3"])?.toLocaleUpperCase(),
        )
        .input(
          "Product_Type_Sub4",
          sql.VarChar,
          safeString(row["STS_Product_SUB TYPE 4"])?.toLocaleUpperCase(),
        )
        .input(
          "Product_Type_Sub5",
          sql.VarChar,
          safeString(row["STS_Product_SUB TYPE 5"])?.toLocaleUpperCase(),
        )
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
              INSERT INTO Product
              (Product_FG, Product_Serie, Product_name, Product_Code, Product_price, Product_Path_img, Description, Product_Header, Product_Type_Main, Product_Type_Sub, Product_Type_Sub2, Product_Type_Sub3, Product_Type_Sub4, Product_Type_Sub5,
         Product_Type_Main_TH, Product_Type_Sub_TH, Product_Type_Sub2_TH, Product_Type_Sub3_TH, Product_Type_Sub4_TH, Product_Type_Sub5_TH)
              VALUES
              (@Product_FG, @Product_Serie, @Product_name, @Product_Code, @Product_price, @Product_Path_img, @Description, @Product_Header, @Product_Type_Main, @Product_Type_Sub, @Product_Type_Sub2, @Product_Type_Sub3, @Product_Type_Sub4, @Product_Type_Sub5,
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
      const Data = rowset.sort((a: any, b: any) => {
        // เปรียบเทียบค่าวันที่โดยตรง (ถ้า format เป็น YYYYMMDD สามารถลบกันได้เลย)
        return Number(b.F4106_EXDJ) - Number(a.F4106_EXDJ);
      })[0];

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
      const Data = rowset.sort((a: any, b: any) => {
        // เปรียบเทียบค่าวันที่โดยตรง (ถ้า format เป็น YYYYMMDD สามารถลบกันได้เลย)
        return Number(b.F4106_EXDJ) - Number(a.F4106_EXDJ);
      })[0];

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

app.post(`/api/Register`, async ({ body }: { body: any }) => {
  try {
    const Username = body.usernameRegis;
    const Employee = body.employeeRegis;
    const Email = body.emailRegis;
    const Password = body.passwordRegis;
    const Name = body.NameAndSubNameRegis;
    const Department = body.department;

    const saltRounds = 10;
    const hashedPassword = await bcrypt.hash(body.passwordRegis, saltRounds);

    const ToDate = new Date();
    const Day = ToDate.getDate();
    const Month = ToDate.getMonth() + 1;
    const Year = ToDate.getFullYear();

    const DateToday = `${Year}-${Month}-${Day}`;

    const CheckUser = await pool
      .request()
      .input("Username", sql.VarChar, Username)
      .input("Employee", sql.VarChar, Employee)
      .query(
        `SELECT * FROM Member WHERE Username = @Username OR Employee = @Employee`,
      );

    const responseCheck = CheckUser.recordset;

    if (responseCheck.length > 0) {
      return { success: false };
    } else {
      await pool
        .request()
        .input("Name", sql.VarChar, Name)
        .input("Department", sql.VarChar, Department)
        .input("Username", sql.VarChar, Username)
        .input("Password", sql.VarChar, hashedPassword)
        .input("Email", sql.VarChar, Email)
        .input("Employee", sql.VarChar, Employee)
        .input("Status", sql.VarChar, "Member")
        .input("Status_Action", sql.VarChar, "UnActive")
        .input("Date_Created", sql.DateTime, DateToday)
        .input("Date_Update", sql.DateTime, DateToday)
        .query(
          `INSERT INTO Member (Name, Department, Username, Password, Employee, Email, Status, Status_Action, Date_Created, Date_Update) VALUES (@Name, @Department, @Username, @Password, @Employee, @Email, @Status, @Status_Action, @Date_Created, @Date_Update)`,
        );
      return { success: true };
    }
  } catch (error) {
    console.log(error);
  }
});

app.get(`/api/Get_Problem`, async () => {
  const res = await pool.request().query(`SELECT * FROM dbProblem`);
  return res.recordset;
});

app.post(`/api/report_problem`, async ({ request }: { request: Request }) => {
  try {
    // 1. ดึงข้อมูลจาก FormData เนื่องจากส่งมาแบบ multipart/form-data
    const formData = await request.formData();
    const problemDescription =
      (formData.get("problemDescription") as string) || "";
    const sessionID = (formData.get("SessionID") as string) || "";
    const file = formData.get("file") as File | null;

    let imagePathToDb = null;

    // 2. ถ้ามีการแนบไฟล์มาด้วย ให้ทำการบันทึกไฟล์ลงโฟลเดอร์ Public/Image_Problem
    if (file && file.size > 0) {
      // กำหนดตำแหน่งโฟลเดอร์เป้าหมาย (ปรับ path ตามโครงสร้างโปรเจกต์ของคุณ)
      const uploadDir = join(process.cwd(), "public", "Image_Problem");

      // สร้างโฟลเดอร์อัตโนมัติถ้ายังไม่มี
      await mkdir(uploadDir, { recursive: true });

      // ตั้งชื่อไฟล์ใหม่ป้องกันชื่อซ้ำ (ใช้ Timestamp + สุ่ม)
      const fileExt = file.name.split(".").pop() || "png";
      const uniqueFileName = `${Date.now()}_${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
      const fullPath = join(uploadDir, uniqueFileName);

      // แปลงไฟล์เป็น Buffer แล้วเขียนลง Disk
      const buffer = await file.arrayBuffer();
      await writeFile(fullPath, Buffer.from(buffer));

      // Path ที่จะบันทึกลง Database
      imagePathToDb = `/Image_Problem/${uniqueFileName}`;
    }

    // 3. จัดการเรื่องวันที่
    const ToDate = new Date();
    const Day = String(ToDate.getDate()).padStart(2, "0");
    const Month = String(ToDate.getMonth() + 1).padStart(2, "0");
    const Year = ToDate.getFullYear();
    const DateToday = `${Year}-${Month}-${Day}`;

    // 4. บันทึกลง SQL Server (เพิ่ม field สำหรับเก็บ Path รูปภาพ เช่น [ImagePath])
    // *หมายเหตุ: อย่าลืมตรวจสอบชื่อ Column ในตาราง dbProblem ของคุณว่าตรงกันไหม (เช่น ImagePath หรือ Path_File)*
    await pool
      .request()
      .input("Problem", sql.VarChar, problemDescription)
      .input("Date_Problem", sql.VarChar, DateToday)
      .input("User_Request", sql.VarChar, sessionID)
      .input("Path_Image", sql.VarChar, imagePathToDb)
      .query(
        `INSERT INTO dbProblem (Problem, Date_Problem, User_Request, Path_Image) VALUES (@Problem, @Date_Problem, @User_Request, @Path_Image)`,
      );

    return { Success: true };
  } catch (error) {
    console.error("Error saving problem report:", error);
    return { Success: false, error: String(error) };
  }
});

app.post(`/api/Check_Login`, async ({ body }: { body: any }) => {
  try {
    const res = await pool
      .request()
      .input("UserID", sql.VarChar, body.SessionID)
      .query(`SELECT * FROM Member WHERE Username = @UserID`);

    const result = res.recordset;

    if (result.length > 0) {
      return { Status: true, Permission: result[0].Status };
    } else {
      return { Status: false };
    }
  } catch (error) {
    console.error(error);
  }
});

app.post(`/API/FindAdd`, async ({ body }: { body: any }) => {
  try {
    const res = await pool
      .request()
      .input(
        "Product_Group",
        sql.VarChar,
        body.formData.Product_Group
          ? body.formData.Product_Group.toUpperCase()
          : null,
      )
      .input("Product_FG", sql.VarChar, body.formData.Product_FG)
      .input("Product_Serie", sql.VarChar, body.formData.Product_Serie)
      .input("Product_name", sql.VarChar, body.formData.Product_name)
      .input("Product_Code", sql.VarChar, body.formData.Product_Code)
      .input(
        "Product_price",
        sql.VarChar,
        body.formData.Product_price
          ? parseInt(body.formData.Product_price)
          : null,
      )
      .input("Description", sql.VarChar, body.formData.Description)
      .input("Product_Path_img", sql.VarChar, body.formData.Product_Path_img)
      .input(
        "Price_Validity",
        sql.DateTime,
        body.formData.Price_Validity
          ? new Date(body.formData.Price_Validity)
          : null,
      )
      .input("Product_Type_Main", sql.VarChar, body.formData.Product_Type_Main)
      .input("Product_Type_Sub", sql.VarChar, body.formData.Product_Type_Sub)
      .input("Product_Type_Sub2", sql.VarChar, body.formData.Product_Type_Sub2)
      .input("Product_Type_Sub3", sql.VarChar, body.formData.Product_Type_Sub3)
      .input("Product_Type_Sub4", sql.VarChar, body.formData.Product_Type_Sub4)
      .input("Product_Type_Sub5", sql.VarChar, body.formData.Product_Type_Sub5)
      .input("Product_Header_TH", sql.VarChar, body.formData.Product_Header_TH)
      .input(
        "Product_Type_Main_TH",
        sql.VarChar,
        body.formData.Product_Type_Main_TH,
      )
      .input(
        "Product_Type_Sub_TH",
        sql.VarChar,
        body.formData.Product_Type_Sub_TH,
      )
      .input(
        "Product_Type_Sub2_TH",
        sql.VarChar,
        body.formData.Product_Type_Sub2_TH,
      )
      .input(
        "Product_Type_Sub3_TH",
        sql.VarChar,
        body.formData.Product_Type_Sub3_TH,
      )
      .input(
        "Product_Type_Sub4_TH",
        sql.VarChar,
        body.formData.Product_Type_Sub4_TH,
      )
      .input(
        "Product_Type_Sub5_TH",
        sql.VarChar,
        body.formData.Product_Type_Sub5_TH,
      )
      .execute(`FindDataInsert`);

    const result = res.recordset;

    return result;
  } catch (error) {
    console.error(error);
  }
});

app.get(`/API/Get_UserMember`, async ({ query }: { query: any }) => {
  try {
    const res = await pool.request().query(`SELECT * FROM Member`);
    const result = res.recordset;

    return result;
  } catch (error) {
    console.error(error);
  }
});

app.post(`/API/Add_UserMember`, async ({ body }: { body: any }) => {
  const ToDate = new Date();
  const Day = ToDate.getDate();
  const Month = ToDate.getMonth() + 1;
  const Year = ToDate.getFullYear();

  const DateToday = `${Year}-${Month}-${Day}`;

  const saltRounds = 10;
  const hashedPassword = await bcrypt.hash(body.Password, saltRounds);

  try {
    await pool
      .request()
      .input("Username", sql.VarChar, body.Username)
      .input("Password", sql.VarChar, hashedPassword)
      .input("Email", sql.VarChar, body.Email)
      .input("Employee", sql.VarChar, body.Employee)
      .input("Status", sql.VarChar, body.Status)
      .input("Status_Action", sql.VarChar, body.Status_Action)
      .input("Date_Created", sql.DateTime, DateToday)
      .input("Date_Update", sql.DateTime, DateToday)
      .query(
        `INSERT INTO Member (Username, Password, Employee, Email, Status, Status_Action, Date_Created, Date_Update) VALUES (@Username, @Password, @Employee, @Email, @Status, @Status_Action, @Date_Created, @Date_Update)`,
      );
    return { success: true, message: "User added successfully" };
  } catch (error) {
    console.error(error);
    return { success: false, message: "Failed to add user" };
  }
});

app.post(`/API/Update_UserMember`, async ({ body }: { body: any }) => {
  try {
    const res = await pool
      .request()
      .input("Username", sql.VarChar, body.Username)
      .input("Email", sql.VarChar, body.Email)
      .input("Status", sql.VarChar, body.Status)
      .input("Action", sql.VarChar, body.Status_Action)
      .execute(`UpdateUserMember`);

    return res;
  } catch (error) {
    console.error(error);
  }
});

app.post(`/API/Delete_UserMember`, async ({ body }: { body: any }) => {
  try {
    const res = await pool
      .request()
      .input("Username", sql.VarChar, body.Username)
      .input("Employee", sql.VarChar, body.Employee)
      .query(
        `Delete FROM Member WHERE Username = @Username AND Employee = @Employee`,
      );

    return res;
  } catch (error) {
    console.error(error);
  }
});

app.get(`/API/Department`, async ({ body }: { body: any }) => {
  const res = await pool.request().query(`SELECT * FROM dbDepartment`);

  return res.recordset;
});

app.listen(5005);

console.log(
  `🦊 Elysia is running at ${app.server?.hostname}:${app.server?.port}`,
);
