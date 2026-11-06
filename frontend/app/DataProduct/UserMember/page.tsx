import React, { useEffect } from "react";

export default function page() {
  const [getMember, setGetMember] = React.useState<any>([]);

  const [isEditOpen, setIsEditOpen] = React.useState<boolean>(false);
  const [selectedUser, setSelectedUser] = React.useState<any>({});

  const [loading, setLoading] = React.useState<boolean>(false);

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

  const handleOpenEdit = (item: any) => {
    setSelectedUser(item);
    setIsEditOpen(true);
  };

  const handleEditChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>,
  ) => {
    const { name, value } = e.target;
    setSelectedUser((prev: any) => ({ ...prev, [name]: value }));
  };

  const UpdateUser = async (user: any) => {
    try {
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

      console.log(response);

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

  const [newUser, setNewUser] = React.useState<any>({
    Username: "",
    Email: "",
    Password: "",
    Status: "Member",
    Status_Action: "Active",
  });

  const handleAddChange = (e: { target: { name: any; value: any } }) => {
    const { name, value } = e.target;
    setNewUser((prev: any) => ({ ...prev, [name]: value }));
  };

  const AddUser = async (userData: any) => {
    try {
      const response = await fetch("http://localhost:5005/API/Add_UserMember", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(userData),
      });

      if (!response.ok) {
        throw new Error("Failed to add user");
      }

      setIsAddOpen(false);
      setNewUser({
        Username: "",
        Email: "",
        Password: "",
        Status: "Member",
        Status_Action: "Active",
      });
    } catch (error) {
      console.error("Error adding user:", error);
      alert("เกิดข้อผิดพลาดในการบันทึกข้อมูล");
    } finally {
      datafecth();
    }
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
        console.log("User deleted successfully:", result);
        datafecth();
      } catch (error) {
        console.error("Error deleting user:", error);
        alert("เกิดข้อผิดพลาดในการลบข้อมูล");
      }
    }
  };

  return (
    <>
      <div>
        {isAddOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative">
              <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
                เพิ่มข้อมูล User ใหม่
              </h3>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  setIsAddOpen(false);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Employee
                  </label>
                  <input
                    type="text"
                    name="Employee"
                    value={newUser.Employee || ""}
                    onChange={handleAddChange}
                    placeholder="ระบุรหัสพนักงาน"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    name="Username"
                    value={newUser.Username || ""}
                    onChange={handleAddChange}
                    placeholder="กรอก Username"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none bg-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="Email"
                    value={newUser.Email || ""}
                    onChange={handleAddChange}
                    placeholder="กรอก Email"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>

                {/* ตัวอย่างเพิ่ม Password สำหรับตอนสมัครหรือเพิ่ม User ใหม่ */}
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    type="password"
                    name="Password"
                    value={newUser.Password || ""}
                    onChange={handleAddChange}
                    placeholder="กรอก Password"
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {/* Status Select */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      name="Status"
                      value={newUser.Status || ""}
                      onChange={handleAddChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none bg-white"
                    >
                      <option value="">-- เลือก Status --</option>
                      <option value="Member">Member</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>

                  {/* Action Select */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Action
                    </label>
                    <select
                      name="Status_Action"
                      value={newUser.Status_Action || "Active"}
                      onChange={handleAddChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-green-500 focus:outline-none bg-white"
                    >
                      <option value="Active">Active</option>
                      <option value="UnActive">UnActive</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setIsAddOpen(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700 cursor-pointer"
                    onClick={() => AddUser && AddUser(newUser)} // เรียกฟังก์ชันบันทึกข้อมูลเพิ่ม
                  >
                    บันทึก
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {isEditOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
            <div className="bg-white rounded-xl shadow-xl w-full max-w-lg p-6 relative">
              <h3 className="text-lg font-bold text-gray-800 mb-4 border-b pb-2">
                แก้ไขข้อมูล User: {selectedUser.Username}
              </h3>

              <form
                onSubmit={async (e) => {
                  e.preventDefault();
                  // โค้ดสำหรับ fetch ส่ง API อัปเดตข้อมูลตรงนี้
                  setIsEditOpen(false);
                }}
                className="space-y-4"
              >
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Username
                  </label>
                  <input
                    type="text"
                    name="Username"
                    value={selectedUser.Username || ""}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white disabled:bg-gray-100 disabled:text-gray-500 disabled:cursor-not-allowed"
                    disabled
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="Email"
                    value={selectedUser.Email || ""}
                    onChange={handleEditChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  {/* Status Select */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Status
                    </label>
                    <select
                      name="Status"
                      value={selectedUser.Status || ""}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                    >
                      <option value="">-- เลือก Status --</option>
                      <option value="Member">Member</option>
                      <option value="Admin">Admin</option>
                    </select>
                  </div>

                  {/* Action Select */}
                  <div>
                    <label className="block text-xs font-medium text-gray-700 mb-1">
                      Action
                    </label>
                    <select
                      name="Status_Action"
                      value={selectedUser.Status_Action || ""}
                      onChange={handleEditChange}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none bg-white"
                    >
                      <option value="Active">Active</option>
                      <option value="UnActive">UnActive</option>
                    </select>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 mt-6 pt-3 border-t">
                  <button
                    type="button"
                    onClick={() => setIsEditOpen(false)}
                    className="px-4 py-2 bg-gray-200 text-gray-700 rounded-lg text-sm font-medium hover:bg-gray-300 cursor-pointer"
                  >
                    ยกเลิก
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg text-sm font-medium hover:bg-indigo-700 cursor-pointer"
                    onClick={() => UpdateUser(selectedUser)} // เรียกฟังก์ชันอัปเดตข้อมูล
                  >
                    บันทึก
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <div className="flex justify-between">
          <div className="p-5 font-sans text-xl font-semibold text-gray-800">
            จัดการ User
          </div>
          <div className="p-5">
            <button
              type="button"
              onClick={() => setIsAddOpen(true)}
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
                        {item.Department}
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
