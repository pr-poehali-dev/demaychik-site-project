import { useState } from 'react';
import { User } from '@/types/business';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import BusinessList from './BusinessList';
import QuestionsSection from './QuestionsSection';
import AdminPanel from './AdminPanel';
import { storageService } from '@/lib/storage';

interface DashboardProps {
  user: User;
  onLogout: () => void;
}

export default function Dashboard({ user, onLogout }: DashboardProps) {
  const [activeTab, setActiveTab] = useState<'businesses' | 'questions' | 'admin'>('businesses');
  const isAdmin = user.id === storageService.getAdminId();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-40 animate-slide-up">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
              {user.username[0].toUpperCase()}
            </div>
            <div>
              <h2 className="font-semibold flex items-center gap-2">
                {user.username}
                {user.isPremium && (
                  <Icon name="Crown" size={16} className="text-yellow-500" />
                )}
              </h2>
              <p className="text-xs text-muted-foreground">
                {user.isPremium ? 'Премиум аккаунт' : 'Пробный период'}
              </p>
            </div>
          </div>

          <Button variant="ghost" size="icon" onClick={onLogout}>
            <Icon name="LogOut" size={20} />
          </Button>
        </div>
      </header>

      <nav className="border-b bg-card sticky top-[73px] z-30">
        <div className="container mx-auto px-4">
          <div className="flex gap-1">
            <Button
              variant={activeTab === 'businesses' ? 'default' : 'ghost'}
              className="rounded-b-none"
              onClick={() => setActiveTab('businesses')}
            >
              <Icon name="Briefcase" size={18} className="mr-2" />
              Мои бизнесы
            </Button>
            <Button
              variant={activeTab === 'questions' ? 'default' : 'ghost'}
              className="rounded-b-none"
              onClick={() => setActiveTab('questions')}
            >
              <Icon name="MessageCircle" size={18} className="mr-2" />
              Вопросы профи
            </Button>
            {isAdmin && (
              <Button
                variant={activeTab === 'admin' ? 'default' : 'ghost'}
                className="rounded-b-none"
                onClick={() => setActiveTab('admin')}
              >
                <Icon name="Shield" size={18} className="mr-2" />
                Админ
              </Button>
            )}
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-4 py-6 animate-fade-in">
        {activeTab === 'businesses' && <BusinessList user={user} />}
        {activeTab === 'questions' && <QuestionsSection user={user} />}
        {activeTab === 'admin' && isAdmin && <AdminPanel />}
      </main>
    </div>
  );
}
