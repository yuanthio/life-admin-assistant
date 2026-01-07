// life-admin-assistant/frontend/app/setup/page.tsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/hooks/useAuth';
import { profileApi } from '@/lib/api/profile';

export default function SetupProfile() {
  const router = useRouter();
  const { user } = useAuth();
  
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [checkingTemplates, setCheckingTemplates] = useState(true);
  
  const [profileData, setProfileData] = useState({
    hasDrivingLicense: false,
    hasIdCard: true,
    hasPassport: false,
    vehicleType: '',
    householdSize: 1,
    houseOwnership: 'owner',
    billReminders: true,
  });

  // Tambahkan useEffect untuk cek template saat component mount
  useEffect(() => {
    const checkIfNeedsSetup = async () => {
      if (user) {
        try {
          const templateStatus = await profileApi.checkUserTemplates();
          
          // Jika sudah punya template, redirect ke dashboard
          if (templateStatus.hasTemplates) {
            console.log('User already has templates, redirecting to dashboard');
            router.push('/dashboard');
          } else {
            setCheckingTemplates(false);
          }
        } catch (err) {
          console.error('Error checking templates:', err);
          setCheckingTemplates(false); // Tetap tampilkan setup page jika error
        }
      }
    };

    checkIfNeedsSetup();
  }, [user, router]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setProfileData(prev => ({ ...prev, [name]: checked }));
    } else if (type === 'number') {
      setProfileData(prev => ({ ...prev, [name]: parseInt(value) || 1 }));
    } else {
      setProfileData(prev => ({ ...prev, [name]: value }));
    }
  };

  const nextStep = () => {
    setStep(prev => Math.min(prev + 1, 3));
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    setLoading(true);

    try {
      console.log('Submitting profile data:', profileData);
      
      const response = await profileApi.setupProfile(profileData);
      
      console.log('Setup response:', response);
      
      // Note: Backend response mungkin tidak memiliki property 'success'
      // Kita akan cek apakah response ada dan memiliki message
      if (!response) {
        throw new Error('No response received from server');
      }
      
      if (response.message && response.message.includes('failed')) {
        throw new Error(response.message || 'Setup failed');
      }
      
      setSuccess('Profile setup completed successfully!');
      
      // Set cookie skipSetup agar tidak diarahkan ke setup lagi
      document.cookie = 'skipSetup=true; path=/; max-age=31536000'; // 1 tahun
      
      // Set flag bahwa user sudah punya template
      document.cookie = 'hasTemplates=true; path=/; max-age=31536000';
      
      // Tambahkan delay kecil untuk user melihat success message
      setTimeout(() => {
        // Redirect ke dashboard setelah setup berhasil
        router.push('/dashboard');
      }, 1500);
      
    } catch (err: any) {
      console.error('Setup error details:', {
        message: err.message,
        response: err.response,
        data: err.response?.data
      });
      
      // Handle error dengan lebih baik
      let errorMessage = 'Setup failed. Please try again.';
      
      if (err.response?.data?.message) {
        errorMessage = err.response.data.message;
      } else if (err.message) {
        errorMessage = err.message;
      } else if (err.response?.status === 0) {
        errorMessage = 'Network error: Please check if the backend server is running and accessible.';
      } else if (!err.response) {
        errorMessage = 'Cannot connect to server. Please make sure the backend is running.';
      }
      
      setError(errorMessage);
      
      // Jika error adalah network error, beri saran
      if (err.response?.status === 0 || !err.response) {
        console.error('Network error detected. Check:');
        console.error('1. Is backend server running on http://localhost:4000?');
        console.error('2. Check CORS configuration in backend');
        console.error('3. Check browser console for CORS errors');
        console.error('4. Try accessing http://localhost:4000/health in browser');
      }
      
    } finally {
      setLoading(false);
    }
  };

  const handleSkipSetup = () => {
    // Set cookie skipSetup agar tidak diarahkan ke setup lagi
    document.cookie = 'skipSetup=true; path=/; max-age=31536000'; // 1 tahun
    // Set flag bahwa user sudah punya template (meskipun sebenarnya belum)
    document.cookie = 'hasTemplates=true; path=/; max-age=31536000';
    // Redirect ke dashboard
    router.push('/dashboard');
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              👨‍💼 Personal Document Information
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="hasIdCard"
                  name="hasIdCard"
                  checked={profileData.hasIdCard}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="hasIdCard" className="ml-3 text-gray-700 dark:text-gray-300">
                  I have an ID Card (Kartu Tanda Penduduk)
                </label>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="hasDrivingLicense"
                  name="hasDrivingLicense"
                  checked={profileData.hasDrivingLicense}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="hasDrivingLicense" className="ml-3 text-gray-700 dark:text-gray-300">
                  I have a Driving License (Surat Izin Mengemudi)
                </label>
              </div>

              {profileData.hasDrivingLicense && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    Vehicle Type
                  </label>
                  <select
                    name="vehicleType"
                    value={profileData.vehicleType}
                    onChange={handleChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="">Select vehicle type</option>
                    <option value="motor">Motorcycle</option>
                    <option value="mobil">Car</option>
                    <option value="both">Both</option>
                  </select>
                </div>
              )}

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="hasPassport"
                  name="hasPassport"
                  checked={profileData.hasPassport}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="hasPassport" className="ml-3 text-gray-700 dark:text-gray-300">
                  I have a Passport
                </label>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              🏠 Household Information
            </h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Household Size
                </label>
                <input
                  type="number"
                  name="householdSize"
                  value={profileData.householdSize}
                  onChange={handleChange}
                  min="1"
                  max="20"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                />
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Including yourself
                </p>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Housing Status
                </label>
                <select
                  name="houseOwnership"
                  value={profileData.houseOwnership}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-700 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-800 dark:text-white"
                >
                  <option value="owner">Home Owner</option>
                  <option value="rent">Renting</option>
                  <option value="family">Living with Family</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="billReminders"
                  name="billReminders"
                  checked={profileData.billReminders}
                  onChange={handleChange}
                  className="h-4 w-4 text-blue-600 rounded focus:ring-blue-500 border-gray-300"
                />
                <label htmlFor="billReminders" className="ml-3 text-gray-700 dark:text-gray-300">
                  Remind me about monthly bills
                </label>
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
              📋 Templates to be Created
            </h3>
            
            <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-lg">
              <div className="flex items-start mb-4">
                <span className="text-2xl mr-3">👨‍💼</span>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Personal Documents Template</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    {profileData.hasDrivingLicense || profileData.hasIdCard || profileData.hasPassport 
                      ? "System will create a template to manage your personal documents"
                      : "You don't have any documents that need management"}
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    {profileData.hasDrivingLicense && <li>✓ Renew Driving License</li>}
                    {profileData.hasIdCard && <li>✓ Renew ID Card</li>}
                    {profileData.hasPassport && <li>✓ Renew Passport</li>}
                    {(profileData.hasDrivingLicense || profileData.hasIdCard || profileData.hasPassport) && (
                      <li>✓ Archive Important Documents</li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="flex items-start">
                <span className="text-2xl mr-3">🏠</span>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Household Template</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                    System will create a template to manage your household tasks
                  </p>
                  <ul className="mt-2 space-y-1 text-sm text-gray-600 dark:text-gray-400">
                    <li>✓ Laundry (2x per week)</li>
                    <li>✓ Clean Room (1x per week)</li>
                    <li>✓ Change Bed Sheets (every 2 weeks)</li>
                    <li>✓ Take Out Trash (every night)</li>
                    <li>✓ Buy Household Supplies (monthly)</li>
                  </ul>
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 dark:bg-yellow-900/30 p-4 rounded-lg">
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                💡 Tips: You can customize these templates later in the dashboard.
              </p>
            </div>
          </div>
        );
    }
  };

  // Tampilkan loading saat cek template
  if (checkingTemplates) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Checking your account...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
            Welcome, {user?.name || user?.email}!
          </h1>
          <p className="mt-2 text-gray-600 dark:text-gray-400">
            Let's setup your profile for a personalized experience
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between mb-2">
            <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
              Step {step} of 3
            </span>
            <span className="text-sm font-medium text-gray-500 dark:text-gray-400">
              {Math.round((step / 3) * 100)}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
            <div 
              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${(step / 3) * 100}%` }}
            ></div>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="bg-white dark:bg-gray-800 shadow-lg rounded-xl p-6 sm:p-8">
          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/50 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 px-4 py-3 rounded-md">
              <div className="flex items-center">
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <span>{error}</span>
              </div>
              {error.includes('Network error') || error.includes('Cannot connect') ? (
                <div className="mt-2 text-sm">
                  <p className="font-medium">Troubleshooting tips:</p>
                  <ul className="list-disc list-inside mt-1 ml-2">
                    <li>Ensure backend server is running on port 4000</li>
                    <li>Check if you can access <a href="http://localhost:4000/health" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">http://localhost:4000/health</a></li>
                    <li>Check browser console for CORS errors (F12 → Console)</li>
                    <li>Try restarting both frontend and backend servers</li>
                  </ul>
                </div>
              ) : null}
            </div>
          )}
          
          {success && (
            <div className="mb-6 bg-green-50 dark:bg-green-900/50 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-400 px-4 py-3 rounded-md">
              <div className="flex items-center">
                <svg className="h-5 w-5 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                <span>{success}</span>
              </div>
              <p className="mt-1 text-sm">Redirecting to dashboard...</p>
            </div>
          )}

          {/* Step Content */}
          {renderStep()}

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t border-gray-200 dark:border-gray-700">
            {step > 1 ? (
              <button
                type="button"
                onClick={prevStep}
                disabled={loading}
                className="px-6 py-2 border border-gray-300 dark:border-gray-600 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 transition-colors"
              >
                Previous
              </button>
            ) : (
              <div></div>
            )}

            {step < 3 ? (
              <button
                type="button"
                onClick={nextStep}
                disabled={loading}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-md font-medium disabled:opacity-50 transition-colors"
              >
                Next
              </button>
            ) : (
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-md font-medium disabled:opacity-50 transition-colors"
              >
                {loading ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                ) : (
                  'Complete Setup'
                )}
              </button>
            )}
          </div>

          {/* Skip Link */}
          {step === 1 && (
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={handleSkipSetup}
                disabled={loading}
                className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 border border-gray-300 dark:border-gray-700 px-4 py-2 rounded-md hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors disabled:opacity-50"
              >
                Skip setup for now
              </button>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                You can setup later via profile menu
              </p>
            </div>
          )}
        </form>

        {/* Steps Indicator */}
        <div className="grid grid-cols-3 gap-4 mt-8 text-center text-sm">
          <div className={`p-3 rounded-lg transition-colors ${step >= 1 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
            <div className="font-medium">1. Documents</div>
            <div className="text-xs mt-1">Personal information</div>
          </div>
          <div className={`p-3 rounded-lg transition-colors ${step >= 2 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
            <div className="font-medium">2. Household</div>
            <div className="text-xs mt-1">Family information</div>
          </div>
          <div className={`p-3 rounded-lg transition-colors ${step >= 3 ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-500'}`}>
            <div className="font-medium">3. Confirm</div>
            <div className="text-xs mt-1">Templates to create</div>
          </div>
        </div>
      </div>
    </div>
  );
}