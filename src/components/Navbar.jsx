"use client"

import { Link, useNavigate, useLocation } from "react-router-dom"
import { useTheme } from "../context/ThemeContext"
import { useAuth } from "../context/AuthContext"
import {
  Sun,
  Moon,
  Shield,
  Menu,
  X,
  Search,
  Plus,
  TrendingUp,
  LogOut,
  CircleUser,
  User,
  Settings,
  Coffee,
  FileStack,
  XCircle
} from "lucide-react"
import { useEffect, useRef, useState } from "react"
import toast from "react-hot-toast"
import { apiService } from "../services/api"
import { getCookie } from "../utils/cookieUtils" // ✅ Add this import

export default function Navbar() {
  const { isDark, toggleTheme } = useTheme()
  const { isAuthenticated, user, logout } = useAuth()

  // ✅ NEW: Navbar auth state
  const [userLoading, setUserLoading] = useState(true)
  const [navbarUser, setNavbarUser] = useState(null)

  const [isMenuOpen, setIsMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState("")
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isCoffeeModalOpen, setIsCoffeeModalOpen] = useState(false)
  const [coffeeAmount, setCoffeeAmount] = useState(50)

  const profileWrapRef = useRef(null)

  const navigate = useNavigate()
  const location = useLocation()

  const isAuthPage = location.pathname === "/login" || location.pathname === "/register"
  const isLandingPage = location.pathname === "/landing"

  // ✅ NEW: Verify auth on Navbar mount
  useEffect(() => {
    const verifyNavbarAuth = async () => {
      try {
        const accessToken = getCookie("accessToken")
        const refreshToken = getCookie("refreshToken")

        if (!accessToken || !refreshToken) {
          setNavbarUser(null)
          setUserLoading(false)
          return
        }

        const response = await fetch(`${apiService.API_BASE_URL}/verifyLogin`, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${accessToken}`,
            "X-Refresh-Token": refreshToken,
            "Content-Type": "application/json",
          },
        })

        if (response.ok) {
          const data = await response.json()
          setNavbarUser({
            username: data.username,
            role: data.role || "USER",
          })
        } else {
          setNavbarUser(null)
        }
      } catch (error) {
        console.error("Navbar auth failed:", error)
        setNavbarUser(null)
      } finally {
        setUserLoading(false)
      }
    }

    verifyNavbarAuth()
  }, [])

  const comingSoon = () => toast("Feature coming soon")

  const closeProfile = () => setIsProfileOpen(false)
  const toggleProfile = () => setIsProfileOpen((v) => !v)

  const openCoffeeModal = () => {
    setCoffeeAmount(50)
    setIsCoffeeModalOpen(true)
    setIsMenuOpen(false)
  }

  const closeCoffeeModal = () => setIsCoffeeModalOpen(false)

  useEffect(() => {
    const onKeyDown = (e) => {
      if (e.key === "Escape") {
        closeProfile()
        closeCoffeeModal()
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  }, [])

  useEffect(() => {
    const onDocDown = (e) => {
      if (!isProfileOpen) return
      if (!profileWrapRef.current) return
      if (!profileWrapRef.current.contains(e.target)) closeProfile()
    }
    document.addEventListener("mousedown", onDocDown)
    return () => document.removeEventListener("mousedown", onDocDown)
  }, [isProfileOpen])

  const handleSearch = (e) => {
    e.preventDefault()
    const q = searchQuery.trim()
    if (q) {
      navigate(`/search?query=${encodeURIComponent(q)}`)
      setSearchQuery("")
      setIsMenuOpen(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    apiService.clearTokens()
    logout()
    setNavbarUser(null) // ✅ Clear navbar state
    closeProfile()
    setIsMenuOpen(false)
    navigate("/login")
  }

  const handleCoffeePayment = async () => {
    try {
      if (!navbarUser?.username) {
        toast.error("Please login first")
        return
      }

      closeCoffeeModal()
      toast.loading("Redirecting to payment...", { id: "coffee" })

      const res = await apiService.initCoffeePayment({
        username: navbarUser.username,
        amount: coffeeAmount,
      })

      toast.dismiss("coffee")

      if (!res?.gatewayUrl) {
        toast.error("Payment gateway URL missing")
        return
      }

      window.location.href = res.gatewayUrl
    } catch (err) {
      toast.dismiss("coffee")
      toast.error(err?.message || "Payment init failed")
    }
  }

  if (isLandingPage) return <></>

  if (isAuthPage) {
    return (
        <nav className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="container mx-auto px-4 max-w-8xl">
            <div className="flex items-center justify-between h-16">
              <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary-600 dark:text-primary-400">
                <Shield className="w-7 h-7" />
                <span>FraudScore</span>
              </Link>
              <button
                  onClick={toggleTheme}
                  className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                  aria-label="Toggle theme"
              >
                {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
              </button>
            </div>
          </div>
        </nav>
    )
  }

  return (
      <>
        <nav className="sticky top-0 z-50 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
          <div className="container mx-auto px-4 max-w-8xl">
            <div className="flex items-center justify-between h-16">
              <Link to="/" className="flex items-center gap-2 text-xl font-bold text-primary-600 dark:text-primary-400">
                <Shield className="w-7 h-7" />
                <span>FraudScore</span>
              </Link>

              <form onSubmit={handleSearch} className="hidden md:flex flex-1 max-w-md mx-8">
                <div className="relative w-full">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                      type="text"
                      placeholder="Search frauds by name, email, phone..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="input pl-10"
                  />
                </div>
              </form>

              <div className="hidden md:flex items-center gap-3">
                <Link
                    to="/trending"
                    className="flex items-center gap-1 text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
                >
                  <TrendingUp className="w-4 h-4" />
                  <span>Trending</span>
                </Link>

                {/* ✅ FIXED: Navbar auth logic */}
                {userLoading ? (
                    <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-700 animate-pulse" />
                ) : navbarUser ? (
                    <>
                      <Link to="/create-post" className="btn btn-primary btn-sm flex items-center gap-1 px-3 py-2 text-sm">
                        <Plus className="w-4 h-4" />
                        <span>Report</span>
                      </Link>

                      <button
                          onClick={openCoffeeModal}
                          type="button"
                          className={[
                            "p-[1.5px] rounded-xl bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600",
                            "shadow-md hover:shadow-lg transition-shadow",
                          ].join(" ")}
                      >
                    <span className="btn btn-secondary btn-sm flex items-center gap-1 px-3 py-2 text-sm rounded-[11px] bg-white dark:bg-gray-800">
                      <Coffee className="w-4 h-4" />
                      <span>Buy me a coffee</span>
                    </span>
                      </button>

                      {navbarUser.role === "ADMIN" && (
                          <Link to="/admin" className="text-gray-600 dark:text-gray-300 hover:text-primary-600 dark:hover:text-primary-400">
                            Admin
                          </Link>
                      )}

                      <div className="relative" ref={profileWrapRef}>
                        <button
                            onClick={toggleProfile}
                            className="p-2.5 rounded-xl text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                            aria-label="Profile"
                            title="Profile"
                            type="button"
                        >
                          <CircleUser className="w-6 h-6" />
                        </button>

                        {isProfileOpen && (
                            <div className="absolute right-0 top-full mt-2 w-64 rounded-2xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-xl overflow-hidden">
                              <div className="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                                <div className="text-sm font-semibold text-gray-900 dark:text-gray-100 truncate">
                                  {navbarUser.username || "User"} {/* ✅ Uses navbarUser */}
                                </div>
                                <div className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                  {navbarUser.role || "Member"} {/* ✅ Uses navbarUser */}
                                </div>
                              </div>

                              <div className="p-2">
                                <button
                                    onClick={() => {
                                      comingSoon()
                                      closeProfile()
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    type="button"
                                >
                                  <User className="w-5 h-5" />
                                  <span className="text-sm font-medium">My profile</span>
                                </button>

                                <button
                                    onClick={() => {
                                      comingSoon()
                                      closeProfile()
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    type="button"
                                >
                                  <FileStack className="w-5 h-5" />
                                  <span className="text-sm font-medium">My Posts</span>
                                </button>

                                <button
                                    onClick={() => {
                                      comingSoon()
                                      closeProfile()
                                    }}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                    type="button"
                                >
                                  <Settings className="w-5 h-5" />
                                  <span className="text-sm font-medium">Settings</span>
                                </button>

                                <button
                                    onClick={handleLogout}
                                    className="w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left text-danger-600 dark:text-danger-400 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition-colors"
                                    type="button"
                                >
                                  <LogOut className="w-5 h-5" />
                                  <span className="text-sm font-medium">Log out</span>
                                </button>
                              </div>
                            </div>
                        )}
                      </div>
                    </>
                ) : (
                    <div className="flex items-center gap-2">
                      <Link to="/login" className="btn btn-secondary">Login</Link>
                      <Link to="/register" className="btn btn-primary">Sign Up</Link>
                    </div>
                )}

                <button
                    onClick={toggleTheme}
                    className="p-2 rounded-lg text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    aria-label="Toggle theme"
                    type="button"
                >
                  {isDark ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
                </button>
              </div>

              <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="md:hidden p-2 text-gray-600 dark:text-gray-300"
                  aria-label="Toggle menu"
                  type="button"
              >
                {isMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
              </button>
            </div>

            {/* Mobile menu */}
            {isMenuOpen && (
                <div className="md:hidden py-4 border-t border-gray-200 dark:border-gray-700">
                  <form onSubmit={handleSearch} className="mb-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                          type="text"
                          placeholder="Search frauds..."
                          value={searchQuery}
                          onChange={(e) => setSearchQuery(e.target.value)}
                          className="input pl-10"
                      />
                    </div>
                  </form>

                  <div className="flex flex-col gap-3">
                    <Link
                        to="/trending"
                        className="flex items-center gap-2 text-gray-600 dark:text-gray-300"
                        onClick={() => setIsMenuOpen(false)}
                    >
                      <TrendingUp className="w-4 h-4" />
                      Trending
                    </Link>

                    {userLoading ? (
                        <div className="w-full h-10 bg-gray-200 dark:bg-gray-700 rounded-xl animate-pulse" />
                    ) : navbarUser ? (
                        <>
                          <Link
                              to="/create-post"
                              className="flex items-center gap-2 text-gray-600 dark:text-gray-300"
                              onClick={() => setIsMenuOpen(false)}
                          >
                            <Plus className="w-4 h-4" />
                            Report Fraud
                          </Link>

                          <button
                              onClick={openCoffeeModal}
                              type="button"
                              className={[
                                "p-[1.5px] rounded-xl bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600",
                                "shadow-md hover:shadow-lg transition-shadow mx-auto w-full max-w-xs",
                              ].join(" ")}
                          >
                      <span className="flex items-center gap-2 w-full rounded-[11px] px-3 py-2 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200">
                        <Coffee className="w-4 h-4" />
                        Buy me a coffee
                      </span>
                          </button>

                          {navbarUser.role === "ADMIN" && (
                              <Link to="/admin" className="text-gray-600 dark:text-gray-300" onClick={() => setIsMenuOpen(false)}>
                                Admin Dashboard
                              </Link>
                          )}

                          <button
                              onClick={() => {
                                setIsMenuOpen(false)
                                setIsProfileOpen(true)
                              }}
                              className="flex items-center gap-2 text-gray-600 dark:text-gray-300"
                              type="button"
                          >
                            <CircleUser className="w-5 h-5" />
                            Profile
                          </button>
                        </>
                    ) : (
                        <>
                          <Link to="/login" className="text-gray-600 dark:text-gray-300" onClick={() => setIsMenuOpen(false)}>
                            Login
                          </Link>
                          <Link
                              to="/register"
                              className="text-primary-600 dark:text-primary-400"
                              onClick={() => setIsMenuOpen(false)}
                          >
                            Sign Up
                          </Link>
                        </>
                    )}

                    <button onClick={toggleTheme} className="flex items-center gap-2 text-gray-600 dark:text-gray-300" type="button">
                      {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                      {isDark ? "Light Mode" : "Dark Mode"}
                    </button>
                  </div>
                </div>
            )}
          </div>
        </nav>

        {/* Coffee Modal - UNCHANGED */}
        {isCoffeeModalOpen && (
            <div className="fixed inset-0 z-[1000] bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto">
                <div className="p-6 border-b border-gray-200 dark:border-gray-700 rounded-t-3xl">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-2xl bg-gradient-to-r from-amber-400 via-pink-500 to-purple-600">
                        <Coffee className="w-6 h-6 text-white" />
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 dark:text-white">Buy me a coffee ☕</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">
                          Support the developer ({navbarUser?.username})
                        </p>
                      </div>
                    </div>
                    <button
                        onClick={closeCoffeeModal}
                        className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                    >
                      <XCircle className="w-5 h-5 text-gray-500" />
                    </button>
                  </div>
                </div>

                <div className="p-6">
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Amount (BDT)
                      </label>
                      <div className="relative">
                        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                          <span className="text-lg font-bold text-primary-600">৳</span>
                        </div>
                        <input
                            type="number"
                            min="10"
                            max="1000"
                            step="10"
                            value={coffeeAmount}
                            onChange={(e) => setCoffeeAmount(Math.max(10, Math.min(1000, parseInt(e.target.value) || 50)))}
                            className="input pl-12 pr-4 w-full text-2xl font-bold text-right"
                            placeholder="50"
                        />
                      </div>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        Minimum ৳10, Maximum ৳1000
                      </p>
                    </div>

                    <div className="flex gap-3 pt-4">
                      <button
                          onClick={closeCoffeeModal}
                          className="flex-1 btn btn-outline h-12 text-sm font-medium"
                      >
                        Cancel
                      </button>
                      <button
                          onClick={handleCoffeePayment}
                          className="flex-1 btn btn-primary h-12 text-sm font-semibold shadow-lg hover:shadow-xl transition-all"
                      >
                        Proceed to Payment
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
        )}
      </>
  )
}
