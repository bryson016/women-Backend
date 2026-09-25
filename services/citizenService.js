/**
 * Citizen service — dashboard, complaints, projects, meetings, announcements,
 * notifications, events, applications, programs, feedback, chat and settings.
 * Migrated to Prisma/PostgreSQL. Response shapes preserved exactly as the
 * mobile app consumes them.
 */
const { prisma } = require('../prisma/client');
const { ApiError } = require('../utils/asyncHandler');

async function dashboard(userId) {
  const [totalComplaints, totalProjects, totalEvents] = await Promise.all([
    prisma.complaint.count({ where: { userId } }),
    prisma.project.count(),
    prisma.event.count(),
  ]);
  return {
    dashboard: {
      totalComplaints: 0,
      totalProjects: 0,
      totalEvents: 0,
      totalBursaryApps: 0,
      recentActivities: [],
    },
    userstats: {
      totalComplaints,
      totalProjects,
      totalEvents,
    },
  };
}

async function complaints(userId) {
  const rows = await prisma.complaint.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
  });
  return { complaints: rows };
}

async function complaintDetails(id, userId) {
  const complaint = await prisma.complaint.findFirst({
    where: { id: parseInt(id, 10), userId },
  });
  if (!complaint) {
    throw new ApiError(404, 'Complaint not found');
  }
  return { complaint };
}

async function submitComplaint(body, userId) {
  const formData = body && typeof body === 'object' ? body : {};
  const category = String(formData.category || '').trim();
  const description = String(formData.description || '').trim();
  const village = String(formData.village || '').trim();
  if (!category || !description || !village) {
    throw new ApiError(400, 'Category, description, and location are required.');
  }

  const newComplaint = await prisma.complaint.create({
    data: {
      userId,
      category,
      priority: String(formData.priority || 'Normal').trim() || 'Normal',
      description,
      village,
      status: 'Pending',
      code: `CMP-${Date.now().toString(36).toUpperCase()}`,
    },
  });
  return {
    message: 'Complaint submitted successfully',
    complaintId: newComplaint.id,
    complaintCode: newComplaint.code,
    complaint: newComplaint,
  };
}

function complaintAttachments() {
  return { attachments: [] };
}

function uploadComplaintAttachment() {
  return { message: 'Attachment uploaded successfully', attachment: { id: 1, name: 'document.pdf' } };
}

async function projects() {
  const rows = await prisma.project.findMany({ orderBy: { createdAt: 'desc' } });
  return { projects: rows };
}

function meetings() {
  return { meetings: [] };
}

async function announcements() {
  const rows = await prisma.announcement.findMany({ orderBy: { createdAt: 'desc' } });
  return { announcements: rows };
}

async function notifications() {
  const rows = await prisma.notification.findMany({ orderBy: { createdAt: 'desc' } });
  const unreadCount = await prisma.notification.count({ where: { isRead: false } });
  return { notifications: rows, unreadCount };
}

async function markNotificationRead(id) {
  const numericId = parseInt(id, 10);
  if (!Number.isNaN(numericId)) {
    await prisma.notification.updateMany({
      where: { id: numericId },
      data: { isRead: true },
    });
  }
  return { message: 'Notification marked as read' };
}

async function markAllNotificationsRead() {
  await prisma.notification.updateMany({
    where: { isRead: false },
    data: { isRead: true },
  });
  return { message: 'All notifications marked as read' };
}

async function events() {
  const rows = await prisma.event.findMany({ orderBy: { createdAt: 'desc' } });
  return { events: rows };
}

function applications() {
  return { applications: [] };
}

function programs() {
  return { programs: [] };
}

function publicParticipation() {
  return { publicParticipation: [] };
}

function submitFeedback() {
  return { message: 'Feedback submitted successfully' };
}

function chatMessages() {
  return { messages: [] };
}

function sendChatMessage() {
  return { message: 'Message sent successfully' };
}

function notificationSettings() {
  return { settings: { pushNotifications: true, emailNotifications: true, smsNotifications: false } };
}

function updateNotificationSettings(body) {
  return { message: 'Notification settings updated', settings: body && body.settings };
}

function updateDeviceToken() {
  return { message: 'Device token updated successfully' };
}

module.exports = {
  dashboard,
  complaints,
  complaintDetails,
  submitComplaint,
  complaintAttachments,
  uploadComplaintAttachment,
  projects,
  meetings,
  announcements,
  notifications,
  markNotificationRead,
  markAllNotificationsRead,
  events,
  applications,
  programs,
  publicParticipation,
  submitFeedback,
  chatMessages,
  sendChatMessage,
  notificationSettings,
  updateNotificationSettings,
  updateDeviceToken,
};