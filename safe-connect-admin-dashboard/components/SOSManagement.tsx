
import React, { useState, useEffect } from 'react';
import { CaseStatus } from '../types';
import { EyeIcon, MapPinIcon } from './icons';
import { sosService } from '../services/sosService';

// Trash icon component
const TrashIcon: React.FC<{ className?: string }> = ({ className = "w-5 h-5" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
    </svg>
);

const statusColorMap: { [key in CaseStatus]: string } = {
    [CaseStatus.PENDING]: 'bg-yellow-500/20 text-yellow-400',
    [CaseStatus.ASSIGNED]: 'bg-blue-500/20 text-blue-400',
    [CaseStatus.COMPLETED]: 'bg-green-500/20 text-green-400',
};

const SOSDetailModal: React.FC<{ sosCase: SOSCase, onClose: () => void }> = ({ sosCase, onClose }) => {
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 transition-opacity">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-4xl p-8 m-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Chi tiết ca SOS: <span className="text-blue-400">{sosCase.id}</span></h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Left Column */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-600 pb-2">Thông tin chung</h3>
                        <div className="space-y-3 text-gray-300">
                            <p><strong>Trạng thái:</strong> <span className={`px-2 py-1 text-sm rounded-full ${statusColorMap[sosCase.status]}`}>{sosCase.status}</span></p>
                            <p><strong>Thời gian:</strong> {new Date(sosCase.timestamp).toLocaleString()}</p>
                            <p><strong>Địa chỉ:</strong> {sosCase.location.address}</p>
                        </div>

                        <div className="mt-6">
                            <h3 className="text-lg font-semibold text-white mb-2">Người gặp nạn (NGN)</h3>
                            <div className="flex items-center bg-gray-700 p-3 rounded-md">
                                <img src={sosCase.user.avatar} alt={sosCase.user.name} className="w-12 h-12 rounded-full mr-4"/>
                                <div>
                                    <p className="font-bold text-white">{sosCase.user.name}</p>
                                    <p className="text-sm text-gray-400">{sosCase.user.phone}</p>
                                </div>
                            </div>
                        </div>

                        {sosCase.volunteer && (
                            <div className="mt-4">
                                <h3 className="text-lg font-semibold text-white mb-2">Tình nguyện viên (TNV)</h3>
                                <div className="flex items-center bg-gray-700 p-3 rounded-md">
                                    <img src={sosCase.volunteer.avatar} alt={sosCase.volunteer.name} className="w-12 h-12 rounded-full mr-4"/>
                                    <div>
                                        <p className="font-bold text-white">{sosCase.volunteer.name}</p>
                                        <p className="text-sm text-gray-400">{sosCase.volunteer.phone}</p>
                                    </div>
                                </div>
                            </div>
                        )}

                        <div className="mt-6">
                             <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-600 pb-2">Bản đồ</h3>
                             <div className="h-64 bg-gray-700 rounded-md flex items-center justify-center relative border-2 border-gray-600">
                                <img src={`https://picsum.photos/seed/${sosCase.id}/600/300?grayscale`} alt="Map" className="absolute inset-0 w-full h-full object-cover opacity-20"/>
                                <MapPinIcon className="h-10 w-10 text-red-500 z-10"/>
                                <p className="absolute bottom-2 text-sm text-gray-400 z-10">Vị trí ước tính</p>
                             </div>
                        </div>

                    </div>
                    {/* Right Column */}
                    <div>
                        <h3 className="text-lg font-semibold text-white mb-4 border-b border-gray-600 pb-2">Lịch sử Chat</h3>
                        <div className="bg-gray-900 rounded-md p-4 h-[28rem] overflow-y-auto flex flex-col space-y-4">
                            {sosCase.chatHistory.map((chat, index) => (
                                <div key={index} className={`flex ${chat.sender === 'TNV' ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-xs lg:max-w-md p-3 rounded-lg ${chat.sender === 'TNV' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-700 text-gray-200 rounded-bl-none'}`}>
                                        <p className="text-sm">{chat.message}</p>
                                        <p className="text-xs text-right mt-1 opacity-60">{chat.time}</p>
                                    </div>
                                </div>
                            ))}
                             {sosCase.chatHistory.length === 0 && <p className="text-center text-gray-500 my-auto">Chưa có tin nhắn.</p>}
                        </div>
                    </div>
                </div>

                <div className="mt-8 text-right">
                    <button onClick={onClose} className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors">Đóng</button>
                </div>
            </div>
        </div>
    );
};

