"use client";
import React, { useEffect } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import CryptoJS from "crypto-js";
// @ts-ignore -- Next.js handles CSS imports at build time.
import "./login.css";

export default function Page() {
  const router = useRouter(); // เรียกใช้งาน router

  const [username, setUsername] = React.useState<string>("");
  const [password, setPassword] = React.useState<string>("");
  const [dangerMessage, setDangerMessage] = React.useState<boolean>(false);
  const [loadRegister, setLoadRegister] = React.useState<boolean>(false);
  const [usernameRegis, setUsernameRegis] = React.useState<string>("");
  const [passwordRegis, setPasswordRegis] = React.useState<string>("");
  const [employeeRegis, setEmployeeRegis] = React.useState<string>("");
  const [emailRegis, setEmailRegis] = React.useState<string>("");
  const [alertTextRegis, setAlertTextRegis] = React.useState<boolean>(false);
  const [NameAndSubNameRegis, setNameAndSubNameRegis] =
    React.useState<string>("");
  const [dataDepartment, setDataDepartment] = React.useState<any>([]);
  const [department, setDepartment] = React.useState<string>("");
  const [dataDepartmentSub, setDataDepartmentSub] = React.useState<any[]>([]);
  const [departmentSub, setDepartmentSub] = React.useState<string>("");
  const [errorText, setErrorText] = React.useState<string>("");

  // เปลี่ยนเป็น Array เพื่อเก็บแจ้งเตือนหลายอันพร้อมกัน
  const [alertTextFalse, setAlertTextFalse] = React.useState<any[]>([]);

  const myLoader = ({ src }: { src: string }) => src;

  const bgVideoRef = React.useRef<HTMLVideoElement>(null);
  const mainVideoRef = React.useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const videos = [bgVideoRef.current, mainVideoRef.current].filter(
      Boolean,
    ) as HTMLVideoElement[];

    const playAll = () => {
      videos.forEach((v) => {
        v.muted = true;
        v.play().catch((e) => {
          // AbortError = browser หยุดเองเพื่อประหยัดพลังงาน ไม่ใช่ error จริง
          if (e.name !== "AbortError") console.error("video play failed:", e);
        });
      });
    };

    playAll();

    const onVisible = () => {
      if (document.visibilityState === "visible") playAll();
    };
    document.addEventListener("visibilitychange", onVisible);

    return () => document.removeEventListener("visibilitychange", onVisible);
  }, []);

  const addDepartment = async (value: string) => {
    const name = value.trim();
    if (!name) return;
    if (dataDepartment.some((item: any) => String(item.Department).toLocaleLowerCase() === name.toLocaleLowerCase())) return;
    const response = await fetch("http://localhost:5005/API/Department", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Department: name }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result?.message || "เพิ่มฝ่ายไม่สำเร็จ");
    setDataDepartment((previous: any[]) => previous.some((item) => item.Department === name) ? previous : [...previous, { Department: name }]);
    setDepartment(name);
  };

  const addDepartmentSub = async (value: string) => {
    const name = value.trim();
    if (!department || !name) return;
    await addDepartment(department);
    if (dataDepartmentSub.some((item: any) => {
      const existing = item.Department_Sub ?? item.DepartmentSub ?? item.SubDepartment ?? item.Sub_Department ?? item.Name;
      return String(existing ?? "").toLocaleLowerCase() === name.toLocaleLowerCase();
    })) return;
    const response = await fetch("http://localhost:5005/API/Department_Sub", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Department: department, Department_Sub: name }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result?.message || "เพิ่มแผนกไม่สำเร็จ");
    setDataDepartmentSub((previous) => [...previous, result]);
    setDepartmentSub(name);
  };

  const fetchDepartmentSub = async (value: string) => {
    const name = value.trim();
    if (!name) {
      setDataDepartmentSub([]);
      setDepartmentSub("");
      return;
    }
    try {
      const res = await fetch(`http://localhost:5005/API/Department_Sub?Department=${encodeURIComponent(name)}`);
      const result = await res.json();
      if (!res.ok) throw new Error(result?.message || `Sub-department API returned ${res.status}`);
      setDataDepartmentSub(Array.isArray(result) ? result : []);
    } catch (error) {
      console.error("Error fetching sub-departments:", error);
      setDataDepartmentSub([]);
    }
  };

  const commitDepartment = async (value: string) => {
    await addDepartment(value);
    await fetchDepartmentSub(value);
  };

  useEffect(() => {
    const datafecth = async () => {
      const res = await fetch(`http://localhost:5005/API/Department`);
      const result = await res.json();

      setDataDepartment(result);
    };

    datafecth();
  }, []);

  // 1. กด Enter ที่คีย์บอร์ด
  const handleLoginProcess = async () => {
    setDangerMessage(false);
    setErrorText("");

    try {
      const res = await fetch(`http://localhost:5005/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });

      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        console.error("Server returned non-JSON:", await res.text());
        setDangerMessage(true);
        return;
      }

      const data = await res.json();

      if (data.success === true) {
        localStorage.setItem("username", username);
        localStorage.setItem("sessionId", data.sessionId);
        router.push(`../components/?id=${username}`);
      } else {
        setErrorText(data.message || "เข้าสู่ระบบไม่สำเร็จ");
        setDangerMessage(true);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      setDangerMessage(true);
    }
  };

  const SignInForKey = async (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") await handleLoginProcess();
  };

  const LogInSignIn = async () => {
    await handleLoginProcess();
  };

  const SwicthRegister = async (value: boolean) => {
    setLoadRegister(value);
  };

  const RegisterUser = async () => {
    console.log(
      usernameRegis,
      passwordRegis,
      employeeRegis,
      NameAndSubNameRegis,
      department,
    );

    if (
      !usernameRegis ||
      !passwordRegis ||
      !employeeRegis ||
      !department ||
      !departmentSub ||
      !NameAndSubNameRegis
    ) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    } else {
      try {
        await addDepartment(department);
        await addDepartmentSub(departmentSub);
        const res = await fetch(`http://localhost:5005/api/Register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            department,
            departmentSub,
            NameAndSubNameRegis,
            usernameRegis,
            passwordRegis,
            employeeRegis,
            emailRegis,
          }),
        });

        const response = await res.json();

        if (response.success === true) {
          setAlertTextRegis(true);
          setTimeout(() => {
            setUsernameRegis("");
            setPasswordRegis("");
            setEmployeeRegis("");
            setEmailRegis("");
                    setDepartment("");
                    setDepartmentSub("");
            setAlertTextRegis(false);
            SwicthRegister(false);
          }, 2000);
        } else {
          triggerAlert();
        }
      } catch (error) {
        console.error(error);
        alert(error instanceof Error ? error.message : "บันทึกฝ่ายหรือแผนกไม่สำเร็จ");
      }
    }
  };

  const triggerAlert = () => {
    const id = Date.now(); // สร้าง ID ที่ไม่ซ้ำกันตามเวลา

    // เพิ่มแจ้งเตือนใหม่เข้าไปต่อท้าย
    setAlertTextFalse((prevAlerts: any) => [
      ...prevAlerts,
      { id, text: "มีข้อมูลซ้ำ" },
    ]);

    // ตั้งเวลาให้ลบแจ้งเตือนตัวนี้ทิ้งหลังจากผ่านไป 2 วินาที
    setTimeout(() => {
      setAlertTextFalse((prevAlerts: any) =>
        prevAlerts.filter((alert: any) => alert.id !== id),
      );
    }, 2000);
  };

  return (
    <>
      {dangerMessage && (
        <div className="fixed bg-amber-700 p-2 px-15 w-full text-center z-[1000]">
          <div className="text-white">Username, Password ผิด</div>
        </div>
      )}

      {/* Container สำหรับแสดงแจ้งเตือนข้อมูลซ้ำแบบซ้อนขึ้นด้านบน */}
      <div className="alert-container">
        {alertTextFalse.map((alert) => (
          <div key={alert.id} className="alert-data bg-red-500 text-white">
            <span className="text-xl text-center">{alert.text}</span>
          </div>
        ))}
        {alertTextRegis && (
          <div className="alert-data bg-green-500 text-white">
            <span className="text-xl text-center">สมัครเรียบร้อยแล้ว</span>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 min-[800px]:grid-cols-2 w-full">
        {/* ซ่อนโลโก้เมื่อหน้าจอ < 500px ตามเงื่อนไขก่อนหน้า */}
        <div className="body-logo border-1 border-right hidden-logo">
          <div className="relative w-full h-screen overflow-hidden flex items-center justify-center bg-black">
            {/* 1. เลเยอร์พื้นหลัง: วิดีโอเดียวกันแต่ขยายใหญ่และใส่เอฟเฟกต์เบลอ */}
            {/* 1. เลเยอร์พื้นหลัง: วิดีโอเดียวกันแต่ขยายใหญ่และใส่เอฟเฟกต์เบลอ */}
            <video
              ref={bgVideoRef}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              onError={(e) =>
                console.error("bg video error:", e.currentTarget.error)
              }
              className="absolute top-1/2 left-1/2 min-w-full min-h-full w-auto h-auto -translate-x-1/2 -translate-y-1/2 object-cover filter blur-2xl opacity-100 scale-110 z-0 pointer-events-none"
            >
              <source src="/Video/Ptk_40.mp4" type="video/mp4" />
            </video>

            {/* 2. เลเยอร์หลัก: วิดีโอจริงตรงกลาง (เห็นครบทุกส่วนด้วย object-contain) */}
            <video
              ref={mainVideoRef}
              autoPlay
              muted
              loop
              playsInline
              preload="auto"
              onError={(e) =>
                console.error("main video error:", e.currentTarget.error)
              }
              className="absolute top-1/2 left-1/2 max-w-full max-h-full w-auto h-auto -translate-x-1/2 -translate-y-1/2 object-contain z-10 shadow-2xl"
            >
              <source src="/Video/Ptk_40.mp4" type="video/mp4" />
            </video>
          </div>
        </div>

        {loadRegister ? (
          <div>
            <div className="body-logo">
              <div className="main-content">
                <div className="card-Login">
                  <div>
                    <h2 className="animation-text">Register</h2>
                  </div>
                  <div className="grid grid-cols-2 items-center mb-5">
                    <div className="align-center">ฝ่าย</div>
                    <div className="relative w-full max-w-xs grid gap-2">
                      <input
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700"
                        list="register-departments"
                        value={department}
                        onChange={(e) => {
                          const value = e.target.value;
                          setDepartment(value);
                          setDepartmentSub("");
                          setDataDepartmentSub([]);
                          if (dataDepartment.some((item: any) => String(item.Department).toLocaleLowerCase() === value.toLocaleLowerCase())) void fetchDepartmentSub(value);
                        }}
                        onBlur={(e) => void commitDepartment(e.currentTarget.value).catch((error) => alert(error.message))}
                        placeholder="ค้นหาหรือพิมพ์ชื่อฝ่าย"
                      />
                      <datalist id="register-departments">
                        {dataDepartment.map((item: any, index: number) => <option key={index} value={item.Department} />)}
                      </datalist>

                      {/* ไอคอนลูกศรด้านขวา (ใช้ pointer-events-none เพื่อให้คลิกทะลุไอคอนได้) */}
                      <div className="hidden">
                        <svg
                          className="w-4 h-4"
                          fill="none"
                          stroke="currentColor"
                          viewBox="0 0 24 24"
                        >
                          <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth="2"
                            d="M19 9l-7 7-7-7"
                          />
                        </svg>
                      </div>
                    </div>
                    <div className="align-center">แผนก</div>
                    <div className="relative w-full max-w-xs mt-4 mb-3 grid gap-2">
                      <input
                        className="w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm text-gray-700 disabled:bg-gray-100"
                        list="register-sub-departments"
                        value={departmentSub}
                        onChange={(e) => setDepartmentSub(e.target.value)}
                        onBlur={(e) => void addDepartmentSub(e.currentTarget.value).catch((error) => alert(error.message))}
                        placeholder={department ? "ค้นหาหรือพิมพ์ชื่อแผนก" : "เลือกฝ่ายก่อน"}
                        disabled={!department}
                      />
                      <datalist id="register-sub-departments">
                        {dataDepartmentSub.map((item: any, index: number) => {
                          const name = item.Department_Sub ?? item.DepartmentSub ?? item.SubDepartment ?? item.Sub_Department ?? item.Name;
                          return name ? <option key={index} value={name} /> : null;
                        })}
                      </datalist>
                    </div>
                    <div className="align-center">Employee ID :</div>
                    <input
                      placeholder="รหัสพนักงาน"
                      className="form-control"
                      required={true}
                      value={employeeRegis}
                      onChange={(e) => setEmployeeRegis(e.target.value)}
                    />
                    <div className="align-center">Name :</div>
                    <input
                      placeholder="ชื่อ - สกุล"
                      className="form-control"
                      required={true}
                      value={NameAndSubNameRegis}
                      onChange={(e) => setNameAndSubNameRegis(e.target.value)}
                    />
                    <div className="align-center">Username :</div>
                    <input
                      placeholder="รหัสผู้ใช้งาน"
                      className="form-control"
                      required={true}
                      value={usernameRegis}
                      onChange={(e) => setUsernameRegis(e.target.value)}
                    />
                    <div className="align-center">Password :</div>
                    <input
                      placeholder="พาสเวิร์ด"
                      type="password"
                      className="form-control"
                      required={true}
                      value={passwordRegis}
                      onChange={(e) => setPasswordRegis(e.target.value)}
                    />

                    <div className="align-center">Email :</div>
                    <input
                      placeholder="อีเมล์"
                      type="email"
                      className="form-control"
                      value={emailRegis}
                      onChange={(e) => setEmailRegis(e.target.value)}
                    />
                  </div>
                  <div className="text-center mt-3 welcome-text">
                    <button
                      className="btn-Register mx-2"
                      onClick={() => {
                        RegisterUser();
                      }}
                    >
                      สมัครสมาชิก
                    </button>
                    <button
                      className="btn-Inside mx-2"
                      onClick={() => SwicthRegister(false)}
                    >
                      เข้าสู่ระบบ
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div>
            <div className="body-logo">
              <div className="main-content">
                <div className="card-Login">
                  <div>
                    <h2 className="animation-text">
                      <span className="max-[1100px]:inline hidden">PPI</span>
                      <span className="max-[1100px]:hidden inline">
                        Practika Product Information
                      </span>
                    </h2>
                  </div>
                  <div>
                    <div className="mb-3 bg-white">
                      <input
                        className="w-full bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-slate-200 rounded-md pl-3 pr-16 py-2 focus:outline-none"
                        placeholder="Username"
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>
                    <div className="bg-white">
                      <input
                        type="password"
                        className="w-full bg-transparent placeholder:text-slate-400 text-slate-700 text-sm border border-slate-200 rounded-md pl-3 pr-16 py-2 focus:outline-none"
                        placeholder="Password"
                        onChange={(e) => setPassword(e.target.value)}
                        onKeyDown={(e) => SignInForKey(e)}
                      />
                    </div>
                    <div className="welcome-text mt-5">
                      <button
                        className="btn-Inside mx-2"
                        onClick={() => LogInSignIn()}
                      >
                        เข้าสู่ระบบ
                      </button>
                      <button
                        className="btn-Register mx-2"
                        onClick={() => SwicthRegister(true)}
                      >
                        สมัครสมาชิก
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
