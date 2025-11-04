
import React, { useState, useEffect } from 'react';
import { CommunityPost, ApprovalStatus } from '../types';
import { CheckCircleIcon, XCircleIcon } from './icons';
import { articleService } from '../services/articleService';
import { mapBackendArticleToCommunityPost } from '../utils/articleMapper';

const RejectModal: React.FC<{ post: CommunityPost, onClose: () => void, onConfirm: (id: string, reason: string) => void }> = ({ post, onClose, onConfirm }) => {
    const [reason, setReason] = useState('');
    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 m-4">
                <h2 className="text-xl font-bold text-white mb-4">Lý do từ chối bài viết</h2>
                <p className="text-sm text-gray-400 mb-4">Cung cấp lý do sẽ giúp người dùng hiểu và cải thiện bài đăng sau này.</p>
                <textarea
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    className="w-full p-2 bg-gray-900 border border-gray-600 rounded-md text-white focus:ring-red-500 focus:border-red-500"
                    rows={4}
                    placeholder="Ví dụ: Nội dung không phù hợp, thiếu thông tin xác thực..."
                />
                <div className="mt-6 flex justify-end gap-4">
                    <button onClick={onClose} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors">Hủy</button>
                    <button 
                        onClick={() => onConfirm(post.id, reason)}
                        disabled={!reason.trim()}
                        className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors disabled:opacity-50"
                    >
                        Xác nhận
                    </button>
                </div>
            </div>
        </div>
    );
};


const CommunityManagement: React.FC = () => {
    const [posts, setPosts] = useState<CommunityPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [postToReject, setPostToReject] = useState<CommunityPost | null>(null);

    useEffect(() => {
        fetchCommunityPosts();
    }, []);

    const fetchCommunityPosts = async () => {
        try {
            setLoading(true);
            const response = await articleService.getArticles({
                category: 'COMMUNITY',
                status: 'PENDING',
            });
            const mappedPosts = (response.data || []).map((a: any) => mapBackendArticleToCommunityPost(a));
            setPosts(mappedPosts);
        } catch (error) {
            console.error('Error fetching community posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleRejectConfirm = async (id: string, reason: string) => {
        try {
            await articleService.rejectArticle(id, reason);
            await fetchCommunityPosts();
            setPostToReject(null);
        } catch (error) {
            console.error('Error rejecting post:', error);
        }
    };

    const handleApprove = async (id: string) => {
        try {
            await articleService.approveArticle(id);
            await fetchCommunityPosts();
        } catch (error) {
            console.error('Error approving post:', error);
        }
    };

    const pendingPosts = posts.filter(p => p.status === ApprovalStatus.PENDING);

    if (loading && posts.length === 0) {
        return (
            <div className="p-8">
                <h1 className="text-3xl font-bold text-white mb-2">Quản lý Cộng đồng</h1>
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-400">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <h1 className="text-3xl font-bold text-white mb-2">Quản lý Cộng đồng</h1>
            <p className="text-gray-400 mb-8">Duyệt các bài viết do người dùng đóng góp để hiển thị trên Bức tường Cộng đồng.</p>

            {pendingPosts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {pendingPosts.map(post => (
                        <div key={post.id} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col">
                            {post.imageUrl && <img src={post.imageUrl} alt="Post content" className="w-full h-48 object-cover" />}
                            <div className="p-6 flex-grow flex flex-col">
                                <div className="flex items-center mb-4">
                                    <img src={post.author.avatar} alt={post.author.name} className="w-10 h-10 rounded-full mr-3" />
                                    <div>
                                        <p className="font-semibold text-white">{post.author.name}</p>
                                        <p className="text-xs text-gray-400">{new Date(post.timestamp).toLocaleString()}</p>
                                    </div>
                                </div>
                                <p className="text-gray-300 text-sm mb-4 flex-grow">{post.content}</p>
                                <div className="mt-auto pt-4 border-t border-gray-700 flex justify-end gap-3">
                                    <button
                                        onClick={() => setPostToReject(post)}
                                        className="flex items-center gap-2 text-sm px-4 py-2 bg-red-600/20 text-red-400 rounded-md hover:bg-red-600/40 transition-colors"
                                    >
                                        <XCircleIcon className="w-5 h-5" /> Từ chối
                                    </button>
                                    <button
                                        onClick={() => handleApprove(post.id)}
                                        className="flex items-center gap-2 text-sm px-4 py-2 bg-green-600/20 text-green-400 rounded-md hover:bg-green-600/40 transition-colors"
                                    >
                                        <CheckCircleIcon className="w-5 h-5" /> Duyệt
                                    </button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="flex flex-col items-center justify-center text-center bg-gray-800 rounded-lg p-16">
                    <CheckCircleIcon className="w-16 h-16 text-green-500 mb-4" />
                    <h2 className="text-xl font-semibold text-white">Đã duyệt hết!</h2>
                    <p className="text-gray-400 mt-2">Không có bài viết nào đang chờ duyệt.</p>
                </div>
            )}
            
            {postToReject && <RejectModal post={postToReject} onClose={() => setPostToReject(null)} onConfirm={handleRejectConfirm} />}
        </div>
    );
};

export default CommunityManagement;
