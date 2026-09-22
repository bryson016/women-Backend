/**
 * Admin controller.
 * Every route using these handlers is guarded by `requireRole('admin')`,
 * so citizen tokens can never reach them.
 */
const { asyncHandler } = require('../utils/asyncHandler');
const adminService = require('../services/adminService');

const listUsers = asyncHandler(async (req, res) => {
  console.log('[ADMIN] List users by:', req.user.username);
  res.json({ success: true, ...(await adminService.listUsers()) });
});

const listApplications = asyncHandler(async (req, res) => {
  console.log('[ADMIN] List all applications by:', req.user.username);
  res.json({ success: true, ...(await adminService.listApplications()) });
});

const updateApplicationStatus = asyncHandler(async (req, res) => {
  console.log('[ADMIN] Update application:', req.params.id, 'by:', req.user.username);
  const { status } = req.body || {};
  res.json({ success: true, ...(await adminService.updateApplicationStatus(req.params.id, status)) });
});

const listComplaints = asyncHandler(async (req, res) => {
  console.log('[ADMIN] List all complaints by:', req.user.username);
  res.json({ success: true, ...(await adminService.listComplaints()) });
});

module.exports = { listUsers, listApplications, updateApplicationStatus, listComplaints };