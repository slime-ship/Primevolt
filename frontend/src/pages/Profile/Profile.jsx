import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/api';
import { User, Lock, MapPin, ShieldCheck, QrCode, Clipboard, AlertCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';

const Profile = () => {
  const { t } = useTranslation();
  const { user, fetchUserMe } = useAuth();
  
  // Profile update form states
  const [fullName, setFullName] = useState(user?.full_name || '');
  const [phone, setPhone] = useState(user?.phone || '');
  const [address, setAddress] = useState(user?.address || '');
  const [city, setCity] = useState(user?.city || '');
  const [state, setState] = useState(user?.state || '');
  const [country, setCountry] = useState(user?.country || '');
  const [zipCode, setZipCode] = useState(user?.zip_code || '');

  // Profile picture upload state
  const [uploadingPic, setUploadingPic] = useState(false);

  const handleProfilePictureUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    
    if (file.size > 5 * 1024 * 1024) {
      setError('File size exceeds the 5MB limit.');
      return;
    }

    setUploadingPic(true);
    setError('');
    setSuccess('');
    
    const formData = new FormData();
    formData.append('profile_picture', file);
    
    try {
      const res = await api.post('users/me/profile-picture/', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      setSuccess('Profile picture uploaded successfully.');
      await fetchUserMe();
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to upload profile picture.');
    } finally {
      setUploadingPic(false);
    }
  };


  // 2FA Setup states
  const [twoFaLoading, setTwoFaLoading] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState('');
  const [secretCode, setSecretCode] = useState('');
  const [verifyCode, setVerifyCode] = useState('');
  const [show2FaSetup, setShow2FaSetup] = useState(false);

  // General alert states
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (user) {
      setFullName(user.full_name || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      setCity(user.city || '');
      setState(user.state || '');
      setCountry(user.country || '');
      setZipCode(user.zip_code || '');
    }
  }, [user]);

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.put('users/me/', {
        full_name: fullName,
        phone: phone,
        address: address,
        city: city,
        state: state,
        country: country,
        zip_code: zipCode
      });
      setSuccess('Profile information updated successfully.');
      await fetchUserMe();
    } catch (err) {
      setError(err.response?.data?.phone || 'Failed to update profile details.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnable2FA = async () => {
    setTwoFaLoading(true);
    setError('');
    setSuccess('');
    try {
      const res = await api.post('auth/2fa/enable/');
      const { secret, provisioning_uri } = res.data;
      setSecretCode(secret);
      // Generate QR Code URL using free API
      const encodedUri = encodeURIComponent(provisioning_uri);
      setQrCodeUrl(`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodedUri}`);
      setShow2FaSetup(true);
    } catch (err) {
      setError('Could not generate 2FA credentials.');
    } finally {
      setTwoFaLoading(false);
    }
  };

  const handleVerify2FA = async (e) => {
    e.preventDefault();
    if (!verifyCode) return;
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      await api.post('auth/2fa/verify/', { code: verifyCode });
      setSuccess('2-Factor Authentication has been successfully enabled.');
      setShow2FaSetup(false);
      setVerifyCode('');
      await fetchUserMe();
    } catch (err) {
      setError(err.response?.data?.error || 'Invalid 2FA code. Please verify and try again.');
    } finally {
      setLoading(false);
    }
  };

  const copySecret = () => {
    navigator.clipboard.writeText(secretCode);
    setSuccess('Secret key copied to clipboard.');
  };

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-6 lg:px-8 min-h-[calc(100vh-4rem)] text-left">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <User className="text-cyanAccent" /> {t('Personal Account & Security')}
        </h1>
        <p className="text-xs text-gray-400">{t('Manage your profile information and configure 2-factor authenticator protocols.')}</p>
      </div>

      {error && (
        <div className="rounded-md bg-red-950/40 border border-red-500/50 p-4 text-xs text-red-200 mb-6">
          ⚠ {error}
        </div>
      )}

      {success && (
        <div className="rounded-md bg-emerald-950/40 border border-emerald-500/50 p-4 text-xs text-emerald-200 mb-6">
          ✓ {success}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2 Cols: Profile Form */}
        <div className="lg:col-span-2 space-y-6">
          <div className="glass-panel p-6 rounded-xl">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <User size={18} className="text-cyanAccent" /> {t('Profile Information')}
            </h2>

            {/* Profile Picture Upload Section */}
            <div className="flex flex-col sm:flex-row items-center gap-6 mb-6 pb-6 border-b border-slate-200 dark:border-gray-850">
              <div className="relative h-20 w-20 rounded-full overflow-hidden bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 flex items-center justify-center">
                {user?.profile_picture ? (
                  <img src={user.profile_picture} alt="Profile" className="h-full w-full object-cover" />
                ) : (
                  <User size={36} className="text-slate-400" />
                )}
              </div>
              <div className="text-center sm:text-left">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-1">{t('Profile Photo')}</h3>
                <p className="text-[10px] text-gray-400 mb-3">{t('Upload a new photo for your profile avatar. PNG or JPEG up to 5MB.')}</p>
                <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                  <label className="cursor-pointer bg-slate-200 hover:bg-slate-300 dark:bg-gray-800 dark:hover:bg-gray-700 text-slate-800 dark:text-white font-bold text-[10px] px-3 py-1.5 rounded transition">
                    {t('Choose Photo')}
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleProfilePictureUpload}
                      disabled={uploadingPic}
                    />
                  </label>
                  {uploadingPic && (
                    <span className="text-[10px] text-cyanAccent animate-pulse">{t('Uploading...')}</span>
                  )}
                </div>
              </div>
            </div>

            <form onSubmit={handleUpdateProfile} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-2">{t('Username')}</label>
                  <input
                    type="text"
                    disabled
                    className="w-full p-2.5 rounded bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 text-gray-500 text-xs cursor-not-allowed"
                    value={user?.username || ''}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-2">{t('Email Address')}</label>
                  <input
                    type="email"
                    disabled
                    className="w-full p-2.5 rounded bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 text-gray-500 text-xs cursor-not-allowed"
                    value={user?.email || ''}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-2">{t('Full Name')}</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter full name"
                    className="w-full p-2.5 rounded glass-input text-xs"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-2">{t('Phone Number')}</label>
                  <input
                    type="text"
                    placeholder="+1 234 567 8900"
                    className="w-full p-2.5 rounded glass-input text-xs"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-6 border-t border-slate-200 dark:border-gray-850 pt-4">
                <h3 className="text-xs font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                  <MapPin size={16} className="text-cyanAccent" /> {t('Address Details')}
                </h3>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                  <div className="sm:col-span-2">
                    <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-2">{t('Residential Address')}</label>
                    <input
                      type="text"
                      placeholder="Street Address, Apt, Suite"
                      className="w-full p-2.5 rounded glass-input text-xs"
                      value={address}
                      onChange={(e) => setAddress(e.target.value)}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  <div className="col-span-2 sm:col-span-1">
                    <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-2">{t('City')}</label>
                    <input
                      type="text"
                      placeholder="City"
                      className="w-full p-2.5 rounded glass-input text-xs"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-2">{t('State / Region')}</label>
                    <input
                      type="text"
                      placeholder="State"
                      className="w-full p-2.5 rounded glass-input text-xs"
                      value={state}
                      onChange={(e) => setState(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-2">{t('Country')}</label>
                    <input
                      type="text"
                      placeholder="Country"
                      className="w-full p-2.5 rounded glass-input text-xs"
                      value={country}
                      onChange={(e) => setCountry(e.target.value)}
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-2">{t('ZIP Code')}</label>
                    <input
                      type="text"
                      placeholder="ZIP"
                      className="w-full p-2.5 rounded glass-input text-xs"
                      value={zipCode}
                      onChange={(e) => setZipCode(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="pt-4 text-right">
                <button
                  type="submit"
                  disabled={loading}
                  className="bg-cyanAccent text-black font-bold text-xs px-6 py-2.5 rounded hover:opacity-90 transition"
                >
                  {loading ? t('Saving details...') : t('Save Profile Changes')}
                </button>
              </div>
            </form>
          </div>
        </div>

        {/* Right Col: Security/2FA */}
        <div className="space-y-6">
          <div className="glass-panel p-6 rounded-xl">
            <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
              <Lock size={18} className="text-cyanAccent" /> {t('2-Factor Authentication (2FA)')}
            </h2>

            {user?.is_2fa_enabled ? (
              <div className="p-4 rounded-lg bg-emerald-950/20 border border-emerald-500/30 text-emerald-400 text-xs">
                <div className="flex items-center gap-2 font-bold mb-1">
                  <ShieldCheck size={18} />
                  <span>{t('2FA Protocol is ACTIVE')}</span>
                </div>
                <p className="text-[10px] text-gray-400">{t('Withdrawals and high-risk operations require Google Authenticator confirmation codes.')}</p>
              </div>
            ) : (
              <div>
                <div className="p-4 rounded-lg bg-yellow-500/5 border border-yellow-500/20 text-yellow-500 text-xs mb-4">
                  <div className="flex items-center gap-2 font-bold mb-1">
                    <AlertCircle size={16} />
                    <span>{t('2FA Protocol is INACTIVE')}</span>
                  </div>
                  <p className="text-[10px] text-gray-400">{t('Please secure your account balance. Set up Google Authenticator to enable withdrawals.')}</p>
                </div>

                {!show2FaSetup ? (
                  <button
                    onClick={handleEnable2FA}
                    disabled={twoFaLoading}
                    className="w-full py-2.5 bg-cyanAccent text-black font-bold text-xs rounded hover:opacity-90 disabled:opacity-50 transition"
                  >
                    {twoFaLoading ? t('Provisioning...') : t('Setup Authenticator 2FA')}
                  </button>
                ) : (
                  <div className="space-y-6 pt-2">
                    {/* QR Code and Secret display */}
                    <div className="flex flex-col items-center">
                      <div className="p-2 bg-white rounded-lg mb-4">
                        <img src={qrCodeUrl} alt="2FA QR Code" width={160} height={160} />
                      </div>
                      <p className="text-[10px] text-gray-400 text-center mb-3">{t('Scan this QR code with Google Authenticator or Duo Mobile.')}</p>
                      
                      <div className="w-full flex items-center justify-between gap-2 p-2 bg-slate-100 dark:bg-gray-900 border border-slate-200 dark:border-gray-800 rounded">
                        <span className="font-mono text-[10px] text-slate-805 dark:text-gray-300 select-all truncate">{secretCode}</span>
                        <button
                          onClick={copySecret}
                          className="text-cyanAccent hover:text-slate-900 dark:hover:text-white transition"
                          title="Copy Secret"
                        >
                          <Clipboard size={14} />
                        </button>
                      </div>
                    </div>

                    {/* Verify form code */}
                    <form onSubmit={handleVerify2FA} className="border-t border-slate-200 dark:border-gray-850 pt-4 space-y-4">
                      <div>
                        <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-2">{t('Verify 6-Digit Token')}</label>
                        <input
                          type="text"
                          required
                          maxLength={6}
                          placeholder="000000"
                          className="w-full p-2.5 rounded glass-input text-xs text-center tracking-widest font-bold"
                          value={verifyCode}
                          onChange={(e) => setVerifyCode(e.target.value)}
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setShow2FaSetup(false)}
                          className="flex-1 py-2 border border-slate-300 dark:border-gray-850 text-slate-700 dark:text-white rounded text-xs hover:bg-slate-100 dark:hover:bg-gray-850 transition"
                        >
                          {t('Cancel')}
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="flex-1 py-2 bg-emeraldAccent text-black font-bold text-xs rounded hover:opacity-90 disabled:opacity-50 transition"
                        >
                          {t('Verify & Activate')}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
