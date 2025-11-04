import React, { useState, useEffect } from 'react';
import { BlogPost, User } from '../types';
import { useSelector } from 'react-redux';
import { selectUser } from '../store/authSlice';
import { articleService } from '../services/articleService';
import { mapBackendArticleToBlogPost } from '../utils/articleMapper';
import { mapBackendUserToFrontendUser } from '../utils/userMapper';

const BlogFormModal: React.FC<{
    post: BlogPost | null;
    onClose: () => void;
    onSave: () => void;
    adminUser: User;
}> = ({ post, onClose, onSave, adminUser }) => {
    const [title, setTitle] = useState(post?.title || '');
    const [content, setContent] = useState(post?.content || '');
    const [imageFile, setImageFile] = useState<File | null>(null);
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        try {
            if (post?.id) {
                await articleService.updateArticle(post.id, {
                    title,
                    content,
                    category: 'BLOG',
                    status: 'APPROVED',
                }, imageFile || undefined);
            } else {
                await articleService.createArticle({
                    title,
                    content,
                    category: 'BLOG',
                    status: 'APPROVED',
                }, imageFile || undefined);
            }
            onSave();
            onClose();
        } catch (error) {
            console.error('Error saving blog post:', error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl p-8 m-4 max-h-[90vh] overflow-y-auto">
                <h2 className="text-2xl font-bold text-white mb-6">{post ? 'Chỉnh sửa bài viết' : 'Tạo bài viết mới'}</h2>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="title" className="block text-sm font-medium text-gray-300">Tiêu đề</label>
                        <input
                            type="text"
                            id="title"
                            value={title}
                            onChange={(e) => setTitle(e.target.value)}
                            required
                            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div>
                        <label htmlFor="image" className="block text-sm font-medium text-gray-300">Hình ảnh</label>
                        <input
                            type="file"
                            id="image"
                            accept="image/*"
                            onChange={(e) => setImageFile(e.target.files?.[0] || null)}
                            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        {post?.imageUrl && !imageFile && (
                            <img src={post.imageUrl} alt="Current" className="mt-2 w-32 h-32 object-cover rounded" />
                        )}
                    </div>
                    <div>
                        <label htmlFor="content" className="block text-sm font-medium text-gray-300">Nội dung</label>
                        <textarea
                            id="content"
                            rows={10}
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            required
                            className="mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                    </div>
                    <div className="flex justify-end gap-4 pt-4">
                        <button type="button" onClick={onClose} disabled={loading} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors disabled:opacity-50">Hủy</button>
                        <button type="submit" disabled={loading} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors disabled:opacity-50">{loading ? 'Đang lưu...' : 'Lưu bài viết'}</button>
                    </div>
                </form>
            </div>
        </div>
    );
};

const BlogManagement: React.FC = () => {
    const adminUser = useSelector(selectUser);
    const [posts, setPosts] = useState<BlogPost[]>([]);
    const [loading, setLoading] = useState(true);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingPost, setEditingPost] = useState<BlogPost | null>(null);
    const [postToDelete, setPostToDelete] = useState<BlogPost | null>(null);
    const [searchTerm, setSearchTerm] = useState('');

    useEffect(() => {
        fetchBlogPosts();
    }, []);

    const fetchBlogPosts = async () => {
        try {
            setLoading(true);
            const response = await articleService.getArticles({
                category: 'BLOG',
            });
            const mappedPosts = (response.data || []).map((a: any) => mapBackendArticleToBlogPost(a));
            setPosts(mappedPosts);
        } catch (error) {
            console.error('Error fetching blog posts:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleEdit = (post: BlogPost) => {
        setEditingPost(post);
        setIsModalOpen(true);
    };

    const handleCreate = () => {
        setEditingPost(null);
        setIsModalOpen(true);
    };
    
    const confirmDelete = async () => {
        if(postToDelete) {
            try {
                await articleService.deleteArticle(postToDelete.id);
                setPostToDelete(null);
                await fetchBlogPosts();
            } catch (error) {
                console.error('Error deleting post:', error);
            }
        }
    };

    const handleSave = async () => {
        await fetchBlogPosts();
    };

    const filteredPosts = posts.filter(post => 
        post.title.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (!adminUser) {
        return <div className="p-8 text-white">Loading...</div>;
    }

    const frontendAdminUser = mapBackendUserToFrontendUser(adminUser as any);

    if (loading && posts.length === 0) {
        return (
            <div className="p-8">
                <h1 className="text-3xl font-bold text-white mb-8">Quản lý Blog</h1>
                <div className="flex items-center justify-center h-64">
                    <p className="text-gray-400">Đang tải dữ liệu...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="p-8">
            <div className="flex justify-between items-center mb-8 flex-wrap gap-4">
                <h1 className="text-3xl font-bold text-white">Quản lý Blog</h1>
                <div className="flex items-center gap-4">
                     <input
                        type="text"
                        placeholder="Tìm bài viết theo tiêu đề..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="bg-gray-700 border border-gray-600 rounded-md py-2 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    />
                    <button onClick={handleCreate} className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors whitespace-nowrap">Tạo bài viết mới</button>
                </div>
            </div>

            {filteredPosts.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredPosts.map(post => (
                        <div key={post.id} className="bg-gray-800 rounded-lg shadow-lg overflow-hidden flex flex-col">
                            <img src={post.imageUrl} alt={post.title} className="w-full h-48 object-cover" />
                            <div className="p-6 flex-grow flex flex-col">
                                <h2 className="text-xl font-bold text-white mb-2">{post.title}</h2>
                                <p className="text-xs text-gray-400 mb-4">Đăng ngày {new Date(post.publishedDate).toLocaleDateString()}</p>
                                <p className="text-gray-300 text-sm mb-4 flex-grow overflow-hidden text-ellipsis">{post.content.substring(0, 100)}...</p>
                                <div className="mt-auto pt-4 border-t border-gray-700 flex justify-end gap-3">
                                    <button onClick={() => handleEdit(post)} className="text-sm px-4 py-2 bg-blue-600/20 text-blue-300 rounded-md hover:bg-blue-600/40 transition-colors">Chỉnh sửa</button>
                                    <button onClick={() => setPostToDelete(post)} className="text-sm px-4 py-2 bg-red-600/20 text-red-300 rounded-md hover:bg-red-600/40 transition-colors">Xóa</button>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-16 bg-gray-800 rounded-lg">
                    <p className="text-gray-400">Không tìm thấy bài viết nào phù hợp.</p>
                </div>
            )}


            {isModalOpen && <BlogFormModal post={editingPost} onClose={() => setIsModalOpen(false)} onSave={handleSave} adminUser={frontendAdminUser} />}
            
            {postToDelete && (
                 <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50">
                    <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-md p-6 m-4">
                        <h2 className="text-xl font-bold text-white mb-4">Xác nhận xóa</h2>
                        <p className="text-sm text-gray-300 mb-6">
                            Bạn có chắc chắn muốn xóa bài viết <span className="font-bold text-white">"{postToDelete.title}"</span>?
                        </p>
                        <div className="flex justify-end gap-4">
                            <button onClick={() => setPostToDelete(null)} className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-500 transition-colors">Hủy</button>
                            <button onClick={confirmDelete} className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 transition-colors">Xác nhận Xóa</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default BlogManagement;