import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  }
});

// Helper to get cookie by name
function getCookie(name) {
  let cookieValue = null;
  if (document.cookie && document.cookie !== '') {
    const cookies = document.cookie.split(';');
    for (let i = 0; i < cookies.length; i++) {
      const cookie = cookies[i].trim();
      if (cookie.substring(0, name.length + 1) === (name + '=')) {
        cookieValue = decodeURIComponent(cookie.substring(name.length + 1));
        break;
      }
    }
  }
  return cookieValue;
}

// Request interceptor to attach CSRF token
api.interceptors.request.use((config) => {
  const csrfToken = getCookie('csrftoken');
  if (csrfToken) {
    config.headers['X-CSRFToken'] = csrfToken;
  }
  return config;
}, (error) => Promise.reject(error));

export const initCSRF = async () => {
  try {
    const res = await api.get('/auth/csrf/');
    return res.data.csrfToken;
  } catch (err) {
    console.warn('CSRF init warning:', err);
    return null;
  }
};

// Authentication Services
export const authService = {
  login: (credentials) => api.post('/auth/login/', credentials),
  logout: () => api.post('/auth/logout/'),
  me: () => api.get('/auth/me/'),
  registerStudent: (data) => api.post('/auth/register/student/', data),
  registerTeacher: (data) => api.post('/auth/register/teacher/', data),
  updateProfile: (data) => api.patch('/auth/profile/update/', data),
  getTeachersDirectory: () => api.get('/auth/teachers/directory/'),

  // Admin User & Teacher Management
  getPendingTeachers: () => api.get('/auth/admin/teachers/pending/'),
  approveTeacher: (id, data = {}) => api.post(`/auth/admin/teachers/${id}/approve/`, data),
  rejectTeacher: (id) => api.post(`/auth/admin/teachers/${id}/reject/`),
  getAllUsers: (params) => api.get('/auth/admin/users/', { params }),
  toggleUserStatus: (id, status) => api.post(`/auth/admin/users/${id}/toggle-status/`, { status }),
  getTeacherCodes: () => api.get('/auth/admin/teacher-codes/'),
  createTeacherCode: (data) => api.post('/auth/admin/teacher-codes/', data),
};

// Classroom Services
export const classroomService = {
  getClassrooms: () => api.get('/classrooms/'),
  getClassroomDetail: (id) => api.get(`/classrooms/${id}/`),
  createClassroom: (data) => api.post('/classrooms/', data),
  getPositions: () => api.get('/classrooms/positions/'),
  getCommittees: () => api.get('/classrooms/committees/'),
  getPositionRequests: (params) => api.get('/classrooms/position-requests/', { params }),
  reviewPositionRequest: (id, action, notes) => api.post(`/classrooms/position-requests/${id}/review/`, { action, notes }),
};

// Points & Coins Services
export const pointsService = {
  addPoints: (data) => api.post('/points/add/', data),
  deductPoints: (data) => api.post('/points/deduct/', data),
  awardCoins: (data) => api.post('/points/coins/award/', data),
  adminAdjustment: (data) => api.post('/points/adjustment/', data),
  getPointsHistory: (studentId) => studentId ? api.get(`/points/history/${studentId}/`) : api.get('/points/history/'),
  getCoinsHistory: (studentId) => studentId ? api.get(`/points/coins/history/${studentId}/`) : api.get('/points/coins/history/'),
  getActivityFeed: (params) => api.get('/points/activity/', { params }),
};

// Gamification Services
export const gamificationService = {
  getLeaderboard: (params) => api.get('/gamification/leaderboard/', { params }),
  getAchievements: () => api.get('/gamification/achievements/'),
  awardAchievement: (data) => api.post('/gamification/achievements/award/', data),
  getLevels: () => api.get('/gamification/levels/'),
};

// Challenges Services
export const challengeService = {
  getChallenges: (params) => api.get('/challenges/', { params }),
  getChallengeDetail: (id) => api.get(`/challenges/${id}/`),
  createChallenge: (data) => api.post('/challenges/', data),
  joinChallenge: (id) => api.post(`/challenges/${id}/join/`),
  completeChallenge: (id, studentId) => api.post(`/challenges/${id}/complete/`, { student_id: studentId }),
};

// Notification Services
export const notificationService = {
  getNotifications: () => api.get('/notifications/'),
  markRead: (id) => api.post(`/notifications/${id}/read/`),
  markAllRead: () => api.post('/notifications/read-all/'),
};

// Audit Services
export const auditService = {
  getAuditLogs: (params) => api.get('/audit/logs/', { params }),
};

// Reports Services
export const reportService = {
  getAnalyticsSummary: (params) => api.get('/reports/summary/', { params }),
  getCSVUrl: (classroomId) => classroomId ? `/api/reports/export/csv/?classroom_id=${classroomId}` : '/api/reports/export/csv/',
  getPDFUrl: (classroomId) => classroomId ? `/api/reports/export/pdf/?classroom_id=${classroomId}` : '/api/reports/export/pdf/',
};

export default api;
