import { useState, useEffect } from 'react';
import { User } from '@/types/business';
import { storageService } from '@/lib/storage';
import LoginScreen from '@/components/LoginScreen';
import Dashboard from '@/components/Dashboard';
import ThemeSwitcher from '@/components/ThemeSwitcher';

export default function Index() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  useEffect(() => {
    const savedUser = storageService.getCurrentUser();
    if (savedUser) {
      if (storageService.checkUserBlocked(savedUser)) {
        storageService.setCurrentUser(null);
        setCurrentUser(null);
      } else {
        setCurrentUser(savedUser);
      }
    }

    const savedTheme = storageService.getTheme();
    document.documentElement.classList.add(savedTheme);
  }, []);

  const handleLogin = (user: User) => {
    storageService.setCurrentUser(user);
    setCurrentUser(user);
  };

  const handleLogout = () => {
    storageService.setCurrentUser(null);
    setCurrentUser(null);
  };

  return (
    <>
      <ThemeSwitcher />
      {currentUser ? (
        <Dashboard user={currentUser} onLogout={handleLogout} />
      ) : (
        <LoginScreen onLogin={handleLogin} />
      )}
    </>
  );
}