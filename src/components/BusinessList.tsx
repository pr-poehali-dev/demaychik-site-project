import { useState, useEffect } from 'react';
import { User, Business } from '@/types/business';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { storageService } from '@/lib/storage';
import { analyticsService } from '@/lib/analytics';
import { useToast } from '@/hooks/use-toast';
import BusinessDetails from './BusinessDetails';
import FeaturesShowcase from './FeaturesShowcase';

interface BusinessListProps {
  user: User;
}

export default function BusinessList({ user }: BusinessListProps) {
  const [businesses, setBusinesses] = useState<Business[]>([]);
  const [selectedBusiness, setSelectedBusiness] = useState<Business | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newBusinessName, setNewBusinessName] = useState('');
  const [newBusinessDescription, setNewBusinessDescription] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadBusinesses();
  }, [user.id]);

  const loadBusinesses = () => {
    const allBusinesses = storageService.getBusinesses();
    const userBusinesses = allBusinesses.filter(b => b.userId === user.id);
    setBusinesses(userBusinesses);
  };

  const handleCreateBusiness = () => {
    if (!newBusinessName.trim()) {
      toast({ title: 'Ошибка', description: 'Введите название бизнеса', variant: 'destructive' });
      return;
    }

    const newBusiness: Business = {
      id: `business_${Date.now()}`,
      userId: user.id,
      name: newBusinessName,
      description: newBusinessDescription,
      createdAt: new Date(),
      records: [],
      transactions: [],
    };

    const allBusinesses = storageService.getBusinesses();
    allBusinesses.push(newBusiness);
    storageService.setBusinesses(allBusinesses);

    setBusinesses([...businesses, newBusiness]);
    setNewBusinessName('');
    setNewBusinessDescription('');
    setIsCreateOpen(false);
    toast({ title: 'Успех!', description: 'Бизнес создан' });
  };

  if (selectedBusiness) {
    return (
      <BusinessDetails
        business={selectedBusiness}
        onBack={() => {
          setSelectedBusiness(null);
          loadBusinesses();
        }}
        onUpdate={(updated) => {
          setSelectedBusiness(updated);
          loadBusinesses();
        }}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Мои бизнесы</h1>
          <p className="text-muted-foreground">Управляйте своими проектами</p>
        </div>

        <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Icon name="Plus" size={20} />
              Создать бизнес
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новый бизнес</DialogTitle>
              <DialogDescription>Создайте новый бизнес-проект для учёта</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Название</Label>
                <Input
                  placeholder="Название бизнеса"
                  value={newBusinessName}
                  onChange={(e) => setNewBusinessName(e.target.value)}
                />
              </div>
              <div>
                <Label>Описание</Label>
                <Textarea
                  placeholder="Краткое описание проекта"
                  value={newBusinessDescription}
                  onChange={(e) => setNewBusinessDescription(e.target.value)}
                  rows={4}
                />
              </div>
              <Button className="w-full" onClick={handleCreateBusiness}>
                Создать
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {businesses.length === 0 ? (
        <Card className="text-center py-12 animate-fade-in">
          <CardContent>
            <Icon name="Briefcase" size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Нет бизнесов</h3>
            <p className="text-muted-foreground mb-6">
              Создайте свой первый бизнес-проект для начала работы
            </p>
            <Button onClick={() => setIsCreateOpen(true)}>
              <Icon name="Plus" size={20} className="mr-2" />
              Создать первый бизнес
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {businesses.map((business, index) => {
            const stats = analyticsService.calculateBusinessStats(business);
            const statusInfo = analyticsService.getStatusInfo(stats.status);

            return (
              <Card
                key={business.id}
                className="cursor-pointer hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 animate-scale-in hover-lift group relative overflow-hidden border-2"
                style={{ animationDelay: `${index * 0.1}s` }}
                onClick={() => setSelectedBusiness(business)}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                
                <CardHeader className="relative z-10">
                  <CardTitle className="flex items-center justify-between">
                    <span className="truncate group-hover:text-primary transition-colors duration-300">{business.name}</span>
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:scale-110 transition-all duration-300">
                      <Icon name="ChevronRight" size={20} className="text-primary group-hover:text-white transition-colors" />
                    </div>
                  </CardTitle>
                  <CardDescription className="line-clamp-2">
                    {business.description || 'Нет описания'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="relative z-10">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg group-hover:bg-muted transition-colors duration-300">
                      <div className="flex items-center gap-2">
                        <Icon name="TrendingUp" size={16} className="text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Прибыль:</span>
                      </div>
                      <span className={`font-bold text-lg ${stats.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {analyticsService.formatCurrency(stats.profit)}
                      </span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg group-hover:bg-muted transition-colors duration-300">
                      <div className="flex items-center gap-2">
                        <Icon name="Activity" size={16} className="text-muted-foreground" />
                        <span className="text-sm text-muted-foreground">Статус:</span>
                      </div>
                      <span className={`font-bold ${statusInfo.color} flex items-center gap-1`}>
                        {statusInfo.label}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-2">
                      <div className="p-2 bg-blue-50 rounded-lg text-center">
                        <p className="text-xs text-blue-600 font-medium">Записей</p>
                        <p className="text-lg font-bold text-blue-900">{business.records.length}</p>
                      </div>
                      <div className="p-2 bg-purple-50 rounded-lg text-center">
                        <p className="text-xs text-purple-600 font-medium">Транзакций</p>
                        <p className="text-lg font-bold text-purple-900">{business.transactions.length}</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {businesses.length > 0 && (
        <div className="mt-12 space-y-4 animate-fade-in">
          <div className="text-center">
            <h2 className="text-3xl font-bold mb-2">Возможности DEMAYNCHIK</h2>
            <p className="text-muted-foreground text-lg">Всё для эффективного управления вашим бизнесом</p>
          </div>
          <FeaturesShowcase />
        </div>
      )}
    </div>
  );
}