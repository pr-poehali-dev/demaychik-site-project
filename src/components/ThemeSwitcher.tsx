import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { storageService } from '@/lib/storage';
import { Theme } from '@/types/business';

export default function ThemeSwitcher() {
  const [theme, setTheme] = useState<Theme>('business');

  useEffect(() => {
    const savedTheme = storageService.getTheme();
    setTheme(savedTheme);
    applyTheme(savedTheme);
  }, []);

  const applyTheme = (newTheme: Theme) => {
    document.documentElement.classList.remove('business', 'rainbow');
    document.documentElement.classList.add(newTheme);
  };

  const toggleTheme = () => {
    const newTheme: Theme = theme === 'business' ? 'rainbow' : 'business';
    setTheme(newTheme);
    storageService.setTheme(newTheme);
    applyTheme(newTheme);
  };

  return (
    <Button
      variant="outline"
      size="icon"
      onClick={toggleTheme}
      className="fixed top-4 right-4 z-50 animate-fade-in transition-all hover:scale-110"
    >
      {theme === 'business' ? (
        <Icon name="Sparkles" size={20} className="text-primary" />
      ) : (
        <div className="gradient-rainbow p-1 rounded-full">
          <Icon name="Palette" size={18} className="text-white" />
        </div>
      )}
    </Button>
  );
}
