import React from 'react';
import { Lock, Mail } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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

    return (
        <Dialog open={isOpen} onOpenChange={handleClose}>
            <DialogContent 
                className="sm:max-w-md"
                onInteractOutside={(e) => {
                    // Allow closing on outside clicks, but prevent closing when clicking
                    // on password manager extensions (they render outside the modal)
                    const target = e.target as HTMLElement;
                    
                    // Check for common password manager extension attributes and classes
                    const isPasswordManager = 
                        // 1Password - check the target and all parents
                        target.closest('[data-1p-extension]') ||
                        target.closest('[class*="1password"]') ||
                        target.closest('[class*="_1password"]') ||
                        target.closest('[id*="1password"]') ||
                        target.closest('[id*="_1password"]') ||
                        // Check if it's a shadow root or extension element
                        target.tagName === 'COM-1PASSWORD-BUTTON' ||
                        target.tagName === 'COM-1PASSWORD-MENU' ||
                        // LastPass
                        target.closest('[data-lastpass-icon-root]') ||
                        target.closest('[id*="lastpass"]') ||
                        // Dashlane
                        target.closest('[data-dashlane-root]') ||
                        target.closest('[id*="dashlane"]') ||
                        // Bitwarden
                        target.closest('[data-bitwarden-root]') ||
                        target.closest('[id*="bitwarden"]') ||
                        // Generic password manager detection
                        target.closest('[class*="password-manager"]') ||
                        target.closest('[role="dialog"][aria-label*="password"]') ||
                        // Check if target is inside an iframe (extensions often use iframes)
                        target.ownerDocument !== document;
                    
                    if (isPasswordManager) {
                        e.preventDefault();
                    }
                    // Otherwise, allow the modal to close (default behavior)
                }}
            >
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Lock className="h-5 w-5 text-primary" />
                        Admin Access
                    </DialogTitle>
                    <DialogDescription>
                        Enter your admin credentials to access the dashboard.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="admin-email">Email Address</Label>
                        <div className="relative">
                            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="admin-email"
                                type="email"
                                required
                                value={credentials.username}
                                onChange={(e) => setCredentials(prev => ({ ...prev, username: e.target.value }))}
                                className="pl-10"
                                placeholder="Enter admin email"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="admin-password">Password</Label>
                        <div className="relative">
                            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                            <Input
                                id="admin-password"
                                type="password"
                                required
                                value={credentials.password}
                                onChange={(e) => setCredentials(prev => ({ ...prev, password: e.target.value }))}
                                className="pl-10"
                                placeholder="Enter admin password"
                                disabled={isLoading}
                            />
                        </div>
                    </div>

                    {error && (
                        <div className="rounded-md bg-destructive/15 p-3">
                            <p className="text-sm text-destructive">{error}</p>
                        </div>
                    )}

                    <div className="flex gap-3 pt-4">
                        <Button
                            type="button"
                            variant="outline"
                            onClick={handleClose}
                            className="flex-1"
                            disabled={isLoading}
                        >
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            className="flex-1"
                            disabled={isLoading}
                        >
                            {isLoading ? 'Authenticating...' : 'Login'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default AdminLoginModal;