import { useEffect, useRef, useState } from "react"
import { Link } from "react-router-dom"
import {
  MapPin,
  Phone,
  Mail,
  Calendar,
  ArrowRight,
  ThumbsUp,
  ThumbsDown,
  MoreVertical,
  Pencil,
  Trash2,
} from "lucide-react"
import toast from "react-hot-toast"
import { apiService } from "../services/api"
import { formatDate } from "../utils/helpers"

export default function PostCard({ post, onDeleted }) {
  const categoryColors = {
    REFUND_FRAUD: "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
    DELIVERY_SCAM:
        "bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400",
    FAKE_PRODUCT:
        "bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400",
    IDENTITY_THEFT:
        "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400",
    PAYMENT_FRAUD: "bg-pink-100 text-pink-700 dark:bg-pink-900/30 dark:text-pink-400",
    OTHER: "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300",
  }

  const [menuOpen, setMenuOpen] = useState(false)
  const [confirmOpen, setConfirmOpen] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [removed, setRemoved] = useState(false)
  const menuWrapRef = useRef(null)

  useEffect(() => {
    if (!menuOpen && !confirmOpen) return
    const onDown = (e) => {
      if (!menuWrapRef.current) return
      if (!menuWrapRef.current.contains(e.target)) setMenuOpen(false)
    }
    document.addEventListener("mousedown", onDown)
    return () => document.removeEventListener("mousedown", onDown)
  }, [menuOpen, confirmOpen])

  if (removed) return null

  if (!post || !post.id) {
    console.warn("PostCard: Missing post ID", post)
    return null
  }

  const author = (post?.postedBy ?? "").trim() || "Unknown"
  const isOwner = post?.ownPosted === true

  const onEdit = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setMenuOpen(false)
    toast.error("Edit feature will be implemented later.")
  }

  const onAskDelete = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setMenuOpen(false)
    setConfirmOpen(true)
  }

  const onDoDelete = async (e) => {
    e.preventDefault()
    e.stopPropagation()

    if (!post?.id || deleting) return

    setDeleting(true)
    try {
      const res = await apiService.deletePost(post.id)
      toast.success(res?.message || "Post deleted successfully")
      setConfirmOpen(false)

      // remove instantly from UI even if parent doesn't update for any reason
      setRemoved(true)

      // parent can also remove it from list state
      onDeleted?.(post.id)
    } catch (err) {
      toast.error(err?.message || "Failed to delete post")
    } finally {
      setDeleting(false)
    }
  }

  return (
      <Link to={`/post/${post.id}`}>
        <div className="card p-3 md:p-4 hover:shadow-md transition-shadow cursor-pointer group relative">
          {/* Header: Title + Category + Actions */}
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0 flex-1">
              <div className="flex items-center gap-2 min-w-0">
                <h3 className="min-w-0 truncate text-base md:text-lg font-semibold text-gray-900 dark:text-gray-100 group-hover:text-primary-600 transition-colors">
                  {post.title}
                </h3>

                <span
                    className={`shrink-0 px-2 py-0.5 text-[11px] font-medium rounded-full ${
                        categoryColors[post.category] || categoryColors.OTHER
                    }`}
                >
                {post.category}
              </span>
              </div>
            </div>

            {/* Right actions: 3-dot (owner) + arrow */}
            <div className="flex items-center gap-2 flex-shrink-0">
              {isOwner && (
                  <div ref={menuWrapRef} className="relative">
                    <button
                        type="button"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setMenuOpen((v) => !v)
                        }}
                        className="p-2 rounded-lg border border-gray-200 bg-white text-gray-600 shadow-sm
                             hover:bg-gray-50 hover:border-primary-300 hover:text-primary-600
                             dark:bg-gray-900 dark:border-gray-700 dark:text-gray-200
                             dark:hover:bg-gray-800 transition-colors"
                        aria-label="Post actions"
                    >
                      <MoreVertical className="w-4 h-4" />
                    </button>

                    {/* Dropdown menu */}
                    {menuOpen && (
                        <div className="absolute right-0 mt-2 w-40 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 shadow-lg z-20 overflow-hidden">
                          <button
                              type="button"
                              onClick={onEdit}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                          >
                            <Pencil className="w-4 h-4" />
                            Edit
                          </button>
                          <button
                              type="button"
                              onClick={onAskDelete}
                              className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/20"
                          >
                            <Trash2 className="w-4 h-4" />
                            Delete
                          </button>
                        </div>
                    )}
                  </div>
              )}

              <ArrowRight className="w-4 h-4 text-gray-400 group-hover:text-primary-600 transition-colors mt-1" />
            </div>
          </div>

          {/* Description: 80 chars */}
          <p className="mt-2 text-sm text-gray-700 dark:text-gray-300">
            {(() => {
              const desc = (post.description ?? "").replace(/\s+/g, " ").trim()
              return desc.length > 80 ? `${desc.slice(0, 77)}...` : desc
            })()}
          </p>

          {/* Fraudster Info (compact) */}
          <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1 text-xs text-gray-600 dark:text-gray-300">
            {post.name && (
                <div className="truncate">
              <span className="font-medium text-gray-700 dark:text-gray-200">
                Business Name:
              </span>{" "}
                  <span className="text-gray-600 dark:text-gray-300">{post.name}</span>
                </div>
            )}

            {post.email && (
                <div className="flex items-center gap-1.5 min-w-0">
                  <Mail className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{post.email}</span>
                </div>
            )}

            {post.phone && (
                <div className="flex items-center gap-1.5 min-w-0">
                  <Phone className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{post.phone}</span>
                </div>
            )}

            {post.address && (
                <div className="flex items-center gap-1.5 min-w-0">
                  <MapPin className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                  <span className="truncate">{post.address}</span>
                </div>
            )}
          </div>

          {/* Bottom bar */}
          <div className="mt-3 pt-2 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between gap-3 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-3 min-w-0">
              <div
                  className={`flex items-center gap-1 ${
                      post.ownLiked ? "text-green-600 dark:text-green-400" : ""
                  }`}
              >
                <ThumbsUp className="w-3.5 h-3.5" />
                <span>{post.likedCount || 0}</span>
              </div>

              <div
                  className={`flex items-center gap-1 ${
                      post.ownDisliked ? "text-red-600 dark:text-red-400" : ""
                  }`}
              >
                <ThumbsDown className="w-3.5 h-3.5" />
                <span>{post.dislikedCount || 0}</span>
              </div>

              <div className="truncate">
                <span className="text-gray-400">by</span>{" "}
                <span className="truncate">{author}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 flex-shrink-0">
              <Calendar className="w-3.5 h-3.5" />
              <span>
              {formatDate
                  ? formatDate(post.postedAt)
                  : new Date(post.postedAt).toLocaleDateString()}
            </span>
            </div>
          </div>

          {/* Confirm delete modal */}
          {confirmOpen && (
              <div
                  className="fixed inset-0 z-50 flex items-center justify-center bg-black/20 dark:bg-black/40 backdrop-blur-sm px-4"
                  onClick={(e) => {
                    e.preventDefault()
                    e.stopPropagation()
                    setConfirmOpen(false)
                  }}
              >
                <div
                    className="card w-full max-w-md rounded-2xl border border-gray-200 dark:border-gray-700 p-6 shadow-2xl"
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                    }}
                >
                  <div className="text-base font-semibold text-gray-900 dark:text-gray-100">
                    Delete post?
                  </div>
                  <div className="mt-1 text-sm text-gray-600 dark:text-gray-300">
                    This action can’t be undone.
                  </div>

                  <div className="mt-5 flex items-center justify-end gap-2">
                    <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={(e) => {
                          e.preventDefault()
                          e.stopPropagation()
                          setConfirmOpen(false)
                        }}
                        disabled={deleting}
                    >
                      Cancel
                    </button>
                    <button
                        type="button"
                        className="btn btn-danger"
                        onClick={onDoDelete}
                        disabled={deleting}
                    >
                      {deleting ? "Deleting..." : "Delete"}
                    </button>
                  </div>
                </div>
              </div>
          )}
        </div>
      </Link>
  )
}
