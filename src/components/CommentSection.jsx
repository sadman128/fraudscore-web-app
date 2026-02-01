"use client"

import { useState, useEffect } from "react"
import { useAuth } from "../context/AuthContext"
import { User, Clock, Flag, Trash2 } from "lucide-react"
import { formatDate } from "../utils/helpers"
import { apiService } from "../services/api"
import toast from "react-hot-toast";

export default function CommentSection({ comments = [], postId, onDeleted }) {
    const { isAuthenticated } = useAuth()

    const [deleteTargetId, setDeleteTargetId] = useState(null)
    const [deleting, setDeleting] = useState(false)

    const closeModal = () => {
        if (deleting) return
        setDeleteTargetId(null)
    }

    // Optional: close on Escape
    useEffect(() => {
        const onKeyDown = (e) => {
            if (e.key === "Escape") closeModal()
        }
        if (deleteTargetId) window.addEventListener("keydown", onKeyDown)
        return () => window.removeEventListener("keydown", onKeyDown)
    }, [deleteTargetId, deleting])

    const confirmDelete = async () => {
        if (!deleteTargetId) return
        try {
            setDeleting(true)
            console.log("Deleting ---", deleteTargetId)
            await apiService.deleteComment(postId, deleteTargetId)

            onDeleted?.(deleteTargetId)
            window.dispatchEvent(
                new CustomEvent("commentDeleted", { detail: deleteTargetId })
            )

            setDeleteTargetId(null)
            toast.success("Comment deleted")

        } catch (error) {
            console.error("Delete failed:", error)
            toast.error("Delete failed:", error)
        } finally {
            setDeleting(false)
        }
    }

    return (
        <div className="space-y-3">
            {comments.length === 0 ? (
                <div className="text-center py-10 text-gray-500 dark:text-gray-400">
                    <User className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                    <p>No comments yet. Be the first to share your experience!</p>
                </div>
            ) : (
                <div className="max-h-[409px] overflow-y-auto scrollbar-nice pr-1 space-y-3">
                    {comments.map((comment) => {
                        const author = comment.author || "Anonymous"
                        const content = comment.content ?? comment.comment ?? comment.text ?? ""
                        const canDelete = isAuthenticated && comment.own === true

                        return (
                            <div
                                key={comment.id}
                                className="rounded-xl border border-gray-200/70 dark:border-gray-700/70 bg-white/60 dark:bg-gray-900/40 p-4 hover:bg-white dark:hover:bg-gray-900/55 transition"
                            >
                                <div className="flex items-start gap-3">
                                    <div className="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-primary-400 to-primary-600 flex items-center justify-center">
                                        <User className="w-5 h-5 text-white" />
                                    </div>

                                    <div className="min-w-0 flex-1">
                                        <div className="flex items-start justify-between gap-2">
                                            <div className="min-w-0">
                                                <p className="font-semibold text-sm text-gray-900 dark:text-gray-100 truncate">
                                                    {author}
                                                </p>
                                                <p className="mt-0.5 flex items-center gap-1 text-xs text-gray-400">
                                                    <Clock className="w-3 h-3" />
                                                    {formatDate(comment.createdAt)}
                                                </p>
                                            </div>

                                            <div className="flex items-center gap-1">
                                                {canDelete && (
                                                    <button
                                                        onClick={() => setDeleteTargetId(comment.id)}
                                                        className="p-2 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-900/20 transition"
                                                        title="Delete comment"
                                                    >
                                                        <Trash2 className="w-4 h-4" />
                                                    </button>
                                                )}
                                                { !canDelete && (
                                                <button
                                                    className="p-2 rounded-lg text-gray-400 hover:text-danger-500 hover:bg-danger-50 dark:hover:bg-danger-900/20 transition"
                                                    title="Flag comment"
                                                >
                                                    <Flag className="w-4 h-4" />
                                                </button>
                                                )}
                                            </div>
                                        </div>

                                        <p className="mt-3 text-sm text-gray-700 dark:text-gray-300 whitespace-pre-wrap break-words leading-relaxed">
                                            {content}
                                        </p>
                                    </div>
                                </div>
                            </div>
                        )
                    })}
                </div>
            )}

            {/* ✅ Delete Modal */}
            {deleteTargetId && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60"
                        onClick={closeModal}
                    />

                    {/* Dialog */}
                    <div
                        role="dialog"
                        aria-modal="true"
                        className="relative w-full max-w-md rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-xl p-6"
                    >
                        <h4 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                            Delete comment?
                        </h4>
                        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
                            This action can’t be undone.
                        </p>

                        <div className="mt-6 flex items-center justify-end gap-2">
                            <button
                                type="button"
                                onClick={closeModal}
                                disabled={deleting}
                                className="px-4 py-2 rounded-xl bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700 transition disabled:opacity-60"
                            >
                                Cancel
                            </button>

                            <button
                                type="button"
                                onClick={confirmDelete}
                                disabled={deleting}
                                className="px-4 py-2 rounded-xl bg-red-600 text-white hover:bg-red-700 transition disabled:opacity-60"
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
