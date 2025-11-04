import { VolunteerApplication, VolunteerType, ApprovalStatus } from '../types';

export const mapBackendVolunteerToFrontend = (backendVolunteer: any): VolunteerApplication => {
  const user = backendVolunteer.userId || {};
  const idCardFront = backendVolunteer.idCardFront?.url || backendVolunteer.idCardFront || '';
  const idCardBack = backendVolunteer.idCardBack?.url || backendVolunteer.idCardBack || '';
  
  return {
    id: backendVolunteer._id || backendVolunteer.id,
    name: user.fullName || user.name || 'Unknown',
    type: backendVolunteer.type === 'CN' ? VolunteerType.INDIVIDUAL : VolunteerType.ORGANIZATION,
    submissionDate: backendVolunteer.createdAt || backendVolunteer.submissionDate || new Date().toISOString(),
    status: backendVolunteer.status === 'PENDING' ? ApprovalStatus.PENDING :
            backendVolunteer.status === 'APPROVED' ? ApprovalStatus.APPROVED :
            ApprovalStatus.REJECTED,
    details: {
      phone: user.phone || '',
      address: backendVolunteer.homeBase?.address || user.address || '',
      idCardUrlFront: idCardFront,
      idCardUrlBack: idCardBack,
      skills: backendVolunteer.skills || [],
      organizationDocsUrl: backendVolunteer.organization?.legalDoc?.url || backendVolunteer.organization?.legalDoc || undefined,
      reason: backendVolunteer.reviewNotes || undefined,
    },
  };
};

