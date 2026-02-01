"use client"

import { useState } from "react"
import { useNavigate } from "react-router-dom"
import { useAuth } from "../context/AuthContext"
import { AlertTriangle, Upload, X, ImageIcon, Building2, FileText, Tag, Send, ArrowLeft, User, Mail, Phone, MapPin, Zap } from "lucide-react"
import { Link } from "react-router-dom"
import { toast } from "react-toastify"
import { apiService } from "../services/api"
import { getCookie } from "../utils/cookieUtils"
import { compressMultipleImages, formatFileSize, calculateTotalSize } from "../utils/ImageCompressor"

/**
 * Fraud report categories available for users to select
 */
const CATEGORIES = [
  { value: "REFUND_FRAUD", label: "Refund Fraud" },
  { value: "DELIVERY_SCAM", label: "Delivery Scam" },
  { value: "FAKE_PRODUCT", label: "Fake Product" },
  { value: "IDENTITY_THEFT", label: "Identity Theft" },
  { value: "PAYMENT_FRAUD", label: "Payment Fraud" },
  { value: "OTHER", label: "Other" },
]

/**
 * CreatePostPage Component
 *
 * Features:
 * - User authentication check
 * - Image upload with compression
 * - Shows original vs compressed file sizes
 * - Image preview before submission
 * - Form validation
 * - Dark mode support
 */
