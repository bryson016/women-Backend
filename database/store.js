/**
 * Data store (development).
 *
 * Collections mirror the previous single-file server exactly. All access must
 * go through the service layer (`backend/services/*`) so this module can be
 * swapped for Prisma/PostgreSQL later without touching routes or controllers.
 *
 * NOTE: storage is in-memory and resets on server restart (unchanged
 * behavior). A persistent database is a required step before deployment.
 */
const store = {
  users: [],
  complaints: [],
  announcements: [],
  notifications: [],
  projects: [],
  events: [],
  bursaryApplications: [],
  dashboardData: {
    totalComplaints: 0,
    totalProjects: 0,
    totalEvents: 0,
    totalBursaryApps: 0,
    recentActivities: [],
  },
};

/** Next id for a collection (same strategy as before: length + 1). */
function nextId(collection) {
  return collection.length + 1;
}

module.exports = { store, nextId };