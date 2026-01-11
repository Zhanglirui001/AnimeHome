"use client";

import { useEffect, useState, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useChat } from "ai/react";
import { Message } from "ai";
import { api, API_BASE_URL } from "@/lib/api-client"; // Use API instead of DB
import { Character } from "@/types/character";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { ArrowLeft, Send, MoreVertical, Settings, Image as ImageIcon, Edit, Trash2, X, CheckSquare } from "lucide-react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";

export default function ChatPage() {
  const params = useParams();
  const id = Number(params.id);
  const router = useRouter();
  const [character, setCharacter] = useState<Character | null>(null);
  
  const [inputValue, setInputValue] = useState("");
  const [isSelectionMode, setIsSelectionMode] = useState(false);
  const [selectedMessageIds, setSelectedMessageIds] = useState<string[]>([]);
  
  // Vercel AI SDK hook
  const { messages, input, handleInputChange, handleSubmit, setMessages, append, isLoading, setInput } = useChat({
    api: `${API_BASE_URL}/chat`,
    body: {
      character_id: character?.id,
      systemPrompt: character?.systemPrompt,
    },
    initialMessages: [],
    onFinish: async (message) => {
       // Message saving is now handled by the backend during streaming completion
       // We don't need to manually save it here unless we want to double check
       // But backend saving is more reliable for the full content.
    }
  });

  const scrollRef = useRef<HTMLDivElement>(null);

  const handleLocalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;
    
    const content = inputValue;
    setInputValue("");

    const userMsgId = crypto.randomUUID();
    const userMsg: Message = {
      id: userMsgId,
      role: 'user',
      content: content,
      createdAt: new Date(),
    };

    // Save user message to DB via API
    if (id) {
      await api.messages.create(id, {
        id: userMsgId,
        role: 'user',
        content: content
      });
    }
    
    append(userMsg);
  };

  const toggleSelectionMode = () => {
    setIsSelectionMode(!isSelectionMode);
    setSelectedMessageIds([]);
  };

  const toggleMessageSelection = (messageId: string) => {
    if (selectedMessageIds.includes(messageId)) {
      setSelectedMessageIds(selectedMessageIds.filter(id => id !== messageId));
    } else {
      setSelectedMessageIds([...selectedMessageIds, messageId]);
    }
  };

  const handleDeleteSelected = async () => {
    if (selectedMessageIds.length === 0) return;
    
    try {
      await api.messages.batchDelete(selectedMessageIds);
      setMessages(messages.filter(m => !selectedMessageIds.includes(m.id)));
      toast.success(`Deleted ${selectedMessageIds.length} messages`);
      setIsSelectionMode(false);
      setSelectedMessageIds([]);
    } catch (error) {
      toast.error("Failed to delete messages");
    }
  };

  const handleDeleteSingle = async (messageId: string) => {
    try {
      await api.messages.delete(messageId);
      setMessages(messages.filter(m => m.id !== messageId));
      toast.success("Message deleted");
    } catch (error) {
      toast.error("Failed to delete message");
    }
  };

  // Load character data and messages
  useEffect(() => {
    if (id) {
      const controller = new AbortController();
      Promise.all([
        api.characters.get(id, controller.signal),
        api.messages.list(id, controller.signal)
      ]).then(async ([char, msgs]) => {
        if (char) {
          // Normalize character data if needed (backend snake_case vs frontend camelCase)
          const normalizedChar: Character = {
            ...char,
            systemPrompt: char.system_prompt || char.systemPrompt,
            firstMessage: char.first_message || char.firstMessage,
            // Ensure other fields are mapped if needed
          };
          setCharacter(normalizedChar);
          
          // Map backend messages to AI SDK Message format
          // Backend Message: { id, role, content, created_at, ... }
          let loadedMessages: Message[] = msgs.map((m: any) => ({
            id: m.id.toString(), // Ensure ID is string
            role: m.role as any,
            content: m.content,
            createdAt: new Date(m.created_at || Date.now())
          }));

          // Initialize chat with first message if no messages exist yet
          if (loadedMessages.length === 0 && (char.first_message || char.firstMessage)) {
             const firstMsgStr = char.first_message || char.firstMessage;
             const initialMsg: Message = {
               id: 'init-1',
               role: 'assistant',
               content: firstMsgStr,
               createdAt: new Date()
             };
             setMessages([initialMsg]);
          } else {
             setMessages(loadedMessages);
          }
        } else {
          router.push("/");
        }
      }).catch((err) => {
        if (err.name !== 'AbortError') {
          console.error(err);
        }
      });
      
      return () => controller.abort();
    }
  }, [id, router, setMessages]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  if (!character) {
    return <div className="flex h-screen items-center justify-center">Loading character...</div>;
  }

  return (
    <div className="flex h-screen flex-col bg-zinc-50 dark:bg-zinc-950 relative overflow-hidden">
      
      {/* Dynamic Background */}
      <div className="absolute inset-0 z-0 bg-[#f8f9fa] dark:bg-zinc-950">
        {character.avatar && (
          <div 
            className="absolute inset-0 z-0 opacity-20 dark:opacity-10 blur-3xl bg-cover bg-center transition-all duration-1000 scale-125"
            style={{ backgroundImage: `url(${character.avatar})` }}
          />
        )}
        <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.05]" 
             style={{ 
               backgroundImage: 'radial-gradient(circle, currentColor 1px, transparent 1px)', 
               backgroundSize: '20px 20px' 
             }} 
        />
      </div>

      {/* Floating Bubbles */}
      <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            className="absolute bg-pink-400/10 dark:bg-pink-400/5 rounded-full blur-2xl"
            initial={{ 
              x: `${Math.random() * 100}%`, 
              y: "120%", 
              scale: 0.5 + Math.random() 
            }}
            animate={{ 
              y: "-20%",
              x: [`${Math.random() * 100}%`, `${Math.random() * 100}%`]
            }}
            transition={{ 
              duration: 15 + Math.random() * 10, 
              repeat: Infinity, 
              ease: "linear",
              delay: Math.random() * 5
            }}
            style={{
              width: `${100 + Math.random() * 200}px`,
              height: `${100 + Math.random() * 200}px`,
            }}
          />
        ))}
      </div>
      
      {/* Chat Header */}
      <header className="flex h-16 items-center justify-between border-b px-4 bg-white/70 dark:bg-zinc-950/70 backdrop-blur-md sticky top-0 z-10 shadow-sm">
        <div className="flex items-center gap-3">
          <Link href="/">
            <Button variant="ghost" size="icon" className="rounded-full">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <Avatar className="h-10 w-10 border-2 border-pink-100 dark:border-pink-900">
            <AvatarImage src={character.avatar} />
            <AvatarFallback>{character.name[0]}</AvatarFallback>
          </Avatar>
          <div>
            <h1 className="font-semibold text-sm">{character.name}</h1>
            <p className="text-xs text-zinc-500 flex items-center gap-1">
              <span className="block h-2 w-2 rounded-full bg-green-500 animate-pulse"></span>
              Online
            </p>
          </div>
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon">
              <MoreVertical className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem onClick={() => router.push(`/edit/${character.id}`)}>
              <Edit className="mr-2 h-4 w-4" />
              Edit Character
            </DropdownMenuItem>
            <DropdownMenuItem onClick={toggleSelectionMode}>
              <CheckSquare className="mr-2 h-4 w-4" />
              {isSelectionMode ? "Exit Selection Mode" : "Select Messages"}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-red-500 focus:text-red-500">
               Delete Character
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </header>

      {/* Messages Area */}
      <ScrollArea className="flex-1 p-4 z-10" ref={scrollRef}>
        <div className="space-y-6 max-w-3xl mx-auto pb-4">
          {messages.map((m) => (
            <div key={m.id} className="group relative flex items-start gap-3">
               {isSelectionMode && (
                 <div className="flex h-full items-center pt-3 pl-2">
                   <Checkbox 
                     checked={selectedMessageIds.includes(m.id)}
                     onCheckedChange={() => toggleMessageSelection(m.id)}
                   />
                 </div>
               )}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className={`flex flex-1 gap-3 ${
                m.role === 'user' ? 'justify-end' : 'justify-start'
              }`}
            >
              {m.role === 'assistant' && (
                <Avatar className="h-10 w-10 mt-1 border-2 border-white dark:border-zinc-800 shadow-sm">
                  <AvatarImage src={character.avatar} className="object-cover" />
                  <AvatarFallback>{character.name[0]}</AvatarFallback>
                </Avatar>
              )}
              
              <div className="flex flex-col gap-1 max-w-[80%] group/msg">
                {m.role === 'assistant' && (
                  <span className="text-xs text-zinc-500 ml-1">{character.name}</span>
                )}
                <div className="relative">
                  <div
                    className={`relative px-5 py-3 text-sm shadow-sm ${
                      m.role === 'user'
                        ? 'bg-gradient-to-br from-pink-500 to-pink-600 text-white rounded-2xl rounded-tr-none'
                        : 'bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/50 dark:border-zinc-800/50 backdrop-blur-sm rounded-2xl rounded-tl-none'
                    }`}
                  >
                    {m.content}
                  </div>
                  
                  {/* Single Delete Button (visible on hover when not in selection mode) */}
                  {!isSelectionMode && (
                    <div className={`absolute top-1/2 -translate-y-1/2 opacity-0 group-hover/msg:opacity-100 transition-opacity ${
                      m.role === 'user' ? '-left-8' : '-right-8'
                    }`}>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-6 w-6 text-zinc-400 hover:text-red-500"
                        onClick={() => handleDeleteSingle(m.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
            </div>
          ))}
          
          {isLoading && (
             <motion.div 
               initial={{ opacity: 0, scale: 0.9 }}
               animate={{ opacity: 1, scale: 1 }}
               className="flex gap-3 justify-start"
             >
                <Avatar className="h-10 w-10 mt-1 border-2 border-white dark:border-zinc-800 shadow-sm">
                  <AvatarImage src={character.avatar} />
                  <AvatarFallback>...</AvatarFallback>
                </Avatar>
                <div className="bg-white/90 dark:bg-zinc-900/90 border border-zinc-200/50 dark:border-zinc-800/50 px-4 py-3 rounded-2xl rounded-tl-none flex items-center gap-1.5 h-12 shadow-sm">
                   <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                   <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                   <span className="w-2 h-2 bg-pink-400 rounded-full animate-bounce"></span>
                </div>
             </motion.div>
          )}
        </div>
      </ScrollArea>

      {/* Input Area or Selection Actions */}
      <div className="p-4 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md border-t border-zinc-100 dark:border-zinc-800 z-10">
        {isSelectionMode ? (
          <div className="flex items-center justify-between max-w-3xl mx-auto h-12">
            <span className="text-sm text-zinc-500">{selectedMessageIds.length} messages selected</span>
            <div className="flex gap-2">
              <Button variant="ghost" onClick={toggleSelectionMode}>Cancel</Button>
              <Button 
                variant="destructive" 
                onClick={handleDeleteSelected}
                disabled={selectedMessageIds.length === 0}
              >
                Delete Selected
              </Button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleLocalSubmit} className="flex gap-3 max-w-3xl mx-auto items-center relative">
            <Button type="button" variant="ghost" size="icon" className="text-zinc-400 hover:text-pink-500 hover:bg-pink-50 dark:hover:bg-pink-950/30 transition-colors">
               <ImageIcon className="h-5 w-5" />
            </Button>
            <Input
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={`Message ${character.name}...`}
              className="rounded-full bg-zinc-100 border-transparent focus:bg-white focus:ring-2 focus:ring-pink-200 dark:bg-zinc-900 dark:focus:bg-black dark:focus:ring-pink-900 transition-all pl-5 h-12"
            />
            <Button 
              type="submit" 
              size="icon" 
              className="h-12 w-12 rounded-full bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600 text-white shadow-md hover:shadow-lg transition-all shrink-0"
              disabled={isLoading || !inputValue.trim()}
            >
              <Send className="h-5 w-5" />
            </Button>
          </form>
        )}
      </div>

    </div>
  );
}
