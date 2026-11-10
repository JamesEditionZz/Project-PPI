import React, { useEffect } from "react";
import * as XLSX from "xlsx";

/* ------------------------------------------------------------------ */
/*  UI helpers (หน้าตาล้วน ไม่มี logic ข้อมูล)                          */
/*  ใช้สไตล์เดียวกับฟอร์ม Register: label ซ้าย / input ขวา              */
/* ------------------------------------------------------------------ */
const fieldClass =
  "w-full rounded-xl border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 outline-none transition-all hover:border-gray-400 focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500";

function FormRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <label className="text-sm font-medium text-gray-700">{label}</label>
      {children}
    </>
  );
}

function SelectBox({
  children,
  ...props
}: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <div className="relative w-full">
      <select
        {...props}
        className={`${fieldClass} cursor-pointer appearance-none pr-10`}
      >
        {children}
      </select>
      {/* ไอคอนลูกศรด้านขวา */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-3 text-gray-500">
        <svg
          className="h-4 w-4"
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
  );
}

function SearchableCreatableInput({
  value,
  options,
  onChange,
  onCreate,
  onCommit,
  placeholder,
  disabled = false,
}: {
  value: string;
  options: string[];
  onChange: (value: string) => void;
  onCreate: (value: string) => void | Promise<void>;
  onCommit?: (value: string) => void | Promise<void>;
  placeholder: string;
  disabled?: boolean;
}) {
  const listId = React.useId();
  const [createError, setCreateError] = React.useState("");

  const createOption = async () => {
    const option = value.trim();
    if (!option) return;
    const alreadyExists = options.some(
      (existing) => existing.toLocaleLowerCase() === option.toLocaleLowerCase(),
    );

    setCreateError("");
    try {
      if (!alreadyExists) await onCreate(option);
      await onCommit?.(option);
    } catch (error) {
      console.error("Error creating option:", error);
      setCreateError("เพิ่มรายการไม่สำเร็จ กรุณาลองอีกครั้ง");
    }
  };

  return (
    <div>
      <input
        type="text"
        list={listId}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        onBlur={() => void createOption()}
        disabled={disabled}
        placeholder={placeholder}
        className={fieldClass}
      />
      <datalist id={listId}>
        {options.map((option, index) => (
          <option key={`${option}-${index}`} value={option} />
        ))}
      </datalist>
      {createError && (
        <p className="mt-1 text-xs text-red-600" role="alert">
          {createError}
        </p>
      )}
    </div>
  );
}

