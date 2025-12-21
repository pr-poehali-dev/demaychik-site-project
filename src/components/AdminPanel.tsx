import { useState, useEffect } from 'react';
import { PromoCode } from '@/types/business';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import Icon from '@/components/ui/icon';
import { storageService } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

export default function AdminPanel() {
  const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
  const [newPromoCode, setNewPromoCode] = useState('');
  const [promoType, setPromoType] = useState<'30d' | 'lifetime'>('30d');
  const { toast } = useToast();

  useEffect(() => {
    loadPromoCodes();
  }, []);

  const loadPromoCodes = () => {
    const codes = storageService.getPromoCodes();
    setPromoCodes(codes.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  const handleCreatePromoCode = () => {
    if (!newPromoCode.trim()) {
      toast({ title: 'Ошибка', description: 'Введите код', variant: 'destructive' });
      return;
    }

    const existingCodes = storageService.getPromoCodes();
    if (existingCodes.find(p => p.code === newPromoCode)) {
      toast({ title: 'Ошибка', description: 'Такой код уже существует', variant: 'destructive' });
      return;
    }

    const newPromo: PromoCode = {
      code: newPromoCode,
      type: promoType,
      isUsed: false,
      createdAt: new Date(),
    };

    existingCodes.push(newPromo);
    storageService.setPromoCodes(existingCodes);

    setPromoCodes([newPromo, ...promoCodes]);
    setNewPromoCode('');
    toast({ title: 'Успех!', description: 'Промокод создан' });
  };

  const stats = {
    total: promoCodes.length,
    used: promoCodes.filter(p => p.isUsed).length,
    active: promoCodes.filter(p => !p.isUsed).length,
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="relative">
        <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-accent/10 blur-3xl -z-10"></div>
        <h1 className="text-4xl font-bold flex items-center gap-3">
          <div className="w-16 h-16 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center shadow-lg glow">
            <Icon name="Shield" size={32} className="text-white" />
          </div>
          Админ-панель
        </h1>
        <p className="text-muted-foreground mt-2 text-lg">Управление промокодами и статистика</p>
      </div>

      <Alert className="bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 animate-slide-up">
        <Icon name="Info" size={20} className="text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Админ-доступ активен.</strong> Все созданные промокоды можно использовать только один раз.
        </AlertDescription>
      </Alert>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="animate-scale-in hover-lift border-2 border-primary/20 bg-gradient-to-br from-card to-primary/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Icon name="Hash" size={16} />
              Всего кодов
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-primary">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="animate-scale-in hover-lift border-2 border-red-200 bg-gradient-to-br from-card to-red-50" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Icon name="CheckCircle" size={16} />
              Использовано
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-red-600">{stats.used}</div>
          </CardContent>
        </Card>

        <Card className="animate-scale-in hover-lift border-2 border-green-200 bg-gradient-to-br from-card to-green-50" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
              <Icon name="Sparkles" size={16} />
              Активных
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-4xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-2 shadow-lg animate-scale-in">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Icon name="Plus" size={24} className="text-primary" />
            Создать промокод
          </CardTitle>
          <CardDescription className="text-base">Генерация нового кода для активации премиум-версии</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4 pt-6">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label className="text-base">Код промокода</Label>
              <Input
                placeholder="Введите уникальный код"
                value={newPromoCode}
                onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
                className="h-12 text-base font-mono"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-base">Тип доступа</Label>
              <Select value={promoType} onValueChange={(v) => setPromoType(v as '30d' | 'lifetime')}>
                <SelectTrigger className="h-12 text-base">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30d">
                    <div className="flex items-center gap-2">
                      <Icon name="Calendar" size={16} />
                      <span>30 дней</span>
                    </div>
                  </SelectItem>
                  <SelectItem value="lifetime">
                    <div className="flex items-center gap-2">
                      <Icon name="Infinity" size={16} />
                      <span>Навсегда</span>
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleCreatePromoCode} className="w-full h-12 text-base font-semibold hover:scale-105 transition-transform shadow-lg">
            <Icon name="Plus" size={20} className="mr-2" />
            Создать промокод
          </Button>
        </CardContent>
      </Card>

      <Card className="border-2 shadow-lg animate-fade-in">
        <CardHeader className="bg-gradient-to-r from-primary/5 to-accent/5">
          <CardTitle className="text-2xl flex items-center gap-2">
            <Icon name="List" size={24} className="text-primary" />
            Список промокодов
          </CardTitle>
          <CardDescription className="text-base">Все созданные промокоды и их статус использования</CardDescription>
        </CardHeader>
        <CardContent>
          {promoCodes.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground animate-fade-in">
              <Icon name="Ticket" size={64} className="mx-auto mb-4 opacity-30" />
              <p className="text-lg font-semibold">Пока нет промокодов</p>
              <p className="text-sm">Создайте первый промокод выше</p>
            </div>
          ) : (
            <div className="space-y-3">
              {promoCodes.map((promo, index) => (
                <div
                  key={promo.code}
                  className="flex items-center justify-between p-5 border-2 rounded-xl hover:shadow-lg transition-all duration-300 hover:-translate-y-1 animate-slide-up group"
                  style={{ animationDelay: `${index * 0.05}s` }}
                >
                  <div className="flex items-center gap-4 flex-1">
                    <div className={`w-14 h-14 rounded-full flex items-center justify-center group-hover:scale-110 transition-transform shadow-md ${
                      promo.isUsed ? 'bg-gradient-to-br from-red-100 to-red-200' : 'bg-gradient-to-br from-green-100 to-green-200'
                    }`}>
                      <Icon
                        name={promo.isUsed ? 'XCircle' : 'Sparkles'}
                        size={28}
                        className={promo.isUsed ? 'text-red-600' : 'text-green-600'}
                      />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-mono font-bold text-xl tracking-wider group-hover:text-primary transition-colors">{promo.code}</span>
                        <Badge 
                          className={promo.type === 'lifetime' 
                            ? 'bg-gradient-to-r from-yellow-500 to-orange-500 text-white' 
                            : 'bg-blue-500 text-white'}
                        >
                          <Icon name={promo.type === 'lifetime' ? 'Infinity' : 'Calendar'} size={12} className="mr-1" />
                          {promo.type === 'lifetime' ? 'Навсегда' : '30 дней'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Icon name="Clock" size={14} />
                        Создан: {new Date(promo.createdAt).toLocaleDateString('ru-RU', { 
                          day: 'numeric', 
                          month: 'long', 
                          year: 'numeric' 
                        })}
                        {promo.isUsed && promo.usedBy && (
                          <>
                            <span className="text-muted-foreground">•</span>
                            <Icon name="CheckCircle" size={14} className="text-red-500" />
                            <span className="text-red-600 font-medium">Использован</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>
                  <Badge 
                    variant={promo.isUsed ? 'destructive' : 'default'}
                    className={`px-4 py-2 text-base font-bold ${
                      !promo.isUsed && 'bg-gradient-to-r from-green-500 to-emerald-500 text-white shadow-lg animate-pulse'
                    }`}
                  >
                    {promo.isUsed ? (
                      <div className="flex items-center gap-2">
                        <Icon name="Ban" size={16} />
                        Использован
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <Icon name="Zap" size={16} />
                        Активен
                      </div>
                    )}
                  </Badge>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}