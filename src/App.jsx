import {Routes, Route, useNavigate, useSearchParams} from "react-router-dom"
import { useEffect, useState, useRef } from "react"
import Navbar from "./components/Navbar"
import HomePage from "./pages/HomePage"
import PostDetailPage from "./pages/PostDetailPage"
import SearchPage from "./pages/SearchPage"
import FraudProfilePage from "./pages/FraudProfilePage"
import LoginPage from "./pages/LoginPage"
import RegisterPage from "./pages/RegisterPage"
import CreatePostPage from "./pages/CreatePostPage"
import AdminDashboard from "./pages/AdminDashboard"
import TrendingPage from "./pages/TrendingPage"
import { apiService } from "./services/api"
import { useAuth } from "./context/AuthContext"
import { getCookie, setCookie, deleteCookie } from "./utils/cookieUtils"
import LandingPage from "./pages/LandingPage";
import { Toaster } from "react-hot-toast";
import { toast } from "react-hot-toast";


function AuthGuard({ children }) {
    const navigate = useNavigate()
    const { login } = useAuth()
    const [loading, setLoading] = useState(true)
    const [isValid, setIsValid] = useState(false)
    const hasVerified = useRef(false) // ✅ Track if already verified

    useEffect(() => {
        // ✅ Only verify once per mount
        if (hasVerified.current) return

        const verifyAuth = async () => {
            try {
                const accessToken = getCookie("accessToken")
                const refreshToken = getCookie("refreshToken")

                if (!accessToken || !refreshToken) {
                    setIsValid(false)
                    navigate("/landing", { replace: true })
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

                    if (data.accessToken) {
                        setCookie("accessToken", data.accessToken, 0.1)
                        apiService.setAuthToken(data.accessToken)
                    }
                    if (data.refreshToken) {
                        setCookie("refreshToken", data.refreshToken, 7)
                        apiService.setRefreshToken(data.refreshToken)
                    }

                    if (data.username) {
                        login({
                            username: data.username,
                            email: data.email || "",
                            role: data.role || "USER",
                            _id: data._id || "",
                        })
                    }

                    setIsValid(true)
                } else {
                    deleteCookie("accessToken")
                    deleteCookie("refreshToken")
                    setIsValid(false)
                    navigate("/landing", { replace: true })
                }
            } catch (error) {
                console.error("Auth verification failed:", error)
                deleteCookie("accessToken")
                deleteCookie("refreshToken")
                setIsValid(false)
                navigate("/landing", { replace: true })
            } finally {
                setLoading(false)
                hasVerified.current = true // ✅ Mark as verified
            }
        }

        verifyAuth()
    }, []) // ✅ Empty dependency - run once on mount

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Verifying authentication...</p>
                </div>
            </div>
        )
    }

    if (!isValid) {
        return null
    }

    return children
}

function RootRedirect() {
    const navigate = useNavigate()
    const [loading, setLoading] = useState(true)
    const hasChecked = useRef(false)

    useEffect(() => {
        if (hasChecked.current) return

        const checkAuth = async () => {
            try {
                const accessToken = getCookie("accessToken")
                const refreshToken = getCookie("refreshToken")

                if (!accessToken || !refreshToken) {
                    navigate("/landing", { replace: true }) // ✅ Changed to landing
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
                    navigate("/home", { replace: true })
                } else {
                    deleteCookie("accessToken")
                    deleteCookie("refreshToken")
                    navigate("/landing", { replace: true }) // ✅ Changed to landing
                }
            } catch (error) {
                console.error("Root auth check failed:", error)
                deleteCookie("accessToken")
                deleteCookie("refreshToken")
                navigate("/landing", { replace: true }) // ✅ Changed to landing
            } finally {
                setLoading(false)
                hasChecked.current = true
            }
        }

        checkAuth()
    }, [navigate])

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
                    <p className="text-gray-600 dark:text-gray-400">Loading...</p>
                </div>
            </div>
        )
    }

    return null
}


function App() {

    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    useEffect(() => {
        const coffeeStatus = searchParams.get('coffee');

        if (coffeeStatus) {
            switch (coffeeStatus) {
                case 'success':
                    toast.success('🎉 Thank you for the coffee! ', {
                        duration: 2000,
                        position: 'top-right',
                    });
                    break;
                case 'fail':
                    toast.error('❌ Payment failed. Please try again.', {
                        duration: 1000,
                        position: 'top-right',
                    });
                    break;
                case 'cancel':
                    toast('ℹ️ Payment cancelled.', {
                        duration: 1000,
                        position: 'top-right',
                    });
                    break;
            }
            navigate(window.location.pathname, { replace: true });
        }
    }, [searchParams, navigate]);


    return (

        <div className="min-h-screen">

            <Toaster
                position="top-right"
                reverseOrder={false}
                toastOptions={{
                    duration: 3000,
                    style: {
                        background: "#0f172a", // slate-900
                        color: "#e5e7eb",
                        border: "1px solid #1e293b",
                    },
                    success: {
                        iconTheme: {
                            primary: "#22c55e",
                            secondary: "#0f172a",
                        },
                    },
                    error: {
                        iconTheme: {
                            primary: "#ef4444",
                            secondary: "#0f172a",
                        },
                    },
                }}
            />




            <Navbar />
            <main className="container mx-auto px-4 py-6 max-w-8xl">
                <Routes>
                    <Route path="/" element={<RootRedirect />} />
                    <Route path="/landing" element={<LandingPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/register" element={<RegisterPage />} />

                    <Route
                        path="/home"
                        element={
                            <AuthGuard>
                                <HomePage />
                            </AuthGuard>
                        }
                    />
                    <Route
                        path="/post/:id"
                        element={
                            <AuthGuard>
                                <PostDetailPage />
                            </AuthGuard>
                        }
                    />
                    <Route
                        path="/search"
                        element={
                            <AuthGuard>
                                <SearchPage />
                            </AuthGuard>
                        }
                    />
                    <Route path="/fraud-profile/:name" element={<FraudProfilePage />} />

                    <Route
                        path="/create-post"
                        element={
                            <AuthGuard>
                                <CreatePostPage />
                            </AuthGuard>
                        }
                    />
                    <Route
                        path="/trending"
                        element={
                            <AuthGuard>
                                <TrendingPage />
                            </AuthGuard>
                        }
                    />
                    <Route
                        path="/admin"
                        element={
                            <AuthGuard>
                                <AdminDashboard />
                            </AuthGuard>
                        }
                    />
                </Routes>
            </main>
        </div>
    )
}

export default App
