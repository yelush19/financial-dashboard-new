import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabaseClient';

// 🔐 רשימת מיילים מורשים - ערוך אותה לפי הצורך!
const ALLOWED_EMAILS = [
  'admin@example.com',
  'user@example.com',
  'litay@modi.com', // דוגמה - שנה למייל שלך!
];

interface ProtectedRouteProps {
  children: React.ReactNode;
}

export const ProtectedRoute = ({ children }: ProtectedRouteProps) => {
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setLoading(false);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setSession(session);
    });

    return () => subscription.unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-xl">טוען...</div>
      </div>
    );
  }

  if (!session) {
    return <LoginPage />;
  }

  const userEmail = session.user.email;
  
  if (!ALLOWED_EMAILS.includes(userEmail)) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-red-50 p-8">
        <div className="bg-white p-8 rounded-lg shadow-lg max-w-md text-center">
          <h2 className="text-2xl font-bold text-red-600 mb-4">אין הרשאת גישה</h2>
          <p className="text-gray-700 mb-4">
            המייל <strong>{userEmail}</strong> לא מורשה לגשת למערכת.
          </p>
          <button
            onClick={() => supabase.auth.signOut()}
            className="bg-red-600 text-white px-6 py-2 rounded-md hover:bg-red-700"
          >
            התנתק
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};

const LoginPage = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) {
      setMessage('שגיאה בשליחת קישור: ' + error.message);
    } else {
      setMessage('נשלח אליך קישור למייל! בדוק את תיבת הדואר שלך.');
    }
    setLoading(false);
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <h2 className="text-3xl font-bold mb-6 text-center text-gray-800">
          כניסה למערכת
        </h2>
        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              כתובת מייל
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              placeholder="your@email.com"
              required
            />
          </div>
          <button
  type="submit"
  disabled={loading}
  style={{
    background: loading 
      ? 'linear-gradient(135deg, #9ca3af 0%, #6b7280 100%)' 
      : 'linear-gradient(135deg, #2d5f3f 0%, #528163 100%)'
  }}
  className="w-full text-white py-4 rounded-lg hover:opacity-90 disabled:opacity-50 font-bold transition-all hover:scale-105 active:scale-95 shadow-lg disabled:cursor-not-allowed"

          >
            {loading ? 'שולח...' : 'שלח קישור כניסה'}
          </button>
        </form>
        {message && (
          <div className="mt-4 p-3 bg-blue-50 border border-blue-200 rounded-md text-sm text-blue-800">
            {message}
          </div>
        )}
      </div>
    </div>
  );
};