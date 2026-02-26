/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useEffect, useRef, useState } from 'react';
import { Sidebar } from './components/Sidebar';
import { ChatArea } from './components/ChatArea';
import { cn } from './lib/utils';
import { Provider } from 'react-redux';
import { store } from './store';
import { AuthUser, getCurrentUser, loginWithGoogle, logoutUser } from './services/api';
import { bootstrapChatData } from './store/chatSlice';

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (params: {
            client_id: string;
            callback: (response: { credential: string }) => void;
          }) => void;
          renderButton: (
            parent: HTMLElement,
            options: {
              theme?: 'outline' | 'filled_blue' | 'filled_black';
              size?: 'large' | 'medium' | 'small';
              text?: 'signin_with' | 'signup_with' | 'continue_with' | 'signin';
              shape?: 'rectangular' | 'pill' | 'circle' | 'square';
              width?: number;
            }
          ) => void;
        };
      };
    };
  }
}

export default function App() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [authError, setAuthError] = useState<string | null>(null);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    const bootstrapAuth = async () => {
      try {
        const response = await getCurrentUser();
        setUser(response.user);
      } catch {
        setUser(null);
      } finally {
        setAuthLoading(false);
      }
    };

    bootstrapAuth();
  }, []);

  useEffect(() => {
    if (!user) return;
    store.dispatch(bootstrapChatData());
  }, [user]);

  useEffect(() => {
    if (authLoading || user || !googleButtonRef.current || !googleClientId) return;

    const scriptId = 'google-identity-services';
    const existing = document.getElementById(scriptId) as HTMLScriptElement | null;

    const initializeGoogle = () => {
      if (!window.google || !googleButtonRef.current) return;

      window.google.accounts.id.initialize({
        client_id: googleClientId,
        callback: async ({ credential }) => {
          try {
            setAuthError(null);
            const response = await loginWithGoogle(credential);
            setUser(response.user);
          } catch (error) {
            setAuthError(error instanceof Error ? error.message : 'Login failed');
          }
        }
      });

      googleButtonRef.current.innerHTML = '';
      window.google.accounts.id.renderButton(googleButtonRef.current, {
        theme: 'outline',
        size: 'large',
        text: 'continue_with',
        shape: 'pill',
        width: 320
      });
    };

    if (existing) {
      initializeGoogle();
      return;
    }

    const script = document.createElement('script');
    script.id = scriptId;
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = initializeGoogle;
    document.body.appendChild(script);
  }, [authLoading, user, googleClientId]);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } finally {
      setUser(null);
    }
  };

  if (authLoading) {
    return (
      <Provider store={store}>
        <div className="min-h-screen bg-white flex items-center justify-center text-gray-500">
          Checking session...
        </div>
      </Provider>
    );
  }

  if (!user) {
    return (
      <Provider store={store}>
        <div className="min-h-screen bg-white flex items-center justify-center px-4">
          <div className="w-full max-w-md rounded-2xl border border-black/10 bg-[#F9F9F8] p-8 text-center shadow-sm">
            <h1 className="font-serif text-3xl text-gray-900 mb-2">Welcome</h1>
            <p className="text-sm text-gray-500 mb-6">Sign in with Google to continue.</p>
            <div ref={googleButtonRef} className="flex justify-center" />
            {!googleClientId && (
              <p className="text-xs text-red-600 mt-4">
                Missing VITE_GOOGLE_CLIENT_ID in frontend environment.
              </p>
            )}
            {authError && <p className="text-xs text-red-600 mt-4">{authError}</p>}
          </div>
        </div>
      </Provider>
    );
  }

  return (
    <Provider store={store}>
      <div className="flex h-screen w-full overflow-hidden bg-white">
        <Sidebar
          isOpen={sidebarOpen}
          toggleSidebar={() => setSidebarOpen(!sidebarOpen)}
          user={user}
          onLogout={handleLogout}
        />
        
        <main className={cn(
          "flex-1 flex flex-col h-full relative transition-all duration-300 ease-in-out",
          sidebarOpen ? "md:ml-0" : "ml-0"
        )}>
          <ChatArea sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />
        </main>
      </div>
    </Provider>
  );
}
