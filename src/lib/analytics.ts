import { Business, Transaction, BusinessStats } from '@/types/business';

export const analyticsService = {
  calculateBusinessStats(business: Business): BusinessStats {
    const totalIncome = business.transactions
      .filter(t => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpenses = business.transactions
      .filter(t => t.type === 'expense')
      .reduce((sum, t) => sum + t.amount, 0);

    const profit = totalIncome - totalExpenses;
    const profitMargin = totalExpenses > 0 ? ((profit / totalExpenses) * 100) : 0;

    let status: BusinessStats['status'] = 'loss';
    if (profitMargin < 20) status = 'loss';
    else if (profitMargin >= 20 && profitMargin < 35) status = 'stable';
    else if (profitMargin >= 35 && profitMargin < 60) status = 'successful';
    else if (profitMargin >= 60 && profitMargin < 100) status = 'ideal';
    else if (profitMargin >= 100) status = 'excellent';

    const daysActive = this.getDaysActive(business);
    const dailyAverage = daysActive > 0 ? profit / daysActive : 0;
    const monthlyAverage = dailyAverage * 30;
    const yearlyProjection = dailyAverage * 365;

    return {
      totalIncome,
      totalExpenses,
      profit,
      profitMargin,
      status,
      dailyAverage,
      monthlyAverage,
      yearlyProjection,
    };
  },

  getDaysActive(business: Business): number {
    if (business.transactions.length === 0) return 0;
    
    const now = new Date();
    const createdAt = new Date(business.createdAt);
    const diffTime = Math.abs(now.getTime() - createdAt.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    return diffDays || 1;
  },

  getStatusInfo(status: BusinessStats['status']): { label: string; color: string; advice: string } {
    const statusMap = {
      loss: {
        label: 'В убытке',
        color: 'text-destructive',
        advice: 'Необходимо срочно пересмотреть расходы и увеличить доходы. Проанализируйте основные источники убытков.',
      },
      stable: {
        label: 'Стабилен',
        color: 'text-yellow-600',
        advice: 'Бизнес держится на плаву. Работайте над увеличением маржинальности и оптимизацией процессов.',
      },
      successful: {
        label: 'Успешен',
        color: 'text-green-600',
        advice: 'Отличные показатели! Масштабируйте успешные направления и развивайте новые каналы дохода.',
      },
      ideal: {
        label: 'Идеален',
        color: 'text-blue-600',
        advice: 'Превосходная прибыльность! Реинвестируйте в развитие и создавайте стратегический резерв.',
      },
      excellent: {
        label: 'Высший успех',
        color: 'text-purple-600',
        advice: 'Выдающиеся результаты! Рассмотрите возможность диверсификации и выхода на новые рынки.',
      },
    };

    return statusMap[status];
  },

  getChartData(business: Business, period: 'week' | 'month' | 'year') {
    const now = new Date();
    let daysBack = 7;
    if (period === 'month') daysBack = 30;
    if (period === 'year') daysBack = 365;

    const labels: string[] = [];
    const incomeData: number[] = [];
    const expenseData: number[] = [];

    for (let i = daysBack - 1; i >= 0; i--) {
      const date = new Date(now);
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      labels.push(this.formatDate(date, period));

      const dayIncome = business.transactions
        .filter(t => t.type === 'income' && t.date.toString().split('T')[0] === dateStr)
        .reduce((sum, t) => sum + t.amount, 0);

      const dayExpense = business.transactions
        .filter(t => t.type === 'expense' && t.date.toString().split('T')[0] === dateStr)
        .reduce((sum, t) => sum + t.amount, 0);

      incomeData.push(dayIncome);
      expenseData.push(dayExpense);
    }

    return { labels, incomeData, expenseData };
  },

  formatDate(date: Date, period: 'week' | 'month' | 'year'): string {
    if (period === 'week') {
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    }
    if (period === 'month') {
      return date.toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
    }
    return date.toLocaleDateString('ru-RU', { month: 'short', year: 'numeric' });
  },

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('ru-RU', {
      style: 'currency',
      currency: 'RUB',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  },
};
