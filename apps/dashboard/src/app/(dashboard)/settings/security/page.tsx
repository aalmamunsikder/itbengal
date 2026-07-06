'use client';

import { useState } from 'react';
import { useAuthStore } from '@/stores/authStore';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { Loader2, Check, AlertCircle, Shield, Key, Copy, AlertTriangle } from 'lucide-react';

interface ApiResponse<T> {
  success: boolean;
  data: T;
}

export default function SecuritySettingsPage() {
  const { user, setUser } = useAuthStore();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  
  // Password change states
  const [pwSaving, setPwSaving] = useState(false);
  const [pwSuccess, setPwSuccess] = useState(false);
  const [pwError, setPwError] = useState<string | null>(null);

  // 2FA states
  const [tfaLoading, setTfaLoading] = useState(false);
  const [tfaSetupData, setTfaSetupData] = useState<{ qrCodeUrl: string; secret: string; backupCodes: string[] } | null>(null);
  const [verificationCode, setVerificationCode] = useState('');
  const [tfaError, setTfaError] = useState<string | null>(null);
  const [tfaSuccess, setTfaSuccess] = useState(false);
  const [disablePassword, setDisablePassword] = useState('');
  const [showDisableForm, setShowDisableForm] = useState(false);
  const [copiedCodes, setCopiedCodes] = useState(false);

  const changePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword !== confirmPassword) {
      setPwError('New passwords do not match');
      return;
    }

    setPwSaving(true);
    setPwSuccess(false);
    setPwError(null);

    try {
      await api.post('/users/me/change-password', {
        currentPassword,
        newPassword,
      });
      setPwSuccess(true);
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      setTimeout(() => setPwSuccess(false), 3000);
    } catch (err) {
      setPwError(err instanceof Error ? err.message : 'Failed to change password');
    } finally {
      setPwSaving(false);
    }
  };

  const setup2fa = async () => {
    setTfaLoading(true);
    setTfaError(null);
    try {
      const res = await api.post<ApiResponse<any>>('/auth/2fa/setup');
      setTfaSetupData(res.data);
    } catch (err) {
      setTfaError(err instanceof Error ? err.message : 'Failed to setup 2FA');
    } finally {
      setTfaLoading(false);
    }
  };

  const verify2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    setTfaLoading(true);
    setTfaError(null);
    try {
      await api.post('/auth/2fa/verify', { code: verificationCode });
      setTfaSuccess(true);
      setTfaSetupData(null);
      setVerificationCode('');
      // Force refresh user to update state
      if (user) setUser({ ...user, role: user.role }); // trigger state reload
      setTimeout(() => setTfaSuccess(false), 3000);
    } catch (err) {
      setTfaError(err instanceof Error ? err.message : 'Invalid code');
    } finally {
      setTfaLoading(false);
    }
  };

  const disable2fa = async (e: React.FormEvent) => {
    e.preventDefault();
    setTfaLoading(true);
    setTfaError(null);
    try {
      await api.post('/auth/2fa/disable', { password: disablePassword });
      setTfaSuccess(true);
      setShowDisableForm(false);
      setDisablePassword('');
      setTimeout(() => setTfaSuccess(false), 3000);
    } catch (err) {
      setTfaError(err instanceof Error ? err.message : 'Incorrect password');
    } finally {
      setTfaLoading(false);
    }
  };

  const copyBackupCodes = () => {
    if (!tfaSetupData) return;
    navigator.clipboard.writeText(tfaSetupData.backupCodes.join('\n'));
    setCopiedCodes(true);
    setTimeout(() => setCopiedCodes(false), 2000);
  };

  const inputClass = 'w-full px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-sm focus:ring-2 focus:ring-primary-500 focus:border-transparent';

  return (
    <div className="space-y-6">
      {/* Change Password Card */}
      <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700/50 p-6 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Key className="w-5 h-5 text-primary-500" /> Change Password
          </h2>
          <p className="text-sm text-gray-500 mt-1">Ensure your account is using a long, random password</p>
        </div>

        <form onSubmit={changePassword} className="space-y-4 max-w-md">
          {pwError && (
            <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{pwError}</span>
            </div>
          )}

          {pwSuccess && (
            <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
              <Check className="w-4 h-4 shrink-0" />
              <span>Password changed successfully!</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Current Password</label>
            <input type="password" value={currentPassword} onChange={e => setCurrentPassword(e.target.value)} className={inputClass} required />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">New Password</label>
            <input type="password" value={newPassword} onChange={e => setNewPassword(e.target.value)} className={inputClass} required />
          </div>

          <div>
            <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Confirm New Password</label>
            <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} className={inputClass} required />
          </div>

          <div className="flex justify-end pt-2">
            <button type="submit" disabled={pwSaving || !currentPassword || !newPassword || !confirmPassword} className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 disabled:opacity-40 text-white font-medium text-sm flex items-center gap-2 transition-all">
              {pwSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />} Update Password
            </button>
          </div>
        </form>
      </div>

      {/* Two-Factor Authentication Card */}
      <div className="bg-white dark:bg-gray-800/50 rounded-2xl border border-gray-200 dark:border-gray-700/50 p-6 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Shield className="w-5 h-5 text-primary-500" /> Two-Factor Authentication
          </h2>
          <p className="text-sm text-gray-500 mt-1">Add an extra layer of security to your account</p>
        </div>

        {tfaSuccess && (
          <div className="p-4 rounded-xl bg-emerald-50 dark:bg-emerald-900/20 border border-emerald-200 dark:border-emerald-800 text-sm text-emerald-600 dark:text-emerald-400 flex items-center gap-2">
            <Check className="w-4 h-4 shrink-0" />
            <span>Two-factor authentication status updated.</span>
          </div>
        )}

        {tfaError && (
          <div className="p-4 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-sm text-red-600 dark:text-red-400 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{tfaError}</span>
          </div>
        )}

        {/* Setup wizard / details */}
        {!tfaSetupData && !showDisableForm && (
          <div className="space-y-4">
            <p className="text-sm text-gray-600 dark:text-gray-400">
              When two-factor authentication is enabled, you will be prompted for a secure, random token during authentication. You may retrieve this token from your phone's authenticator application.
            </p>
            <div className="pt-2">
              <button onClick={setup2fa} disabled={tfaLoading} className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm flex items-center gap-2 disabled:opacity-40 transition-all">
                {tfaLoading && <Loader2 className="w-4 h-4 animate-spin" />} Enable 2FA
              </button>
            </div>
          </div>
        )}

        {/* 2FA Setup Flow */}
        {tfaSetupData && (
          <div className="space-y-6 max-w-lg">
            <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 text-sm text-amber-700 dark:text-amber-400 flex items-start gap-2.5">
              <AlertTriangle className="w-5 h-5 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Backup Codes Warning</p>
                <p className="mt-0.5 text-xs text-amber-600 dark:text-amber-500">Store these backup codes in a safe place. They can be used to access your account if you lose your device.</p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row items-center gap-6">
              {tfaSetupData.qrCodeUrl && (
                <div className="bg-white p-3 rounded-xl border border-gray-200 shrink-0">
                  <img src={tfaSetupData.qrCodeUrl} alt="2FA QR Code" className="w-40 h-40" />
                </div>
              )}
              <div className="space-y-3 w-full">
                <p className="text-sm text-gray-600 dark:text-gray-400">Scan this QR code with Google Authenticator, Authy, or 1Password. If you cannot scan the code, enter the secret key manually:</p>
                <code className="block bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg p-2.5 text-xs font-mono break-all text-gray-900 dark:text-white">{tfaSetupData.secret}</code>
              </div>
            </div>

            {/* Backup codes */}
            <div className="bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Backup Codes</span>
                <button onClick={copyBackupCodes} className="text-xs text-primary-600 hover:underline flex items-center gap-1">
                  {copiedCodes ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />} {copiedCodes ? 'Copied' : 'Copy All'}
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 text-xs font-mono text-gray-700 dark:text-gray-300">
                {tfaSetupData.backupCodes.map((code, idx) => (
                  <div key={idx} className="bg-white dark:bg-gray-800 border border-gray-150 dark:border-gray-700/50 rounded-lg py-1.5 px-3">{code}</div>
                ))}
              </div>
            </div>

            {/* Verify code */}
            <form onSubmit={verify2fa} className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Verification Code</label>
                <input value={verificationCode} onChange={e => setVerificationCode(e.target.value)} placeholder="000000" className={cn(inputClass, 'font-mono text-center max-w-[150px] tracking-[0.25em] text-lg')} maxLength={6} required />
              </div>
              <div className="flex gap-3">
                <button type="submit" disabled={tfaLoading || verificationCode.length < 6} className="px-5 py-2.5 rounded-xl bg-primary-600 hover:bg-primary-700 text-white font-medium text-sm flex items-center gap-2 transition-all">
                  {tfaLoading && <Loader2 className="w-4 h-4 animate-spin" />} Verify & Activate
                </button>
                <button type="button" onClick={() => setTfaSetupData(null)} className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
              </div>
            </form>
          </div>
        )}

        {/* Disable form */}
        {showDisableForm && (
          <form onSubmit={disable2fa} className="space-y-4 max-w-md">
            <p className="text-sm text-gray-600 dark:text-gray-400">To disable two-factor authentication, please enter your current account password.</p>
            <div>
              <label className="block text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1.5">Current Password</label>
              <input type="password" value={disablePassword} onChange={e => setDisablePassword(e.target.value)} className={inputClass} required />
            </div>
            <div className="flex gap-3">
              <button type="submit" disabled={tfaLoading} className="px-5 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-medium text-sm flex items-center gap-2 transition-all">
                {tfaLoading && <Loader2 className="w-4 h-4 animate-spin" />} Disable 2FA
              </button>
              <button type="button" onClick={() => setShowDisableForm(false)} className="px-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-700 text-sm hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">Cancel</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
