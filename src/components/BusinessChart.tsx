import { useState } from 'react';
import { Business } from '@/types/business';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { analyticsService } from '@/lib/analytics';

interface BusinessChartProps {
  business: Business;
}

export default function BusinessChart({ business }: BusinessChartProps) {
  const [period, setPeriod] = useState<'week' | 'month' | 'year'>('week');
  const chartData = analyticsService.getChartData(business, period);

  const maxValue = Math.max(
    ...chartData.incomeData,
    ...chartData.expenseData,
    1
  );

  return (
    <Card className="animate-fade-in">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Диаграмма доходов/расходов</CardTitle>
          <Select value={period} onValueChange={(v) => setPeriod(v as typeof period)}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="week">Неделя</SelectItem>
              <SelectItem value="month">Месяц</SelectItem>
              <SelectItem value="year">Год</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="flex items-center gap-4 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-green-500"></div>
              <span>Доход</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded bg-red-500"></div>
              <span>Расход</span>
            </div>
          </div>

          <div className="relative h-64 flex items-end justify-between gap-1 border-b border-l border-muted pb-2 pl-2">
            {chartData.labels.map((label, index) => {
              const incomeHeight = (chartData.incomeData[index] / maxValue) * 100;
              const expenseHeight = (chartData.expenseData[index] / maxValue) * 100;

              return (
                <div 
                  key={index} 
                  className="flex-1 flex flex-col items-center gap-1 group"
                >
                  <div className="w-full flex gap-1 items-end h-56">
                    <div 
                      className="flex-1 bg-gradient-to-t from-green-500 to-green-400 rounded-t transition-all duration-300 hover:from-green-600 hover:to-green-500 relative group-hover:scale-110 origin-bottom"
                      style={{ height: `${incomeHeight}%` }}
                    >
                      {chartData.incomeData[index] > 0 && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity bg-green-600 text-white px-2 py-1 rounded whitespace-nowrap">
                          {analyticsService.formatCurrency(chartData.incomeData[index])}
                        </div>
                      )}
                    </div>
                    <div 
                      className="flex-1 bg-gradient-to-t from-red-500 to-red-400 rounded-t transition-all duration-300 hover:from-red-600 hover:to-red-500 relative group-hover:scale-110 origin-bottom"
                      style={{ height: `${expenseHeight}%` }}
                    >
                      {chartData.expenseData[index] > 0 && (
                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-opacity bg-red-600 text-white px-2 py-1 rounded whitespace-nowrap">
                          {analyticsService.formatCurrency(chartData.expenseData[index])}
                        </div>
                      )}
                    </div>
                  </div>
                  <span className="text-xs text-muted-foreground text-center leading-tight w-full truncate">
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          {business.transactions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              <p>Нет данных для отображения</p>
              <p className="text-sm">Добавьте транзакции для создания диаграммы</p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
