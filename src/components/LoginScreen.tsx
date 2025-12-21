import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User } from '@/types/business';
import { storageService } from '@/lib/storage';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'promo'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [showTrial, setShowTrial] = useState(false);
  const [showPaymentInfo, setShowPaymentInfo] = useState(false);
  const [currentIP, setCurrentIP] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    storageService.getCurrentIP().then(setCurrentIP);
  }, []);

  const handleLogin = async () => {
    if (!username.trim() || !password.trim()) {
      toast({ title: 'Ошибка', description: 'Заполните все поля', variant: 'destructive' });
      return;
    }

    if (storageService.isAdminAccount(username, password)) {
      const adminUser: User = {
        id: storageService.getAdminId(),
        username,
        password,
        avatar: 'https://cdn.poehali.dev/files/1766331853236.png',
        isPremium: true,
        isBlocked: false,
        createdAt: new Date(),
      };
      onLogin(adminUser);
      return;
    }

    const users = storageService.getUsers();
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
      toast({ title: 'Ошибка', description: 'Неверный логин или пароль', variant: 'destructive' });
      return;
    }

    const ip = await storageService.getCurrentIP();
    if (!storageService.checkIPLimit(ip, user.id)) {
      toast({ 
        title: 'Ошибка', 
        description: 'С этого IP уже зарегистрирован другой аккаунт', 
        variant: 'destructive' 
      });
      return;
    }

    if (storageService.checkUserBlocked(user)) {
      setShowTrial(true);
      return;
    }

    storageService.registerIP(ip, user.id);
    onLogin(user);
  };

  const handleRegister = async () => {
    if (!username.trim() || !password.trim()) {
      toast({ title: 'Ошибка', description: 'Заполните все поля', variant: 'destructive' });
      return;
    }

    const users = storageService.getUsers();
    
    if (users.find(u => u.username === username)) {
      toast({ title: 'Ошибка', description: 'Пользователь уже существует', variant: 'destructive' });
      return;
    }

    const ip = await storageService.getCurrentIP();
    if (!storageService.checkIPLimit(ip, 'new_user')) {
      toast({ 
        title: 'Ошибка', 
        description: 'С этого IP уже зарегистрирован аккаунт', 
        variant: 'destructive' 
      });
      return;
    }

    const newUser: User = {
      id: `user_${Date.now()}`,
      username,
      password,
      avatar: 'https://cdn.poehali.dev/files/1766331853236.png',
      isPremium: false,
      trialEndsAt: storageService.calculateTrialEnd(),
      isBlocked: false,
      createdAt: new Date(),
    };

    users.push(newUser);
    storageService.setUsers(users);
    storageService.registerIP(ip, newUser.id);
    
    toast({ title: 'Успех!', description: 'Аккаунт создан. Пробный период: 3 дня' });
    setMode('login');
  };

  const handlePromoActivation = () => {
    if (!promoCode.trim()) {
      toast({ title: 'Ошибка', description: 'Введите промокод', variant: 'destructive' });
      return;
    }

    const promoCodes = storageService.getPromoCodes();
    const promo = promoCodes.find(p => p.code === promoCode && !p.isUsed);

    if (!promo) {
      toast({ title: 'Ошибка', description: 'Неверный или использованный промокод', variant: 'destructive' });
      return;
    }

    const users = storageService.getUsers();
    const user = users.find(u => u.username === username && u.password === password);

    if (!user) {
      toast({ title: 'Ошибка', description: 'Сначала войдите в аккаунт', variant: 'destructive' });
      return;
    }

    promo.isUsed = true;
    promo.usedBy = user.id;
    storageService.setPromoCodes(promoCodes);

    user.isPremium = true;
    if (promo.type === '30d') {
      const trialEnd = new Date();
      trialEnd.setDate(trialEnd.getDate() + 30);
      user.trialEndsAt = trialEnd;
    } else {
      user.trialEndsAt = undefined;
    }
    user.isBlocked = false;

    storageService.setUsers(users);
    toast({ title: 'Успех!', description: 'Промокод активирован!' });
    onLogin(user);
  };

  if (showTrial) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted to-background animate-fade-in">
        <Card className="w-full max-w-md animate-scale-in shadow-2xl border-2">
          <CardHeader className="text-center">
            <div className="mx-auto w-20 h-20 rounded-full bg-gradient-to-br from-yellow-400 to-orange-500 flex items-center justify-center mb-4 animate-pulse">
              <Icon name="Crown" size={40} className="text-white" />
            </div>
            <CardTitle className="text-3xl font-bold bg-gradient-to-r from-yellow-600 to-orange-600 bg-clip-text text-transparent">
              Пробный период истёк
            </CardTitle>
            <CardDescription className="text-base">
              Приобретите полную версию для продолжения работы
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <Alert className="bg-yellow-50 border-yellow-200 animate-slide-up">
              <Icon name="AlertCircle" size={20} className="text-yellow-600" />
              <AlertDescription className="text-yellow-800">
                Ваш 3-дневный бесплатный период завершён. Выберите один из вариантов для продолжения:
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Button 
                className="w-full h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105" 
                size="lg" 
                onClick={() => setShowPaymentInfo(true)}
              >
                <Icon name="ShoppingCart" size={24} className="mr-2" />
                Купить на месяц - 399₽
              </Button>
              <Button 
                className="w-full h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105 bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-600 hover:to-orange-600" 
                size="lg" 
                onClick={() => setShowPaymentInfo(true)}
              >
                <Icon name="Crown" size={24} className="mr-2" />
                Купить навсегда - 1899₽
              </Button>
            </div>

            <div className="pt-4 space-y-2 animate-fade-in">
              <Label className="text-base font-semibold">У вас есть код оплаты?</Label>
              <div className="flex gap-2">
                <Input
                  placeholder="Введите промокод"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  className="text-base"
                />
                <Button onClick={handlePromoActivation} className="px-6">
                  Активировать
                </Button>
              </div>
            </div>

            <Button 
              variant="outline" 
              className="w-full hover:bg-muted transition-all duration-300" 
              onClick={() => setShowTrial(false)}
            >
              <Icon name="ArrowLeft" size={20} className="mr-2" />
              Назад
            </Button>
          </CardContent>
        </Card>

        <Dialog open={showPaymentInfo} onOpenChange={setShowPaymentInfo}>
          <DialogContent className="max-w-lg animate-scale-in">
            <DialogHeader>
              <DialogTitle className="text-2xl flex items-center gap-2">
                <Icon name="CreditCard" size={28} className="text-primary" />
                Инструкция по оплате
              </DialogTitle>
              <DialogDescription className="text-base pt-2">
                Следуйте простым шагам для активации полного доступа
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-6 py-4">
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-muted rounded-lg hover:bg-muted/70 transition-colors duration-200">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                    1
                  </div>
                  <div>
                    <p className="font-semibold text-base mb-1">Откройте Telegram-бот</p>
                    <Button 
                      variant="link" 
                      className="p-0 h-auto text-blue-600 hover:text-blue-800"
                      onClick={() => window.open('https://t.me/Aks1kx_bot', '_blank')}
                    >
                      <Icon name="Send" size={16} className="mr-1" />
                      @Aks1kx_bot
                    </Button>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-muted rounded-lg hover:bg-muted/70 transition-colors duration-200">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                    2
                  </div>
                  <div>
                    <p className="font-semibold text-base mb-1">Выберите тариф</p>
                    <ul className="text-sm text-muted-foreground space-y-1">
                      <li>• Месяц (30 дней) — 399₽</li>
                      <li>• Навсегда (без ограничений) — 1899₽</li>
                    </ul>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-muted rounded-lg hover:bg-muted/70 transition-colors duration-200">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                    3
                  </div>
                  <div>
                    <p className="font-semibold text-base mb-1">Оплатите любым способом</p>
                    <p className="text-sm text-muted-foreground">
                      Банковская карта, СБП, электронные кошельки
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-muted rounded-lg hover:bg-muted/70 transition-colors duration-200">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center font-bold flex-shrink-0">
                    4
                  </div>
                  <div>
                    <p className="font-semibold text-base mb-1">Получите промокод</p>
                    <p className="text-sm text-muted-foreground">
                      Бот автоматически отправит вам код активации
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-lg">
                  <div className="w-8 h-8 rounded-full bg-green-500 text-white flex items-center justify-center font-bold flex-shrink-0">
                    5
                  </div>
                  <div>
                    <p className="font-semibold text-base mb-1 text-green-900">Активируйте код</p>
                    <p className="text-sm text-green-700">
                      Введите промокод в поле выше и нажмите "Активировать"
                    </p>
                  </div>
                </div>
              </div>

              <Alert className="bg-blue-50 border-blue-200">
                <Icon name="Info" size={20} className="text-blue-600" />
                <AlertDescription className="text-blue-800">
                  <strong>Важно:</strong> Промокод можно использовать только один раз. 
                  Сохраните его до момента активации!
                </AlertDescription>
              </Alert>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background via-muted to-background relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-pattern opacity-5"></div>
      
      <Card className="w-full max-w-md animate-scale-in shadow-2xl border-2 relative z-10">
        <CardHeader className="text-center pb-6">
          <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-4 shadow-lg animate-pulse">
            <Icon name="TrendingUp" size={48} className="text-white" />
          </div>
          <CardTitle className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
            DEMAYNCHIK
          </CardTitle>
          <CardDescription className="text-base pt-2">
            Платформа для управления бизнесом
          </CardDescription>
          {currentIP && (
            <p className="text-xs text-muted-foreground pt-2">
              IP: {currentIP}
            </p>
          )}
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === 'register' && (
            <Alert className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-300 animate-slide-up">
              <Icon name="Clock" size={20} className="text-yellow-600" />
              <AlertDescription className="text-yellow-800 font-medium">
                Вы получите <strong>3-дневный бесплатный период</strong> для тестирования всех функций
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-base">Логин</Label>
              <Input
                placeholder="Введите логин"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleRegister())}
                className="h-12 text-base transition-all duration-200 focus:scale-105"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-base">Пароль</Label>
              <Input
                type="password"
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleRegister())}
                className="h-12 text-base transition-all duration-200 focus:scale-105"
              />
            </div>
          </div>

          {mode === 'login' && (
            <>
              <Button 
                className="w-full h-12 text-base font-semibold hover:scale-105 transition-all duration-300 shadow-lg" 
                size="lg" 
                onClick={handleLogin}
              >
                <Icon name="LogIn" size={20} className="mr-2" />
                Войти
              </Button>
              <Button 
                variant="outline" 
                className="w-full h-12 hover:scale-105 transition-all duration-300" 
                onClick={() => setMode('register')}
              >
                Создать аккаунт
              </Button>
            </>
          )}

          {mode === 'register' && (
            <>
              <Button 
                className="w-full h-12 text-base font-semibold hover:scale-105 transition-all duration-300 shadow-lg" 
                size="lg" 
                onClick={handleRegister}
              >
                <Icon name="UserPlus" size={20} className="mr-2" />
                Зарегистрироваться
              </Button>
              <Button 
                variant="outline" 
                className="w-full h-12 hover:scale-105 transition-all duration-300" 
                onClick={() => setMode('login')}
              >
                Уже есть аккаунт
              </Button>
            </>
          )}

          {mode === 'promo' && (
            <>
              <div className="space-y-2">
                <Label className="text-base">Промокод</Label>
                <Input
                  placeholder="Введите код активации"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                  className="h-12 text-base font-mono"
                />
              </div>
              <Button 
                className="w-full h-12 text-base font-semibold hover:scale-105 transition-all duration-300" 
                size="lg" 
                onClick={handlePromoActivation}
              >
                <Icon name="Gift" size={20} className="mr-2" />
                Активировать промокод
              </Button>
              <Button 
                variant="outline" 
                className="w-full h-12 hover:scale-105 transition-all duration-300" 
                onClick={() => setMode('login')}
              >
                Назад
              </Button>
            </>
          )}

          {mode === 'login' && (
            <Button 
              variant="ghost" 
              className="w-full text-primary hover:text-primary/80 hover:bg-primary/10 transition-all duration-200" 
              onClick={() => setMode('promo')}
            >
              <Icon name="Gift" size={18} className="mr-2" />
              У меня есть промокод
            </Button>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
