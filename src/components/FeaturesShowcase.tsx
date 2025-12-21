import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

const features = [
  {
    icon: 'TrendingUp',
    title: 'Аналитика доходов',
    description: 'Автоматический расчёт прибыли с графиками и прогнозами',
    color: 'from-green-500 to-emerald-500',
  },
  {
    icon: 'BarChart3',
    title: 'Интерактивные диаграммы',
    description: 'Визуализация доходов и расходов за любой период',
    color: 'from-blue-500 to-cyan-500',
  },
  {
    icon: 'Sparkles',
    title: 'Рекомендации ИИ',
    description: 'Персональные советы на основе ваших показателей',
    color: 'from-purple-500 to-pink-500',
  },
  {
    icon: 'FileText',
    title: 'Вечное хранение записей',
    description: 'Создавайте заметки с кастомным оформлением',
    color: 'from-orange-500 to-red-500',
  },
  {
    icon: 'Users',
    title: 'Сообщество профи',
    description: 'Задавайте вопросы опытным предпринимателям',
    color: 'from-indigo-500 to-blue-500',
  },
  {
    icon: 'Shield',
    title: 'Безопасность данных',
    description: 'Ваши данные хранятся локально и защищены',
    color: 'from-yellow-500 to-amber-500',
  },
];

export default function FeaturesShowcase() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {features.map((feature, index) => (
        <Card
          key={feature.title}
          className="group hover:shadow-2xl transition-all duration-300 hover:-translate-y-2 cursor-default border-2 animate-scale-in overflow-hidden"
          style={{ animationDelay: `${index * 0.1}s` }}
        >
          <div className={`absolute inset-0 bg-gradient-to-br ${feature.color} opacity-0 group-hover:opacity-10 transition-opacity duration-300`}></div>
          <CardHeader className="relative z-10">
            <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-3 shadow-lg group-hover:scale-110 transition-transform duration-300`}>
              <Icon name={feature.icon as any} size={28} className="text-white" />
            </div>
            <CardTitle className="text-lg group-hover:text-primary transition-colors duration-300">
              {feature.title}
            </CardTitle>
          </CardHeader>
          <CardContent className="relative z-10">
            <p className="text-muted-foreground text-sm leading-relaxed">
              {feature.description}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