function ModalShell({
  title,
  children,
  footer,
}: {
  title: string;
  children: React.ReactNode;
  footer: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
      <div className="relative max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <h3 className="mb-5 border-b pb-3 text-lg font-bold text-gray-800">
          {title}
        </h3>
        <div className="grid grid-cols-[110px_1fr] items-center gap-x-4 gap-y-4">
          {children}
        </div>
        <div className="mt-6 flex justify-end gap-3 border-t pt-4">
          {footer}
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Page                                                               */
/* ------------------------------------------------------------------ */
export default function page() {
  const [getMember, setGetMember] = React.useState<any>([]);

  const [isEditOpen, setIsEditOpen] = React.useState<boolean>(false);
  const [selectedUser, setSelectedUser] = React.useState<any>({});

  const [loading, setLoading] = React.useState<boolean>(false);

  // รายชื่อแผนก (ดึงจาก API เดียวกับหน้า Register)
  const [dataDepartment, setDataDepartment] = React.useState<any>([]);
  const [dataDepartmentSub, setDataDepartmentSub] = React.useState<any[]>([]);

  const datafecth = async () => {
    const res = await fetch("http://localhost:5005/API/Get_UserMember");
    const data = await res.json();

    setGetMember(data);
    setLoading(false);
  };

  useEffect(() => {
    setLoading(true);
    datafecth();
  }, []);

  useEffect(() => {
    const fetchDepartment = async () => {
      try {
        const res = await fetch("http://localhost:5005/API/Department");
        const result = await res.json();
        setDataDepartment(result);
      } catch (error) {
        console.error("Error fetching department:", error);
      }
    };
    fetchDepartment();
  }, []);

  const departmentOptions: string[] = [...new Set<string>(
    dataDepartment
      .map((item: any) => item.Department)
      .filter((name: unknown): name is string => typeof name === "string"),
  )];

  const fetchDepartmentSub = async (division: string) => {
    if (!division) {
      setDataDepartmentSub([]);
      return;
    }
    try {
      const response = await fetch(
        `http://localhost:5005/API/Department_Sub?Department=${encodeURIComponent(division)}`,
      );
      if (!response.ok) throw new Error("Failed to fetch sub-departments");
      setDataDepartmentSub(await response.json());
    } catch (error) {
      console.error("Error fetching sub-departments:", error);
      setDataDepartmentSub([]);
    }
  };

  const departmentSubOptions: string[] = [...new Set<string>(
    dataDepartmentSub
      .map(
        (item: any) =>
          item.Department_Sub ?? item.DepartmentSub ?? item.SubDepartment ?? item.Sub_Department ?? item.Name,
      )
      .filter((name: unknown): name is string => typeof name === "string"),
  )];

  const saveDepartment = async (name: string) => {
    const department = name.trim();
    if (!department) return;
    const response = await fetch("http://localhost:5005/API/Department", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Department: department }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result?.message || "เพิ่มฝ่ายไม่สำเร็จ");
    setDataDepartment((previous: any[]) => previous.some((item) => item.Department === department)
      ? previous
      : [...previous, { Department: department }]);
    return department;
  };

  const saveDepartmentSub = async (department: string, name: string) => {
    const departmentSub = name.trim();
    if (!department || !departmentSub) return;
    await saveDepartment(department);
    const response = await fetch("http://localhost:5005/API/Department_Sub", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ Department: department, Department_Sub: departmentSub }),
    });
    const result = await response.json();
    if (!response.ok) throw new Error(result?.message || "เพิ่มแผนกไม่สำเร็จ");
    setDataDepartmentSub((previous) => [...previous, { Department: department, Department_Sub: departmentSub }]);
    return departmentSub;
  };

  const handleOpenEdit = (item: any) => {
    setSelectedUser(item);
    void fetchDepartmentSub(item.Department || "");
    setIsEditOpen(true);
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    if (name === "Department") {
      setDataDepartmentSub([]);
      setSelectedUser((prev: any) => ({
        ...prev,
        Department: value,
        Department_Sub: "",
      }));
      void fetchDepartmentSub(value);
      return;
    }
    setSelectedUser((prev: any) => ({ ...prev, [name]: value }));
  };

  const UpdateUser = async (user: any) => {
    try {
      await saveDepartment(user.Department || "");
      await saveDepartmentSub(user.Department || "", user.Department_Sub || "");
      const response = await fetch(
        "http://localhost:5005/API/Update_UserMember",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(user),
        },
      );

      if (!response.ok) {
        throw new Error("Network response was not ok");
      } else {
        alert("อัปเดตข้อมูลสำเร็จ");
        setIsEditOpen(false);
        datafecth();
      }
    } catch (error) {
      console.error("Error updating user:", error);
      alert("เกิดข้อผิดพลาดในการอัปเดตข้อมูล");
    }
  };

  const [isAddOpen, setIsAddOpen] = React.useState<boolean>(false);

  const emptyUser = {
    Department: "",
    Department_Sub: "",
    Employee: "",
    Name: "",
    Username: "",
    Email: "",
    Password: "",
    Status: "Member",
    Status_Action: "Active",
  };

  const [newUser, setNewUser] = React.useState<any>(emptyUser);

  const handleAddChange = (e: { target: { name: any; value: any } }) => {
    const { name, value } = e.target;
    if (name === "Department") {
      setDataDepartmentSub([]);
      setNewUser((prev: any) => ({
        ...prev,
        Department: value,
        Department_Sub: "",
      }));
      void fetchDepartmentSub(value);
      return;
    }
    setNewUser((prev: any) => ({ ...prev, [name]: value }));
  };

  const AddUser = async (userData: any) => {
    try {
      await saveDepartment(userData.Department || "");
      await saveDepartmentSub(userData.Department || "", userData.Department_Sub || "");
      const response = await fetch(
        "http://localhost:5005/API/Add_UserMember",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify(userData),
        },
      );

      if (!response.ok) {
        throw new Error("Failed to add user");
      }

      setIsAddOpen(false);
      setNewUser(emptyUser);
    } catch (error) {
      console.error("Error adding user:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      datafecth();
    }
  };

  // ตรวจข้อมูลก่อนบันทึก (เหมือนตอน Register: Email ไม่บังคับ)
  const handleAddSubmit = () => {
    if (
      !newUser.Department ||
      !newUser.Department_Sub ||
      !newUser.Employee ||
      !newUser.Name ||
      !newUser.Username ||
      !newUser.Password
    ) {
      alert("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }
    AddUser(newUser);
  };

  const handleOpenDelete = async (item: any) => {
    const confirmDelete = window.confirm(
      `คุณต้องการลบ User: ${item.Username} หรือไม่?`,
    );
    if (confirmDelete) {
      try {
        const response = await fetch(
          "http://localhost:5005/API/Delete_UserMember",
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({
              Username: item.Username,
              Employee: item.Employee,
            }),
          },
        );
        if (!response.ok) {
          throw new Error("Failed to delete user");
        }
        const result = await response.json();
        datafecth();
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("เกิดข้อผิดพลาดในการลบข้อมูล");
      }
    }
  };

  const Log_Login = async () => {
    try {
      const res = await fetch("http://localhost:5005/Data_Log_Login");
      const data = await res.json();

      const worksheet = XLSX.utils.json_to_sheet(data);

      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, "Log_Login");

      XLSX.writeFile(workbook, `Log_Login_${Date.now()}.xlsx`);
    } catch (error) {
      console.error("Error fetching or exporting data:", error);
    }
  };

  return (
    <>
      <div>
        {/* ---------------- Modal: Add User ---------------- */}
        {isAddOpen && (
          <ModalShell
            title="เพิ่มข้อมูล User ใหม่"
            footer={
              <>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddOpen(false);
                  }}
                  className="cursor-pointer rounded-xl bg-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-300"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={handleAddSubmit}
                  className="cursor-pointer rounded-xl bg-green-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-green-700"
                >
                  บันทึก
                </button>
              </>
            }
          >
            <FormRow label="ฝ่าย">
              <div className="grid gap-2">
              <SearchableCreatableInput
                value={newUser.Department || ""}
                options={departmentOptions}
                onChange={(value) => {
                  setDataDepartmentSub([]);
                  setNewUser((previous: any) => ({ ...previous, Department: value, Department_Sub: "" }));
                  if (departmentOptions.some((name) => name.toLocaleLowerCase() === value.toLocaleLowerCase())) void fetchDepartmentSub(value);
                }}
                onCreate={async (name) => { await saveDepartment(name); }}
                onCommit={fetchDepartmentSub}
                placeholder="ค้นหาหรือพิมพ์ชื่อฝ่าย"
              />
              </div>
            </FormRow>

            <FormRow label="แผนก">
              <SearchableCreatableInput
                value={newUser.Department_Sub || ""}
                options={departmentSubOptions}
                onChange={(value) => setNewUser((previous: any) => ({ ...previous, Department_Sub: value }))}
                onCreate={async (name) => { await saveDepartmentSub(newUser.Department, name); }}
                placeholder={newUser.Department ? "ค้นหาหรือพิมพ์ชื่อแผนก" : "เลือกฝ่ายก่อน"}
                disabled={!newUser.Department}
              />
            </FormRow>

            <FormRow label="Employee ID :">
              <input
                type="text"
                name="Employee"
                value={newUser.Employee || ""}
                onChange={handleAddChange}
                placeholder="รหัสพนักงาน"
                className={fieldClass}
              />
            </FormRow>

            <FormRow label="Name :">
              <input
                type="text"
                name="Name"
                value={newUser.Name || ""}
                onChange={handleAddChange}
                placeholder="ชื่อ - สกุล"
                className={fieldClass}
              />
            </FormRow>

            <FormRow label="Username :">
              <input
                type="text"
                name="Username"
                value={newUser.Username || ""}
                onChange={handleAddChange}
                placeholder="รหัสผู้ใช้งาน"
                className={fieldClass}
              />
            </FormRow>

            <FormRow label="Password :">
              <input
                type="password"
                name="Password"
                value={newUser.Password || ""}
                onChange={handleAddChange}
                placeholder="พาสเวิร์ด"
                className={fieldClass}
              />
            </FormRow>

            <FormRow label="Email :">
              <input
                type="email"
                name="Email"
                value={newUser.Email || ""}
                onChange={handleAddChange}
                placeholder="อีเมล์"
                className={fieldClass}
              />
            </FormRow>

            <FormRow label="Status :">
              <SelectBox
                name="Status"
                value={newUser.Status || ""}
                onChange={handleAddChange}
              >
                <option value="">-- เลือก Status --</option>
                <option value="Member">Member</option>
                <option value="Admin">Admin</option>
              </SelectBox>
            </FormRow>

            <FormRow label="Action :">
              <SelectBox
                name="Status_Action"
                value={newUser.Status_Action || "Active"}
                onChange={handleAddChange}
              >
                <option value="Active">Active</option>
                <option value="UnActive">UnActive</option>
              </SelectBox>
            </FormRow>
          </ModalShell>
        )}

        {/* ---------------- Modal: Edit User ---------------- */}
        {isEditOpen && (
          <ModalShell
            title={`แก้ไขข้อมูล User: ${selectedUser.Username}`}
            footer={
              <>
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="cursor-pointer rounded-xl bg-gray-200 px-5 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-300"
                >
                  ยกเลิก
                </button>
                <button
                  type="button"
                  onClick={() => UpdateUser(selectedUser)} // เรียกฟังก์ชันอัปเดตข้อมูล
                  className="cursor-pointer rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-indigo-700"
                >
                  บันทึก
                </button>
              </>
            }
          >
            <FormRow label="แผนก">
              <div className="grid gap-3">
                <SearchableCreatableInput
                  value={selectedUser.Department || ""}
                  options={departmentOptions}
                  onChange={(value) => {
                    setDataDepartmentSub([]);
                    setSelectedUser((previous: any) => ({ ...previous, Department: value, Department_Sub: "" }));
                    if (departmentOptions.some((name) => name.toLocaleLowerCase() === value.toLocaleLowerCase())) void fetchDepartmentSub(value);
                  }}
                  onCreate={async (name) => { await saveDepartment(name); }}
                  onCommit={fetchDepartmentSub}
                  placeholder="ค้นหาหรือพิมพ์ชื่อฝ่าย"
                />
                <SearchableCreatableInput
                  value={selectedUser.Department_Sub || ""}
                  options={departmentSubOptions}
                  onChange={(value) => setSelectedUser((previous: any) => ({ ...previous, Department_Sub: value }))}
                  onCreate={async (name) => { await saveDepartmentSub(selectedUser.Department, name); }}
                  placeholder={selectedUser.Department ? "ค้นหาหรือพิมพ์ชื่อแผนก" : "เลือกฝ่ายก่อน"}
                  disabled={!selectedUser.Department}
                />
              </div>
            </FormRow>

            <FormRow label="Employee ID :">
              <input
                type="text"
                name="Employee"
                value={selectedUser.Employee || ""}
                className={fieldClass}
                disabled
              />
            </FormRow>

            <FormRow label="Name :">
              <input
                type="text"
                name="Name"
                value={selectedUser.Name || ""}
                onChange={handleEditChange}
                placeholder="ชื่อ - สกุล"
                className={fieldClass}
              />
            </FormRow>

            <FormRow label="Username :">
              <input
                type="text"
                name="Username"
                value={selectedUser.Username || ""}
                className={fieldClass}
                disabled
              />
            </FormRow>

            <FormRow label="Email :">
              <input
                type="email"
                name="Email"
                value={selectedUser.Email || ""}
                onChange={handleEditChange}
                placeholder="อีเมล์"
                className={fieldClass}
              />
            </FormRow>

            <FormRow label="Status :">
              <SelectBox
                name="Status"
                value={selectedUser.Status || ""}
                onChange={handleEditChange}
              >
                <option value="">-- เลือก Status --</option>
                <option value="Member">Member</option>
                <option value="Admin">Admin</option>
              </SelectBox>
            </FormRow>

            <FormRow label="Action :">
              <SelectBox
                name="Status_Action"
                value={selectedUser.Status_Action || ""}
                onChange={handleEditChange}
              >
                <option value="Active">Active</option>
                <option value="UnActive">UnActive</option>
              </SelectBox>
            </FormRow>
          </ModalShell>
        )}

        <div className="flex justify-between">
          <div className="p-5 font-sans text-xl font-semibold text-gray-800">
            จัดการ User
          </div>
          <div className="p-5">
            <button
              type="button"
              onClick={() => Log_Login()}
              className="px-5 py-2 bg-gray-600 text-white rounded-lg text-sm font-medium hover:bg-gray-700 cursor-pointer mx-3"
            >
              Log Login
            </button>
            <button
              type="button"
              onClick={() => {
                setIsAddOpen(true);
              }}
              className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 cursor-pointer"
            >
              Add User
            </button>
          </div>
        </div>

        <div className="shadow-md rounded-xl border border-gray-200 bg-white mx-5">
          <table className="w-full border-collapse">
            <thead className="text-center sticky top-0 bg-gray-50 text-gray-700 uppercase text-xs tracking-wider border-b border-gray-200 z-10">
              <tr>
                <th className="py-3 px-4">แผนก</th>
                <th className="py-3 px-4">รหัสพนักงาน</th>
                <th className="py-3 px-4">ชื่อ-นามสกุล</th>
                <th className="py-3 px-4">Username</th>
                <th className="py-3 px-4">Email</th>
                <th className="py-3 px-4">Status</th>
                <th className="py-3 px-4">การใช้งาน</th>
                <th className="py-3 px-4">Date_Create</th>
                <th></th>
                <th></th>
              </tr>
            </thead>
            {loading ? (
              <tbody>
                <tr>
                  <td colSpan={13} className="py-70 text-center">
                    <div className="flex flex-col items-center justify-center space-y-3">
                      <div className="w-10 h-10 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin"></div>
                      <p className="text-gray-500 font-medium text-sm animate-pulse">
                        กำลังโหลดข้อมูล กรุณารอสักครู่...
                      </p>
                    </div>
                  </td>
                </tr>
              </tbody>
            ) : (
              <>
                {getMember.map((item: any, index: number) => (
                  <tbody
                    key={index}
                    className="divide-y divide-gray-100 text-sm text-gray-600 text-center"
                  >
                    <tr className="hover:bg-gray-50 transition-colors">
                      <td className="py-2.5 px-4 font-medium text-gray-900">
                        {item.Department} / {item.Department_Sub}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-gray-900">
                        {item.Employee}
                      </td>
                      <td className="py-2.5 px-4 font-medium text-gray-900">
                        {item.Name}
                      </td>
                      <td className="py-2.5 px-4">{item.Username}</td>
                      <td className="py-2.5 px-4 font-medium text-gray-900">
                        {item.Email}
                      </td>
                      <th className="py-3 px-4">{item.Status}</th>
                      <td
                        className={`py-2.5 px-4 text-center text-lg font-bold ${item.Status_Action === "Active" ? "text-green-600" : "text-red-600"}`}
                      >
                        {item.Status_Action}
                      </td>
                      <td className="py-2.5 px-4 text-center">
                        {item.Date_Created.split("T")[0] +
                          " " +
                          item.Date_Created.split("T")[1].split(".")[0]}
                      </td>
                      <td>
                        <button
                          onClick={() => handleOpenEdit(item)}
                          className="bg-yellow-600 hover:bg-yellow-700 text-white font-bold py-2 px-4 rounded cursor-pointer transition-all"
                        >
                          Edit
                        </button>
                      </td>
                      <td>
                        <button
                          onClick={() => handleOpenDelete(item)}
                          className="bg-red-600 hover:bg-red-700 text-white font-bold py-2 px-4 rounded cursor-pointer transition-all"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  </tbody>
                ))}
              </>
            )}
          </table>
        </div>
      </div>
    </>
  );
}
