import React from 'react';
import { X, Lock, Mail } from 'lucide-react';

interface AdminLoginModalProps {
    isOpen: boolean;
    onClose: () => void;
    onLogin: (credentials: { username: string; password: string }) => void;
    isLoading?: boolean;
    error?: string;
}

const AdminLoginModal: React.FC<AdminLoginModalProps> = ({
    isOpen,
    onClose,
    onLogin,
    isLoading = false,
    error
}) => {
    const [credentials, setCredentials] = React.useState({
        username: '',
        password: ''
    });

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onLogin(credentials);
    };

    const handleClose = () => {
        setCredentials({ username: '', password: '' });
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
            {/* Backdrop */}
            <div
                className="absolute inset-0 bg-black/50 backdrop-blur-sm"
                onClick={handleClose}
            />

            {/* Modal */}
            <div className="relative bg-background border border-border rounded-lg shadow-xl w-full max-w-md mx-4 p-6">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center space-x-2">
                        <Lock size={20} className="text-primary" />
                        <h2 className="text-lg font-semibold">Admin Access</h2>
                    </div>
                    <button
                        onClick={handleClose}
                        className="p-1 hover:bg-muted rounded-md transition-colors"
                    >
                        <X size={18} />
                    </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="admin-email" className="block text-sm font-medium mb-2">
                            Email Address
                        </label>
                        <div className="relative">
                            <Mail size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="email"
                                id="admin-email"
                                required
                                value={credentials.username}
                                onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                                className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/35 focus:border-primary"
                                placeholder="Enter admin email"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div>
                        <label htmlFor="admin-password" className="block text-sm font-medium mb-2">
                            Password
                        </label>
                        <div className="relative">
                            <Lock size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground" />
                            <input
                                type="password"
                                id="admin-password"
                                required
                                value={credentials.password}
                                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                                className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-md text-foreground placeholder:text-muted-foreground text-sm focus:outline-none focus:ring-2 focus:ring-primary/35 focus:border-primary"
                                placeholder="Enter admin password"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
                            <p className="text-sm text-destructive">{error}</p>
                        </div>
                    )}

                    <div className="flex space-x-3 pt-2">
                        <button
                            type="button"
                            onClick={handleClose}
                            className="flex-1 px-4 py-2 border border-border rounded-md text-sm font-medium hover:bg-muted transition-colors"
                            disabled={isLoading}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="flex-1 px-4 py-2 bg-primary text-primary-foreground rounded-md text-sm font-medium hover:bg-primary/90 transition-colors disabled:opacity-50"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Authenticating...' : 'Login'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default AdminLoginModal;