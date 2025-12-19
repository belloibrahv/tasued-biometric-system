'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  User, Lock, Fingerprint, Bell, Shield, Palette, Globe,
  Eye, EyeOff, Camera, Save, Loader2, CheckCircle, AlertTriangle,
  Smartphone, Monitor, LogOut
} from 'lucide-react';
import { toast } from 'sonner';

const tabs = [
  { id: 'profile', name: 'Profile', icon: User },
  { id: 'security', name: 'Security', icon: Lock },
  { id: 'biometric', name: 'Biometric', icon: Fingerprint },
  { id: 'notifications', name: 'Notifications', icon: Bell },
  { id: 'privacy', name: 'Privacy', icon: Shield },
];

const activeSessions = [
  { id: 1, device: 'Chrome on MacOS', location: 'Lagos, Nigeria', lastActive: 'Now', current: true },
  { id: 2, device: 'Safari on iPhone', location: 'Lagos, Nigeria', lastActive: '2 hours ago', current: false },
];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState('profile');
  const [saving, setSaving] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [passkeyBusy, setPasskeyBusy] = useState(false);

  // WebAuthn helpers
  function b64urlToArrayBuffer(b64url: string) {
    const pad = '='.repeat((4 - (b64url.length % 4)) % 4);
    const base64 = (b64url + pad).replace(/-/g, '+').replace(/_/g, '/');
    const raw = atob(base64);
    const arr = new Uint8Array(raw.length);
    for (let i = 0; i < raw.length; i++) arr[i] = raw.charCodeAt(i);
    return arr.buffer;
  }
  function arrayBufferToB64url(buf: ArrayBuffer) {
    const bytes = new Uint8Array(buf);
    let binary = '';
    for (let i = 0; i < bytes.length; i++) binary += String.fromCharCode(bytes[i]);
    return btoa(binary).replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
  }

  async function registerPasskey() {
    try {
      setPasskeyBusy(true);
      const optionsRes = await fetch('/api/webauthn/register/options', { method: 'POST' });
      const options = await optionsRes.json();
      if (!optionsRes.ok) throw new Error(options.error || 'Failed to get options');

      // Convert to proper types
      const publicKey: any = {
        ...options,
        challenge: b64urlToArrayBuffer(options.challenge),
        user: {
          ...options.user,
          id: b64urlToArrayBuffer(options.user.id),
        },
      };

      const cred: any = await (navigator as any).credentials.create({ publicKey });
      if (!cred) throw new Error('Credential creation returned null');

      const payload = {
        id: cred.id,
        rawId: arrayBufferToB64url(cred.rawId),
        type: cred.type,
        response: {
          clientDataJSON: arrayBufferToB64url(cred.response.clientDataJSON),
          attestationObject: cred.response.attestationObject ? arrayBufferToB64url(cred.response.attestationObject) : undefined,
          publicKey: 'placeholder',
          transports: (cred as any).response?.transports || [],
        }
      };

      const verifyRes = await fetch('/api/webauthn/register/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const verify = await verifyRes.json();
      if (!verifyRes.ok || !verify.success) throw new Error(verify.error || 'Passkey register failed');
      toast.success('Passkey registered');
    } catch (e: any) {
      toast.error('Passkey error', { description: e.message });
    } finally {
      setPasskeyBusy(false);
    }
  }

  async function authenticatePasskey() {
    try {
      setPasskeyBusy(true);
      const optionsRes = await fetch('/api/webauthn/authenticate/options', { method: 'POST' });
      const options = await optionsRes.json();
      if (!optionsRes.ok) throw new Error(options.error || 'Failed to get options');

      const publicKey: any = {
        ...options,
        challenge: b64urlToArrayBuffer(options.challenge),
        allowCredentials: (options.allowCredentials || []).map((c: any) => ({ ...c, id: b64urlToArrayBuffer(c.id) })),
      };

      const assertion: any = await (navigator as any).credentials.get({ publicKey });
      if (!assertion) throw new Error('No assertion');

      const payload = {
        id: assertion.id,
        rawId: arrayBufferToB64url(assertion.rawId),
        type: assertion.type,
        response: {
          clientDataJSON: arrayBufferToB64url(assertion.response.clientDataJSON),
          authenticatorData: assertion.response.authenticatorData ? arrayBufferToB64url(assertion.response.authenticatorData) : undefined,
          signature: assertion.response.signature ? arrayBufferToB64url(assertion.response.signature) : undefined,
          userHandle: assertion.response.userHandle ? arrayBufferToB64url(assertion.response.userHandle) : undefined,
        }
      };

      const verifyRes = await fetch('/api/webauthn/authenticate/verify', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) });
      const verify = await verifyRes.json();
      if (!verifyRes.ok || !verify.success) throw new Error(verify.error || 'Passkey authentication failed');
      toast.success('Passkey authenticated');
    } catch (e: any) {
      toast.error('Passkey error', { description: e.message });
    } finally {
      setPasskeyBusy(false);
    }
  }

  const [profile, setProfile] = useState({
    firstName: 'John',
    lastName: 'Doe',
    email: 'john.doe@student.tasued.edu.ng',
    phone: '+234 800 000 0000',
    department: 'Computer Science',
    level: '400',
  });

  const [notifications, setNotifications] = useState({
    email: true,
    sms: false,
    push: true,
    verificationAlerts: true,
    securityAlerts: true,
    serviceUpdates: false,
  });

  const handleSave = async () => {
    setSaving(true);
    await new Promise(resolve => setTimeout(resolve, 1500));
    setSaving(false);
    toast.success('Settings saved successfully');
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-surface-950">Settings</h1>
        <p className="text-surface-500 mt-1">Manage your account settings and preferences</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? 'bg-brand-500 text-white'
                : 'bg-surface-100 text-surface-600 hover:bg-surface-200'
            }`}
          >
            <tab.icon size={18} />
            {tab.name}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <motion.div
        key={activeTab}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-6"
      >
        {/* Profile Tab */}
        {activeTab === 'profile' && (
          <div className="space-y-6">
            <div className="flex items-center gap-6">
              <div className="relative">
                <div className="w-24 h-24 rounded-full bg-brand-100 flex items-center justify-center text-brand-600">
                  <User size={40} />
                </div>
                <button className="absolute bottom-0 right-0 p-2 bg-brand-500 rounded-full text-white hover:bg-brand-600 transition-colors">
                  <Camera size={16} />
                </button>
              </div>
              <div>
                <h3 className="font-bold text-surface-900">{profile.firstName} {profile.lastName}</h3>
                <p className="text-sm text-surface-500">{profile.email}</p>
                <span className="badge badge-success mt-2">Verified Student</span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="input-label">First Name</label>
                <input type="text" value={profile.firstName} onChange={(e) => setProfile({...profile, firstName: e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="input-label">Last Name</label>
                <input type="text" value={profile.lastName} onChange={(e) => setProfile({...profile, lastName: e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="input-label">Email</label>
                <input type="email" value={profile.email} disabled className="input-field bg-surface-50" />
              </div>
              <div>
                <label className="input-label">Phone Number</label>
                <input type="tel" value={profile.phone} onChange={(e) => setProfile({...profile, phone: e.target.value})} className="input-field" />
              </div>
              <div>
                <label className="input-label">Department</label>
                <input type="text" value={profile.department} disabled className="input-field bg-surface-50" />
              </div>
              <div>
                <label className="input-label">Level</label>
                <input type="text" value={profile.level} disabled className="input-field bg-surface-50" />
              </div>
            </div>
          </div>
        )}

        {/* Security Tab */}
        {activeTab === 'security' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-surface-900 mb-4">Change Password</h3>
              <div className="space-y-4 max-w-md">
                <div>
                  <label className="input-label">Current Password</label>
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} className="input-field pr-10" placeholder="••••••••" />
                    <button onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-surface-400">
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label className="input-label">New Password</label>
                  <input type="password" className="input-field" placeholder="••••••••" />
                </div>
                <div>
                  <label className="input-label">Confirm New Password</label>
                  <input type="password" className="input-field" placeholder="••••••••" />
                </div>
                <button className="btn-primary py-2 px-4 text-sm">Update Password</button>
              </div>
            </div>

            <div className="pt-6 border-t border-surface-200">
              <h3 className="font-bold text-surface-900 mb-4">Active Sessions</h3>
              <div className="space-y-3">
                {activeSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between p-4 bg-surface-50 rounded-xl">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-surface-200 rounded-lg">
                        {session.device.includes('iPhone') ? <Smartphone size={20} /> : <Monitor size={20} />}
                      </div>
                      <div>
                        <p className="font-medium text-surface-900">{session.device}</p>
                        <p className="text-sm text-surface-500">{session.location} • {session.lastActive}</p>
                      </div>
                    </div>
                    {session.current ? (
                      <span className="badge badge-success">Current</span>
                    ) : (
                      <button className="text-sm text-error-500 font-semibold hover:underline">Revoke</button>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Biometric Tab */}
        {activeTab === 'biometric' && (
          <div className="space-y-6">
            <div className="bg-success-50 border border-success-200 rounded-xl p-4 flex items-start gap-3">
              <CheckCircle className="text-success-500 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-semibold text-success-700">Biometric Data Enrolled</p>
                <p className="text-sm text-success-600">Your fingerprint and facial data are securely stored</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-surface-50 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <Fingerprint size={24} className="text-brand-500" />
                  <span className="font-semibold text-surface-900">Fingerprint</span>
                </div>
                <p className="text-sm text-surface-500 mb-3">Last updated: Dec 15, 2024</p>
                <button className="btn-outline py-2 px-4 text-sm w-full">Re-enroll Fingerprint</button>
              </div>
              <div className="p-4 bg-surface-50 rounded-xl">
                <div className="flex items-center gap-3 mb-3">
                  <Camera size={24} className="text-brand-500" />
                  <span className="font-semibold text-surface-900">Facial Recognition</span>
                </div>
                <p className="text-sm text-surface-500 mb-3">Last updated: Dec 15, 2024</p>
                <button className="btn-outline py-2 px-4 text-sm w-full">Update Face Data</button>
              </div>
            </div>

            <div className="pt-6 border-t border-surface-200">
              <div className="bg-warning-50 border border-warning-200 rounded-xl p-4 flex items-start gap-3">
                <AlertTriangle className="text-warning-500 flex-shrink-0 mt-0.5" size={20} />
                <div>
                  <p className="font-semibold text-warning-700">Delete Biometric Data</p>
                  <p className="text-sm text-warning-600 mb-3">This will remove all your biometric data. You&apos;ll need to re-enroll to use biometric features.</p>
                  <button className="btn-danger py-2 px-4 text-sm">Delete All Biometric Data</button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Notifications Tab */}
        {activeTab === 'notifications' && (
          <div className="space-y-6">
            <div>
              <h3 className="font-bold text-surface-900 mb-4">Notification Channels</h3>
              <div className="space-y-3">
                {[
                  { key: 'email', label: 'Email Notifications', desc: 'Receive updates via email' },
                  { key: 'sms', label: 'SMS Notifications', desc: 'Receive updates via SMS' },
                  { key: 'push', label: 'Push Notifications', desc: 'Browser push notifications' },
                ].map((item) => (
                  <label key={item.key} className="flex items-center justify-between p-4 bg-surface-50 rounded-xl cursor-pointer">
                    <div>
                      <p className="font-medium text-surface-900">{item.label}</p>
                      <p className="text-sm text-surface-500">{item.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications[item.key as keyof typeof notifications]}
                      onChange={(e) => setNotifications({...notifications, [item.key]: e.target.checked})}
                      className="w-5 h-5 rounded border-surface-300 text-brand-500 focus:ring-brand-500"
                    />
                  </label>
                ))}
              </div>
            </div>

            <div className="pt-6 border-t border-surface-200">
              <h3 className="font-bold text-surface-900 mb-4">Notification Types</h3>
              <div className="space-y-3">
                {[
                  { key: 'verificationAlerts', label: 'Verification Alerts', desc: 'When your identity is verified' },
                  { key: 'securityAlerts', label: 'Security Alerts', desc: 'Suspicious activity warnings' },
                  { key: 'serviceUpdates', label: 'Service Updates', desc: 'New features and updates' },
                ].map((item) => (
                  <label key={item.key} className="flex items-center justify-between p-4 bg-surface-50 rounded-xl cursor-pointer">
                    <div>
                      <p className="font-medium text-surface-900">{item.label}</p>
                      <p className="text-sm text-surface-500">{item.desc}</p>
                    </div>
                    <input
                      type="checkbox"
                      checked={notifications[item.key as keyof typeof notifications]}
                      onChange={(e) => setNotifications({...notifications, [item.key]: e.target.checked})}
                      className="w-5 h-5 rounded border-surface-300 text-brand-500 focus:ring-brand-500"
                    />
                  </label>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Privacy Tab */}
        {activeTab === 'privacy' && (
          <div className="space-y-6">
            <div className="bg-info-50 border border-info-200 rounded-xl p-4 flex items-start gap-3">
              <Shield className="text-info-500 flex-shrink-0 mt-0.5" size={20} />
              <div>
                <p className="font-semibold text-info-700">Your Privacy Matters</p>
                <p className="text-sm text-info-600">Control how your data is used and shared across services</p>
              </div>
            </div>

            <div className="space-y-3">
              {[
                { label: 'Share access history with services', desc: 'Allow connected services to see your verification history' },
                { label: 'Anonymous usage statistics', desc: 'Help improve BioVault with anonymous usage data' },
                { label: 'Third-party data sharing', desc: 'Share data with approved university partners' },
              ].map((item, idx) => (
                <label key={idx} className="flex items-center justify-between p-4 bg-surface-50 rounded-xl cursor-pointer">
                  <div>
                    <p className="font-medium text-surface-900">{item.label}</p>
                    <p className="text-sm text-surface-500">{item.desc}</p>
                  </div>
                  <input type="checkbox" defaultChecked={idx === 0} className="w-5 h-5 rounded border-surface-300 text-brand-500 focus:ring-brand-500" />
                </label>
              ))}
            </div>
          </div>
        )}
      </motion.div>

      {/* Save Button */}
      <button onClick={handleSave} disabled={saving} className="btn-primary w-full py-3 flex items-center justify-center gap-2">
        {saving ? <Loader2 className="animate-spin" size={20} /> : <Save size={20} />}
        {saving ? 'Saving...' : 'Save Changes'}
      </button>
    </div>
  );
}
