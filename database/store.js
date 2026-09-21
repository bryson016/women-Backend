/**
 * Data store (development).
 *
 * Collections mirror the previous single-file server exactly. All access must
 * go through the service layer (`backend/services/*`) so this module can be
 * swapped for Prisma/PostgreSQL later without touching routes or controllers.
 *
 * NOTE: storage is in-memory at runtime. When DATABASE_URL is provided,
 * `database/persistence.js` restores the latest snapshot on boot and saves
 * every write, so data survives restarts/redeploys (required in production —
 * without it all accounts vanish and login fails with "Invalid credentials").
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

/**
 * Next id for a collection: highest existing id + 1.
 *
 * (Previously `length + 1`, which produced duplicate ids once any item had
 * been deleted — e.g. users [id=2] after deleting id=1 would assign id=2
 * again, breaking auth lookups by id. With persistence this becomes a real
 * risk, so ids are now derived from the max existing id.)
 */
function nextId(collection) {
  let max = 0;
  for (const item of collection) {
    const id = Number(item && item.id) || 0;
    if (id > max) max = id;
  }
  return max + 1;
}

module.exports = { store, nextId };