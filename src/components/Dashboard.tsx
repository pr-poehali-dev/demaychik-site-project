import { useState } from 'react';
import { User } from '@/types/business';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
  const [showPurchaseDialog, setShowPurchaseDialog] = useState(false);
  const isAdmin = user.id === storageService.getAdminId();

  const getTrialDaysLeft = () => {
    if (!user.trialEndsAt) return null;
    const now = new Date();
    const end = new Date(user.trialEndsAt);
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays > 0 ? diffDays : 0;
  };

  const trialDaysLeft = getTrialDaysLeft();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card sticky top-0 z-40 animate-slide-up shadow-md">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Avatar className="w-12 h-12 border-2 border-primary/20 shadow-lg hover:scale-110 transition-transform duration-300">
              <AvatarImage src={user.avatar} alt={user.username} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white font-bold text-lg">
                {user.username[0].toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div>
              <h2 className="font-bold text-lg flex items-center gap-2">
                {user.username}
                {user.isPremium && (
                  <Icon name="Crown" size={18} className="text-yellow-500 animate-pulse" />
                )}
              </h2>
              <p className="text-sm text-muted-foreground flex items-center gap-2">
                {user.isPremium ? (
                  <>
                    <Icon name="Star" size={14} className="text-yellow-500" />
                    Премиум аккаунт
                  </>
                ) : (
                  <>
                    <Icon name="Clock" size={14} className="text-orange-500" />
                    Пробный период: {trialDaysLeft} {trialDaysLeft === 1 ? 'день' : 'дня'}
                  </>
                )}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {!user.isPremium && (
              <Button 
                className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600 font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105"
                onClick={() => setShowPurchaseDialog(true)}
              >
                <Icon name="Crown" size={18} className="mr-2" />
                Купить доступ
              </Button>
            )}
            <Button variant="ghost" size="icon" onClick={onLogout} className="hover:bg-destructive/10 hover:text-destructive transition-colors">
              <Icon name="LogOut" size={20} />
            </Button>
          </div>
        </div>
      </header>

      <Dialog open={showPurchaseDialog} onOpenChange={setShowPurchaseDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-2xl flex items-center gap-2">
              <Icon name="ShoppingBag" size={28} className="text-primary" />
              Купить полный доступ
            </DialogTitle>
            <DialogDescription className="text-base pt-2">
              Получите безграничные возможности для управления бизнесом
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-6 py-4">
            <div className="grid gap-4">
              <div className="p-4 border-2 rounded-lg hover:border-primary transition-all duration-300 hover:shadow-lg cursor-pointer group">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold group-hover:text-primary transition-colors">Месяц доступа</h3>
                    <p className="text-sm text-muted-foreground">30 дней полного функционала</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary">399₽</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm">
                  <li className="flex items-center gap-2">
                    <Icon name="Check" size={16} className="text-green-500" />
                    Неограниченное количество бизнесов
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon name="Check" size={16} className="text-green-500" />
                    Аналитика и диаграммы
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon name="Check" size={16} className="text-green-500" />
                    Рекомендации ИИ
                  </li>
                </ul>
              </div>

              <div className="p-4 border-2 border-yellow-400 rounded-lg bg-gradient-to-br from-yellow-50 to-orange-50 hover:shadow-xl transition-all duration-300 cursor-pointer group relative overflow-hidden">
                <div className="absolute top-2 right-2 bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs font-bold px-3 py-1 rounded-full animate-pulse">
                  Выгодно!
                </div>
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="text-lg font-bold text-yellow-900 group-hover:text-orange-600 transition-colors">Навсегда</h3>
                    <p className="text-sm text-yellow-700">Бессрочный доступ</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">1899₽</p>
                  </div>
                </div>
                <ul className="space-y-2 text-sm text-yellow-900">
                  <li className="flex items-center gap-2">
                    <Icon name="Check" size={16} className="text-green-600" />
                    Все функции навсегда
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon name="Check" size={16} className="text-green-600" />
                    Приоритетная поддержка
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon name="Check" size={16} className="text-green-600" />
                    Ранний доступ к новым функциям
                  </li>
                  <li className="flex items-center gap-2">
                    <Icon name="Crown" size={16} className="text-yellow-600" />
                    Значок премиум в сообществе
                  </li>
                </ul>
              </div>
            </div>

            <Alert className="bg-blue-50 border-blue-200">
              <Icon name="Info" size={20} className="text-blue-600" />
              <AlertDescription className="text-blue-800">
                <strong>Как оплатить:</strong> Свяжитесь с @Aks1kx_bot в Telegram для получения промокода
              </AlertDescription>
            </Alert>

            <Button 
              className="w-full h-12 text-base font-semibold bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
              onClick={() => window.open('https://t.me/Aks1kx_bot', '_blank')}
            >
              <Icon name="Send" size={20} className="mr-2" />
              Написать в Telegram
            </Button>
          </div>
        </DialogContent>
      </Dialog>

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