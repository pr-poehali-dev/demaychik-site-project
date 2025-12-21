import { useState, useEffect } from 'react';
import { PromoCode } from '@/types/business';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
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
      <div>
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Icon name="Shield" size={32} className="text-primary" />
          Админ-панель
        </h1>
        <p className="text-muted-foreground">Управление промокодами</p>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="animate-scale-in">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Всего кодов</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats.total}</div>
          </CardContent>
        </Card>

        <Card className="animate-scale-in" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Использовано</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-red-600">{stats.used}</div>
          </CardContent>
        </Card>

        <Card className="animate-scale-in" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Активных</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-600">{stats.active}</div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Создать промокод</CardTitle>
          <CardDescription>Генерация нового кода для активации премиум-версии</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Код промокода</Label>
              <Input
                placeholder="Введите уникальный код"
                value={newPromoCode}
                onChange={(e) => setNewPromoCode(e.target.value)}
              />
            </div>
            <div>
              <Label>Тип</Label>
              <Select value={promoType} onValueChange={(v) => setPromoType(v as '30d' | 'lifetime')}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30d">30 дней</SelectItem>
                  <SelectItem value="lifetime">Навсегда</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <Button onClick={handleCreatePromoCode} className="w-full">
            <Icon name="Plus" size={20} className="mr-2" />
            Создать промокод
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Список промокодов</CardTitle>
          <CardDescription>Все созданные промокоды и их статус</CardDescription>
        </CardHeader>
        <CardContent>
          {promoCodes.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Icon name="Ticket" size={48} className="mx-auto mb-3 opacity-50" />
              <p>Пока нет промокодов</p>
            </div>
          ) : (
            <div className="space-y-2">
              {promoCodes.map((promo) => (
                <div
                  key={promo.code}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      promo.isUsed ? 'bg-red-100' : 'bg-green-100'
                    }`}>
                      <Icon
                        name={promo.isUsed ? 'XCircle' : 'CheckCircle'}
                        size={20}
                        className={promo.isUsed ? 'text-red-600' : 'text-green-600'}
                      />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold">{promo.code}</span>
                        <Badge variant={promo.type === 'lifetime' ? 'default' : 'secondary'}>
                          {promo.type === 'lifetime' ? 'Навсегда' : '30 дней'}
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        Создан: {new Date(promo.createdAt).toLocaleDateString('ru-RU')}
                        {promo.isUsed && promo.usedBy && ` • Использован`}
                      </p>
                    </div>
                  </div>
                  <Badge variant={promo.isUsed ? 'destructive' : 'default'}>
                    {promo.isUsed ? 'Использован' : 'Активен'}
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
