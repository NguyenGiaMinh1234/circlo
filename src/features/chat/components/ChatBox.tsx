import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MessageCircle, X, Send, Loader2, Sparkles, HelpCircle, Palette, Wallet } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAIChat } from "@/hooks/useAIChat";
import { cn } from "@/lib/utils";

const CHAT_AVATAR_SRC = "/chat-avatar.png";

const quickActions = [
  { icon: Wallet, label: "Sản phẩm", message: "Cho tôi xem các sản phẩm có thể thiết kế" },
  { icon: Palette, label: "Thiết kế 3D", message: "Hướng dẫn tôi sử dụng công cụ thiết kế 3D" },
  { icon: HelpCircle, label: "Đặt hàng", message: "Quy trình đặt hàng và thanh toán như thế nào?" },
];

const TypingIndicator = () => (
  <div className="flex w-fit items-center gap-1.5 rounded-2xl rounded-bl-sm border border-[rgba(83,96,214,0.18)] bg-white/92 px-4 py-3 shadow-[0_10px_28px_rgba(76,88,214,0.08)]">
    <span className="h-2 w-2 rounded-full bg-[rgba(83,96,214,0.72)] animate-bounce" style={{ animationDelay: "0ms" }} />
    <span className="h-2 w-2 rounded-full bg-[rgba(83,96,214,0.72)] animate-bounce" style={{ animationDelay: "150ms" }} />
    <span className="h-2 w-2 rounded-full bg-[rgba(83,96,214,0.72)] animate-bounce" style={{ animationDelay: "300ms" }} />
  </div>
);

const ChatAvatar = ({ size = "md" }: { size?: "md" | "sm" }) => {
  const [imageFailed, setImageFailed] = useState(false);
  const containerClass = size === "md" ? "h-11 w-11 rounded-2xl" : "h-8 w-8 rounded-xl";
  const iconClass = size === "md" ? "h-5 w-5" : "h-4 w-4";

  return (
    <div className={cn(
      "overflow-hidden border border-[rgba(255,255,255,0.28)] bg-[linear-gradient(135deg,rgba(255,255,255,0.22),rgba(182,192,197,0.14),rgba(255,255,255,0.08))] shadow-[0_12px_30px_rgba(17,45,96,0.24)]",
      containerClass,
    )}>
      {!imageFailed ? (
        <img
          src={CHAT_AVATAR_SRC}
          alt="Criclo AI avatar"
          loading="lazy"
          decoding="async"
          className="h-full w-full object-cover"
          onError={() => setImageFailed(true)}
        />
      ) : (
        <div className="flex h-full w-full items-center justify-center bg-[linear-gradient(135deg,rgba(10,28,63,0.94),rgba(17,45,96,0.9),rgba(118,133,145,0.7))]">
          <Sparkles className={cn("text-white", iconClass)} />
        </div>
      )}
    </div>
  );
};

