"use client"

import { useState, useEffect } from "react"
import PostCard from "../components/PostCard"
import TrendingCard from "../components/TrendingCard"
import LoadingSpinner from "../components/LoadingSpinner"
import { apiService } from "../services/api"
import { Shield, TrendingUp, FileWarning, Users, ThumbsUp, ThumbsDown, Coffee, Heart } from "lucide-react"

function normalizeName(name) {
  return (name || "").trim().toLowerCase()
}

function calculateTopTrending(posts, limit = 5) {
  const map = new Map()

  for (const post of posts) {
    const rawName = post?.name
    const key = normalizeName(rawName)
    if (!key) continue

    if (!map.has(key)) map.set(key, { name: rawName.trim(), count: 1 })
    else map.get(key).count += 1
  }

  return Array.from(map.values())
      .sort((a, b) => b.count - a.count)
      .slice(0, limit)
}

export default function HomePage() {
  const [posts, setPosts] = useState([])
  const [trendingEntities, setTrendingEntities] = useState([])
  const [supporters, setSupporters] = useState([]) // ✅ NEW: Supporters state
  const [loading, setLoading] = useState(true)
  const [postsLoading, setPostsLoading] = useState(true)
  const [trendingLoading, setTrendingLoading] = useState(true)
  const [supportersLoading, setSupportersLoading] = useState(true) // ✅ NEW

  useEffect(() => {
    const fetchData = async () => {
      setPostsLoading(true)
      setTrendingLoading(true)
      setSupportersLoading(true) // ✅ NEW

      try {
        // Fetch posts
        const postsData = await apiService.getPosts()
        const validPosts = (postsData || []).filter((post) => post?.id)
        console.log(`Loaded ${validPosts.length} valid posts`)
        setPosts(validPosts)
        setPostsLoading(false)

        // Fetch trending
        setTimeout(() => {
          const top5 = calculateTopTrending(validPosts, 5)
          setTrendingEntities(top5)
          setTrendingLoading(false)
        }, 0)

        // ✅ NEW: Fetch supporters
        try {
          const paymentsData = await apiService.getPayments()
          const recentSupporters = (paymentsData || [])
              .slice(0, 8) // Show top 8 recent supporters
              .map(payment => ({
                username: payment.username || "Anonymous",
                amount: payment.amount
              }))
          setSupporters(recentSupporters)
        } catch (supporterError) {
          console.error("Failed to fetch supporters:", supporterError)
          setSupporters([])
        } finally {
          setSupportersLoading(false)
        }

      } catch (error) {
        console.error("Error fetching data:", error)
        setPosts([])
        setTrendingEntities([])
        setPostsLoading(false)
        setTrendingLoading(false)
      }
    }

    fetchData()
  }, [])

  return (
      <div className="space-y-8">
        <section className="card bg-gradient-to-r from-primary-600 to-primary-700 text-white p-6 md:p-8">
          <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-12 items-start justify-between">

            {/* LEFT: Original content */}
            <div className="max-w-xl flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Shield className="w-9 h-9 md:w-10 md:h-10" />
                <h1 className="text-2xl md:text-3xl font-bold leading-tight">FraudScore</h1>
              </div>

              <p className="text-base md:text-lg text-primary-100 mb-6 leading-relaxed">
                Report fraud anonymously. Check fraud scores before decisions.
              </p>

              <div className="flex flex-wrap gap-4 text-sm mb-6">
                <div className="flex items-center gap-1.5">
                  <FileWarning className="w-4 h-4" />
                  <span>{posts.length}+ Reports</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <Users className="w-4 h-4" />
                  <span>Anonymous & Secure</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <TrendingUp className="w-4 h-4" />
                  <span>Real-time</span>
                </div>
              </div>
            </div>

            {/* RIGHT: Supporters - SAME DESIGN */}
            <div className="flex-1 lg:flex-none w-full lg:w-auto">
              <h3 className="flex items-center gap-2 mb-3 text-lg font-semibold">
                <Heart className="w-5 h-5 fill-current" />
                Supported by
              </h3>

              {supportersLoading ? (
                  <div className="flex items-center gap-2 text-sm opacity-75">
                    <Coffee className="w-4 h-4 animate-spin" />
                    Loading supporters...
                  </div>
              ) : supporters.length === 0 ? (
                  <p className="text-sm opacity-75">No supporters yet ☕</p>
              ) : (
                  <div className="flex flex-wrap gap-3 justify-end">
                    {supporters.map((supporter, index) => (
                        <div
                            key={index}
                            className="bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 border border-white/30 hover:bg-white/30 transition-all"
                        >
                          <Coffee className="w-3 h-3" />
                          <span>{supporter.username}</span>
                          <span className="font-mono">৳{supporter.amount}</span>
                        </div>
                    ))}
                  </div>
              )}
            </div>
          </div>
        </section>


        {/* MAIN GRID - UNCHANGED */}
        <div className="grid lg:grid-cols-3 gap-6 lg:h-[calc(87vh-220px)] lg:overflow-hidden">
          {/* POSTS */}
          <section className="lg:col-span-2 flex flex-col min-h-0 space-y-3">
            <h2 className="shrink-0 text-xl font-semibold text-gray-900 dark:text-gray-100">
              Latest Fraud Reports
            </h2>

            <div className="min-h-0 lg:min-h-[460px] overflow-y-auto pr-2 scrollbar-nice">
              {posts.length === 0 ? (
                  <div className="card p-8 text-center">
                    <FileWarning className="w-12 h-12 mx-auto mb-3 text-gray-400" />
                    <p className="text-gray-500 dark:text-gray-400">No fraud reports yet</p>
                  </div>
              ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-1 gap-4">
                    {posts.map((post) => (
                        <PostCard key={post.id} post={post} />
                    ))}
                  </div>
              )}
            </div>
          </section>

          {/* TRENDING */}
          <aside className="flex flex-col min-h-0 space-y-3">
            <div className="shrink-0 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-danger-500" />
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Trending Frauds
              </h2>
            </div>

            <div className="min-h-0 overflow-y-auto pr-2 scrollbar-nice">
              {trendingEntities.length === 0 ? (
                  <div className="card p-6 text-center">
                    <p className="text-gray-500 dark:text-gray-400">No trending data</p>
                  </div>
              ) : (
                  <div className="space-y-3">
                    {trendingEntities.map((entity, index) => (
                        <TrendingCard
                            key={`${entity.name}-${index}`}
                            entity={entity}
                            rank={index + 1}
                        />
                    ))}
                  </div>
              )}
            </div>
          </aside>
        </div>
      </div>
  )
}
