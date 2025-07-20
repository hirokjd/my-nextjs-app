// Simple in-memory cache for dashboard data
class DashboardCache {
  constructor() {
    this.cache = new Map();
    this.timeouts = new Map();
  }

  // Set cache with expiration time (default: 5 minutes)
  set(key, data, ttl = 5 * 60 * 1000) {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl
    });

    // Clear existing timeout
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
    }

    // Set new timeout
    const timeout = setTimeout(() => {
      this.delete(key);
    }, ttl);

    this.timeouts.set(key, timeout);
  }

  // Get cached data
  get(key) {
    const item = this.cache.get(key);
    if (!item) return null;

    // Check if expired
    if (Date.now() - item.timestamp > item.ttl) {
      this.delete(key);
      return null;
    }

    return item.data;
  }

  // Delete cache entry
  delete(key) {
    this.cache.delete(key);
    if (this.timeouts.has(key)) {
      clearTimeout(this.timeouts.get(key));
      this.timeouts.delete(key);
    }
  }

  // Clear all cache
  clear() {
    this.cache.clear();
    this.timeouts.forEach(timeout => clearTimeout(timeout));
    this.timeouts.clear();
  }

  // Get cache size
  size() {
    return this.cache.size;
  }

  // Check if key exists and is valid
  has(key) {
    return this.get(key) !== null;
  }
}

// Create singleton instance
const dashboardCache = new DashboardCache();

// Cache keys
export const CACHE_KEYS = {
  DASHBOARD_STATS: 'dashboard_stats',
  UPCOMING_EXAMS: 'upcoming_exams',
  RECENT_ACTIVITY: 'recent_activity',
  STUDENTS_COUNT: 'students_count',
  EXAMS_COUNT: 'exams_count',
  QUESTIONS_COUNT: 'questions_count',
  COURSES_COUNT: 'courses_count'
};

export default dashboardCache; 