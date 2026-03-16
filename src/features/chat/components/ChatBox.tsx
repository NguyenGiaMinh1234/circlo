import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { MessageCircle, X, Send, Loader2, Sparkles } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useAIChat } from "@/hooks/useAIChat";
import { cn } from "@/lib/utils";

const CHAT_AVATAR_SRC = "/chat-avatar.png";

const quickActions = [
  { label: "🛍 Xem sản phẩm", message: "Cho tôi xem các sản phẩm có thể thiết kế" },
  { label: "🎨 Thiết kế 3D", message: "Hướng dẫn tôi sử dụng công cụ thiết kế 3D" },
  { label: "📦 Theo dõi đơn hàng", message: "Tôi muốn theo dõi trạng thái đơn hàng của mình" },
];

const TypingIndicator = () => (
  <div className="flex w-fit items-center gap-1.5 rounded-[14px] rounded-bl-sm border border-white/70 bg-white/75 px-3.5 py-2.5 shadow-[0_10px_24px_rgba(15,23,42,0.12)] backdrop-blur-md">
    <span className="h-2 w-2 animate-bounce rounded-full bg-[rgba(83,96,214,0.72)]" style={{ animationDelay: "0ms" }} />
    <span className="h-2 w-2 animate-bounce rounded-full bg-[rgba(83,96,214,0.72)]" style={{ animationDelay: "150ms" }} />
    <span className="h-2 w-2 animate-bounce rounded-full bg-[rgba(83,96,214,0.72)]" style={{ animationDelay: "300ms" }} />
  </div>
);

