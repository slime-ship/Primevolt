import React, { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import api from '../../api/api';
import { CheckCircle, AlertTriangle, Clock, User, FileText, Camera, Shield, ArrowRight, Lock, Mail, Phone, UploadCloud, Eye, EyeOff } from 'lucide-react';

const KYC = () => {
  const { user, fetchUserMe } = useAuth();
  const [kycStatusData, setKycStatusData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  
  // Level 1 States
  const [emailCode, setEmailCode] = useState('');
  const [phoneCode, setPhoneCode] = useState('');
  const [verifyingEmail, setVerifyingEmail] = useState(false);
  const [verifyingPhone, setVerifyingPhone] = useState(false);

  // Level 2 States
  const [docType, setDocType] = useState('ID_CARD');
  const [docNumber, setDocNumber] = useState('');
  const [country, setCountry] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [docFile, setDocFile] = useState(null);

  // Level 3 States
  const [ssn, setSsn] = useState('');
  const [showSsn, setShowSsn] = useState(false);
  const [selfieFile, setSelfieFile] = useState(null);
  const [isSubmittingLevel3, setIsSubmittingLevel3] = useState(false);

  useEffect(() => {
    fetchKYCStatus();
  }, []);

  const fetchKYCStatus = async () => {
    try {
      const res = await api.get('kyc/status/');
      setKycStatusData(res.data);
      setLoading(false);
    } catch (err) {
      console.error(err);
      setError('Failed to fetch KYC status information.');
      setLoading(false);
    }
  };

  const handleVerifyEmail = async (e) => {
    e.preventDefault();
    setVerifyingEmail(true);
    setError('');
    setSuccess('');
    try {
      await api.post('auth/verify-email/', { code: emailCode });
      setSuccess('Email verified successfully!');
      setEmailCode('');
      await fetchUserMe();
      await fetchKYCStatus();
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed. Use code 123456.');
    } finally {
      setVerifyingEmail(false);
    }
  };

  const handleVerifyPhone = async (e) => {
    e.preventDefault();
    setVerifyingPhone(true);
    setError('');
    setSuccess('');
    try {
      await api.post('auth/verify-phone/', { code: phoneCode });
      setSuccess('Phone verified successfully!');
      setPhoneCode('');
      await fetchUserMe();
      await fetchKYCStatus();
    } catch (err) {
      setError(err.response?.data?.error || 'Verification failed. Use code 123456.');
    } finally {
      setVerifyingPhone(false);
    }
  };

  const handleLevel2Submit = async (e) => {
    e.preventDefault();
    if (!docNumber || !country || !expiryDate) {
      setError('Please fill in all document fields.');
      return;
    }

    setIsUploading(true);
    setError('');
    setSuccess('');

    try {
      // Simulate secure Cloud Upload of the ID document
      const mockUrl = `https://primevolt-storage.s3.amazonaws.com/kyc/${user?.username}_${docType.toLowerCase()}_${Date.now()}.png`;
      
      await api.post('kyc/documents/', {
        document_type: docType,
        document_number: docNumber,
        issued_country: country,
        expiry_date: expiryDate,
        document_url: mockUrl
      });

      setSuccess('Identity document submitted successfully for review.');
      setDocNumber('');
      setCountry('');
      setExpiryDate('');
      setDocFile(null);
      await fetchKYCStatus();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit document. Ensure fields are correct.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleLevel3Submit = async (e) => {
    e.preventDefault();
    if (!ssn) {
      setError('Please enter your SSN.');
      return;
    }

    setIsSubmittingLevel3(true);
    setError('');
    setSuccess('');

    try {
      // Step A: Update SSN on user profile
      await api.put('users/me/', { ssn });

      // Step B: Submit Selfie Document review
      const mockSelfieUrl = `https://primevolt-storage.s3.amazonaws.com/kyc/${user?.username}_selfie_${Date.now()}.png`;
      await api.post('kyc/documents/', {
        document_type: 'SELFIE',
        document_number: `SELFIE-${user?.id}`,
        issued_country: 'US',
        document_url: mockSelfieUrl
      });

      setSuccess('VIP Level 3 details submitted. Admin verification pending.');
      setSsn('');
      setSelfieFile(null);
      await fetchUserMe();
      await fetchKYCStatus();
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to submit VIP details.');
    } finally {
      setIsSubmittingLevel3(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-4rem)] items-center justify-center bg-transparent">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyanAccent border-t-transparent"></div>
      </div>
    );
  }

  // Get active documents details
  const documents = kycStatusData?.documents || [];
  const pendingDocs = documents.filter(d => d.status === 'PENDING');
  const rejectedDocs = documents.filter(d => d.status === 'REJECTED');

  return (
    <div className="mx-auto max-w-4xl px-4 py-8 sm:px-6 lg:px-8 min-h-[calc(100vh-4rem)] text-left">
      <div className="mb-8">
        <h1 className="text-2xl font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Shield className="text-cyanAccent" /> Identity Verification (KYC)
        </h1>
        <p className="text-xs text-gray-400">Verify your details to lift deposit, withdrawal limits, and attain VIP privileges.</p>
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

      {/* KYC Progress Steps Bar */}
      <div className="grid grid-cols-3 gap-2 mb-8 text-center text-xs">
        <div className={`p-4 rounded-lg border ${
          user?.kyc_level >= 1 ? 'border-cyanAccent bg-cyanAccent/5 text-slate-800 dark:text-white' : 'border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950/40 text-gray-405'
        }`}>
          <p className="font-bold text-cyanAccent">Level 1</p>
          <p className="text-[10px] text-gray-400">Email & Phone OTP</p>
          <span className="inline-block mt-2 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-emeraldAccent/10 text-emeraldAccent">Active</span>
        </div>
        
        <div className={`p-4 rounded-lg border ${
          user?.kyc_level >= 2 
            ? 'border-cyanAccent bg-cyanAccent/5 text-slate-800 dark:text-white' 
            : pendingDocs.some(d => ['ID_CARD', 'PASSPORT', 'DRIVERS_LICENSE'].includes(d.document_type))
            ? 'border-yellow-500 bg-yellow-500/5 text-slate-850 dark:text-white'
            : 'border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950/40 text-gray-405'
        }`}>
          <p className="font-bold text-cyanAccent">Level 2</p>
          <p className="text-[10px] text-gray-400">Government ID Upload</p>
          {user?.kyc_level >= 2 ? (
            <span className="inline-block mt-2 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-emeraldAccent/10 text-emeraldAccent">Verified</span>
          ) : pendingDocs.some(d => ['ID_CARD', 'PASSPORT', 'DRIVERS_LICENSE'].includes(d.document_type)) ? (
            <span className="inline-block mt-2 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-yellow-500/10 text-yellow-500">Under Review</span>
          ) : (
            <span className="inline-block mt-2 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-slate-200 dark:bg-gray-800 text-slate-500 dark:text-gray-500">Locked</span>
          )}
        </div>

        <div className={`p-4 rounded-lg border ${
          user?.kyc_level >= 3 
            ? 'border-cyanAccent bg-cyanAccent/5 text-slate-850 dark:text-white'
            : pendingDocs.some(d => d.document_type === 'SELFIE')
            ? 'border-yellow-500 bg-yellow-500/5 text-slate-850 dark:text-white'
            : 'border-slate-200 dark:border-gray-800 bg-white dark:bg-gray-950/40 text-gray-405'
        }`}>
          <p className="font-bold text-cyanAccent">Level 3 VIP</p>
          <p className="text-[10px] text-gray-400">Selfie & SSN Encryption</p>
          {user?.kyc_level >= 3 ? (
            <span className="inline-block mt-2 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-goldAccent/10 text-goldAccent">VIP Activated</span>
          ) : pendingDocs.some(d => d.document_type === 'SELFIE') ? (
            <span className="inline-block mt-2 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-yellow-500/10 text-yellow-500">Pending VIP</span>
          ) : (
            <span className="inline-block mt-2 px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-wider bg-slate-200 dark:bg-gray-800 text-slate-500 dark:text-gray-500">Locked</span>
          )}
        </div>
      </div>

      {/* Verification Forms */}
      <div className="space-y-8">
        
        {/* LEVEL 1: Verification Form */}
        <div className="glass-panel p-6 rounded-xl">
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
            <User size={18} className="text-cyanAccent" /> Level 1: Core Contact Verification
          </h2>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Email Verification Box */}
            <div className="border border-slate-200 dark:border-gray-800/80 rounded-lg p-4 bg-slate-100/40 dark:bg-gray-950/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-700 dark:text-gray-300 flex items-center gap-2">
                  <Mail size={16} className="text-gray-400" /> Email: {user?.email}
                </span>
                {user?.is_email_verified ? (
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emeraldAccent/15 text-emeraldAccent">Verified</span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-red-500/15 text-red-400">Unverified</span>
                )}
              </div>
              {!user?.is_email_verified && (
                <form onSubmit={handleVerifyEmail} className="flex gap-2 mt-4">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter code (123456)"
                    className="flex-1 px-3 py-1.5 rounded glass-input text-xs"
                    value={emailCode}
                    onChange={(e) => setEmailCode(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={verifyingEmail}
                    className="px-4 py-1.5 rounded bg-cyanAccent text-black font-bold text-xs hover:opacity-90 disabled:opacity-50"
                  >
                    {verifyingEmail ? 'Confirming...' : 'Verify'}
                  </button>
                </form>
              )}
            </div>

            {/* Phone Verification Box */}
            <div className="border border-slate-200 dark:border-gray-800/80 rounded-lg p-4 bg-slate-100/40 dark:bg-gray-950/20">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-semibold text-slate-700 dark:text-gray-300 flex items-center gap-2">
                  <Phone size={16} className="text-gray-400" /> Phone: {user?.phone || 'Not provided'}
                </span>
                {user?.is_phone_verified ? (
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-emeraldAccent/15 text-emeraldAccent">Verified</span>
                ) : (
                  <span className="px-2 py-0.5 rounded text-[9px] font-bold bg-red-500/15 text-red-400">Unverified</span>
                )}
              </div>
              {!user?.is_phone_verified && (
                <form onSubmit={handleVerifyPhone} className="flex gap-2 mt-4">
                  <input
                    type="text"
                    maxLength={6}
                    placeholder="Enter code (123456)"
                    className="flex-1 px-3 py-1.5 rounded glass-input text-xs"
                    value={phoneCode}
                    onChange={(e) => setPhoneCode(e.target.value)}
                  />
                  <button
                    type="submit"
                    disabled={verifyingPhone}
                    className="px-4 py-1.5 rounded bg-cyanAccent text-black font-bold text-xs hover:opacity-90 disabled:opacity-50"
                  >
                    {verifyingPhone ? 'Confirming...' : 'Verify'}
                  </button>
                </form>
              )}
            </div>
          </div>
        </div>

        {/* LEVEL 2: Identity Document Upload */}
        <div className={`glass-panel p-6 rounded-xl ${
          !(user?.is_email_verified && user?.is_phone_verified) || user?.kyc_level >= 2 ? 'opacity-50 pointer-events-none' : ''
        }`}>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <FileText size={18} className="text-cyanAccent" /> Level 2: Photo Identity Document
          </h2>
          <p className="text-[11px] text-gray-400 mb-6">Provide a government-issued identification card, driving license, or passport to lift operations limits.</p>

          {user?.kyc_level >= 2 ? (
            <div className="flex items-center gap-2 text-emeraldAccent text-xs font-bold py-2">
              <CheckCircle size={18} /> Level 2 Identity documentation is fully approved.
            </div>
          ) : pendingDocs.some(d => ['ID_CARD', 'PASSPORT', 'DRIVERS_LICENSE'].includes(d.document_type)) ? (
            <div className="flex items-center gap-2 text-yellow-500 text-xs font-bold py-2 bg-yellow-500/5 border border-yellow-500/20 p-4 rounded-lg">
              <Clock size={18} /> Identity document verification is currently pending review. Please wait for administrator approval.
            </div>
          ) : (
            <form onSubmit={handleLevel2Submit} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-2">Document Type</label>
                  <select
                    className="w-full p-2.5 rounded glass-input text-xs"
                    value={docType}
                    onChange={(e) => setDocType(e.target.value)}
                  >
                    <option value="ID_CARD">Identity Card (Front & Back)</option>
                    <option value="PASSPORT">International Passport</option>
                    <option value="DRIVERS_LICENSE">Driver's License</option>
                    <option value="PROOF_OF_ADDRESS">Proof of Address (Utility Bill)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-2">Document Serial Number</label>
                  <input
                    type="text"
                    required
                    placeholder="Enter registration or serial number"
                    className="w-full p-2.5 rounded glass-input text-xs"
                    value={docNumber}
                    onChange={(e) => setDocNumber(e.target.value)}
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-2">Country of Issue</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. United States"
                    className="w-full p-2.5 rounded glass-input text-xs"
                    value={country}
                    onChange={(e) => setCountry(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-2">Expiry Date</label>
                  <input
                    type="date"
                    required
                    className="w-full p-2.5 rounded glass-input text-xs"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-2">Upload Document Scan</label>
                <div className="border-2 border-dashed border-slate-300 dark:border-gray-800 rounded-lg p-6 text-center cursor-pointer hover:border-cyanAccent transition bg-slate-100/40 dark:bg-[#111827]/40 relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setDocFile(e.target.files[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <UploadCloud className="mx-auto text-gray-500 mb-2" size={32} />
                  <p className="text-xs text-slate-800 dark:text-gray-300">
                    {docFile ? `Selected: ${docFile.name}` : 'Click or Drag document image here to upload'}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">Supports PNG, JPG, or PDF (Max 5MB)</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isUploading}
                className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-cyanAccent text-black font-bold text-xs rounded hover:opacity-90 disabled:opacity-50 transition"
              >
                {isUploading ? 'Uploading & Securing...' : 'Submit Document Scan'}
              </button>
            </form>
          )}
        </div>

        {/* LEVEL 3: VIP Selfie & SSN */}
        <div className={`glass-panel p-6 rounded-xl ${
          user?.kyc_level < 2 || user?.kyc_level >= 3 ? 'opacity-50 pointer-events-none' : ''
        }`}>
          <h2 className="text-sm font-bold text-slate-900 dark:text-white mb-2 flex items-center gap-2">
            <Camera size={18} className="text-cyanAccent" /> Level 3 VIP: Selfie & SSN Verification
          </h2>
          <p className="text-[11px] text-gray-400 mb-6">Gain elite brokerage limits and compounding bonus structures. Submits encrypted Social Security Number (SSN) and camera selfie.</p>

          {user?.kyc_level >= 3 ? (
            <div className="flex items-center gap-2 text-goldAccent text-xs font-bold py-2">
              <CheckCircle size={18} /> Level 3 VIP Brokerage status is fully active.
            </div>
          ) : pendingDocs.some(d => d.document_type === 'SELFIE') ? (
            <div className="flex items-center gap-2 text-yellow-500 text-xs font-bold py-2 bg-yellow-500/5 border border-yellow-500/20 p-4 rounded-lg">
              <Clock size={18} /> VIP Selfie & SSN audit is pending review.
            </div>
          ) : (
            <form onSubmit={handleLevel3Submit} className="space-y-4">
              <div>
                <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-2">Social Security Number (SSN)</label>
                <div className="relative">
                  <input
                    type={showSsn ? 'text' : 'password'}
                    required
                    placeholder="XXX-XX-XXXX"
                    className="w-full p-2.5 rounded glass-input text-xs pr-10"
                    value={ssn}
                    onChange={(e) => setSsn(e.target.value)}
                  />
                  <button
                    type="button"
                    onClick={() => setShowSsn(!showSsn)}
                    className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-slate-800 dark:hover:text-white"
                  >
                    {showSsn ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                <span className="text-[9px] text-gray-500 block mt-1 flex items-center gap-1">
                  <Lock size={10} /> Fully encrypted database storage (cryptography-fernet).
                </span>
              </div>

              <div>
                <label className="block text-[10px] text-gray-400 uppercase font-semibold mb-2">Upload Selfie with ID Card</label>
                <div className="border-2 border-dashed border-slate-300 dark:border-gray-800 rounded-lg p-6 text-center cursor-pointer hover:border-cyanAccent transition bg-slate-100/40 dark:bg-[#111827]/40 relative">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setSelfieFile(e.target.files[0])}
                    className="absolute inset-0 opacity-0 cursor-pointer"
                  />
                  <Camera className="mx-auto text-gray-500 mb-2" size={32} />
                  <p className="text-xs text-slate-805 dark:text-gray-300">
                    {selfieFile ? `Selected: ${selfieFile.name}` : 'Upload selfie holding your physical ID document'}
                  </p>
                  <p className="text-[10px] text-gray-500 mt-1">Selfie must clearly show face and ID card text.</p>
                </div>
              </div>

              <button
                type="submit"
                disabled={isSubmittingLevel3}
                className="mt-4 w-full flex items-center justify-center gap-2 py-3 bg-gradient-to-r from-goldAccent to-yellow-600 text-black font-bold text-xs rounded hover:opacity-90 disabled:opacity-50 transition"
              >
                {isSubmittingLevel3 ? 'Encrypting & Submitting...' : 'Apply for VIP Status'}
              </button>
            </form>
          )}
        </div>

      </div>

      {/* KYC History log */}
      {documents.length > 0 && (
        <div className="mt-12 glass-panel rounded-xl p-6">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-4">Submission Records</h3>
          <div className="space-y-4">
            {documents.map((doc) => (
              <div key={doc.id} className="border border-slate-200 dark:border-gray-800/60 rounded-lg p-4 bg-slate-100/20 dark:bg-gray-950/10 flex items-center justify-between text-xs">
                <div>
                  <p className="font-semibold text-slate-900 dark:text-white">{doc.document_type.replace('_', ' ')}</p>
                  <p className="text-[10px] text-gray-500">Submitted: {new Date(doc.created_at).toLocaleDateString()}</p>
                  {doc.rejection_reason && (
                    <p className="text-[10px] text-red-400 mt-1">Reason: {doc.rejection_reason}</p>
                  )}
                </div>
                <div className="text-right">
                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                    doc.status === 'APPROVED' ? 'bg-emeraldAccent/15 text-emeraldAccent' :
                    doc.status === 'REJECTED' ? 'bg-red-500/15 text-red-400' :
                    'bg-yellow-500/15 text-yellow-500'
                  }`}>
                    {doc.status}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default KYC;
