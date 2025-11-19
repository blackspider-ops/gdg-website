import React, { useState, useEffect } from 'react';
import { useAdmin } from '@/contexts/AdminContext';
import { Navigate, Link } from 'react-router-dom';
import {
    FileText,
    Download,
    Eye,
    RefreshCw,
    Search,
    File,
    Calendar,
    User,
    AlertCircle,
    ArrowLeft,
    MessageSquare,
    Send,
    Edit,
    Trash2,
    CheckCircle,
    XCircle,
    Clock
} from 'lucide-react';
import AdminPageWrapper from '@/components/admin/AdminPageWrapper';
import { useBodyScrollLock } from '@/hooks/useBodyScrollLock';
import { 
    MediaService, 
    type MediaFile, 
    type MediaFolder
} from '@/services/mediaService';
import { BlogSubmissionService, type BlogSubmission, type BlogSubmissionComment } from '@/services/blogSubmissionService';

const BlogEditorMedia: React.FC = () => {
    const { isAuthenticated, currentAdmin } = useAdmin();
    
    // State management
    const [isLoading, setIsLoading] = useState(true);
    const [submissions, setSubmissions] = useState<BlogSubmission[]>([]);
    const [searchTerm, setSearchTerm] = useState('');
    const [selectedSubmission, setSelectedSubmission] = useState<BlogSubmission | null>(null);
    const [comments, setComments] = useState<BlogSubmissionComment[]>([]);
    const [newComment, setNewComment] = useState('');
    const [commentType, setCommentType] = useState<BlogSubmissionComment['comment_type']>('general');
    const [isAddingComment, setIsAddingComment] = useState(false);
    const [showStatusModal, setShowStatusModal] = useState(false);
    const [newStatus, setNewStatus] = useState<BlogSubmission['status']>('pending');
    const [statusNotes, setStatusNotes] = useState('');
    
    // Lock body scroll when modal is open
    useBodyScrollLock(!!selectedSubmission || showStatusModal);

    // Authentication check
    if (!isAuthenticated || currentAdmin?.role !== 'blog_editor') {
        return <Navigate to="/" replace />;
    }

    useEffect(() => {
        loadBlogSubmissions();
    }, []);

    const loadBlogSubmissions = async () => {
        setIsLoading(true);
        try {
            // Load blog submissions from the dedicated service
            const blogSubmissions = await BlogSubmissionService.getAllSubmissions();
            setSubmissions(blogSubmissions);
        } catch (error) {
            console.error('Error loading blog submissions:', error);
            setSubmissions([]);
        } finally {
            setIsLoading(false);
        }
    };

    const handleViewFile = async (submission: BlogSubmission) => {
        try {
            const fileBlob = await BlogSubmissionService.getSubmissionFile(submission.file_path);
            if (fileBlob) {
                const fileUrl = URL.createObjectURL(fileBlob);
                window.open(fileUrl, '_blank');
                // Clean up the URL after a delay
                setTimeout(() => URL.revokeObjectURL(fileUrl), 1000);
            }
        } catch (error) {
            console.error('Error viewing file:', error);
        }
    };

    const handleDownloadFile = async (submission: BlogSubmission) => {
        try {
            const fileBlob = await BlogSubmissionService.getSubmissionFile(submission.file_path);
            if (fileBlob) {
                const url = URL.createObjectURL(fileBlob);
                const a = document.createElement('a');
                a.href = url;
                a.download = submission.file_path.split('/').pop() || 'blog-submission.pdf';
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                URL.revokeObjectURL(url);
            }
        } catch (error) {
            console.error('Error downloading file:', error);
        }
    };

    const formatDate = (dateString: string) => {
        return new Date(dateString).toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });
    };

    const getStatusColor = (status: BlogSubmission['status']) => {
        switch (status) {
            case 'pending':
                return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/20 dark:text-yellow-400';
            case 'approved':
                return 'bg-green-100 text-green-800 dark:bg-green-900/20 dark:text-green-400';
            case 'rejected':
                return 'bg-red-100 text-red-800 dark:bg-red-900/20 dark:text-red-400';
            default:
                return 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
        }
    };

    const filteredSubmissions = submissions.filter(submission => 
        searchTerm === '' || 
        submission.submitter_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.submitter_email.toLowerCase().includes(searchTerm.toLowerCase()) ||
        submission.file_path.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const loadComments = async (submissionId: string) => {
        try {
            const submissionComments = await BlogSubmissionService.getSubmissionComments(submissionId);
            setComments(submissionComments);
        } catch (error) {
            console.error('Error loading comments:', error);
            setComments([]);
        }
    };

    const handleViewSubmission = async (submission: BlogSubmission) => {
        setSelectedSubmission(submission);
        await loadComments(submission.id);
    };

    const handleAddComment = async () => {
        if (!selectedSubmission || !currentAdmin?.id || !newComment.trim()) return;
        
        setIsAddingComment(true);
        try {
            const comment = await BlogSubmissionService.addSubmissionComment(
                selectedSubmission.id,
                currentAdmin.id,
                newComment.trim(),
                commentType
            );
            
            if (comment) {
                setComments(prev => [...prev, comment]);
                setNewComment('');
                setCommentType('general');
            }
        } catch (error) {
            console.error('Error adding comment:', error);
        } finally {
            setIsAddingComment(false);
        }
    };

    const handleStatusUpdate = async () => {
        if (!selectedSubmission || !currentAdmin?.id) return;
        
        try {
            const success = await BlogSubmissionService.updateSubmissionStatusWithComment(
                selectedSubmission.id,
                newStatus,
                currentAdmin.id,
                statusNotes.trim() || undefined
            );
            
            if (success) {
                // Update the submission in the list
                setSubmissions(prev => prev.map(sub => 
                    sub.id === selectedSubmission.id 
                        ? { ...sub, status: newStatus, admin_notes: statusNotes.trim() || sub.admin_notes }
                        : sub
                ));
                
                // Update selected submission
                setSelectedSubmission(prev => prev ? { 
                    ...prev, 
                    status: newStatus, 
                    admin_notes: statusNotes.trim() || prev.admin_notes 
                } : null);
                
                // Reload comments to show the status change comment
                await loadComments(selectedSubmission.id);
                
                setShowStatusModal(false);
                setStatusNotes('');
            }
        } catch (error) {
            console.error('Error updating status:', error);
        }
    };

    return (
        <AdminPageWrapper pageName="Blog Submissions" pageTitle="Blog Submissions">
            <div className="min-h-screen bg-background pt-20">
                <div className="editorial-grid py-8">
                    {/* Header */}
                    <div className="col-span-12 mb-8">
                        {/* Back Button */}
                        <div className="mb-4">
                            <Link
                                to="/admin/blog-editor"
                                className="inline-flex items-center space-x-2 text-muted-foreground hover:text-foreground transition-colors"
                            >
                                <ArrowLeft size={16} />
                                <span className="text-sm">Back to Dashboard</span>
                            </Link>
                        </div>
                        
                        {/* Header Content */}
                        <div className="flex items-center justify-between">
                            <div className="flex items-center space-x-3">
                                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                                    <FileText size={20} className="text-primary-foreground" />
                                </div>
                                <div>
                                    <h1 className="font-display text-2xl font-bold text-foreground">Blog Submissions</h1>
                                    <p className="text-muted-foreground text-sm">
                                        Files submitted through the contact form for blog posts
                                    </p>
                                </div>
                            </div>
                        
                            <button
                                onClick={loadBlogSubmissions}
                                disabled={isLoading}
                                className="flex items-center space-x-2 px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors text-muted-foreground disabled:opacity-50"
                            >
                                <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
                                <span>Refresh</span>
                            </button>
                        </div>
                    </div>

                    {/* Search */}
                    <div className="col-span-12 mb-6">
                        <div className="relative max-w-md">
                            <Search size={20} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="text"
                                placeholder="Search submissions..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10 pr-4 py-2 w-full border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-gdg-blue bg-background text-foreground"
                            />
                        </div>
                    </div>

                    {/* Content */}
                    <div className="col-span-12">
                        {isLoading ? (
                            <div className="bg-card border border-border rounded-lg p-8 text-center">
                                <RefreshCw size={24} className="animate-spin mx-auto text-muted-foreground mb-2" />
                                <p className="text-muted-foreground">Loading blog submissions...</p>
                            </div>
                        ) : filteredSubmissions.length === 0 ? (
                            <div className="bg-card border border-border rounded-lg p-8 text-center">
                                <FileText size={48} className="mx-auto text-muted-foreground mb-4" />
                                <h3 className="text-lg font-semibold mb-2">No submissions yet</h3>
                                <p className="text-muted-foreground">
                                    {searchTerm 
                                        ? 'No submissions match your search criteria.' 
                                        : 'Blog submissions from the contact form will appear here.'
                                    }
                                </p>
                            </div>
                        ) : (
                            <div className="bg-card border border-border rounded-lg overflow-hidden">
                                <div className="p-4 border-b border-border">
                                    <h3 className="font-semibold text-foreground">
                                        {filteredSubmissions.length} submission{filteredSubmissions.length !== 1 ? 's' : ''}
                                    </h3>
                                </div>
                                
                                <div className="divide-y divide-border">
                                    {filteredSubmissions.map((submission) => (
                                        <div key={submission.id} className="p-6 hover:bg-muted/30 transition-colors">
                                            <div className="flex items-start justify-between">
                                                <div className="flex items-start space-x-4 flex-1">
                                                    <div className="flex-shrink-0">
                                                        <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
                                                            <FileText size={24} className="text-blue-600" />
                                                        </div>
                                                    </div>
                                                    
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center space-x-2 mb-1">
                                                            <h4 className="font-medium text-foreground truncate">
                                                                {submission.file_path.split('/').pop() || 'Blog Submission'}
                                                            </h4>
                                                            <span className={`px-2 py-1 text-xs rounded-full font-medium ${getStatusColor(submission.status)}`}>
                                                                {submission.status.charAt(0).toUpperCase() + submission.status.slice(1)}
                                                            </span>
                                                        </div>
                                                        
                                                        <div className="flex items-center space-x-4 text-xs text-muted-foreground mb-2">
                                                            <div className="flex items-center space-x-1">
                                                                <User size={12} />
                                                                <span>{submission.submitter_name}</span>
                                                            </div>
                                                            
                                                            <div className="flex items-center space-x-1">
                                                                <span>{submission.submitter_email}</span>
                                                            </div>
                                                            
                                                            <div className="flex items-center space-x-1">
                                                                <Calendar size={12} />
                                                                <span>{formatDate(submission.created_at)}</span>
                                                            </div>
                                                        </div>
                                                        
                                                        {submission.admin_notes && (
                                                            <div className="mt-2 p-2 bg-muted rounded text-sm">
                                                                <strong>Admin Notes:</strong> {submission.admin_notes}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                                
                                                <div className="flex items-center space-x-2 ml-4">
                                                    <button
                                                        onClick={() => handleViewSubmission(submission)}
                                                        className="flex items-center space-x-1 px-3 py-2 text-sm bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                                                        title="View details and comments"
                                                    >
                                                        <MessageSquare size={14} />
                                                        <span>Details</span>
                                                    </button>
                                                    
                                                    <button
                                                        onClick={() => handleViewFile(submission)}
                                                        className="flex items-center space-x-1 px-3 py-2 text-sm border border-border rounded-lg hover:bg-muted transition-colors"
                                                        title="View file"
                                                    >
                                                        <Eye size={14} />
                                                        <span>View</span>
                                                    </button>
                                                    
                                                    <button
                                                        onClick={() => handleDownloadFile(submission)}
                                                        className="flex items-center space-x-1 px-3 py-2 text-sm bg-gdg-blue text-white rounded-lg hover:bg-gdg-blue/90 transition-colors"
                                                        title="Download file"
                                                    >
                                                        <Download size={14} />
                                                        <span>Download</span>
                                                    </button>
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>

                    {/* Info Box */}
                    <div className="col-span-12 mt-8">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                                <AlertCircle size={20} className="text-blue-600 flex-shrink-0 mt-0.5" />
                                <div>
                                    <h4 className="font-medium text-blue-900 mb-1">About Blog Submissions</h4>
                                    <p className="text-sm text-blue-700">
                                        These are files submitted through the contact form when users select "Blog Submission". 
                                        You can view and download these files to review potential blog content. 
                                        Contact the admin team to publish approved submissions.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Submission Details Modal */}
                {selectedSubmission && (
                    <div 
                        className="fixed inset-0 z-50 bg-card/50 flex items-center justify-center p-4"
                        style={{ 
                            overflow: 'hidden',
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0
                        }}
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                setSelectedSubmission(null);
                            }
                        }}
                        onWheel={(e) => e.preventDefault()}
                        onTouchMove={(e) => e.preventDefault()}
                        onScroll={(e) => e.preventDefault()}
                    >
                        <div 
                            className="bg-card border border-border rounded-lg w-full max-w-4xl max-h-[80vh] overflow-hidden flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                            onWheel={(e) => e.stopPropagation()}
                            onTouchMove={(e) => e.stopPropagation()}
                        >
                            {/* Fixed Header */}
                            <div className="flex-shrink-0 p-6 border-b border-border">
                                <div className="flex items-center justify-between">
                                    <div className="flex items-center space-x-3">
                                        <FileText size={24} className="text-primary" />
                                        <div>
                                            <h2 className="text-xl font-semibold text-foreground">
                                                Blog Submission Details
                                            </h2>
                                            <p className="text-sm text-muted-foreground">
                                                {selectedSubmission.file_path.split('/').pop()}
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setSelectedSubmission(null)}
                                        className="p-2 hover:bg-muted rounded-lg transition-colors"
                                    >
                                        <XCircle size={20} />
                                    </button>
                                </div>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto flex">
                                {/* Left Panel - Submission Info */}
                                <div className="w-1/3 p-6 border-r border-border overflow-y-auto">
                                    <div className="space-y-4">
                                        {/* Status */}
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Status</label>
                                            <div className="flex items-center space-x-2 mt-1">
                                                <span className={`px-3 py-1 text-sm rounded-full font-medium ${getStatusColor(selectedSubmission.status)}`}>
                                                    {selectedSubmission.status.charAt(0).toUpperCase() + selectedSubmission.status.slice(1)}
                                                </span>
                                                <button
                                                    onClick={() => {
                                                        setNewStatus(selectedSubmission.status);
                                                        setShowStatusModal(true);
                                                    }}
                                                    className="p-1 hover:bg-muted rounded transition-colors"
                                                    title="Change status"
                                                >
                                                    <Edit size={14} />
                                                </button>
                                            </div>
                                        </div>

                                        {/* Submitter Info */}
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Submitter</label>
                                            <div className="mt-1">
                                                <p className="font-medium">{selectedSubmission.submitter_name}</p>
                                                <p className="text-sm text-muted-foreground">{selectedSubmission.submitter_email}</p>
                                            </div>
                                        </div>

                                        {/* Submission Date */}
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">Submitted</label>
                                            <p className="mt-1">{formatDate(selectedSubmission.created_at)}</p>
                                        </div>

                                        {/* File Info */}
                                        <div>
                                            <label className="text-sm font-medium text-muted-foreground">File</label>
                                            <div className="mt-1 space-y-1">
                                                <p className="text-sm">{selectedSubmission.file_path.split('/').pop()}</p>
                                                <p className="text-xs text-muted-foreground">{selectedSubmission.mime_type}</p>
                                            </div>
                                        </div>

                                        {/* Admin Notes */}
                                        {selectedSubmission.admin_notes && (
                                            <div>
                                                <label className="text-sm font-medium text-muted-foreground">Admin Notes</label>
                                                <div className="mt-1 p-3 bg-muted rounded-lg">
                                                    <p className="text-sm">{selectedSubmission.admin_notes}</p>
                                                </div>
                                            </div>
                                        )}

                                        {/* Actions */}
                                        <div className="pt-4 space-y-2">
                                            <button
                                                onClick={() => handleViewFile(selectedSubmission)}
                                                className="w-full flex items-center justify-center space-x-2 px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                                            >
                                                <Eye size={16} />
                                                <span>View File</span>
                                            </button>
                                            <button
                                                onClick={() => handleDownloadFile(selectedSubmission)}
                                                className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-gdg-blue text-white rounded-lg hover:bg-gdg-blue/90 transition-colors"
                                            >
                                                <Download size={16} />
                                                <span>Download File</span>
                                            </button>
                                        </div>
                                    </div>
                                </div>

                                {/* Right Panel - Comments */}
                                <div className="flex-1 flex flex-col">
                                    {/* Comments Header */}
                                    <div className="p-4 border-b border-border">
                                        <h3 className="font-semibold text-foreground">Comments & Feedback</h3>
                                    </div>

                                    {/* Comments List */}
                                    <div className="flex-1 overflow-y-auto p-4 space-y-4">
                                        {comments.length === 0 ? (
                                            <div className="text-center py-8">
                                                <MessageSquare size={48} className="mx-auto text-muted-foreground mb-2" />
                                                <p className="text-muted-foreground">No comments yet</p>
                                            </div>
                                        ) : (
                                            comments.map((comment) => (
                                                <div key={comment.id} className="bg-muted/30 rounded-lg p-4">
                                                    <div className="flex items-start justify-between mb-2">
                                                        <div className="flex items-center space-x-2">
                                                            <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                                                                <User size={16} className="text-primary-foreground" />
                                                            </div>
                                                            <div>
                                                                <p className="font-medium text-sm">{comment.admin_users?.email}</p>
                                                                <p className="text-xs text-muted-foreground">
                                                                    {formatDate(comment.created_at)} • {comment.comment_type}
                                                                </p>
                                                            </div>
                                                        </div>
                                                        {comment.comment_type === 'status_change' && (
                                                            <div className="flex items-center space-x-1 text-xs">
                                                                {comment.comment.includes('approved') ? (
                                                                    <CheckCircle size={14} className="text-green-500" />
                                                                ) : comment.comment.includes('rejected') ? (
                                                                    <XCircle size={14} className="text-red-500" />
                                                                ) : (
                                                                    <Clock size={14} className="text-yellow-500" />
                                                                )}
                                                            </div>
                                                        )}
                                                    </div>
                                                    <p className="text-sm whitespace-pre-wrap">{comment.comment}</p>
                                                </div>
                                            ))
                                        )}
                                    </div>

                                    {/* Add Comment */}
                                    <div className="p-4 border-t border-border">
                                        <div className="space-y-3">
                                            <div className="flex space-x-2">
                                                <select
                                                    value={commentType}
                                                    onChange={(e) => setCommentType(e.target.value as BlogSubmissionComment['comment_type'])}
                                                    className="px-3 py-2 border border-border rounded-lg bg-background text-foreground"
                                                >
                                                    <option value="general">General</option>
                                                    <option value="feedback">Feedback</option>
                                                    <option value="internal">Internal Note</option>
                                                </select>
                                            </div>
                                            <div className="flex space-x-2">
                                                <textarea
                                                    value={newComment}
                                                    onChange={(e) => setNewComment(e.target.value)}
                                                    placeholder="Add a comment..."
                                                    className="flex-1 px-3 py-2 border border-border rounded-lg bg-background text-foreground resize-none"
                                                    rows={3}
                                                />
                                                <button
                                                    onClick={handleAddComment}
                                                    disabled={!newComment.trim() || isAddingComment}
                                                    className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                >
                                                    {isAddingComment ? (
                                                        <RefreshCw size={16} className="animate-spin" />
                                                    ) : (
                                                        <Send size={16} />
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                )}

                {/* Status Update Modal */}
                {showStatusModal && selectedSubmission && (
                    <div 
                        className="fixed inset-0 z-60 bg-card/50 flex items-center justify-center p-4"
                        style={{ 
                            overflow: 'hidden',
                            position: 'fixed',
                            top: 0,
                            left: 0,
                            right: 0,
                            bottom: 0
                        }}
                        onClick={(e) => {
                            if (e.target === e.currentTarget) {
                                setShowStatusModal(false);
                                setStatusNotes('');
                            }
                        }}
                        onWheel={(e) => e.preventDefault()}
                        onTouchMove={(e) => e.preventDefault()}
                        onScroll={(e) => e.preventDefault()}
                    >
                        <div 
                            className="bg-card border border-border rounded-lg w-full max-w-md overflow-hidden flex flex-col"
                            onClick={(e) => e.stopPropagation()}
                            onWheel={(e) => e.stopPropagation()}
                            onTouchMove={(e) => e.stopPropagation()}
                        >
                            <div className="p-6">
                                <h3 className="text-lg font-semibold mb-4">Update Status</h3>
                                
                                <div className="space-y-4">
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Status</label>
                                        <select
                                            value={newStatus}
                                            onChange={(e) => setNewStatus(e.target.value as BlogSubmission['status'])}
                                            className="w-full px-3 py-2 border border-border rounded-lg bg-background"
                                        >
                                            <option value="pending">Pending</option>
                                            <option value="reviewed">Reviewed</option>
                                            <option value="approved">Approved</option>
                                            <option value="rejected">Rejected</option>
                                        </select>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-sm font-medium mb-2">Notes (optional)</label>
                                        <textarea
                                            value={statusNotes}
                                            onChange={(e) => setStatusNotes(e.target.value)}
                                            placeholder="Add notes about this status change..."
                                            className="w-full px-3 py-2 border border-border rounded-lg bg-background resize-none"
                                            rows={3}
                                        />
                                    </div>
                                </div>
                                
                                <div className="flex justify-end space-x-3 mt-6">
                                    <button
                                        onClick={() => {
                                            setShowStatusModal(false);
                                            setStatusNotes('');
                                        }}
                                        className="px-4 py-2 border border-border rounded-lg hover:bg-muted transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        onClick={handleStatusUpdate}
                                        className="px-4 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors"
                                    >
                                        Update Status
                                    </button>
                                </div>
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </AdminPageWrapper>
    );
};

export default BlogEditorMedia;