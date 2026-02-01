"use client"

import { useState, useEffect, useRef } from "react"
import { useParams, Link } from "react-router-dom"
import {
    ThumbsUp,
    ThumbsDown,
    Calendar,
    MapPin,
    Phone,
    Mail,
    FileText,
    Image as ImageIcon,
    User,
    MessageCircle,
    Send,
    MoreVertical,  // ✅ Added
    Pencil,         // ✅ Added
    Trash2,         // ✅ Added
} from "lucide-react"

import { apiService } from "../services/api"
import LoadingSpinner from "../components/LoadingSpinner"
import CommentSection from "../components/CommentSection"
import toast from "react-hot-toast"

export default function PostDetailPage() {
    const { id } = useParams()

    const [post, setPost] = useState(null)
    const [images, setImages] = useState([])
    const [comments, setComments] = useState([])
    const [commentText, setCommentText] = useState("")
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState(null)
    const [isAuthenticated, setIsAuthenticated] = useState(false)
    const [showAllImages, setShowAllImages] = useState(false)

    // ✅ NEW: 3-dot menu states (same as PostCard)
    const [menuOpen, setMenuOpen] = useState(false)
    const [confirmOpen, setConfirmOpen] = useState(false)
    const [deleting, setDeleting] = useState(false)
    const menuWrapRef = useRef(null)

    useEffect(() => {
        const fetchData = async () => {
            try {
                setLoading(true)

                const postData = await apiService.getPost(id)
                setPost(postData)

                const imageFiles = await apiService.getPostImages(id)
                if (imageFiles?.length) {
                    setImages(
                        imageFiles.map(
                            (f) =>
                                `${apiService.API_BASE_URL}/posts/${id}/images/${encodeURIComponent(
                                    f
                                )}`
                        )
                    )
                }

                const commentData = await apiService.getComments(id)
                setComments(commentData || [])

                setIsAuthenticated(apiService.isAuthenticated())
            } catch (err) {
                setError("Failed to load post")
            } finally {
                setLoading(false)
            }
        }

        fetchData()
    }, [id])

    // ✅ NEW: Outside click handler (same as PostCard)
    useEffect(() => {
        if (!menuOpen && !confirmOpen) return
        const onDown = (e) => {
            if (!menuWrapRef.current) return
            if (!menuWrapRef.current.contains(e.target)) setMenuOpen(false)
        }
        document.addEventListener("mousedown", onDown)
        return () => document.removeEventListener("mousedown", onDown)
    }, [menuOpen, confirmOpen])

    // ✅ NEW: Check if current user owns post
    const isOwner = post?.ownPosted === true

    // ✅ NEW: Edit/Delete handlers (same as PostCard)
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
            // Redirect to home after delete
            window.location.href = "/"
        } catch (err) {
            toast.error(err?.message || "Failed to delete post")
        } finally {
            setDeleting(false)
        }
    }

    const handleCommentSubmit = async (e) => {
        e.preventDefault()
        if (!commentText.trim()) return

        try {
            const newComment = await apiService.createComment(id, commentText)
            setComments((prev) => [...prev, newComment])
            setCommentText("")
            toast.success("Comment added")
            window.location.reload()
        } catch {
            toast.error("Failed to comment")
        }
    }

    const handleLike = async () => {
        if (!isAuthenticated) return alert("Login required")
        setPost(await apiService.likePost(id))
    }

    const handleDislike = async () => {
        if (!isAuthenticated) return alert("Login required")
        setPost(await apiService.dislikePost(id))
    }

    if (loading)
        return (
            <div className="flex items-center justify-center min-h-screen">
                <LoadingSpinner />
            </div>
        )

    if (error)
        return (
            <div className="card p-8 text-center max-w-xl mx-auto mt-10">
                <p className="text-red-500">{error}</p>
                <Link to="/" className="btn btn-primary mt-4">
                    Back
                </Link>
            </div>
        )

    const visibleImages = showAllImages ? images : images.slice(0, 3)
    const extraCount = images.length - 3

    return (
        <div className="max-w-8xl mx-auto py-4">
            <div className="grid grid-cols-1 lg:grid-cols-[70%_30%] gap-8">

                {/* ================= POST ================= */}
                <main>
                    <div className="card p-6 md:p-10 max-h-[85vh] overflow-hidden flex flex-col">

                        {/* ✅ NEW: Header with 3-dot menu (same layout as PostCard) */}
                        <div className="flex items-start justify-between gap-3 mb-6">
                            <div className="min-w-0 flex-1">
                                <h1 className="min-w-0 truncate text-3xl font-bold text-gray-900 dark:text-gray-100">
                                    {post.title}
                                </h1>

                                <div className="flex items-center gap-4 mt-3 text-sm text-gray-500">
                    <span className="px-3 py-1 bg-danger-100 text-danger-700 rounded-full">
                      {post.category}
                    </span>
                                    {post.postedBy && (
                                        <span className="flex items-center gap-1">
                          <User className="w-4 h-4" /> {post.postedBy}
                        </span>
                                    )}
                                    {post.postedAt && (
                                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                                            {new Date(post.postedAt).toLocaleString()}
                        </span>
                                    )}
                                </div>
                            </div>

                            {/* ✅ NEW: 3-dot menu (same as PostCard) */}
                            {isOwner && (
                                <div ref={menuWrapRef} className="relative flex-shrink-0">
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
                        </div>

                        {/* Fraud Info */}
                        <div className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 space-y-2 mb-6">
                            {post.name && <p><strong>Name:</strong> {post.name}</p>}
                            {post.email && <p><strong>Email:</strong> {post.email}</p>}
                            {post.phone && <p><strong>Phone:</strong> {post.phone}</p>}
                            {post.address && <p><strong>Address:</strong> {post.address}</p>}
                        </div>

                        {/* Description (Scrollable) */}
                        <div className="mb-6 flex-1 overflow-hidden">
                            <h3 className="font-semibold flex items-center gap-2 mb-2">
                                <FileText className="w-4 h-4" /> Report Details
                            </h3>
                            <div className="max-h-64 overflow-y-auto pr-2">
                                <p className="whitespace-pre-wrap leading-relaxed text-gray-700 dark:text-gray-300">
                                    {post.description}
                                </p>
                            </div>
                        </div>

                        {/* Images */}
                        {images.length > 0 && (
                            <div className="mt-4">
                                <div className="flex justify-between mb-3">
                                    <h3 className="font-semibold flex items-center gap-2">
                                        <ImageIcon className="w-4 h-4" /> Evidence ({images.length})
                                    </h3>
                                    {images.length > 3 && (
                                        <button
                                            onClick={() => setShowAllImages((v) => !v)}
                                            className="text-sm text-primary-600 hover:underline"
                                        >
                                            {showAllImages ? "Show less" : "Show all"}
                                        </button>
                                    )}
                                </div>

                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                    {visibleImages.map((img, idx) => {
                                        const showOverlay =
                                            !showAllImages && images.length > 3 && idx === 2

                                        return (
                                            <a
                                                key={idx}
                                                href={img}
                                                target="_blank"
                                                rel="noreferrer"
                                                onClick={(e) => {
                                                    if (showOverlay) {
                                                        e.preventDefault()
                                                        setShowAllImages(true)
                                                    }
                                                }}
                                                className="relative h-40 rounded-lg overflow-hidden bg-gray-100"
                                            >
                                                <img
                                                    src={img}
                                                    alt=""
                                                    className="w-full h-full object-cover"
                                                />
                                                {showOverlay && (
                                                    <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                    <span className="text-white text-3xl font-semibold">
                                      +{extraCount}
                                    </span>
                                                    </div>
                                                )}
                                            </a>
                                        )
                                    })}
                                </div>
                            </div>
                        )}

                    </div>
                </main>

                {/* ================= COMMENTS (COMPLETE - UNCHANGED) ================= */}
                <aside className="space-y-6">
                    <div className="card p-6 sticky top-6 flex flex-col max-h-[85vh]">

                        {/* Header */}
                        <h3 className="font-semibold flex items-center gap-2 mb-4 shrink-0">
                            <MessageCircle className="w-5 h-5" /> Comments ({comments.length})
                        </h3>

                        {/* Comment Form */}
                        <form
                            onSubmit={handleCommentSubmit}
                            className="space-y-3 mb-4 shrink-0"
                        >
                <textarea
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                    className="input w-full min-h-[90px]"
                    placeholder="Share your experience..."
                />
                            <button className="btn btn-primary w-full flex items-center gap-2">
                                <Send className="w-4 h-4" /> Post Comment
                            </button>
                        </form>

                        {/* Comments List (Scrollable) */}
                        <div className="flex-1 overflow-y-auto pr-1 space-y-4">
                            <CommentSection
                                comments={comments}
                                postId={id}
                                onDeleted={(cid) =>
                                    setComments((prev) => prev.filter((c) => c.id !== cid))
                                }
                            />
                        </div>

                        {/* Reactions */}
                        <div className="border-t pt-4 mt-4 flex flex-wrap items-center gap-3 shrink-0">
                            <button
                                onClick={handleLike}
                                disabled={!isAuthenticated}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all
            border bg-transparent
            ${
                                    post.ownLiked
                                        ? "border-green-500 text-green-600 dark:border-green-400 dark:text-green-400"
                                        : "border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-300"
                                }`}
                            >
                                <ThumbsUp
                                    className={`w-5 h-5 ${post.ownLiked ? "fill-green-500" : ""}`}
                                />
                                {post.likedCount || 0}
                            </button>

                            <button
                                onClick={handleDislike}
                                disabled={!isAuthenticated}
                                className={`flex items-center gap-2 px-6 py-3 rounded-xl font-medium transition-all
            border bg-transparent
            ${
                                    post.ownDisliked
                                        ? "border-red-500 text-red-600 dark:border-red-400 dark:text-red-400"
                                        : "border-gray-300 text-gray-700 dark:border-gray-700 dark:text-gray-300"
                                }`}
                            >
                                <ThumbsDown
                                    className={`w-5 h-5 ${post.ownDisliked ? "fill-red-500" : ""}`}
                                />
                                {post.dislikedCount || 0}
                            </button>
                        </div>
                    </div>
                </aside>

            </div>

            {/* ✅ NEW: Delete confirmation modal (same as PostCard) */}
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
                            This action can't be undone.
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
    )
}