const SOSTable: React.FC<{
    cases: any[], 
    onSelectCase: (c: any) => void, 
    onDeleteCase: (c: any) => void,
    deletingCaseId: string | null
}> = ({cases, onSelectCase, onDeleteCase, deletingCaseId}) => {
    const getStatusKey = (status: string) => {
        if (status === 'SEARCHING') return CaseStatus.PENDING;
        if (status === 'ACCEPTED' || status === 'IN_PROGRESS') return CaseStatus.ASSIGNED;
        if (status === 'RESOLVED' || status === 'CANCELLED') return CaseStatus.COMPLETED;
        return CaseStatus.PENDING;
    };

    return (
     <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-400">
            <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                <tr>
                    <th scope="col" className="px-6 py-3">Mã ca</th>
                    <th scope="col" className="px-6 py-3">Người gặp nạn</th>
                    <th scope="col" className="px-6 py-3">Tình nguyện viên</th>
                    <th scope="col" className="px-6 py-3">Thời gian</th>
                    <th scope="col" className="px-6 py-3">Trạng thái</th>
                    <th scope="col" className="px-6 py-3">Hành động</th>
                </tr>
            </thead>
            <tbody>
                {cases.map((sosCase) => {
                    const caseId = sosCase.code || sosCase._id || sosCase.id;
                    const reporter = sosCase.reporterId || sosCase.user;
                    const volunteer = sosCase.acceptedBy || sosCase.volunteer;
                    const timestamp = sosCase.createdAt || sosCase.timestamp;
                    const status = sosCase.status || 'SEARCHING';
                    const statusKey = getStatusKey(status);

                    return (
                    <tr key={caseId} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-600/50">
                        <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{caseId}</td>
                        <td className="px-6 py-4">{reporter?.fullName || reporter?.name || 'Unknown'}</td>
                        <td className="px-6 py-4">{volunteer?.fullName || volunteer?.name || 'Chưa có'}</td>
                        <td className="px-6 py-4">{new Date(timestamp).toLocaleString()}</td>
                        <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${statusColorMap[statusKey]}`}>{status}</span>
                        </td>
                        <td className="px-6 py-4">
                            <div className="flex items-center space-x-3">
                                <button 
                                    onClick={() => onSelectCase(sosCase)} 
                                    className="text-blue-400 hover:text-blue-300"
                                    title="Xem chi tiết"
                                >
                                    <EyeIcon className="w-5 h-5"/>
                                </button>
                                <button 
                                    onClick={() => onDeleteCase(sosCase)} 
                                    disabled={deletingCaseId === caseId}
                                    className={`${deletingCaseId === caseId ? 'opacity-50 cursor-not-allowed' : 'hover:text-red-300'} text-red-400`}
                                    title="Xóa case (Admin - Hard delete)"
                                >
                                    <TrashIcon className="w-5 h-5"/>
                                </button>
                            </div>
                        </td>
                    </tr>
                    );
                })}
            </tbody>
        </table>
    </div>
    );
};


const SOSManagement: React.FC = () => {
    const [activeTab, setActiveTab] = useState<'active' | 'completed'>('active');
    const [selectedCase, setSelectedCase] = useState<any | null>(null);
    const [sosCases, setSosCases] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [deletingCaseId, setDeletingCaseId] = useState<string | null>(null);

    useEffect(() => {
        const fetchSosCases = async () => {
            try {
                setLoading(true);
                const response = await sosService.getSosCases({ limit: 100 });
                // Response format từ backend: { success: true, data: [...], pagination: {...} }
                // response đã là response.data từ axios, nên cần kiểm tra response.data hoặc response
                const cases = (response && response.data) ? response.data : (Array.isArray(response) ? response : []);
                console.log('SOS Management - Full response:', response);
                console.log('SOS Management - Fetched cases:', cases);
                setSosCases(cases);
            } catch (error) {
                console.error('Error fetching SOS cases:', error);
            } finally {
                setLoading(false);
            }
        };
        fetchSosCases();
    }, []);

    const activeCases = sosCases.filter(c => !['RESOLVED', 'CANCELLED'].includes(c.status));
    const completedCases = sosCases.filter(c => ['RESOLVED', 'CANCELLED'].includes(c.status));

    const handleDeleteCase = async (sosCase: any) => {
        const caseId = sosCase.code || sosCase._id || sosCase.id;
        const caseCode = sosCase.code || 'Unknown';
        
        // Xác nhận trước khi xóa
        const confirmed = window.confirm(
            `Bạn có chắc chắn muốn XÓA VĨNH VIỄN case SOS "${caseCode}"?\n\n` +
            `Lưu ý: Hành động này không thể hoàn tác. Case sẽ bị xóa hoàn toàn khỏi hệ thống.`
        );

        if (!confirmed) {
            return;
        }

        try {
            setDeletingCaseId(caseId);
            await sosService.deleteSosCase(caseId);
            
            // Xóa case khỏi danh sách
            setSosCases(prevCases => prevCases.filter(c => {
                const cId = c.code || c._id || c.id;
                return cId !== caseId;
            }));

            alert(`Case SOS "${caseCode}" đã được xóa thành công.`);
        } catch (error: any) {
            console.error('Error deleting SOS case:', error);
            const errorMessage = error?.response?.data?.message || error?.message || 'Có lỗi xảy ra khi xóa case';
            alert(`Lỗi: ${errorMessage}`);
        } finally {
            setDeletingCaseId(null);
        }
    };
    
    if (loading) {
        return (
            <div className="p-8">
                <h1 className="text-3xl font-bold text-white mb-8">Quản lý ca SOS</h1>
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-400">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-white mb-8">Quản lý ca SOS</h1>
            <div className="mb-6 border-b border-gray-700">
                <nav className="flex space-x-4">
                    <button onClick={() => setActiveTab('active')} className={`py-2 px-4 text-sm font-medium ${activeTab === 'active' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}>
                        Đang hoạt động ({activeCases.length})
                    </button>
                    <button onClick={() => setActiveTab('completed')} className={`py-2 px-4 text-sm font-medium ${activeTab === 'completed' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}>
                        Đã hoàn thành ({completedCases.length})
                    </button>
                </nav>
            </div>
            
            <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                 {activeTab === 'active' ? (
                     <SOSTable 
                         cases={activeCases} 
                         onSelectCase={setSelectedCase} 
                         onDeleteCase={handleDeleteCase}
                         deletingCaseId={deletingCaseId}
                     />
                 ) : (
                     <SOSTable 
                         cases={completedCases} 
                         onSelectCase={setSelectedCase} 
                         onDeleteCase={handleDeleteCase}
                         deletingCaseId={deletingCaseId}
                     />
                 )}
            </div>

            {selectedCase && <SOSDetailModal sosCase={selectedCase} onClose={() => setSelectedCase(null)} />}
        </div>
    );
};

export default SOSManagement;
