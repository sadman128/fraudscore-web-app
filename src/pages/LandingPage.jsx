"use client"

import { useState } from "react"
import { Link, useNavigate } from "react-router-dom"
import { Shield, TrendingUp, FileWarning, Sun, Moon, Mail, ShieldX ,Lock, Users  as UsersIcon } from "lucide-react"
import { useTheme } from "../context/ThemeContext"
import LoadingSpinner from "../components/LoadingSpinner"

export default function LandingPage() {
    const navigate = useNavigate()
    const { isDark, toggleTheme } = useTheme()
    const [loading, setLoading] = useState(false)

    const handleLogin = () => {
        setLoading(true)
        setTimeout(() => {
            navigate("/login")
        }, 500)
    }

    const handleRegister = () => {
        setLoading(true)
        setTimeout(() => {
            navigate("/register")
        }, 500)
    }

    if (loading) {
        return <LoadingSpinner size="lg" text="Redirecting..." />
    }

    return (

            <main className="container mx-auto px-4 max-w-8xl pt-20 pb-0 mb-0">
                <div className="grid lg:grid-cols-2 gap-16 items-center">
                    {/* Left: Hero Section */}
                    <div className="space-y-8">
                        <div>
                            <h1 className="text-5xl md:text-6xl lg:text-7xl font-bold bg-gradient-to-r from-primary-600 via-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight">
                                Protect Yourself from Fraud
                            </h1>
                            <p className="text-xl md:text-2xl text-gray-600 dark:text-gray-300 mt-6 max-w-lg">
                                Report fraud incidents anonymously. Check fraud scores before making decisions.
                            </p>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-3 gap-6 mb-12">
                            <div className="text-center">
                                <div className="text-3xl font-bold text-primary-600 dark:text-primary-400 mb-1">
                                    10K+
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">Reports</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-green-600 dark:text-green-400 mb-1">
                                    98%
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">Accuracy</div>
                            </div>
                            <div className="text-center">
                                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-1">
                                    500+
                                </div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">Entities</div>
                            </div>
                        </div>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row gap-4"
                             style={{
                                 display: "flex",
                                 justifyContent: "center",
                                 alignItems: "center",
                                 gap: "16px",
                             }}
                        >
                            <button
                                onClick={handleLogin}
                                className="group flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-primary-600 to-blue-600 hover:from-primary-700 hover:to-blue-700 text-white font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 max-w-sm"
                                style={{ margin: 0 }}
                            >
                                <UsersIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                Get Started - Login
                            </button>
                            <button
                                onClick={handleRegister}
                                className="group flex items-center gap-3 px-8 py-4 bg-white dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-600 hover:border-primary-500 hover:bg-primary-50 dark:hover:bg-primary-950 text-gray-900 dark:text-gray-100 font-semibold text-lg rounded-xl shadow-lg hover:shadow-xl transform hover:-translate-y-1 transition-all duration-300 max-w-sm"
                                style={{ margin: 0 }}
                            >
                                <Mail className="w-5 h-5 group-hover:scale-110 transition-transform" />
                                Create Account
                            </button>
                        </div>

                        {/* Features */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 pt-8 border-t border-gray-200 dark:border-gray-700">
                            <div className="flex items-start gap-3 p-4 rounded-xl hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all">
                                <Shield className="w-8 h-8 text-primary-600 dark:text-primary-400 mt-1 flex-shrink-0" />
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Anonymous Reporting</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Your identity is protected</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 rounded-xl hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all">
                                <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400 mt-1 flex-shrink-0" />
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Real-time Analytics</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">See trending fraud patterns</p>
                                </div>
                            </div>
                            <div className="flex items-start gap-3 p-4 rounded-xl hover:bg-white/50 dark:hover:bg-gray-800/50 transition-all">
                                <FileWarning className="w-8 h-8 text-orange-600 dark:text-orange-400 mt-1 flex-shrink-0" />
                                <div>
                                    <h3 className="font-semibold text-gray-900 dark:text-gray-100">Fraud Score</h3>
                                    <p className="text-sm text-gray-600 dark:text-gray-400">Check risk scores instantly</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Right: Hero Image */}
                    <div className="relative">
                        <div className="relative z-10 bg-gradient-to-br from-white/90 to-blue-50/50 dark:from-gray-900/90 dark:to-gray-800/50 backdrop-blur-xl rounded-3xl p-12 shadow-2xl border border-white/50 dark:border-gray-700/50 max-w-lg mx-auto">
                            <div className="text-center">
                                <div className="w-32 h-32 bg-gradient-to-r from-orange-400 via-red-500 to-purple-600 rounded-3xl mx-auto mb-8 shadow-xl flex items-center justify-center">
                                    <ShieldX className="w-16 h-16 text-white/90 drop-shadow-lg" />
                                </div>
                                <div className="space-y-4">
                                    <h2 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-200 bg-clip-text text-transparent">
                                        FraudScore in Action
                                    </h2>
                                    <p className="text-lg text-gray-600 dark:text-gray-300 leading-relaxed">
                                        Search any business or individual to see their fraud score, view reports, and make informed decisions.
                                    </p>
                                </div>
                            </div>
                        </div>
                        <div className="absolute -bottom-4 -right-4 w-64 h-64 bg-gradient-to-r from-primary-400/20 to-blue-400/20 rounded-full blur-3xl"></div>
                    </div>
                </div>

                {/* Credits */}
                <p className="text-center mt-12 text-s text-white-600 dark:text-gray-500 italic">
                    Mock data support by <span className="font-medium">bignoob11, amimofiz, elrubio44, lightsalt, superman1</span>
                </p>
            </main>


    )
}