const ChatBox = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [inputValue, setInputValue] = useState("");
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const { messages, sendMessage, isLoading } = useAIChat();

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isLoading]);

  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim() || isLoading) return;
    sendMessage(inputValue);
    setInputValue("");
  };

  const handleQuickAction = (message: string) => {
    if (isLoading) return;
    sendMessage(message);
  };

  const showQuickActions = messages.length <= 1 && !isLoading;

  return (
    <>
      {/* Chat toggle button */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 h-14 w-14 rounded-full shadow-2xl z-50 bg-[linear-gradient(135deg,rgba(10,28,63,0.98),rgba(17,45,96,0.96),rgba(118,133,145,0.88))] hover:scale-110 transition-all duration-300 border border-[rgba(214,222,227,0.4)] group text-white"
          size="icon"
        >
          <MessageCircle className="h-6 w-6 group-hover:scale-110 transition-transform" />
          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 bg-emerald-400 rounded-full border-2 border-background animate-pulse" />
        </Button>
      )}

      {/* Chat window */}
      {isOpen && (
        <Card className="fixed bottom-6 right-6 z-50 flex h-[560px] w-[390px] flex-col overflow-hidden rounded-3xl border border-[rgba(214,222,227,0.34)] bg-[linear-gradient(145deg,rgba(10,28,63,0.62),rgba(17,45,96,0.5),rgba(76,103,141,0.28))] shadow-[0_34px_110px_rgba(7,18,44,0.36)] backdrop-blur-[14px] supports-[backdrop-filter]:bg-[linear-gradient(145deg,rgba(10,28,63,0.56),rgba(17,45,96,0.44),rgba(76,103,141,0.24))] animate-in slide-in-from-bottom-5 duration-300 before:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(180deg,rgba(255,255,255,0.18),rgba(255,255,255,0.05)_34%,rgba(255,255,255,0.02)_100%)] before:content-[''] after:pointer-events-none after:absolute after:inset-[1px] after:rounded-[calc(1.5rem-1px)] after:border after:border-[rgba(255,255,255,0.16)] after:shadow-[inset_0_0_0_1px_rgba(193,208,221,0.1),0_0_18px_rgba(214,222,227,0.08)] after:content-['']">
          {/* Header */}
          <CardHeader className="flex shrink-0 flex-row items-center justify-between space-y-0 border-b border-[rgba(214,222,227,0.22)] bg-[linear-gradient(135deg,rgba(10,28,63,0.82),rgba(17,45,96,0.7),rgba(92,120,157,0.36))] p-4 backdrop-blur-sm shadow-[inset_0_1px_0_rgba(255,255,255,0.18),inset_0_-1px_0_rgba(255,255,255,0.06)]">
            <div className="flex items-center gap-3">
              <div className="relative">
                <ChatAvatar size="md" />
                <span className="absolute -bottom-0.5 -right-0.5 h-3.5 w-3.5 bg-emerald-400 rounded-full border-2 border-background" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-semibold tracking-wide text-white">Criclo AI ✨</h3>
                </div>
                <p className="mt-0.5 flex items-center gap-1.5 text-xs text-white/80">
                  {isLoading ? (
                    <>
                      <span className="relative flex h-2 w-2">
                        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75" />
                        <span className="relative inline-flex rounded-full h-2 w-2 bg-primary" />
                      </span>
                      Đang soạn tin nhắn...
                    </>
                  ) : (
                    <>
                      <span className="h-2 w-2 bg-emerald-400 rounded-full" />
                      Luôn sẵn sàng hỗ trợ bạn 💜
                    </>
                  )}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="h-8 w-8 rounded-xl text-white/85 transition-colors hover:bg-white/20 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          {/* Messages */}
          <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
            <ScrollArea className="flex-1 bg-[linear-gradient(180deg,rgba(255,255,255,0.08),rgba(210,220,229,0.12),rgba(170,184,197,0.14))] p-4" ref={scrollRef}>
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={cn(
                      "flex animate-in fade-in-0 slide-in-from-bottom-2 duration-300",
                      message.sender === "user" ? "justify-end" : "justify-start"
                    )}
                  >
                    {message.sender === "bot" && (
                        <div className="mr-2 mt-1 flex h-8 w-8 shrink-0 items-center justify-center rounded-xl border border-[rgba(214,222,227,0.18)] bg-[linear-gradient(135deg,rgba(10,28,63,0.94),rgba(17,45,96,0.9),rgba(118,133,145,0.7))] shadow-[0_8px_20px_rgba(7,18,44,0.2)]">
                        <Sparkles className="h-4 w-4 text-white" />
                      </div>
                    )}
                    <div
                      className={cn(
                        "max-w-[78%] px-4 py-2.5 shadow-sm",
                        message.sender === "user"
                          ? "rounded-2xl rounded-br-sm border border-[rgba(214,222,227,0.14)] bg-[linear-gradient(135deg,rgba(10,28,63,0.92),rgba(17,45,96,0.84),rgba(118,133,145,0.58))] text-white shadow-[0_12px_28px_rgba(7,18,44,0.22)]"
                          : "rounded-2xl rounded-bl-sm border border-[rgba(214,222,227,0.34)] bg-[linear-gradient(145deg,rgba(255,255,255,0.26),rgba(218,225,231,0.22),rgba(182,192,197,0.18))] backdrop-blur-sm text-white shadow-[0_8px_22px_rgba(7,18,44,0.12)]"
                      )}
                    >
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.text}</p>
                      <p className={cn(
                        "text-[10px] mt-1.5",
                        message.sender === "user" ? "text-white/75" : "text-white/72"
                      )}>
                        {message.timestamp.toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {isLoading && messages[messages.length - 1]?.sender === "user" && (
                  <div className="flex items-start animate-in fade-in-0 duration-200">
                    <div className="mr-2 shrink-0">
                      <ChatAvatar size="sm" />
                    </div>
                    <TypingIndicator />
                  </div>
                )}

                {/* Quick actions */}
                {showQuickActions && (
                  <div className="pt-2 space-y-3 animate-in fade-in-0 slide-in-from-bottom-2 duration-500 delay-300">
                    <p className="text-xs text-white/72 text-center">💬 Bạn có thể bắt đầu bằng:</p>
                    <div className="flex flex-wrap gap-2 justify-center">
                      {quickActions.map((action) => (
                        <Button
                          key={action.label}
                          variant="outline"
                          size="sm"
                          onClick={() => handleQuickAction(action.message)}
                          className="h-8 text-xs border-white/12 bg-white/12 text-white/88 hover:bg-white/18 hover:text-white hover:border-white/24 transition-all rounded-xl backdrop-blur-sm"
                        >
                          <action.icon className="h-3.5 w-3.5 mr-1.5" />
                          {action.label}
                        </Button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            {/* Input */}
            <form
              onSubmit={handleSendMessage}
              className="flex shrink-0 gap-2 border-t border-[rgba(214,222,227,0.2)] bg-[linear-gradient(180deg,rgba(10,28,63,0.28),rgba(17,45,96,0.22),rgba(118,133,145,0.1))] p-3 backdrop-blur-md supports-[backdrop-filter]:bg-[linear-gradient(180deg,rgba(10,28,63,0.22),rgba(17,45,96,0.18),rgba(118,133,145,0.08))]"
            >
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Nhắn gì đó cho mình nhé... 😊"
                className="h-10 flex-1 rounded-2xl border-[rgba(214,222,227,0.24)] bg-[rgba(255,255,255,0.18)] backdrop-blur-sm px-4 text-sm text-white placeholder:text-white/60 shadow-[inset_0_1px_2px_rgba(17,45,96,0.08)] transition-all focus:border-[rgba(214,222,227,0.34)] focus:ring-1 focus:ring-[rgba(214,222,227,0.12)]"
                disabled={isLoading}
              />
              <Button 
                type="submit" 
                size="icon" 
                className="h-10 w-10 shrink-0 rounded-2xl border border-[rgba(214,222,227,0.2)] bg-[linear-gradient(135deg,rgba(10,28,63,0.96),rgba(17,45,96,0.92),rgba(118,133,145,0.72))] text-white shadow-[0_12px_28px_rgba(7,18,44,0.24)] transition-all hover:scale-105 disabled:opacity-50" 
                disabled={isLoading || !inputValue.trim()}
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Send className="h-4 w-4" />
                )}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default ChatBox;
