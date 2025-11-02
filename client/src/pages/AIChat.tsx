import { useState, useEffect, useRef } from "react";
import { useParams, useLocation } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/contexts/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Textarea } from "@/components/ui/textarea";
import { 
  Send, 
  Bot,
  User,
  PawPrint,
  Loader2
} from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { queryClient, apiRequest } from "@/lib/queryClient";
import type { Animal, ChatMessage } from "@shared/schema";

export default function AIChat() {
  const { animalId } = useParams<{ animalId?: string }>();
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [selectedAnimalId, setSelectedAnimalId] = useState<string>(animalId || "");
  const [message, setMessage] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) {
      setLocation("/login");
    }
  }, [user, setLocation]);

  useEffect(() => {
    if (animalId) {
      setSelectedAnimalId(animalId);
    }
  }, [animalId]);

  const { data: animals = [], isLoading: animalsLoading } = useQuery<Animal[]>({
    queryKey: ["/api/animals/owner", user?.id],
    enabled: !!user && !!user.id && user.userType === "owner",
  });

  const { data: messages = [], isLoading: messagesLoading } = useQuery<ChatMessage[]>({
    queryKey: ["/api/chat", selectedAnimalId],
    enabled: !!selectedAnimalId,
  });

  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest(`/api/chat/${selectedAnimalId}`, "POST", {
        message: content,
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/chat", selectedAnimalId] });
      setMessage("");
    },
    onError: (error: any) => {
      toast({
        title: "Помилка",
        description: error.message || "Не вдалося надіслати повідомлення",
        variant: "destructive",
      });
    },
  });

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = () => {
    if (!message.trim() || !selectedAnimalId) return;
    sendMessageMutation.mutate(message.trim());
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const selectedAnimal = animals.find(a => a.id === selectedAnimalId);

  if (!user) {
    return null;
  }

  if (animalsLoading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full -m-6" data-testid="page-ai-chat">
      <div className="px-6 pt-6 pb-6 border-b flex-shrink-0">
        <h1 className="text-3xl font-bold mb-4">AI Асістент Здоров'я</h1>
        
        <div className="max-w-md">
          <label className="text-sm font-medium mb-2 block">
            Оберіть тварину
          </label>
          <Select
            value={selectedAnimalId}
            onValueChange={(value) => {
              setSelectedAnimalId(value);
              setLocation(`/ai-chat/${value}`);
            }}
          >
            <SelectTrigger data-testid="select-animal">
              <SelectValue placeholder={animals.length === 0 ? "Немає доступних тварин" : "Оберіть тварину..."} />
            </SelectTrigger>
            <SelectContent>
              {animals.length === 0 ? (
                <div className="p-4 text-sm text-muted-foreground text-center">
                  Спочатку додайте тварину
                </div>
              ) : (
                animals.map((animal) => (
                  <SelectItem 
                    key={animal.id} 
                    value={animal.id}
                    data-testid={`select-item-animal-${animal.id}`}
                  >
                    <div className="flex items-center gap-2">
                      <PawPrint className="h-4 w-4" />
                      {animal.name} ({animal.species})
                    </div>
                  </SelectItem>
                ))
              )}
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex-1 overflow-hidden flex flex-col">
        {!selectedAnimalId ? (
          <div className="flex-1 flex items-center justify-center p-6">
            <Card className="max-w-md w-full">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Bot className="h-6 w-6" />
                  Ласкаво просимо до AI Асистента
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-muted-foreground">
                  Оберіть тварину зі списку вище, щоб почати розмову з AI асистентом про її здоров'я.
                </p>
                <div className="space-y-2 text-sm">
                  <p className="font-medium">Асистент може допомогти:</p>
                  <ul className="list-disc list-inside space-y-1 text-muted-foreground">
                    <li>Відповісти на запитання про метрики здоров'я</li>
                    <li>Аналізувати тренди та зміни у показниках</li>
                    <li>Пояснити медичні терміни простою мовою</li>
                    <li>Порівняти поточні значення з референсними</li>
                  </ul>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          <>
            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              {messagesLoading ? (
                <div className="flex justify-center items-center h-full">
                  <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
                </div>
              ) : messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <Card className="max-w-md">
                    <CardContent className="pt-6">
                      <div className="text-center space-y-3">
                        <Bot className="h-12 w-12 mx-auto text-muted-foreground" />
                        <p className="text-muted-foreground">
                          Ще немає повідомлень. Задайте перше запитання про {selectedAnimal?.name}!
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <>
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                      data-testid={`message-${msg.role}-${msg.id}`}
                    >
                      {msg.role === "assistant" && (
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className="bg-primary text-primary-foreground">
                            <Bot className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                      
                      <div
                        className={`rounded-lg px-4 py-3 max-w-[75%] ${
                          msg.role === "user"
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted"
                        }`}
                      >
                        <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                        {msg.createdAt && (
                          <p className={`text-xs mt-1 ${
                            msg.role === "user" 
                              ? "text-primary-foreground/70" 
                              : "text-muted-foreground"
                          }`}>
                            {new Date(msg.createdAt).toLocaleTimeString("uk-UA", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </p>
                        )}
                      </div>

                      {msg.role === "user" && (
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className="bg-secondary">
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  ))}
                  
                  {sendMessageMutation.isPending && (
                    <div className="flex gap-3 justify-start" data-testid="message-loading">
                      <Avatar className="h-8 w-8 flex-shrink-0">
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          <Bot className="h-4 w-4" />
                        </AvatarFallback>
                      </Avatar>
                      <div className="rounded-lg px-4 py-3 bg-muted">
                        <div className="flex items-center gap-2">
                          <Loader2 className="h-4 w-4 animate-spin" />
                          <span className="text-sm text-muted-foreground">Генерую відповідь...</span>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  <div ref={messagesEndRef} />
                </>
              )}
            </div>

            <div className="border-t px-6 py-4 bg-background">
              <div className="max-w-4xl mx-auto flex gap-2">
                <Textarea
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder={`Запитайте про здоров'я ${selectedAnimal?.name}...`}
                  className="min-h-[60px] max-h-[200px] resize-none"
                  disabled={sendMessageMutation.isPending}
                  data-testid="input-message"
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || sendMessageMutation.isPending}
                  size="icon"
                  className="flex-shrink-0"
                  data-testid="button-send"
                >
                  <Send className="h-5 w-5" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground text-center mt-2">
                Натисніть Enter для відправки • Shift+Enter для нового рядка
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
