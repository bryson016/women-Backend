/** Citizen controller — thin HTTP layer over `citizenService`. */
const { asyncHandler } = require('../utils/asyncHandler');
const citizenService = require('../services/citizenService');

const dashboard = asyncHandler(async (req, res) => {
  console.log('[CITIZEN] Dashboard request');
  res.json(citizenService.dashboard());
});

const complaints = asyncHandler(async (req, res) => {
  console.log('[CITIZEN] Get complaints');
  res.json(citizenService.complaints());
});

const complaintDetails = asyncHandler(async (req, res) => {
  console.log('[CITIZEN] Get complaint details:', req.params.id);
  res.json(citizenService.complaintDetails(req.params.id));
});

const submitComplaint = asyncHandler(async (req, res) => {
  console.log('[CITIZEN] Submit complaint by:', req.user.username);
  const result = citizenService.submitComplaint(req.body, req.user.id);
  res.status(201).json(result);
});

const complaintAttachments = asyncHandler(async (req, res) => {
  console.log('[CITIZEN] Get complaint attachments:', req.params.id);
  res.json(citizenService.complaintAttachments());
});

const uploadComplaintAttachment = asyncHandler(async (req, res) => {
  console.log('[CITIZEN] Upload complaint attachment:', req.params.id);
  res.json(citizenService.uploadComplaintAttachment());
});

const projects = asyncHandler(async (req, res) => {
  console.log('[CITIZEN] Get projects');
  res.json(citizenService.projects());
});

const meetings = asyncHandler(async (req, res) => {
  console.log('[CITIZEN] Get meetings');
  res.json(citizenService.meetings());
});

const announcements = asyncHandler(async (req, res) => {
  console.log('[CITIZEN] Get announcements');
  res.json(citizenService.announcements());
});

const notifications = asyncHandler(async (req, res) => {
  console.log('[CITIZEN] Get notifications');
  res.json(citizenService.notifications());
});

const markNotificationRead = asyncHandler(async (req, res) => {
  console.log('[CITIZEN] Mark notification read:', req.params.id);
  res.json(citizenService.markNotificationRead());
});

const markAllNotificationsRead = asyncHandler(async (req, res) => {
  console.log('[CITIZEN] Mark all notifications read');
  res.json(citizenService.markAllNotificationsRead());
});

const events = asyncHandler(async (req, res) => {
  console.log('[CITIZEN] Get events');
  res.json(citizenService.events());
});

const applications = asyncHandler(async (req, res) => {
  console.log('[CITIZEN] Get applications');
  res.json(citizenService.applications());
});

const programs = asyncHandler(async (req, res) => {
  console.log('[CITIZEN] Get programs');
  res.json(citizenService.programs());
});

const publicParticipation = asyncHandler(async (req, res) => {
  console.log('[CITIZEN] Get public participation');
  res.json(citizenService.publicParticipation());
});

const submitFeedback = asyncHandler(async (req, res) => {
  console.log('[CITIZEN] Submit feedback by:', req.user.username);
  res.json(citizenService.submitFeedback());
});

const chatMessages = asyncHandler(async (req, res) => {
  console.log('[CITIZEN] Get chat messages');
  res.json(citizenService.chatMessages());
});

const sendChatMessage = asyncHandler(async (req, res) => {
  console.log('[CITIZEN] Send chat message by:', req.user.username);
  res.json(citizenService.sendChatMessage());
});

const notificationSettings = asyncHandler(async (req, res) => {
  console.log('[CITIZEN] Get notification settings');
  res.json(citizenService.notificationSettings());
});

const updateNotificationSettings = asyncHandler(async (req, res) => {
  console.log('[CITIZEN] Update notification settings');
  res.json(citizenService.updateNotificationSettings(req.body));
});

const updateDeviceToken = asyncHandler(async (req, res) => {
  console.log('[CITIZEN] Update device token');
  res.json(citizenService.updateDeviceToken());
});

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