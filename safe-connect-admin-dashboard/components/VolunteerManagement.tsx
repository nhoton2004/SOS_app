
import React, { useState, useEffect } from 'react';
import { VolunteerApplication, ApprovalStatus, VolunteerType } from '../types';
import { EyeIcon, CheckCircleIcon, XCircleIcon } from './icons';
import { volunteerService } from '../services/volunteerService';
import { mapBackendVolunteerToFrontend } from '../utils/volunteerMapper';

const statusColorMap: { [key in ApprovalStatus]: string } = {
    [ApprovalStatus.PENDING]: 'bg-yellow-500/20 text-yellow-400',
    [ApprovalStatus.APPROVED]: 'bg-green-500/20 text-green-400',
    [ApprovalStatus.REJECTED]: 'bg-red-500/20 text-red-400',
};

const ApplicationDetailModal: React.FC<{ app: VolunteerApplication; onClose: () => void; onUpdate: (id: string, status: ApprovalStatus, reason?: string) => void; }> = ({ app, onClose, onUpdate }) => {
    const [rejectionReason, setRejectionReason] = useState("");
    const [isRejecting, setIsRejecting] = useState(false);
    const [loading, setLoading] = useState(false);

    const handleReject = async () => {
        if(rejectionReason.trim()){
            setLoading(true);
            try {
                await onUpdate(app.id, ApprovalStatus.REJECTED, rejectionReason);
                onClose();
            } catch (error) {
                console.error('Error rejecting volunteer:', error);
            } finally {
                setLoading(false);
            }
        }
    }

    const handleApprove = async () => {
        setLoading(true);
        try {
            await onUpdate(app.id, ApprovalStatus.APPROVED);
            onClose();
        } catch (error) {
            console.error('Error approving volunteer:', error);
        } finally {
            setLoading(false);
        }
    }
    
    return (
         <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl p-8 m-4 max-h-[90vh] overflow-y-auto">
                <div className="flex justify-between items-center mb-6">
                    <h2 className="text-2xl font-bold text-white">Duyệt hồ sơ Tình nguyện viên</h2>
                    <button onClick={onClose} className="text-gray-400 hover:text-white">&times;</button>
                </div>

                <div className="space-y-4 text-gray-300">
                    <p><strong>Họ tên / Tên tổ chức:</strong> <span className="text-white">{app.name}</span></p>
                    <p><strong>Loại hình:</strong> {app.type}</p>
                    <p><strong>Số điện thoại:</strong> {app.details.phone}</p>
                    <p><strong>Địa chỉ:</strong> {app.details.address}</p>
                    <p><strong>Ngày nộp:</strong> {new Date(app.submissionDate).toLocaleDateString()}</p>
                    <div>
                        <p className="font-semibold text-white mb-2">Kỹ năng:</p>
                        <div className="flex flex-wrap gap-2">
                            {app.details.skills.map(skill => <span key={skill} className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded-full">{skill}</span>)}
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4">
                        <div>
                            <p className="font-semibold text-white mb-2">CCCD/CMND (Mặt trước)</p>
                            <img src={app.details.idCardUrlFront} alt="ID Front" className="w-full h-auto rounded-md border-2 border-gray-600"/>
                        </div>
                        <div>
                            <p className="font-semibold text-white mb-2">CCCD/CMND (Mặt sau)</p>
                            <img src={app.details.idCardUrlBack} alt="ID Back" className="w-full h-auto rounded-md border-2 border-gray-600"/>
                        </div>
                    </div>
                    {app.type === VolunteerType.ORGANIZATION && app.details.organizationDocsUrl && (
                         <div>
                            <p className="font-semibold text-white mb-2">Giấy tờ tổ chức</p>
                            <a href={app.details.organizationDocsUrl} target="_blank" rel="noopener noreferrer" className="text-blue-400 hover:underline">Xem tài liệu</a>
                        </div>
                    )}
                </div>
                
                {app.status === ApprovalStatus.PENDING && !isRejecting && (
                    <div className="mt-8 flex justify-end gap-4">
                        <button onClick={() => setIsRejecting(true)} disabled={loading} className="flex items-center gap-2 px-6 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50">
                            <XCircleIcon className="w-5 h-5"/> Từ chối
                        </button>
                        <button onClick={handleApprove} disabled={loading} className="flex items-center gap-2 px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 transition-colors disabled:opacity-50">
                           <CheckCircleIcon className="w-5 h-5"/> Phê duyệt
                        </button>
                    </div>
                )}
                
                {isRejecting && (
                    <div className="mt-8 p-4 bg-gray-700 rounded-md">
                        <h3 className="font-semibold text-red-400 mb-2">Lý do từ chối</h3>
                        <textarea 
                            value={rejectionReason}
                            onChange={(e) => setRejectionReason(e.target.value)}
                            className="w-full p-2 bg-gray-800 border border-gray-600 rounded-md text-white focus:ring-red-500 focus:border-red-500"
                            rows={3}
                            placeholder="Ví dụ: Ảnh CMND/CCCD bị mờ, vui lòng tải lại..."
                        />
                        <div className="mt-4 flex justify-end gap-4">
                             <button onClick={() => setIsRejecting(false)} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors">Hủy</button>
                             <button onClick={handleReject} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50" disabled={!rejectionReason.trim()}>Xác nhận Từ chối</button>
                        </div>
                    </div>
                )}


            </div>
        </div>
    );
};

const VolunteerTable: React.FC<{applications: VolunteerApplication[], onSelectApp: (app: VolunteerApplication) => void}> = ({ applications, onSelectApp }) => (
     <div className="overflow-x-auto">
        <table className="w-full text-sm text-left text-gray-400">
            <thead className="text-xs text-gray-300 uppercase bg-gray-700">
                <tr>
                    <th scope="col" className="px-6 py-3">Họ tên / Tổ chức</th>
                    <th scope="col" className="px-6 py-3">Loại hình</th>
                    <th scope="col" className="px-6 py-3">Ngày nộp</th>
                    <th scope="col" className="px-6 py-3">Trạng thái</th>
                    <th scope="col" className="px-6 py-3">Hành động</th>
                </tr>
            </thead>
            <tbody>
                {applications.map((app) => (
                    <tr key={app.id} className="bg-gray-800 border-b border-gray-700 hover:bg-gray-600/50">
                        <td className="px-6 py-4 font-medium text-white whitespace-nowrap">{app.name}</td>
                        <td className="px-6 py-4">{app.type}</td>
                        <td className="px-6 py-4">{new Date(app.submissionDate).toLocaleDateString()}</td>
                        <td className="px-6 py-4">
                            <span className={`px-2 py-1 rounded-full text-xs ${statusColorMap[app.status]}`}>{app.status}</span>
                        </td>
                        <td className="px-6 py-4">
                             <button onClick={() => onSelectApp(app)} className="text-blue-400 hover:text-blue-300">
                                <EyeIcon className="w-5 h-5"/>
                            </button>
                        </td>
                    </tr>
                ))}
            </tbody>
        </table>
    </div>
);

const VolunteerManagement: React.FC = () => {
    const [applications, setApplications] = useState<VolunteerApplication[]>([]);
    const [loading, setLoading] = useState(true);
    const [activeTab, setActiveTab] = useState<'pending' | 'all'>('pending');
    const [selectedApp, setSelectedApp] = useState<VolunteerApplication | null>(null);

    useEffect(() => {
        fetchVolunteers();
    }, []);

    const fetchVolunteers = async () => {
        try {
            setLoading(true);
            const response = await volunteerService.getVolunteers();
            const mappedApps = (response.data || []).map((v: any) => mapBackendVolunteerToFrontend(v));
            setApplications(mappedApps);
        } catch (error) {
            console.error('Error fetching volunteers:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateApplication = async (id: string, status: ApprovalStatus, reason?: string) => {
        try {
            if (status === ApprovalStatus.APPROVED) {
                await volunteerService.approveVolunteer(id);
            } else if (status === ApprovalStatus.REJECTED) {
                await volunteerService.rejectVolunteer(id, reason || '');
            }
            await fetchVolunteers();
        } catch (error) {
            console.error('Error updating volunteer application:', error);
            throw error;
        }
    };

    const pendingApps = applications.filter(app => app.status === ApprovalStatus.PENDING);

    if (loading && applications.length === 0) {
        return (
            <div className="p-8">
                <h1 className="text-3xl font-bold text-white mb-8">Quản lý Tình nguyện viên</h1>
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-400">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-white mb-8">Quản lý Tình nguyện viên</h1>
            <div className="mb-6 border-b border-gray-700">
                <nav className="flex space-x-4">
                    <button onClick={() => setActiveTab('pending')} className={`py-2 px-4 text-sm font-medium ${activeTab === 'pending' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}>
                        Chờ duyệt ({pendingApps.length})
                    </button>
                    <button onClick={() => setActiveTab('all')} className={`py-2 px-4 text-sm font-medium ${activeTab === 'all' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}>
                        Tất cả hồ sơ ({applications.length})
                    </button>
                </nav>
            </div>

            <div className="bg-gray-800 rounded-lg shadow-lg p-6">
                 {activeTab === 'pending' ? (
                     <VolunteerTable applications={pendingApps} onSelectApp={setSelectedApp} />
                 ) : (
                     <VolunteerTable applications={applications} onSelectApp={setSelectedApp} />
                 )}
            </div>
            
            {selectedApp && <ApplicationDetailModal app={selectedApp} onClose={() => setSelectedApp(null)} onUpdate={handleUpdateApplication} />}
        </div>
    );
};

export default VolunteerManagement;
