"use client";

import { useSessionGuard } from "./Login/hook/useSessionGuard";

export default function SessionGuard() {
  useSessionGuard(5000); // เช็คทุก 5 วินาที
  return null; // ไม่แสดงอะไรบนหน้าจอ
}
