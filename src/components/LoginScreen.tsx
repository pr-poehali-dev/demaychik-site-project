import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { User } from '@/types/business';
import { storageService } from '@/lib/storage';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';

interface LoginScreenProps {
  onLogin: (user: User) => void;
}

export default function LoginScreen({ onLogin }: LoginScreenProps) {
  const [mode, setMode] = useState<'login' | 'register' | 'promo'>('login');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [promoCode, setPromoCode] = useState('');
  const [showTrial, setShowTrial] = useState(false);
  const { toast } = useToast();

  const handleLogin = () => {
    if (!username.trim() || !password.trim()) {
      toast({ title: 'Ошибка', description: 'Заполните все поля', variant: 'destructive' });
      return;
    }

    if (storageService.isAdminAccount(username, password)) {
      const adminUser: User = {
        id: storageService.getAdminId(),
        username,
        password,
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

    if (storageService.checkUserBlocked(user)) {
      setShowTrial(true);
      return;
    }

    onLogin(user);
  };

  const handleRegister = () => {
    if (!username.trim() || !password.trim()) {
      toast({ title: 'Ошибка', description: 'Заполните все поля', variant: 'destructive' });
      return;
    }

    const users = storageService.getUsers();
    
    if (users.find(u => u.username === username)) {
      toast({ title: 'Ошибка', description: 'Пользователь уже существует', variant: 'destructive' });
      return;
    }

    const newUser: User = {
      id: `user_${Date.now()}`,
      username,
      password,
      isPremium: false,
      trialEndsAt: storageService.calculateTrialEnd(),
      isBlocked: false,
      createdAt: new Date(),
    };

    users.push(newUser);
    storageService.setUsers(users);
    
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
    const user = users.find(u => u.username === username);

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
      <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
        <Card className="w-full max-w-md animate-scale-in">
          <CardHeader>
            <CardTitle className="text-2xl">Пробный период истёк</CardTitle>
            <CardDescription>Приобретите полную версию для продолжения работы</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <Alert>
              <Icon name="AlertCircle" size={20} />
              <AlertDescription>
                Ваш 3-дневный бесплатный период завершён. Выберите один из вариантов:
              </AlertDescription>
            </Alert>

            <div className="space-y-3">
              <Button className="w-full" size="lg" onClick={() => window.open('https://t.me/Aks1kx_bot', '_blank')}>
                <Icon name="ShoppingCart" size={20} className="mr-2" />
                Купить на месяц - 399₽
              </Button>
              <Button className="w-full" size="lg" variant="secondary" onClick={() => window.open('https://t.me/Aks1kx_bot', '_blank')}>
                <Icon name="Crown" size={20} className="mr-2" />
                Купить навсегда - 1899₽
              </Button>
            </div>

            <div className="pt-4">
              <Label>У вас есть код оплаты?</Label>
              <div className="flex gap-2 mt-2">
                <Input
                  placeholder="Введите промокод"
                  value={promoCode}
                  onChange={(e) => setPromoCode(e.target.value)}
                />
                <Button onClick={handlePromoActivation}>
                  Активировать
                </Button>
              </div>
            </div>

            <Button variant="outline" className="w-full" onClick={() => setShowTrial(false)}>
              Назад
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-background to-muted">
      <Card className="w-full max-w-md animate-scale-in">
        <CardHeader className="text-center">
          <CardTitle className="text-3xl font-bold">DEMAYNCHIK</CardTitle>
          <CardDescription>Платформа для управления бизнесом</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {mode === 'register' && (
            <Alert className="bg-yellow-50 border-yellow-200">
              <Icon name="Clock" size={20} />
              <AlertDescription className="text-yellow-800">
                Вы получите <strong>3-дневный бесплатный период</strong> для тестирования
              </AlertDescription>
            </Alert>
          )}

          <div className="space-y-3">
            <div>
              <Label>Логин</Label>
              <Input
                placeholder="Введите логин"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleRegister())}
              />
            </div>
            <div>
              <Label>Пароль</Label>
              <Input
                type="password"
                placeholder="Введите пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (mode === 'login' ? handleLogin() : handleRegister())}
              />
            </div>
          </div>

          {mode === 'login' && (
            <>
              <Button className="w-full" size="lg" onClick={handleLogin}>
                <Icon name="LogIn" size={20} className="mr-2" />
                Войти
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setMode('register')}>
                Создать аккаунт
              </Button>
            </>
          )}

          {mode === 'register' && (
            <>
              <Button className="w-full" size="lg" onClick={handleRegister}>
                <Icon name="UserPlus" size={20} className="mr-2" />
                Зарегистрироваться
              </Button>
              <Button variant="outline" className="w-full" onClick={() => setMode('login')}>
                Уже есть аккаунт
              </Button>
              <div className="pt-2">
                <Button
                  variant="link"
                  className="w-full text-sm"
                  onClick={() => window.open('https://t.me/Aks1kx_bot', '_blank')}
                >
                  Купить полную версию →
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
