import { useState, useEffect } from 'react';
import { User } from '@/types/business';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import { useToast } from '@/hooks/use-toast';
import { communityApi, ApiQuestion, ApiQuestionDetail } from '@/lib/api';

interface QuestionsSectionProps {
  user: User;
}

export default function QuestionsSection({ user }: QuestionsSectionProps) {
  const [questions, setQuestions] = useState<ApiQuestion[]>([]);
  const [selectedQuestion, setSelectedQuestion] = useState<ApiQuestionDetail | null>(null);
  const [isAskOpen, setIsAskOpen] = useState(false);
  const [questionTitle, setQuestionTitle] = useState('');
  const [questionContent, setQuestionContent] = useState('');
  const [questionCategory, setQuestionCategory] = useState('Общие вопросы');
  const [answerContent, setAnswerContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [likedAnswers, setLikedAnswers] = useState<Set<number>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    initUser();
    loadQuestions();
  }, []);

  const initUser = async () => {
    try {
      const result = await communityApi.createOrUpdateUser({
        username: user.username,
        email: user.email || `${user.username}@example.com`,
        avatar_url: user.avatar,
        is_premium: user.isPremium,
      });
      communityApi.setUserId(result.user_id);
    } catch (error) {
      console.error('Failed to init user:', error);
    }
  };

  const loadQuestions = async () => {
    try {
      setLoading(true);
      const data = await communityApi.getQuestions();
      setQuestions(data.questions);
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить вопросы', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleAskQuestion = async () => {
    if (!questionTitle.trim() || !questionContent.trim()) {
      toast({ title: 'Ошибка', description: 'Заполните все поля', variant: 'destructive' });
      return;
    }

    try {
      setLoading(true);
      await communityApi.createQuestion({
        title: questionTitle,
        content: questionContent,
        category: questionCategory,
      });

      setQuestionTitle('');
      setQuestionContent('');
      setQuestionCategory('Общие вопросы');
      setIsAskOpen(false);
      toast({ title: 'Успех!', description: 'Вопрос опубликован' });
      loadQuestions();
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось создать вопрос', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleSelectQuestion = async (question: ApiQuestion) => {
    try {
      setLoading(true);
      const detail = await communityApi.getQuestion(question.id);
      setSelectedQuestion(detail);
      
      const liked = new Set<number>();
      detail.answers.forEach(answer => {
        if (answer.liked_by.includes(detail.user_id)) {
          liked.add(answer.id);
        }
      });
      setLikedAnswers(liked);
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось загрузить вопрос', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleAddAnswer = async () => {
    if (!selectedQuestion || !answerContent.trim()) {
      toast({ title: 'Ошибка', description: 'Напишите ответ', variant: 'destructive' });
      return;
    }

    try {
      setLoading(true);
      await communityApi.createAnswer({
        question_id: selectedQuestion.id,
        content: answerContent,
      });

      setAnswerContent('');
      toast({ title: 'Успех!', description: 'Ответ добавлен' });
      
      const updated = await communityApi.getQuestion(selectedQuestion.id);
      setSelectedQuestion(updated);
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось добавить ответ', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleLike = async (answerId: number) => {
    if (!selectedQuestion) return;

    try {
      const result = await communityApi.toggleLike(answerId);
      
      const newLiked = new Set(likedAnswers);
      if (result.action === 'added') {
        newLiked.add(answerId);
      } else {
        newLiked.delete(answerId);
      }
      setLikedAnswers(newLiked);

      const updated = await communityApi.getQuestion(selectedQuestion.id);
      setSelectedQuestion(updated);
    } catch (error) {
      toast({ title: 'Ошибка', description: 'Не удалось поставить лайк', variant: 'destructive' });
    }
  };

  if (selectedQuestion) {
    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedQuestion(null)}>
            <Icon name="ArrowLeft" size={20} />
          </Button>
          <h1 className="text-2xl font-bold">Вопрос</h1>
        </div>

        <Card className="border-2 shadow-lg animate-scale-in">
          <CardHeader>
            <div className="flex items-center gap-3 mb-3">
              <Avatar className="w-12 h-12 border-2 border-primary/20 ring-2 ring-offset-2 ring-primary/30">
                <AvatarImage src={selectedQuestion.avatar_url} alt={selectedQuestion.username} />
                <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-bold">
                  {selectedQuestion.username[0].toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-lg">{selectedQuestion.username}</span>
                  {selectedQuestion.is_premium && (
                    <Badge className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white animate-pulse">
                      <Icon name="Crown" size={12} className="mr-1" />
                      Premium
                    </Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">
                  {new Date(selectedQuestion.created_at).toLocaleDateString('ru-RU', { 
                    day: 'numeric', 
                    month: 'long', 
                    year: 'numeric' 
                  })}
                </p>
              </div>
            </div>
            <Badge variant="secondary" className="w-fit mb-2">{selectedQuestion.category}</Badge>
            <CardTitle className="text-2xl">{selectedQuestion.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-base leading-relaxed whitespace-pre-wrap">{selectedQuestion.content}</p>
          </CardContent>
        </Card>

        <div>
          <h2 className="text-xl font-bold mb-4">
            Ответы ({selectedQuestion.answers.length})
          </h2>

          <div className="space-y-4">
            <Card>
              <CardContent className="pt-6">
                <Textarea
                  placeholder="Напишите ваш ответ..."
                  value={answerContent}
                  onChange={(e) => setAnswerContent(e.target.value)}
                  rows={4}
                  disabled={loading}
                />
                <Button className="mt-3" onClick={handleAddAnswer} disabled={loading}>
                  <Icon name="Send" size={18} className="mr-2" />
                  {loading ? 'Отправка...' : 'Ответить'}
                </Button>
              </CardContent>
            </Card>

            {selectedQuestion.answers.map((answer, index) => (
              <Card 
                key={answer.id} 
                className="animate-slide-up hover:shadow-lg transition-all duration-300" 
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start gap-4">
                    <Avatar className="w-12 h-12 border-2 border-muted">
                      <AvatarImage src={answer.avatar_url} alt={answer.username} />
                      <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-bold">
                        {answer.username[0].toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-bold">{answer.username}</span>
                        {answer.is_premium && (
                          <Badge variant="secondary" className="bg-gradient-to-r from-yellow-500 to-orange-500 text-white text-xs">
                            <Icon name="Crown" size={10} className="mr-1" />
                            Premium
                          </Badge>
                        )}
                        <span className="text-sm text-muted-foreground">
                          • {new Date(answer.created_at).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                      <p className="text-base leading-relaxed whitespace-pre-wrap mb-3">{answer.content}</p>
                      
                      <Button
                        variant={likedAnswers.has(answer.id) ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => handleToggleLike(answer.id)}
                        className="gap-2 hover:scale-105 transition-transform duration-200"
                      >
                        <Icon 
                          name="ThumbsUp" 
                          size={16} 
                          className={likedAnswers.has(answer.id) ? 'fill-current' : ''} 
                        />
                        <span className="font-semibold">{answer.like_count}</span>
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Вопросы профессионалам</h1>
          <p className="text-muted-foreground">Спросите совет у опытных предпринимателей</p>
        </div>

        <Dialog open={isAskOpen} onOpenChange={setIsAskOpen}>
          <DialogTrigger asChild>
            <Button size="lg" className="gap-2">
              <Icon name="MessageCirclePlus" size={20} />
              Задать вопрос
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle className="text-2xl">Задать вопрос сообществу</DialogTitle>
              <DialogDescription>
                Получите ответы от опытных предпринимателей
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Заголовок вопроса</Label>
                <Input
                  id="title"
                  value={questionTitle}
                  onChange={(e) => setQuestionTitle(e.target.value)}
                  placeholder="Как увеличить продажи?"
                  disabled={loading}
                />
              </div>

              <div>
                <Label htmlFor="category">Категория</Label>
                <Select value={questionCategory} onValueChange={setQuestionCategory} disabled={loading}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Общие вопросы">Общие вопросы</SelectItem>
                    <SelectItem value="Маркетинг">Маркетинг</SelectItem>
                    <SelectItem value="Финансы">Финансы</SelectItem>
                    <SelectItem value="Персонал">Персонал</SelectItem>
                    <SelectItem value="Технологии">Технологии</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="content">Описание</Label>
                <Textarea
                  id="content"
                  value={questionContent}
                  onChange={(e) => setQuestionContent(e.target.value)}
                  placeholder="Опишите вашу ситуацию подробнее..."
                  rows={6}
                  disabled={loading}
                />
              </div>

              <Button onClick={handleAskQuestion} className="w-full" size="lg" disabled={loading}>
                <Icon name="Send" size={18} className="mr-2" />
                {loading ? 'Публикация...' : 'Опубликовать вопрос'}
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {loading && questions.length === 0 ? (
        <div className="text-center py-12">
          <Icon name="Loader2" size={48} className="mx-auto animate-spin text-primary mb-4" />
          <p className="text-muted-foreground">Загрузка вопросов...</p>
        </div>
      ) : questions.length === 0 ? (
        <Card className="text-center py-12">
          <CardContent className="pt-6">
            <Icon name="MessageCircle" size={48} className="mx-auto text-muted-foreground mb-4" />
            <p className="text-lg font-semibold mb-2">Пока нет вопросов</p>
            <p className="text-muted-foreground mb-4">Станьте первым, кто задаст вопрос!</p>
            <Button onClick={() => setIsAskOpen(true)}>
              <Icon name="Plus" size={18} className="mr-2" />
              Задать первый вопрос
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {questions.map((question, index) => (
            <Card
              key={question.id}
              className="group cursor-pointer hover:shadow-xl transition-all duration-300 hover:-translate-y-2 animate-scale-in border-2"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => handleSelectQuestion(question)}
            >
              <CardHeader>
                <div className="flex items-center gap-3 mb-3">
                  <Avatar className="w-10 h-10 border-2 border-primary/20">
                    <AvatarImage src={question.avatar_url} alt={question.username} />
                    <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-white font-bold">
                      {question.username[0].toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm truncate">{question.username}</span>
                      {question.is_premium && (
                        <Icon name="Crown" size={14} className="text-yellow-500 flex-shrink-0" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(question.created_at).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                </div>
                <Badge variant="secondary" className="w-fit mb-2 text-xs">{question.category}</Badge>
                <CardTitle className="text-lg group-hover:text-primary transition-colors line-clamp-2">
                  {question.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground line-clamp-3 mb-3">
                  {question.content}
                </p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Icon name="MessageCircle" size={16} />
                    <span>{question.answer_count}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
