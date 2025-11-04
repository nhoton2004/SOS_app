import React, { useState, useEffect } from 'react';
import { User, UserStatus } from '../types';
import { userService } from '../services/userService';
import { mapBackendUserToFrontendUser } from '../utils/userMapper';

const UserManagement: React.FC = () => {
    const [users, setUsers] = useState<User[]>([]);
    const [loading, setLoading] = useState(true);
    const [userToDelete, setUserToDelete] = useState<User | null>(null);
    const [searchTerm, setSearchTerm] = useState('');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);

    useEffect(() => {
        fetchUsers();
    }, [page, searchTerm]);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const response = await userService.getUsers({
                page,
                limit: 20,
                search: searchTerm || undefined,
            });
            const mappedUsers = (response.data || []).map((u: any) => mapBackendUserToFrontendUser(u));
            setUsers(mappedUsers);
            setTotalPages(response.pagination?.pages || 1);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusToggle = async (user: User) => {
        try {
            const newStatus = user.status === 'active' ? 'suspended' : 'active';
            await userService.updateUser(user.id, {
                isActive: newStatus === 'active',
            });
            await fetchUsers();
        } catch (error) {
            console.error('Error updating user:', error);
        }
    };

    const confirmDelete = async () => {
        if (userToDelete) {
            try {
                await userService.deleteUser(userToDelete.id);
                setUserToDelete(null);
                await fetchUsers();
            } catch (error) {
                console.error('Error deleting user:', error);
            }
        }
    };

    const filteredUsers = users.filter(user => 
        user.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (loading && users.length === 0) {
        return (
            <div className="p-8">
                <h1 className="text-3xl font-bold text-white mb-8">Quản lý Người dùng</h1>
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-400">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-white mb-8">Quản lý Người dùng</h1>
            <div className="bg-gray-800 rounded-lg shadow-lg overflow-hidden">
                <div className="p-4 bg-gray-700/50">
                    <input
                        type="text"
                        placeholder="Tìm người dùng theo tên..."
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setPage(1);
                        }}
                        className="w-full md:w-1/3 bg-gray-900 border border-gray-600 rounded-md py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left text-gray-400">
                        <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                            <tr>
                                <th scope="col" className="px-6 py-3">Người dùng</th>
                                <th scope="col" className="px-6 py-3">Số điện thoại</th>
                                <th scope="col" className="px-6 py-3">Ngày đăng ký</th>
                                <th scope="col" className="px-6 py-3">Trạng thái</th>
                                <th scope="col" className="px-6 py-3">Hành động</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.length > 0 ? filteredUsers.map((user) => (
                                <tr key={user.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-600/50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center">
                                            <img className="w-10 h-10 rounded-full" src={user.avatar} alt={user.name} />
                                            <div className="pl-3">
                                                <div className="text-base font-semibold text-white">{user.name}</div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4">{user.phone}</td>
                                    <td className="px-6 py-4">{new Date(user.registrationDate).toLocaleDateString()}</td>
                                    <td className="px-6 py-4">
                                        <span className={`px-2 py-1 rounded-full text-xs ${
                                            user.status === 'active' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-300'
                                        }`}>
                                            {user.status === 'active' ? 'Hoạt động' : 'Bị đình chỉ'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4 flex items-center space-x-3">
                                        <button 
                                            onClick={() => handleStatusToggle(user)}
                                            className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                                                user.status === 'active' ? 'bg-yellow-500/20 text-yellow-300 hover:bg-yellow-500/40' : 'bg-green-500/20 text-green-300 hover:bg-green-500/40'
                                            }`}
                                        >
                                            {user.status === 'active' ? 'Đình chỉ' : 'Kích hoạt'}
                                        </button>
                                        <button
                                            onClick={() => setUserToDelete(user)}
                                            className="px-3 py-1 text-xs font-medium text-red-300 bg-red-500/20 rounded-md hover:bg-red-500/40 transition-colors"
                                        >
                                            Xóa
                                        </button>
                                    </td>
                                </tr>
                            )) : (
                                <tr>
                                    <td colSpan={5} className="text-center py-10 text-gray-500">
                                        Không tìm thấy người dùng nào phù hợp.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
                {totalPages > 1 && (
                    <div className="p-4 bg-gray-700/50 flex justify-between items-center">
                        <button
                            onClick={() => setPage(p => Math.max(1, p - 1))}
                            disabled={page === 1}
                            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 disabled:opacity-50"
                        >
                            Trước
                        </button>
                        <span className="text-gray-300">Trang {page} / {totalPages}</span>
                        <button
                            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                            disabled={page === totalPages}
                            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 disabled:opacity-50"
                        >
                            Sau
                        </button>
                    </div>
                )}
            </div>

            {userToDelete && (
                <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
                    <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 m-4">
                        <h2 className="text-xl font-bold text-white mb-4">Xác nhận xóa</h2>
                        <p className="text-sm text-gray-300 mb-6">
                            Bạn có chắc chắn muốn xóa người dùng <span className="font-bold text-white">{userToDelete.name}</span>? Hành động này không thể được hoàn tác.
                        </p>
                        <div className="flex justify-end gap-4">
                            <button onClick={() => setUserToDelete(null)} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors">Hủy</button>
                            <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">Xác nhận Xóa</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;