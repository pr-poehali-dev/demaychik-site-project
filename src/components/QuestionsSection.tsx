import { useState, useEffect } from 'react';
import { User, Question, Answer } from '@/types/business';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import { storageService } from '@/lib/storage';
import { useToast } from '@/hooks/use-toast';

interface QuestionsSectionProps {
  user: User;
}

export default function QuestionsSection({ user }: QuestionsSectionProps) {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [isAskOpen, setIsAskOpen] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState<Question | null>(null);
  const [questionTitle, setQuestionTitle] = useState('');
  const [questionContent, setQuestionContent] = useState('');
  const [answerContent, setAnswerContent] = useState('');
  const { toast } = useToast();

  useEffect(() => {
    loadQuestions();
  }, []);

  const loadQuestions = () => {
    const allQuestions = storageService.getQuestions();
    setQuestions(allQuestions.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));
  };

  const handleAskQuestion = () => {
    if (!questionTitle.trim() || !questionContent.trim()) {
      toast({ title: 'Ошибка', description: 'Заполните все поля', variant: 'destructive' });
      return;
    }

    const newQuestion: Question = {
      id: `question_${Date.now()}`,
      userId: user.id,
      username: user.username,
      userAvatar: user.avatar,
      isPremium: user.isPremium,
      title: questionTitle,
      content: questionContent,
      answers: [],
      createdAt: new Date(),
    };

    const allQuestions = storageService.getQuestions();
    allQuestions.push(newQuestion);
    storageService.setQuestions(allQuestions);

    setQuestions([newQuestion, ...questions]);
    setQuestionTitle('');
    setQuestionContent('');
    setIsAskOpen(false);
    toast({ title: 'Успех!', description: 'Вопрос опубликован' });
  };

  const handleAddAnswer = () => {
    if (!selectedQuestion || !answerContent.trim()) {
      toast({ title: 'Ошибка', description: 'Напишите ответ', variant: 'destructive' });
      return;
    }

    const newAnswer: Answer = {
      id: `answer_${Date.now()}`,
      questionId: selectedQuestion.id,
      userId: user.id,
      username: user.username,
      userAvatar: user.avatar,
      isPremium: user.isPremium,
      content: answerContent,
      createdAt: new Date(),
    };

    const allQuestions = storageService.getQuestions();
    const questionIndex = allQuestions.findIndex(q => q.id === selectedQuestion.id);
    
    if (questionIndex !== -1) {
      allQuestions[questionIndex].answers.push(newAnswer);
      storageService.setQuestions(allQuestions);
      setSelectedQuestion(allQuestions[questionIndex]);
      loadQuestions();
    }

    setAnswerContent('');
    toast({ title: 'Успех!', description: 'Ответ добавлен' });
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

        <Card>
          <CardHeader>
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                {selectedQuestion.username[0].toUpperCase()}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{selectedQuestion.username}</span>
                  {selectedQuestion.isPremium && (
                    <Icon name="Crown" size={14} className="text-yellow-500" />
                  )}
                </div>
                <p className="text-xs text-muted-foreground">
                  {new Date(selectedQuestion.createdAt).toLocaleDateString('ru-RU')}
                </p>
              </div>
            </div>
            <CardTitle>{selectedQuestion.title}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground whitespace-pre-wrap">{selectedQuestion.content}</p>
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
                />
                <Button className="mt-3" onClick={handleAddAnswer}>
                  <Icon name="Send" size={18} className="mr-2" />
                  Ответить
                </Button>
              </CardContent>
            </Card>

            {selectedQuestion.answers.map((answer) => (
              <Card key={answer.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start gap-3">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold flex-shrink-0">
                      {answer.username[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="font-semibold">{answer.username}</span>
                        {answer.isPremium && (
                          <Icon name="Crown" size={14} className="text-yellow-500" />
                        )}
                        <span className="text-xs text-muted-foreground">
                          • {new Date(answer.createdAt).toLocaleDateString('ru-RU')}
                        </span>
                      </div>
                      <p className="text-muted-foreground whitespace-pre-wrap">{answer.content}</p>
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
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Новый вопрос</DialogTitle>
              <DialogDescription>Задайте вопрос сообществу профессионалов</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label>Заголовок</Label>
                <Input
                  placeholder="Кратко опишите вопрос"
                  value={questionTitle}
                  onChange={(e) => setQuestionTitle(e.target.value)}
                />
              </div>
              <div>
                <Label>Описание</Label>
                <Textarea
                  placeholder="Подробно опишите вашу ситуацию"
                  value={questionContent}
                  onChange={(e) => setQuestionContent(e.target.value)}
                  rows={6}
                />
              </div>
              <Button className="w-full" onClick={handleAskQuestion}>
                Опубликовать вопрос
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {questions.length === 0 ? (
        <Card className="text-center py-12 animate-fade-in">
          <CardContent>
            <Icon name="MessageCircle" size={48} className="mx-auto text-muted-foreground mb-4" />
            <h3 className="text-xl font-semibold mb-2">Пока нет вопросов</h3>
            <p className="text-muted-foreground mb-6">
              Станьте первым, кто задаст вопрос сообществу
            </p>
            <Button onClick={() => setIsAskOpen(true)}>
              <Icon name="MessageCirclePlus" size={20} className="mr-2" />
              Задать первый вопрос
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {questions.map((question, index) => (
            <Card
              key={question.id}
              className="cursor-pointer hover:shadow-lg transition-all animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
              onClick={() => setSelectedQuestion(question)}
            >
              <CardHeader>
                <div className="flex items-center gap-3 mb-2">
                  <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white font-bold">
                    {question.username[0].toUpperCase()}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className="font-semibold">{question.username}</span>
                      {question.isPremium && (
                        <Icon name="Crown" size={14} className="text-yellow-500" />
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {new Date(question.createdAt).toLocaleDateString('ru-RU')}
                    </p>
                  </div>
                </div>
                <CardTitle className="flex items-center justify-between">
                  <span>{question.title}</span>
                  <Icon name="ChevronRight" size={20} className="text-muted-foreground" />
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground line-clamp-2 mb-3">{question.content}</p>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-1">
                    <Icon name="MessageCircle" size={16} />
                    <span>{question.answers.length} ответов</span>
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