const ChatAvatar = () => {
  const [imageFailed, setImageFailed] = useState(false);

  return (
    <div className="h-8 w-8 overflow-hidden rounded-lg border border-white/60 bg-[#6366F1] text-white shadow-[0_10px_20px_rgba(15,23,42,0.2)] [transform:perspective(500px)_rotateX(8deg)]">
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
        <div className="flex h-full w-full items-center justify-center bg-[#6366F1]">
          <Sparkles className="h-4 w-4 text-white" />
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
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full border border-white/50 bg-[linear-gradient(135deg,rgba(30,58,138,0.92),rgba(99,102,241,0.9))] text-white shadow-[0_24px_48px_rgba(15,23,42,0.28),inset_0_1px_0_rgba(255,255,255,0.28)] backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:scale-105"
          size="icon"
        >
          <MessageCircle className="h-6 w-6" />
          <span className="absolute -top-1 -right-1 h-3.5 w-3.5 animate-pulse rounded-full border-2 border-background bg-emerald-400" />
        </Button>
      )}

      {isOpen && (
        <Card className="fixed bottom-6 right-6 z-50 flex h-[min(560px,calc(100vh-6rem))] w-[min(340px,calc(100vw-1.5rem))] flex-col overflow-hidden rounded-[18px] border border-white/55 bg-[linear-gradient(160deg,rgba(248,250,252,0.86),rgba(238,242,255,0.74),rgba(224,231,255,0.7))] shadow-[0_30px_60px_rgba(15,23,42,0.25),inset_0_1px_0_rgba(255,255,255,0.9)] backdrop-blur-xl animate-in slide-in-from-bottom-5 duration-300 [transform:perspective(1400px)_rotateX(1.2deg)]">
          <span className="pointer-events-none absolute -top-10 -left-8 h-28 w-28 rounded-full bg-white/45 blur-2xl" />
          <span className="pointer-events-none absolute bottom-16 -right-10 h-32 w-32 rounded-full bg-indigo-200/55 blur-3xl" />

          <CardHeader className="relative shrink-0 space-y-0 border-b border-white/35 bg-[linear-gradient(135deg,rgba(30,58,138,0.92),rgba(99,102,241,0.9))] px-4 py-3 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
            <div className="flex items-start justify-between gap-2 pr-8">
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  <h3 className="text-sm font-semibold tracking-wide">Criclo AI</h3>
                </div>
                <p className="mt-0.5 text-xs text-white/90">Trợ lý thiết kế & sản phẩm</p>
              </div>
              <div className="flex items-center gap-2 pt-0.5">
                <span className="h-2 w-2 rounded-full bg-[#22c55e]" />
                <span className="text-xs font-medium">Online</span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsOpen(false)}
              className="absolute right-2 top-2 h-8 w-8 rounded-lg text-white/90 transition-all duration-200 hover:bg-white/20 hover:text-white"
            >
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>

          <CardContent className="relative flex flex-1 flex-col overflow-hidden p-0">
            <ScrollArea className="flex-1 bg-[linear-gradient(180deg,rgba(248,250,252,0.72),rgba(238,242,255,0.58))] p-4" ref={scrollRef}>
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
                      <div className="mr-2 mt-1">
                        <ChatAvatar />
                      </div>
                    )}

                    <div
                      className={cn(
                        "max-w-[75%] px-[14px] py-3",
                        message.sender === "user"
                          ? "rounded-[14px] rounded-br-sm border border-indigo-300/40 bg-[linear-gradient(135deg,rgba(79,70,229,0.92),rgba(99,102,241,0.86))] text-white shadow-[0_12px_24px_rgba(79,70,229,0.28)]"
                          : "rounded-[14px] rounded-bl-sm border border-white/70 bg-white/82 text-slate-700 shadow-[0_10px_22px_rgba(15,23,42,0.1)] backdrop-blur-md"
                      )}
                    >
                      <p className="whitespace-pre-wrap text-sm leading-relaxed">{message.text}</p>
                      <p
                        className={cn(
                          "mt-1.5 text-[10px]",
                          message.sender === "user" ? "text-white/80" : "text-slate-400"
                        )}
                      >
                        {message.timestamp.toLocaleTimeString("vi-VN", {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                ))}

                {isLoading && messages[messages.length - 1]?.sender === "user" && (
                  <div className="flex items-start animate-in fade-in-0 duration-200">
                    <div className="mr-2 shrink-0">
                      <ChatAvatar />
                    </div>
                    <TypingIndicator />
                  </div>
                )}

                {showQuickActions && (
                  <div className="animate-in fade-in-0 slide-in-from-bottom-2 space-y-2 pt-2 duration-500 delay-300">
                    <p className="text-center text-xs font-medium text-slate-500">Bạn có thể thử:</p>
                    <div className="flex flex-col gap-2">
                      {quickActions.map((action) => (
                        <button
                          key={action.label}
                          type="button"
                          onClick={() => handleQuickAction(action.message)}
                          className="inline-flex items-center gap-2 rounded-xl border border-[#E0E7FF]/90 bg-[#EEF2FF]/85 px-[14px] py-[10px] text-left text-sm text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.75)] backdrop-blur-md transition-all duration-200 hover:-translate-y-1 hover:bg-[#6366F1] hover:text-white hover:shadow-[0_10px_20px_rgba(79,70,229,0.28)]"
                        >
                          <span>{action.label}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </ScrollArea>

            <form
              onSubmit={handleSendMessage}
              className="flex shrink-0 gap-2 border-t border-white/70 bg-white/78 p-[10px] backdrop-blur-md"
            >
              <Input
                ref={inputRef}
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                placeholder="Nhắn tin cho Criclo AI..."
                className="h-9 flex-1 rounded-[10px] border border-white/80 bg-white/72 px-3 text-sm text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.7)] placeholder:text-slate-400 focus-visible:ring-1 focus-visible:ring-indigo-200"
                disabled={isLoading}
              />
              <Button
                type="submit"
                size="icon"
                className="h-9 w-9 shrink-0 rounded-[10px] border border-indigo-300/60 bg-[linear-gradient(135deg,rgba(79,70,229,0.96),rgba(99,102,241,0.94))] text-white shadow-[0_10px_20px_rgba(79,70,229,0.3)] transition-all duration-200 hover:-translate-y-1 hover:bg-[#5558e6] hover:shadow-[0_14px_24px_rgba(79,70,229,0.35)] disabled:opacity-50"
                disabled={isLoading || !inputValue.trim()}
              >
                {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}
    </>
  );
};

export default ChatBox;
