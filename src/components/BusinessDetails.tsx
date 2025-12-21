import { useState } from 'react';
import { Business, Transaction, BusinessRecord } from '@/types/business';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import Icon from '@/components/ui/icon';
import { storageService } from '@/lib/storage';
import { analyticsService } from '@/lib/analytics';
import { useToast } from '@/hooks/use-toast';
import BusinessChart from './BusinessChart';

interface BusinessDetailsProps {
  business: Business;
  onBack: () => void;
  onUpdate: (business: Business) => void;
}

export default function BusinessDetails({ business, onBack, onUpdate }: BusinessDetailsProps) {
  const [isAddTransactionOpen, setIsAddTransactionOpen] = useState(false);
  const [isAddRecordOpen, setIsAddRecordOpen] = useState(false);
  const [transactionType, setTransactionType] = useState<'income' | 'expense'>('income');
  const [transactionAmount, setTransactionAmount] = useState('');
  const [transactionDescription, setTransactionDescription] = useState('');
  const [recordTitle, setRecordTitle] = useState('');
  const [recordContent, setRecordContent] = useState('');
  const [recordFont, setRecordFont] = useState('Inter');
  const [recordColor, setRecordColor] = useState('#000000');
  const { toast } = useToast();

  const stats = analyticsService.calculateBusinessStats(business);
  const statusInfo = analyticsService.getStatusInfo(stats.status);

  const handleAddTransaction = () => {
    const amount = parseFloat(transactionAmount);
    if (isNaN(amount) || amount <= 0) {
      toast({ title: 'Ошибка', description: 'Введите корректную сумму', variant: 'destructive' });
      return;
    }

    const newTransaction: Transaction = {
      id: `transaction_${Date.now()}`,
      businessId: business.id,
      type: transactionType,
      amount,
      description: transactionDescription,
      date: new Date(),
    };

    const allBusinesses = storageService.getBusinesses();
    const businessIndex = allBusinesses.findIndex(b => b.id === business.id);
    
    if (businessIndex !== -1) {
      allBusinesses[businessIndex].transactions.push(newTransaction);
      storageService.setBusinesses(allBusinesses);
      onUpdate(allBusinesses[businessIndex]);
    }

    setTransactionAmount('');
    setTransactionDescription('');
    setIsAddTransactionOpen(false);
    toast({ title: 'Успех!', description: 'Транзакция добавлена' });
  };

  const handleAddRecord = () => {
    if (!recordTitle.trim()) {
      toast({ title: 'Ошибка', description: 'Введите название записи', variant: 'destructive' });
      return;
    }

    const newRecord: BusinessRecord = {
      id: `record_${Date.now()}`,
      businessId: business.id,
      title: recordTitle,
      content: recordContent,
      fontFamily: recordFont,
      textColor: recordColor,
      createdAt: new Date(),
    };

    const allBusinesses = storageService.getBusinesses();
    const businessIndex = allBusinesses.findIndex(b => b.id === business.id);
    
    if (businessIndex !== -1) {
      allBusinesses[businessIndex].records.push(newRecord);
      storageService.setBusinesses(allBusinesses);
      onUpdate(allBusinesses[businessIndex]);
    }

    setRecordTitle('');
    setRecordContent('');
    setIsAddRecordOpen(false);
    toast({ title: 'Успех!', description: 'Запись добавлена' });
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <Icon name="ArrowLeft" size={20} />
        </Button>
        <div className="flex-1">
          <h1 className="text-3xl font-bold">{business.name}</h1>
          <p className="text-muted-foreground">{business.description}</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="animate-scale-in">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Доход</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {analyticsService.formatCurrency(stats.totalIncome)}
            </div>
          </CardContent>
        </Card>

        <Card className="animate-scale-in" style={{ animationDelay: '0.1s' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Расход</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {analyticsService.formatCurrency(stats.totalExpenses)}
            </div>
          </CardContent>
        </Card>

        <Card className="animate-scale-in" style={{ animationDelay: '0.2s' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Прибыль</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${stats.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {analyticsService.formatCurrency(stats.profit)}
            </div>
          </CardContent>
        </Card>

        <Card className="animate-scale-in" style={{ animationDelay: '0.3s' }}>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">Статус</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-xl font-bold ${statusInfo.color}`}>
              {statusInfo.label}
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Рекомендация ИИ</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-3">
              <Icon name="Sparkles" size={24} className="text-primary flex-shrink-0" />
              <p className="text-muted-foreground">{statusInfo.advice}</p>
            </div>
          </CardContent>
        </Card>

        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle>Средние показатели</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">Среднее за день</p>
              <p className="text-xl font-bold">{analyticsService.formatCurrency(stats.dailyAverage)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Среднее за месяц</p>
              <p className="text-xl font-bold">{analyticsService.formatCurrency(stats.monthlyAverage)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Прогноз на год</p>
              <p className="text-xl font-bold text-primary">{analyticsService.formatCurrency(stats.yearlyProjection)}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <BusinessChart business={business} />

      <Tabs defaultValue="transactions" className="animate-fade-in">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="transactions">Финансы</TabsTrigger>
          <TabsTrigger value="records">Записи</TabsTrigger>
        </TabsList>

        <TabsContent value="transactions" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isAddTransactionOpen} onOpenChange={setIsAddTransactionOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Icon name="Plus" size={20} className="mr-2" />
                  Добавить транзакцию
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Новая транзакция</DialogTitle>
                  <DialogDescription>Добавьте доход или расход</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Тип</Label>
                    <Select value={transactionType} onValueChange={(v) => setTransactionType(v as 'income' | 'expense')}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="income">Доход</SelectItem>
                        <SelectItem value="expense">Расход</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Сумма (₽)</Label>
                    <Input
                      type="number"
                      placeholder="1000"
                      value={transactionAmount}
                      onChange={(e) => setTransactionAmount(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Описание</Label>
                    <Input
                      placeholder="Описание операции"
                      value={transactionDescription}
                      onChange={(e) => setTransactionDescription(e.target.value)}
                    />
                  </div>
                  <Button className="w-full" onClick={handleAddTransaction}>
                    Добавить
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-2">
            {business.transactions.length === 0 ? (
              <Card className="text-center py-8">
                <CardContent>
                  <Icon name="TrendingUp" size={48} className="mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Пока нет транзакций</p>
                </CardContent>
              </Card>
            ) : (
              business.transactions.slice().reverse().map((transaction) => (
                <Card key={transaction.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          transaction.type === 'income' ? 'bg-green-100' : 'bg-red-100'
                        }`}>
                          <Icon
                            name={transaction.type === 'income' ? 'TrendingUp' : 'TrendingDown'}
                            size={20}
                            className={transaction.type === 'income' ? 'text-green-600' : 'text-red-600'}
                          />
                        </div>
                        <div>
                          <p className="font-medium">{transaction.description || 'Без описания'}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(transaction.date).toLocaleDateString('ru-RU')}
                          </p>
                        </div>
                      </div>
                      <div className={`text-xl font-bold ${
                        transaction.type === 'income' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {transaction.type === 'income' ? '+' : '-'}
                        {analyticsService.formatCurrency(transaction.amount)}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>

        <TabsContent value="records" className="space-y-4">
          <div className="flex justify-end">
            <Dialog open={isAddRecordOpen} onOpenChange={setIsAddRecordOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Icon name="Plus" size={20} className="mr-2" />
                  Добавить запись
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Новая запись</DialogTitle>
                  <DialogDescription>Создайте заметку о бизнесе</DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Название</Label>
                    <Input
                      placeholder="Название записи"
                      value={recordTitle}
                      onChange={(e) => setRecordTitle(e.target.value)}
                    />
                  </div>
                  <div>
                    <Label>Содержание</Label>
                    <Textarea
                      placeholder="Текст записи"
                      value={recordContent}
                      onChange={(e) => setRecordContent(e.target.value)}
                      rows={5}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label>Шрифт</Label>
                      <Select value={recordFont} onValueChange={setRecordFont}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="Inter">Inter</SelectItem>
                          <SelectItem value="Montserrat">Montserrat</SelectItem>
                          <SelectItem value="Roboto">Roboto</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>Цвет текста</Label>
                      <Input
                        type="color"
                        value={recordColor}
                        onChange={(e) => setRecordColor(e.target.value)}
                      />
                    </div>
                  </div>
                  <Button className="w-full" onClick={handleAddRecord}>
                    Добавить
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>

          <div className="space-y-3">
            {business.records.length === 0 ? (
              <Card className="text-center py-8">
                <CardContent>
                  <Icon name="FileText" size={48} className="mx-auto text-muted-foreground mb-3" />
                  <p className="text-muted-foreground">Пока нет записей</p>
                </CardContent>
              </Card>
            ) : (
              business.records.slice().reverse().map((record) => (
                <Card key={record.id} className="hover:shadow-md transition-shadow">
                  <CardHeader>
                    <CardTitle style={{ fontFamily: record.fontFamily, color: record.textColor }}>
                      {record.title}
                    </CardTitle>
                    <CardDescription>
                      {new Date(record.createdAt).toLocaleDateString('ru-RU')}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p style={{ fontFamily: record.fontFamily, color: record.textColor }}>
                      {record.content}
                    </p>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}