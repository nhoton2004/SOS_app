import { CommunityPost, BlogPost, ApprovalStatus } from '../types';
import { mapBackendUserToFrontendUser } from './userMapper';

export const mapBackendArticleToCommunityPost = (article: any): CommunityPost => {
  return {
    id: article._id || article.id,
    author: mapBackendUserToFrontendUser(article.author || {}),
    content: article.content || '',
    imageUrl: article.images?.url || article.images || undefined,
    timestamp: article.createdAt || article.publishedAt || new Date().toISOString(),
    status: article.status === 'PENDING' ? ApprovalStatus.PENDING :
            article.status === 'APPROVED' ? ApprovalStatus.APPROVED :
            ApprovalStatus.REJECTED,
  };
};

export const mapBackendArticleToBlogPost = (article: any): BlogPost => {
  return {
    id: article._id || article.id,
    title: article.title || '',
    content: article.content || '',
    imageUrl: article.images?.url || article.images || 'https://picsum.photos/800/400',
    author: mapBackendUserToFrontendUser(article.author || {}),
    publishedDate: article.publishedAt || article.createdAt || new Date().toISOString(),
  };
};