export default function CreatePostPage() {
  const navigate = useNavigate()
  const { isAuthenticated } = useAuth()

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
    title: "",
    category: "",
    description: "",
  })

  // Image state
  const [images, setImages] = useState([])                    // Compressed image files
  const [previewUrls, setPreviewUrls] = useState([])         // Preview URLs for display
  const [originalSizes, setOriginalSizes] = useState([])     // Original file sizes (before compression)
  const [compressedSizes, setCompressedSizes] = useState([]) // Compressed file sizes
  const [isCompressing, setIsCompressing] = useState(false)  // Loading state while compressing

  // Form state
  const [loading, setLoading] = useState(false)

  /**
   * Handle image selection and compression
   *
   * Process:
   * 1. Get selected files
   * 2. Check total limit
   * 3. Show loading toast
   * 4. Compress images
   * 5. Create preview URLs
   * 6. Store size information
   * 7. Show success with size reduction
   *
   * @param e File input change event
   */
  const handleImageChange = async (e) => {
    // Get selected files as array
    const files = Array.from(e.target.files)

    // Check total limit
    if (images.length + files.length > 5) {
      toast.error("Maximum 5 images allowed")
      return
    }

    // Start compression
    setIsCompressing(true)
    const compressingToast = toast.loading("Compressing images...")

    try {
      // Store original sizes before compression
      const newOriginalSizes = files.map(f => f.size)

      // Compress all files
      const compressedFiles = await compressMultipleImages(files, 0.7)

      // Get compressed sizes
      const newCompressedSizes = compressedFiles.map(f => f.size)

      // Calculate size reduction
      const originalTotal = newOriginalSizes.reduce((a, b) => a + b, 0)
      const compressedTotal = newCompressedSizes.reduce((a, b) => a + b, 0)
      const reduction = Math.round(((originalTotal - compressedTotal) / originalTotal) * 100)

      // Add to existing images
      const newImages = [...images, ...compressedFiles]
      setImages(newImages)

      // Create preview URLs
      const newPreviews = compressedFiles.map(file => URL.createObjectURL(file))
      setPreviewUrls([...previewUrls, ...newPreviews])

      // Store sizes
      setOriginalSizes([...originalSizes, ...newOriginalSizes])
      setCompressedSizes([...compressedSizes, ...newCompressedSizes])

      // Update toast with success message
      toast.update(compressingToast, {
        render: `✅ Compressed ${files.length} image(s) - ${reduction}% size reduction!`,
        type: "success",
        isLoading: false,
        autoClose: 3000,
      })

    } catch (error) {
      console.error("Compression error:", error)
      toast.update(compressingToast, {
        render: "Failed to compress images: " + error.message,
        type: "error",
        isLoading: false,
        autoClose: 3000,
      })
    } finally {
      setIsCompressing(false)
    }
  }

  /**
   * Remove image from selection
   *
   * @param index Index of image to remove
   */
  const handleImageRemove = (index) => {
    // Remove from all arrays
    const newImages = images.filter((_, i) => i !== index)
    const newPreviews = previewUrls.filter((_, i) => i !== index)
    const newOriginalSizes = originalSizes.filter((_, i) => i !== index)
    const newCompressedSizes = compressedSizes.filter((_, i) => i !== index)

    // Revoke URL to free memory
    URL.revokeObjectURL(previewUrls[index])

    // Update state
    setImages(newImages)
    setPreviewUrls(newPreviews)
    setOriginalSizes(newOriginalSizes)
    setCompressedSizes(newCompressedSizes)
  }

  /**
   * Submit form with compressed images
   */
  const handleSubmit = async (e) => {
    e.preventDefault()

    // Validation
    if (!formData.name || !formData.title || !formData.category || !formData.description) {
      toast.error("Please fill in all required fields")
      return
    }

    setLoading(true)

    try {
      // Get auth token
      const accessToken = getCookie("accessToken")

      // Create FormData with compressed images
      const submitData = new FormData()
      submitData.append("name", formData.name)
      submitData.append("email", formData.email || "")
      submitData.append("phone", formData.phone || "")
      submitData.append("address", formData.address || "")
      submitData.append("title", formData.title)
      submitData.append("category", formData.category)
      submitData.append("description", formData.description)

      // Add compressed images
      images.forEach((image) => {
        submitData.append("images", image)
      })

      // Send request
      const response = await fetch(`${apiService.API_BASE_URL}/posts`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${accessToken}`,
        },
        body: submitData,
      })

      if (response.ok) {
        toast.success("Report submitted successfully!")
        navigate("/home")
      } else {
        const error = await response.json()
        toast.error(error.message || "Failed to submit report")
      }
    } catch (error) {
      console.error("Submit error:", error)
      toast.error("Failed to submit report: " + error.message)
    } finally {
      setLoading(false)
    }
  }

  if (!isAuthenticated) {
    return (
        <div className="max-w-lg mx-auto py-12">
          <div className="card p-8 text-center">
            <AlertTriangle className="w-16 h-16 mx-auto mb-4 text-warning-500" />
            <h2 className="text-2xl font-bold mb-2 text-gray-900 dark:text-gray-100">Login Required</h2>
            <p className="text-gray-600 dark:text-gray-400 mb-6">
              You need to be logged in to submit a fraud report.
            </p>
            <Link to="/login" className="btn btn-primary">
              Login to Continue
            </Link>
          </div>
        </div>
    )
  }

  return (
      <div className="max-w-6xl mx-auto py-6">
        {/* Back button

        <div className="mb-6">
          <Link to="/home" className="flex items-center gap-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to Home
          </Link>
        </div>
        */}

        <div className="card p-6 md:p-8">
          {/* Header */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-xl bg-danger-100 dark:bg-danger-900/30 flex items-center justify-center">
              <AlertTriangle className="w-6 h-6 text-danger-600 dark:text-danger-400" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Report Fraud</h1>
              <p className="text-gray-500 dark:text-gray-400">Help community by reporting fraudulent activity</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">

            {/* FRAUDSTER INFORMATION */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <Building2 className="w-5 h-5 text-primary-600" />
                Fraudster Information
              </h3>

              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Name / Business Name *
                  </label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={formData.name}
                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                        placeholder="Enter name or business name"
                        className="input pl-10"
                        required
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="email"
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        placeholder="Enter email (if known)"
                        className="input pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Phone
                  </label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        placeholder="Enter phone number"
                        className="input pl-10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Address
                  </label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                    <input
                        type="text"
                        value={formData.address}
                        onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                        placeholder="Enter address (if known)"
                        className="input pl-10"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* REPORT DETAILS */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <FileText className="w-5 h-5 text-primary-600" />
                Report Details
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Report Title *
                </label>
                <input
                    type="text"
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Brief title for this report"
                    className="input"
                    required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                                <span className="flex items-center gap-1">
                                    <Tag className="w-4 h-4" />
                                    Category *
                                </span>
                </label>
                <select
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    className="input"
                    required
                >
                  <option value="">Select a category</option>
                  {CATEGORIES.map((cat) => (
                      <option key={cat.value} value={cat.value}>
                        {cat.label}
                      </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description *
                </label>
                <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the fraud incident in detail..."
                    className="input min-h-[150px] resize-y"
                    required
                />
              </div>
            </div>

            {/* IMAGE UPLOAD WITH COMPRESSION */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
                <ImageIcon className="w-5 h-5 text-primary-600" />
                Evidence (Optional)
              </h3>

              {/* Upload area */}
              <div className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl p-6">
                <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleImageChange}
                    className="hidden"
                    id="image-upload"
                    disabled={images.length >= 5 || isCompressing}
                />
                <label
                    htmlFor="image-upload"
                    className="flex flex-col items-center cursor-pointer"
                >
                  {isCompressing ? (
                      <>
                        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary-600 mb-2"></div>
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            Compressing images...
                                        </span>
                      </>
                  ) : (
                      <>
                        <Zap className="w-10 h-10 text-gray-400 mb-2" />
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                                            Click to upload images ({images.length}/5)
                                        </span>
                        <span className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                                            Auto-compressed: PNG, JPG up to 10MB each
                                        </span>
                      </>
                  )}
                </label>
              </div>

              {/* Image previews with size info */}
              {previewUrls.length > 0 && (
                  <div className="space-y-3">
                    {/* Total size info */}
                    <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Zap className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                        <span className="text-gray-700 dark:text-gray-300">
                                            Total Size: {formatFileSize(calculateTotalSize(images))}
                          {originalSizes.length > 0 && (
                              <span className="text-gray-500 dark:text-gray-400">
                                                    {" "}(Original: {formatFileSize(calculateTotalSize(originalSizes))})
                                                </span>
                          )}
                                        </span>
                      </div>
                    </div>

                    {/* Image grid */}
                    <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                      {previewUrls.map((url, index) => (
                          <div key={index} className="relative group">
                            <img
                                src={url}
                                alt={`Preview ${index + 1}`}
                                className="w-full h-32 object-cover rounded-lg border border-gray-200 dark:border-gray-700"
                            />

                            {/* Size info overlay */}
                            <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-2 rounded-b-lg">
                              <div className="text-xs text-white space-y-1">
                                <div>{formatFileSize(compressedSizes[index])}</div>
                                {originalSizes[index] > 0 && (
                                    <div className="text-gray-300">
                                      {Math.round(((originalSizes[index] - compressedSizes[index]) / originalSizes[index]) * 100)}% reduced
                                    </div>
                                )}
                              </div>
                            </div>

                            {/* Remove button */}
                            <button
                                type="button"
                                onClick={() => handleImageRemove(index)}
                                className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                      ))}
                    </div>
                  </div>
              )}
            </div>

            {/* Form actions */}
            <div className="flex gap-4 pt-4">
              <button
                  type="button"
                  onClick={() => navigate("/home")}
                  className="btn btn-secondary flex-1"
              >
                Cancel
              </button>
              <button
                  type="submit"
                  disabled={loading || isCompressing}
                  className="btn btn-primary flex-1 flex items-center justify-center gap-2"
              >
                {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      Submitting...
                    </>
                ) : (
                    <>
                      <Send className="w-4 h-4" />
                      Submit Report
                    </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
  )
}
