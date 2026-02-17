import { useState, useMemo, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Switch } from '@/components/ui/switch';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { User, Bell, Lock, Palette, Save, Loader2, Check, X, Shield } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { z } from 'zod';
import { cn } from '@/lib/utils';
import { useTheme } from 'next-themes';

const passwordSchema = z.string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number');

interface PasswordStrength {
  score: number;
  label: string;
  color: string;
  requirements: {
    minLength: boolean;
    hasUppercase: boolean;
    hasLowercase: boolean;
    hasNumber: boolean;
    hasSpecial: boolean;
  };
}

const calculatePasswordStrength = (password: string): PasswordStrength => {
  const requirements = {
    minLength: password.length >= 8,
    hasUppercase: /[A-Z]/.test(password),
    hasLowercase: /[a-z]/.test(password),
    hasNumber: /[0-9]/.test(password),
    hasSpecial: /[!@#$%^&*(),.?":{}|<>]/.test(password),
  };

  const score = Object.values(requirements).filter(Boolean).length;

  let label = 'Very Weak';
  let color = 'bg-destructive';

  if (score >= 5) {
    label = 'Strong';
    color = 'bg-green-500';
  } else if (score >= 4) {
    label = 'Good';
    color = 'bg-emerald-500';
  } else if (score >= 3) {
    label = 'Fair';
    color = 'bg-yellow-500';
  } else if (score >= 2) {
    label = 'Weak';
    color = 'bg-orange-500';
  }

  return { score, label, color, requirements };
};

export default function SettingsPage() {
  const { profile, user } = useAuth();
  const { theme, setTheme } = useTheme();
  const [isSaving, setIsSaving] = useState(false);
  const [formData, setFormData] = useState({
    full_name: profile?.full_name || '',
    phone: profile?.phone || '',
  });
  const [notifications, setNotifications] = useState(() => {
    // Load from localStorage on initial render
    const saved = localStorage.getItem('notification_preferences');
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return { email: true, push: true, booking: true, updates: false };
      }
    }
    return { email: true, push: true, booking: true, updates: false };
  });

  // Save notification preferences to localStorage when they change
  useEffect(() => {
    localStorage.setItem('notification_preferences', JSON.stringify(notifications));
  }, [notifications]);

  // Change password state
  const [isPasswordDialogOpen, setIsPasswordDialogOpen] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordErrors, setPasswordErrors] = useState<{ password?: string; confirmPassword?: string }>({});

  // 2FA state
  const [is2FADialogOpen, setIs2FADialogOpen] = useState(false);
  const [mfaFactors, setMfaFactors] = useState<any[]>([]);
  const [qrCode, setQrCode] = useState<string>('');
  const [totpSecret, setTotpSecret] = useState<string>('');
  const [verifyCode, setVerifyCode] = useState('');
  const [factorId, setFactorId] = useState<string>('');
  const [isEnabling2FA, setIsEnabling2FA] = useState(false);
  const [isDisabling2FA, setIsDisabling2FA] = useState(false);
  const [mfaStep, setMfaStep] = useState<'start' | 'verify' | 'enabled'>('start');

  const passwordStrength = useMemo(() => calculatePasswordStrength(newPassword), [newPassword]);

  // Load MFA factors on mount
  useEffect(() => {
    const loadMfaFactors = async () => {
      const { data, error } = await supabase.auth.mfa.listFactors();
      if (!error && data) {
        setMfaFactors(data.totp || []);
      }
    };
    loadMfaFactors();
  }, []);

  const handleEnable2FA = async () => {
    setIsEnabling2FA(true);
    try {
      // Enroll a new TOTP factor
      const { data, error } = await supabase.auth.mfa.enroll({
        factorType: 'totp',
        friendlyName: 'Authenticator App',
      });

      if (error) throw error;

      if (data) {
        setQrCode(data.totp.qr_code);
        setTotpSecret(data.totp.secret);
        setFactorId(data.id);
        setMfaStep('verify');
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to enable 2FA');
    } finally {
      setIsEnabling2FA(false);
    }
  };

  const handleVerify2FA = async () => {
    if (verifyCode.length !== 6) {
      toast.error('Please enter a 6-digit code');
      return;
    }

    setIsEnabling2FA(true);
    try {
      // Create a challenge and verify
      const { data: challengeData, error: challengeError } = await supabase.auth.mfa.challenge({
        factorId: factorId,
      });

      if (challengeError) throw challengeError;

      const { error: verifyError } = await supabase.auth.mfa.verify({
        factorId: factorId,
        challengeId: challengeData.id,
        code: verifyCode,
      });

      if (verifyError) throw verifyError;

      toast.success('Two-factor authentication enabled successfully!');
      setMfaStep('enabled');
      
      // Refresh factors list
      const { data } = await supabase.auth.mfa.listFactors();
      if (data) {
        setMfaFactors(data.totp || []);
      }
      
      setIs2FADialogOpen(false);
      resetMfaState();
    } catch (error: any) {
      toast.error(error.message || 'Invalid verification code');
    } finally {
      setIsEnabling2FA(false);
    }
  };

  const handleDisable2FA = async (factorIdToRemove: string) => {
    setIsDisabling2FA(true);
    try {
      const { error } = await supabase.auth.mfa.unenroll({
        factorId: factorIdToRemove,
      });

      if (error) throw error;

      toast.success('Two-factor authentication disabled');
      
      // Refresh factors list
      const { data } = await supabase.auth.mfa.listFactors();
      if (data) {
        setMfaFactors(data.totp || []);
      }
    } catch (error: any) {
      toast.error(error.message || 'Failed to disable 2FA');
    } finally {
      setIsDisabling2FA(false);
    }
  };

  const resetMfaState = () => {
    setQrCode('');
    setTotpSecret('');
    setVerifyCode('');
    setFactorId('');
    setMfaStep('start');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  const handleSaveProfile = async () => {
    if (!user) return;

    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: formData.full_name,
          phone: formData.phone,
        })
        .eq('user_id', user.id);

      if (error) throw error;
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsSaving(false);
    }
  };

  const validatePasswordForm = () => {
    const newErrors: { password?: string; confirmPassword?: string } = {};
    
    try {
      passwordSchema.parse(newPassword);
    } catch (e) {
      if (e instanceof z.ZodError) {
        newErrors.password = e.errors[0].message;
      }
    }
    
    if (newPassword !== confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }
    
    setPasswordErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChangePassword = async () => {
    if (!validatePasswordForm()) return;

    setIsChangingPassword(true);
    try {
      const { error } = await supabase.auth.updateUser({ password: newPassword });
      
      if (error) throw error;
      
      toast.success('Password updated successfully');
      setIsPasswordDialogOpen(false);
      setNewPassword('');
      setConfirmPassword('');
      setPasswordErrors({});
    } catch (error: any) {
      toast.error(error.message || 'Failed to update password');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const RequirementItem = ({ met, text }: { met: boolean; text: string }) => (
    <div className="flex items-center gap-2 text-xs">
      {met ? (
        <Check className="h-3 w-3 text-green-500" />
      ) : (
        <X className="h-3 w-3 text-muted-foreground" />
      )}
      <span className={cn(met ? 'text-green-600 dark:text-green-400' : 'text-muted-foreground')}>
        {text}
      </span>
    </div>
  );

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl">
      <div>
        <h1 className="text-3xl font-display font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      {/* Profile Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5 text-primary" />
            Profile Information
          </CardTitle>
          <CardDescription>Update your personal details</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar className="h-20 w-20">
              <AvatarImage src={profile?.avatar_url} />
              <AvatarFallback className="text-lg bg-primary text-primary-foreground">
                {getInitials(profile?.full_name || 'U')}
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{profile?.full_name}</h3>
              <p className="text-sm text-muted-foreground">{profile?.email}</p>
              <Button variant="outline" size="sm" className="mt-2">
                Change Avatar
              </Button>
            </div>
          </div>

          <Separator />

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="full_name">Full Name</Label>
              <Input
                id="full_name"
                value={formData.full_name}
                onChange={(e) => setFormData({ ...formData, full_name: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                value={profile?.email || ''}
                disabled
                className="bg-muted"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number</Label>
              <Input
                id="phone"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="+234 803 123 4567"
              />
            </div>
          </div>

          <Button onClick={handleSaveProfile} disabled={isSaving}>
            <Save className="mr-2 h-4 w-4" />
            {isSaving ? 'Saving...' : 'Save Changes'}
          </Button>
        </CardContent>
      </Card>

      {/* Notifications Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Bell className="h-5 w-5 text-primary" />
            Notifications
          </CardTitle>
          <CardDescription>Configure how you receive notifications</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">Receive updates via email</p>
            </div>
            <Switch
              checked={notifications.email}
              onCheckedChange={(checked) => {
                setNotifications({ ...notifications, email: checked });
                toast.success(checked ? 'Email notifications enabled' : 'Email notifications disabled');
              }}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Push Notifications</p>
              <p className="text-sm text-muted-foreground">Receive push notifications in browser</p>
            </div>
            <Switch
              checked={notifications.push}
              onCheckedChange={(checked) => {
                setNotifications({ ...notifications, push: checked });
                toast.success(checked ? 'Push notifications enabled' : 'Push notifications disabled');
              }}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Booking Confirmations</p>
              <p className="text-sm text-muted-foreground">Get notified about booking updates</p>
            </div>
            <Switch
              checked={notifications.booking}
              onCheckedChange={(checked) => {
                setNotifications({ ...notifications, booking: checked });
                toast.success(checked ? 'Booking confirmations enabled' : 'Booking confirmations disabled');
              }}
            />
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Marketing Updates</p>
              <p className="text-sm text-muted-foreground">Receive news and promotional offers</p>
            </div>
            <Switch
              checked={notifications.updates}
              onCheckedChange={(checked) => {
                setNotifications({ ...notifications, updates: checked });
                toast.success(checked ? 'Marketing updates enabled' : 'Marketing updates disabled');
              }}
            />
          </div>
        </CardContent>
      </Card>

      {/* Security Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="h-5 w-5 text-primary" />
            Security
          </CardTitle>
          <CardDescription>Manage your account security</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Change Password</p>
              <p className="text-sm text-muted-foreground">Update your account password</p>
            </div>
            <Dialog open={isPasswordDialogOpen} onOpenChange={setIsPasswordDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">Change Password</Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle>Change Password</DialogTitle>
                  <DialogDescription>
                    Enter your new password below. Make sure it meets all the requirements.
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="new-password">New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="new-password"
                        type="password"
                        placeholder="••••••••"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {passwordErrors.password && (
                      <p className="text-sm text-destructive">{passwordErrors.password}</p>
                    )}
                    
                    {/* Password Strength Indicator */}
                    {newPassword.length > 0 && (
                      <div className="space-y-2 pt-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-muted-foreground">Password strength:</span>
                          <span className={cn(
                            "text-xs font-medium",
                            passwordStrength.score >= 4 ? "text-green-600 dark:text-green-400" :
                            passwordStrength.score >= 3 ? "text-yellow-600 dark:text-yellow-400" :
                            "text-orange-600 dark:text-orange-400"
                          )}>
                            {passwordStrength.label}
                          </span>
                        </div>
                        
                        {/* Strength bar */}
                        <div className="flex gap-1">
                          {[1, 2, 3, 4, 5].map((level) => (
                            <div
                              key={level}
                              className={cn(
                                "h-1.5 flex-1 rounded-full transition-colors",
                                level <= passwordStrength.score
                                  ? passwordStrength.color
                                  : "bg-muted"
                              )}
                            />
                          ))}
                        </div>

                        {/* Requirements checklist */}
                        <div className="grid grid-cols-2 gap-1 pt-1">
                          <RequirementItem met={passwordStrength.requirements.minLength} text="8+ characters" />
                          <RequirementItem met={passwordStrength.requirements.hasUppercase} text="Uppercase" />
                          <RequirementItem met={passwordStrength.requirements.hasLowercase} text="Lowercase" />
                          <RequirementItem met={passwordStrength.requirements.hasNumber} text="Number" />
                          <RequirementItem met={passwordStrength.requirements.hasSpecial} text="Special char (bonus)" />
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="confirm-new-password">Confirm New Password</Label>
                    <div className="relative">
                      <Lock className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                      <Input
                        id="confirm-new-password"
                        type="password"
                        placeholder="••••••••"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        className="pl-10"
                      />
                    </div>
                    {passwordErrors.confirmPassword && (
                      <p className="text-sm text-destructive">{passwordErrors.confirmPassword}</p>
                    )}
                    {confirmPassword.length > 0 && newPassword === confirmPassword && (
                      <div className="flex items-center gap-2 text-xs text-green-600 dark:text-green-400">
                        <Check className="h-3 w-3" />
                        <span>Passwords match</span>
                      </div>
                    )}
                  </div>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setIsPasswordDialogOpen(false);
                      setNewPassword('');
                      setConfirmPassword('');
                      setPasswordErrors({});
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleChangePassword} disabled={isChangingPassword}>
                    {isChangingPassword && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                    Update Password
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
          <Separator />
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Two-Factor Authentication</p>
              <p className="text-sm text-muted-foreground">
                {mfaFactors.length > 0 
                  ? 'Your account is protected with 2FA' 
                  : 'Add an extra layer of security'}
              </p>
            </div>
            {mfaFactors.length > 0 ? (
              <div className="flex items-center gap-2">
                <Badge variant="default" className="bg-green-600">
                  <Check className="h-3 w-3 mr-1" />
                  Enabled
                </Badge>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => handleDisable2FA(mfaFactors[0].id)}
                  disabled={isDisabling2FA}
                >
                  {isDisabling2FA ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Disable'}
                </Button>
              </div>
            ) : (
              <Dialog open={is2FADialogOpen} onOpenChange={(open) => {
                setIs2FADialogOpen(open);
                if (!open) resetMfaState();
              }}>
                <DialogTrigger asChild>
                  <Button variant="outline">Enable 2FA</Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Enable Two-Factor Authentication</DialogTitle>
                    <DialogDescription>
                      {mfaStep === 'start' 
                        ? 'Secure your account with an authenticator app like Google Authenticator or Authy.'
                        : 'Scan the QR code with your authenticator app, then enter the 6-digit code.'}
                    </DialogDescription>
                  </DialogHeader>
                  
                  {mfaStep === 'start' && (
                    <div className="space-y-4 py-4">
                      <div className="rounded-lg bg-muted p-4">
                        <h4 className="font-medium mb-2">How it works:</h4>
                        <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                          <li>Click "Generate QR Code" below</li>
                          <li>Scan the QR code with your authenticator app</li>
                          <li>Enter the 6-digit code from the app</li>
                        </ol>
                      </div>
                      <Button onClick={handleEnable2FA} disabled={isEnabling2FA} className="w-full">
                        {isEnabling2FA ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Generating...
                          </>
                        ) : (
                          'Generate QR Code'
                        )}
                      </Button>
                    </div>
                  )}

                  {mfaStep === 'verify' && (
                    <div className="space-y-4 py-4">
                      {qrCode && (
                        <div className="flex flex-col items-center gap-4">
                          <div className="bg-white p-4 rounded-lg">
                            <img src={qrCode} alt="2FA QR Code" className="w-48 h-48" />
                          </div>
                          <div className="text-center">
                            <p className="text-xs text-muted-foreground mb-1">Can't scan? Enter this code manually:</p>
                            <code className="text-xs bg-muted px-2 py-1 rounded font-mono break-all">
                              {totpSecret}
                            </code>
                          </div>
                        </div>
                      )}
                      <div className="space-y-2">
                        <Label htmlFor="verify-code">Enter 6-digit code</Label>
                        <Input
                          id="verify-code"
                          type="text"
                          placeholder="000000"
                          value={verifyCode}
                          onChange={(e) => setVerifyCode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                          className="text-center text-2xl tracking-widest font-mono"
                          maxLength={6}
                        />
                      </div>
                      <Button onClick={handleVerify2FA} disabled={isEnabling2FA || verifyCode.length !== 6} className="w-full">
                        {isEnabling2FA ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Verifying...
                          </>
                        ) : (
                          'Verify & Enable 2FA'
                        )}
                      </Button>
                    </div>
                  )}
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Appearance Section */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5 text-primary" />
            Appearance
          </CardTitle>
          <CardDescription>Customize the look and feel</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Dark Mode</p>
              <p className="text-sm text-muted-foreground">Use dark theme</p>
            </div>
            <Switch 
              checked={theme === 'dark'}
              onCheckedChange={(checked) => setTheme(checked ? 'dark' : 'light')}
            />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
