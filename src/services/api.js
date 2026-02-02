/**
 * API Service - Centralized API calls for FraudScore
 * Features:
 * - Automatic token refresh on 401
 * - Mock data fallback for development
 * - Consistent error handling
 * - Auth token management
 */

import mockData from "../data/mock-data.json"

const API_BASE_URL = "http://192.168.0.156:5000/api";

async function fetchWithFallback(endpoint, options = {}, mockDataKey = null) {
  try {
    const url = `${API_BASE_URL}${endpoint}`

    // Default headers
    const defaultOptions = {
      headers: {
        "Content-Type": "application/json",
        ...options.headers,
      },
    }

    // Add auth token if available
    const accessToken = localStorage.getItem("accessToken")
    if (accessToken) {
      defaultOptions.headers.Authorization = `Bearer ${accessToken}`
    }

    // Merge options
    const finalOptions = {
      ...defaultOptions,
      ...options,
      headers: {
        ...defaultOptions.headers,
        ...(options.headers || {}),
      },
    }

    console.log(`📡 [${finalOptions.method || "GET"}] ${endpoint}`)

    const response = await fetch(url, finalOptions)

    // Handle empty responses
    const text = await response.text()
    const data = text ? JSON.parse(text) : {}

    if (!response.ok) {
      // Handle 401 - Token expired
      if (response.status === 401) {
        console.warn("⚠️ Token expired, attempting refresh...")
        const refreshed = await refreshAccessToken()
        if (refreshed) {
          console.log("✅ Token refreshed, retrying request...")
          return fetchWithFallback(endpoint, options, mockDataKey)
        }
        clearTokens()
        throw new Error("Session expired. Please login again.")
      }

      // Handle 403 - Forbidden
      if (response.status === 403) {
        throw new Error("You don't have permission to access this resource")
      }

      // Handle 404 - Not found
      if (response.status === 404) {
        throw new Error(data.message || "Resource not found")
      }

      // Handle 500 - Server error
      if (response.status === 500) {
        throw new Error("Server error. Please try again later.")
      }

      throw new Error(data.message || `API Error: ${response.status}`)
    }

    console.log(`✅ [${response.status}] ${endpoint}`)
    return data

  } catch (error) {
    console.error(`❌ API Error [${endpoint}]:`, error.message)

    // Use mock data as fallback if available
    if (mockDataKey && mockData[mockDataKey]) {
      console.log(`📦 Using mock data for: ${endpoint}`)
      return mockData[mockDataKey]
    }

    throw error
  }
}

// ============ TOKEN MANAGEMENT ============

/**
 * Set access token in localStorage
 */
function setAuthToken(accessToken) {
  localStorage.setItem("accessToken", accessToken)
  console.log("✅ Access token saved")
}

/**
 * Set refresh token in localStorage
 */
function setRefreshToken(refreshToken) {
  localStorage.setItem("refreshToken", refreshToken)
  console.log("✅ Refresh token saved")
}

/**
 * Get access token from localStorage
 */
function getAccessToken() {
  return localStorage.getItem("accessToken")
}

/**
 * Get refresh token from localStorage
 */
function getRefreshToken() {
  return localStorage.getItem("refreshToken")
}

/**
 * Clear all tokens from localStorage
 */
function clearTokens() {
  localStorage.removeItem("accessToken")
  localStorage.removeItem("refreshToken")
  console.log("✅ Tokens cleared")
}

/**
 * Check if user is authenticated
 */
function isAuthenticated() {
  return !!getAccessToken()
}

/**
 * Refresh access token using refresh token
 */
async function refreshAccessToken() {
  try {
    const refreshToken = getRefreshToken()
    if (!refreshToken) {
      console.warn("⚠️ No refresh token available")
      return false
    }

    console.log("🔄 Refreshing access token...")

    const response = await fetch(`${API_BASE_URL}/auth/refresh-token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${refreshToken}`,
      },
    })

    const data = await response.json()

    if (response.ok && data.accessToken) {
      setAuthToken(data.accessToken)
      console.log("✅ Access token refreshed successfully")
      return true
    }

    console.warn("⚠️ Token refresh failed")
    return false

  } catch (error) {
    console.error("❌ Token refresh error:", error)
    return false
  }
}

