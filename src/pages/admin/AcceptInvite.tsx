import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { Users, Mail, Lock, User, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { TeamInviteService, type TeamInvite } from '@/services/teamInviteService';

const AcceptInvite: React.FC = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const [invite, setInvite] = useState<TeamInvite | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  
  const [formData, setFormData] = useState({
    displayName: '',
    password: '',
    confirmPassword: ''
  });

  useEffect(() => {
    if (token) {
      loadInvite();
    }
  }, [token]);

  const loadInvite = async () => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      const data = await TeamInviteService.getInviteByToken(token);
      if (data) {
        setInvite(data);
        
        // Check if expired
        if (new Date(data.expires_at) < new Date()) {
          setError('This invite has expired');
        } else if (data.status !== 'pending') {
          setError(`This invite has been ${data.status}`);
        }
      } else {
        setError('Invalid invite link');
      }
    } catch (err) {
      setError('Failed to load invite');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!token) return;
    
    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match');
      return;
    }
    
    if (formData.password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    
    try {
      const result = await TeamInviteService.acceptInvite(
        token,
        formData.password,
        formData.displayName || undefined
      );
      
      if (result.success) {
        setSuccess(true);
        setTimeout(() => {
          navigate('/admin');
        }, 3000);
      } else {
        setError(result.message);
      }
    } catch (err) {
      setError('Failed to accept invite');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-4" />
          <p className="text-muted-foreground">Loading invite...</p>
        </div>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card rounded-xl border border-border p-8 text-center">
          <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Welcome to the Team!</h1>
          <p className="text-muted-foreground mb-4">
            Your account has been created successfully. Redirecting to login...
          </p>
          <Link
            to="/admin"
            className="text-primary hover:underline"
          >
            Go to Admin Panel
          </Link>
        </div>
      </div>
    );
  }

  if (error && !invite) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center p-4">
        <div className="max-w-md w-full bg-card rounded-xl border border-border p-8 text-center">
          <XCircle className="w-16 h-16 text-red-500 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-foreground mb-2">Invalid Invite</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Link
            to="/"
            className="text-primary hover:underline"
          >
            Go to Homepage
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full bg-card rounded-xl border border-border p-8">
        <div className="text-center mb-6">
          <div
            className="w-16 h-16 rounded-xl mx-auto mb-4 flex items-center justify-center"
            style={{ backgroundColor: (invite?.team?.color || '#4285F4') + '20' }}
          >
            <Users className="w-8 h-8" style={{ color: invite?.team?.color || '#4285F4' }} />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Join {invite?.team?.name}</h1>
          <p className="text-muted-foreground mt-2">
            You've been invited to join as a <span className="font-medium capitalize">{invite?.role?.replace('_', ' ')}</span>
          </p>
          <p className="text-sm text-muted-foreground mt-1">
            Invited by {invite?.inviter?.display_name || invite?.inviter?.email}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Email
            </label>
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="email"
                value={invite?.email || ''}
                disabled
                className="w-full pl-10 pr-4 py-2 bg-muted border border-border rounded-lg text-muted-foreground"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Display Name (optional)
            </label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={formData.displayName}
                onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                placeholder="Your name"
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                placeholder="Create a password"
                required
                minLength={8}
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-foreground mb-1">
              Confirm Password
            </label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="password"
                value={formData.confirmPassword}
                onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
                placeholder="Confirm your password"
                required
                className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-lg"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full py-3 bg-primary text-primary-foreground rounded-lg font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
          >
            {isSubmitting ? (
              <span className="flex items-center justify-center">
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
                Creating Account...
              </span>
            ) : (
              'Accept Invite & Create Account'
            )}
          </button>
        </form>
      </div>
    </div>
  );
};

export default AcceptInvite;
