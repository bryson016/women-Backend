/** Bursary controller — every action is scoped to the authenticated user. */
const { asyncHandler } = require('../utils/asyncHandler');
const bursaryService = require('../services/bursaryService');

const apply = asyncHandler(async (req, res) => {
  console.log('[BURSARY] Apply for bursary by:', req.user.username);
  const result = await bursaryService.apply(req.body, req.user.id);
  console.log('[BURSARY] Application submitted:', result.application.applicationCode);
  res.status(201).json(result);
});

const myApplications = asyncHandler(async (req, res) => {
  console.log('[BURSARY] Get my applications for:', req.user.username);
  res.json(await bursaryService.myApplications(req.user.id));
});

const myApplication = asyncHandler(async (req, res) => {
  console.log('[BURSARY] Get application:', req.params.id);
  res.json(await bursaryService.myApplication(req.params.id, req.user.id));
});

const withdraw = asyncHandler(async (req, res) => {
  console.log('[BURSARY] Withdraw application:', req.params.id);
  res.json(await bursaryService.withdraw(req.params.id, req.user.id));
});

const remove = asyncHandler(async (req, res) => {
  console.log('[BURSARY] Delete application:', req.params.id);
  res.json(await bursaryService.remove(req.params.id, req.user.id));
});

const history = asyncHandler(async (req, res) => {
  console.log('[BURSARY] Get application history:', req.params.id);
  res.json(await bursaryService.history(req.params.id, req.user.id));
});

module.exports = { apply, myApplications, myApplication, withdraw, remove, history };