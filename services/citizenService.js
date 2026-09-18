/**
 * Citizen service — dashboard, complaints, projects, meetings, announcements,
 * notifications, events, applications, programs, feedback, chat and settings.
 * Response shapes are preserved exactly as the mobile app consumes them.
 */
const { store, nextId } = require('../database/store');
const { ApiError } = require('../utils/asyncHandler');

function dashboard() {
  return {
    dashboard: store.dashboardData,
    userstats: {
      totalComplaints: store.complaints.length,
      totalProjects: store.projects.length,
      totalEvents: store.events.length,
    },
  };
}

function complaints() {
  return { complaints: store.complaints.slice() };
}

function complaintDetails(id) {
  const complaint = store.complaints.find((c) => c.id === parseInt(id, 10));
  if (!complaint) {
    throw new ApiError(404, 'Complaint not found');
  }
  return { complaint };
}

function submitComplaint(body, userId) {
  const newComplaint = {
    id: nextId(store.complaints),
    ...(body && typeof body === 'object' ? body : {}),
    userId,
    status: 'Pending',
    createdAt: new Date().toISOString(),
    code: `CMP-${Date.now().toString(36).toUpperCase()}`,
  };
  store.complaints.push(newComplaint);
  return {
    message: 'Complaint submitted successfully',
    complaintId: newComplaint.id,
    complaintCode: newComplaint.code,
  };
}

function complaintAttachments() {
  return { attachments: [] };
}

function uploadComplaintAttachment() {
  return { message: 'Attachment uploaded successfully', attachment: { id: 1, name: 'document.pdf' } };
}

function projects() {
  return { projects: store.projects.slice() };
}

function meetings() {
  return { meetings: [] };
}

function announcements() {
  return { announcements: store.announcements.slice() };
}

function notifications() {
  return { notifications: store.notifications.slice(), unreadCount: 0 };
}

function markNotificationRead() {
  return { message: 'Notification marked as read' };
}

function markAllNotificationsRead() {
  return { message: 'All notifications marked as read' };
}

function events() {
  return { events: store.events.slice() };
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