// ============ MAIN API SERVICE ============

export const apiService = {
  // Token management exports
  API_BASE_URL,
  setAuthToken,
  setRefreshToken,
  getAccessToken,
  getRefreshToken,
  clearTokens,
  isAuthenticated,
  refreshAccessToken,

  // ============ AUTH ENDPOINTS ============

  /**
   * POST /auth/register - Register new user with email
   */
  async register(payload) {
    return fetchWithFallback("/auth/register", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  /**
   * POST /auth/verify-otp - Verify OTP for email
   */
  async verifyOtp(payload) {
    return fetchWithFallback("/auth/verify-otp", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  /**
   * POST /auth/login - Login user with email/password
   */
  async login(payload) {
    return fetchWithFallback("/auth/login", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  /**
   * POST /auth/resend-otp - Resend OTP to email
   */
  async resendOtp(payload) {
    return fetchWithFallback("/auth/resend-otp", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  /**
   * POST /auth/logout - Logout user
   */
  async logoutApi() {
    return fetchWithFallback("/auth/logout", {
      method: "POST",
    })
  },

  // ============ POST ENDPOINTS ============

  /**
   * GET /posts - Get all fraud reports (newest first)
   */
  async getPosts() {
    const data = await fetchWithFallback("/posts", {}, "posts")

    // Normalize post IDs
    return (Array.isArray(data) ? data : []).map(post => ({
      ...post,
      _id: post._id || post.id, // Ensure _id exists
      id: post.id || post._id,  // Ensure id exists
    }))
  },



  /**
   * GET /posts/:id - Get single post by ID
   */
  async getPost(id) {
    if (!id || id === "undefined") {
      throw new Error("Invalid post ID")
    }

    try {
      const post = await fetchWithFallback(`/posts/${id}`, {}, null)
      return post
    } catch (error) {
      // Fallback to mock data
      const post = mockData.posts?.find((p) => p._id === id || p.id === id)
      if (!post) throw new Error("Post not found")
      return post
    }
  },

  /**
   * GET /posts/:id/images - Get image filenames for a post
   */
  async getPostImages(postId) {
    if (!postId || postId === "undefined") {
      console.warn("Invalid post ID for images")
      return []
    }

    try {
      const imageFilenames = await fetchWithFallback(`/posts/${postId}/images`, {}, null)
      return Array.isArray(imageFilenames) ? imageFilenames : []
    } catch (error) {
      console.warn(`Failed to fetch images for post ${postId}:`, error.message)
      return []
    }
  },

  /**
   * POST /posts - Create new fraud report with images
   */
  async createPost(formData) {
    const url = `${API_BASE_URL}/posts`
    const accessToken = localStorage.getItem("accessToken")

    if (!accessToken) {
      throw new Error("Not authenticated. Please login first.")
    }

    try {
      console.log("📤 Creating post with images...")

      const response = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${accessToken}`,
          // Don't set Content-Type - browser will set it with boundary
        },
        body: formData,
      })

      const text = await response.text()
      const data = text ? JSON.parse(text) : {}

      if (!response.ok) {
        throw new Error(data.message || "Failed to create post")
      }

      console.log("✅ Post created successfully")
      return data

    } catch (error) {
      console.error("❌ Post creation failed:", error)
      throw error
    }
  },

  /**
   * GET /profile/posts - Get current user's posts
   */
  async getUserPosts() {
    try {
      return await fetchWithFallback("/profile/posts", {}, null)
    } catch (error) {
      console.warn("Failed to fetch user posts:", error.message)
      return []
    }
  },

  /**
   * GET /posts/search - Search posts by name/email/phone
   */
  async searchPosts(query) {
    if (!query?.trim()) return []

    try {
      return await fetchWithFallback(`/posts/search?query=${encodeURIComponent(query)}`, {}, null)
    } catch (error) {
      // Fallback to mock search
      const q = query.toLowerCase()
      return mockData.posts?.filter((p) =>
          p.name?.toLowerCase().includes(q) ||
          p.email?.toLowerCase().includes(q) ||
          p.phone?.includes(q) ||
          p.title?.toLowerCase().includes(q)
      ) || []
    }
  },



  async getScore(prompt) {
    return fetchWithFallback(
        "/score",
        { method: "POST", body: JSON.stringify({ prompt }) },
        null
    );
  },





  /**
   * GET /posts/category/:category - Get posts by category
   */
  async getPostsByCategory(category) {
    if (!category) return []

    try {
      return await fetchWithFallback(`/posts/category/${category}`, {}, null)
    } catch (error) {
      // Fallback to mock data
      return mockData.posts?.filter((p) => p.category === category) || []
    }
  },

  /**
   * DELETE /posts/:id - Delete a post
   */
  async deletePost(id) {
    if (!id) throw new Error("Invalid post ID")

    return fetchWithFallback(`/posts/${id}`, {
      method: "DELETE",
    })
  },

  // ============ COMMENT ENDPOINTS ============

// In your apiService.js file, add these two methods:

  async getComments(postId) {
    const token =
        localStorage.getItem('accessToken') ||
        sessionStorage.getItem('accessToken')

    const response = await fetch(`/api/posts/${postId}/comments`, {
      method: 'GET',
      headers: {
        'Content-Type': 'text/plain',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
    })

    if (!response.ok) {
      throw new Error('Failed to fetch comments')
    }

    return response.json()
  },


  async  createComment(postId, content) {
    const token = localStorage.getItem('accessToken') || sessionStorage.getItem('accessToken')

    const response = await fetch(`/api/posts/${postId}/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
        ...(token && { 'Authorization': `Bearer ${token}` }),
      },
      body: content,
    });
    if (!response.ok) throw new Error('Failed to add comment');
    return response.json();
  },

  async deleteComment(postId, commentId) {
    const token =
        localStorage.getItem('accessToken') ||
        sessionStorage.getItem('accessToken');

    const response = await fetch(
        `/api/posts/${postId}/comments/${commentId}`,
        {
          method: 'DELETE',
          headers: {
            ...(token && { Authorization: `Bearer ${token}` }),
          },
        }
    );

    if (!response.ok) {
      throw new Error('Failed to delete comment');
    }

    return true; // Success
  },




  // ============ TRENDING ENDPOINTS ============

  /**
   * GET /posts/trending - Get trending fraudsters
   */
  async getTrendingEntities(timeRange = "7d") {
    try {
      return await fetchWithFallback(`/posts?sort=trending&range=${timeRange}`, {}, null)
    } catch (error) {
      // Calculate trending from mock data
      const nameFreq = {}
      mockData.posts?.forEach((p) => {
        nameFreq[p.name] = (nameFreq[p.name] || 0) + 1
      })

      return Object.entries(nameFreq)
          .map(([name, reportCount]) => ({ name, reportCount }))
          .sort((a, b) => b.reportCount - a.reportCount)
          .slice(0, 10)
    }
  },

  // ============ SEARCH ENDPOINTS ============

  /**
   * GET /search - Global search across posts
   */
  async search(query) {
    if (!query?.trim()) return { posts: [] }

    try {
      return await fetchWithFallback(`/search?query=${encodeURIComponent(query)}`, {}, null)
    } catch (error) {
      // Fallback to mock search
      const q = query.toLowerCase()
      return {
        posts: mockData.posts?.filter((p) =>
            p.name?.toLowerCase().includes(q) ||
            p.title?.toLowerCase().includes(q) ||
            p.description?.toLowerCase().includes(q) ||
            p.email?.toLowerCase().includes(q)
        ) || [],
      }
    }
  },

  // ============ ADMIN ENDPOINTS ============

  /**
   * GET /admin/stats - Get admin dashboard statistics
   */
  async getAdminStats() {
    return fetchWithFallback("/admin/stats", {}, "adminStats")
  },

  /**
   * GET /admin/posts/pending - Get pending posts for approval
   */
  async getPendingPosts() {
    return fetchWithFallback("/admin/posts/pending", {}, "pendingPosts")
  },

  /**
   * POST /admin/posts/:id/approve - Approve pending post
   */
  async approvePendingPost(id) {
    return fetchWithFallback(`/admin/posts/${id}/approve`, {
      method: "POST",
    })
  },

  /**
   * POST /admin/posts/:id/reject - Reject pending post
   */
  async rejectPendingPost(id) {
    return fetchWithFallback(`/admin/posts/${id}/reject`, {
      method: "POST",
    })
  },

  /**
   * GET /admin/users - Get all users
   */
  async getAdminUsers() {
    return fetchWithFallback("/admin/users", {}, null)
  },

  /**
   * PUT /admin/users/:userId/role - Update user role
   */
  async updateUserRole(userId, role) {
    return fetchWithFallback(`/admin/users/${userId}/role`, {
      method: "PUT",
      body: JSON.stringify({ role }),
    })
  },

  /**
   * POST /admin/users/:userId/block - Block user
   */
  async blockUser(userId) {
    return fetchWithFallback(`/admin/users/${userId}/block`, {
      method: "POST",
    })
  },

  /**
   * POST /admin/users/:userId/unblock - Unblock user
   */
  async unblockUser(userId) {
    return fetchWithFallback(`/admin/users/${userId}/unblock`, {
      method: "POST",
    })
  },

  // ============ USER PROFILE ENDPOINTS ============

  /**
   * GET /profile - Get current user profile
   */
  async getUserProfile() {
    return fetchWithFallback("/profile", {})
  },

  /**
   * PUT /profile - Update user profile
   */
  async updateUserProfile(payload) {
    return fetchWithFallback("/profile", {
      method: "PUT",
      body: JSON.stringify(payload),
    })
  },

  /**
   * POST /profile/change-password - Change user password
   */
  async changePassword(payload) {
    return fetchWithFallback("/profile/change-password", {
      method: "POST",
      body: JSON.stringify(payload),
    })
  },

  // ============ NOTIFICATION ENDPOINTS ============

  /**
   * GET /notifications - Get all notifications
   */
  async getNotifications() {
    return fetchWithFallback("/notifications", {})
  },

  /**
   * POST /notifications/:id/read - Mark notification as read
   */
  async markNotificationAsRead(id) {
    return fetchWithFallback(`/notifications/${id}/read`, {
      method: "POST",
    })
  },

  /**
   * POST /notifications/read-all - Mark all notifications as read
   */
  async markAllNotificationsAsRead() {
    return fetchWithFallback("/notifications/read-all", {
      method: "POST",
    })
  },

  // ============ FRAUD ENTITY ENDPOINTS ============

  /**
   * GET /fraud-entity/:id - Get fraud entity details
   */
  async getFraudEntity(id) {
    try {
      return await fetchWithFallback(`/fraud-entity/${id}`, {}, null)
    } catch (error) {
      const entity = mockData.fraudEntities?.find((e) => e._id === id || e.id === id)
      if (!entity) throw error
      return entity
    }
  },

  /**
   * GET /fraud-entity/:id/posts - Get posts for an entity
   */
  async getEntityPosts(entityId) {
    try {
      return await fetchWithFallback(`/fraud-entity/${entityId}/posts`, {}, null)
    } catch (error) {
      return mockData.posts?.filter((p) => p.fraudEntityId === entityId) || []
    }
  },


  /**
   * LIKE AND DISLIKE ER JORA TALI CODE
   */

  async likePost(postId) {
    return fetchWithFallback(`/posts/${postId}/like`, {
      method: "POST",
    })
  },

  async dislikePost(postId) {
    return fetchWithFallback(`/posts/${postId}/dislike`, {
      method: "POST",
    })
  },

  // apiService.js
  async initCoffeePayment({ username, amount }) {
    return fetchWithFallback(
        "/coffee/init",
        {
          method: "POST",
          body: JSON.stringify({ username, amount }),
        },
        null
    );
  },
  async getPayments() {
    try {
      const response = await fetch(`${this.API_BASE_URL}/coffee/payments`, {
        method: 'GET',
        headers: {

        }
      })
      return response.ok ? await response.json() : []
    } catch {
      return []
    }
  },




  // ============ LOGOUT ============

  /**
   * Clear local auth state and logout
   */
  logout() {
    clearTokens()
    console.log("✅ User logged out")
  },
}

export default apiService