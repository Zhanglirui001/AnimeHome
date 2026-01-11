"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { useEffect, useState } from "react";
import { api, Character } from "@/lib/api-client";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { MessageCircle, Plus, Edit } from "lucide-react";

export default function Home() {
  const [characters, setCharacters] = useState<Character[]>([]);

  useEffect(() => {
    const controller = new AbortController();
    api.characters.list(controller.signal)
      .then(setCharacters)
      .catch(err => {
        if (err.name !== 'AbortError') {
          console.error(err);
        }
      });
      
    return () => controller.abort();
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center bg-zinc-50 p-8 dark:bg-zinc-950">
      
      {/* Header */}
      <div className="w-full max-w-5xl mb-12 flex items-center justify-between">
         <h1 className="text-3xl font-bold bg-gradient-to-r from-pink-500 to-violet-500 bg-clip-text text-transparent">
            AnimeHome
         </h1>
         <Link href="/create">
            <Button className="rounded-full bg-pink-500 hover:bg-pink-600 text-white gap-2">
               <Plus className="h-4 w-4" /> Create New
            </Button>
         </Link>
      </div>

      {/* Hero Section (Only show if no characters) */}
      {characters?.length === 0 && (
        <div className="text-center space-y-6 max-w-lg mt-20">
           <h2 className="text-2xl font-semibold text-zinc-800 dark:text-zinc-200">No characters found</h2>
           <p className="text-zinc-500 dark:text-zinc-400">
             It's a bit lonely here. Why not create your first AI companion?
           </p>
           <Link href="/create">
             <Button size="lg" className="rounded-full bg-gradient-to-r from-pink-500 to-violet-500 hover:opacity-90 transition-opacity">
               Get Started
             </Button>
           </Link>
        </div>
      )}

      {/* Character Grid */}
      <div className="w-full max-w-5xl grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {characters?.map((char) => (
          <div key={char.id} className="relative group">
            <Link href={`/chat/${char.id}`} className="block h-full">
              <Card className="h-full border-zinc-200 dark:border-zinc-800 transition-all hover:shadow-lg hover:border-pink-200 dark:hover:border-pink-900 overflow-hidden">
                <div className="h-32 bg-gradient-to-r from-pink-100 to-violet-100 dark:from-pink-950/30 dark:to-violet-950/30 relative">
                   {/* Avatar Placeholder */}
                   <div className="absolute -bottom-8 left-6 h-20 w-20 rounded-2xl bg-white dark:bg-zinc-900 shadow-md border-4 border-white dark:border-zinc-900 flex items-center justify-center overflow-hidden">
                    <Avatar className="h-full w-full rounded-none">
                      <AvatarImage src={char.avatar || ""} className="object-cover" alt={char.name} />
                      <AvatarFallback className="text-3xl bg-transparent rounded-none">👤</AvatarFallback>
                    </Avatar>
                 </div>
                </div>
                <CardHeader className="pt-10 pb-2">
                  <CardTitle className="text-xl flex items-center justify-between">
                    {char.name}
                  </CardTitle>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {char.tags.slice(0, 3).map(tag => (
                      <Badge key={tag} variant="secondary" className="text-xs font-normal">
                        {tag}
                      </Badge>
                    ))}
                    {char.tags.length > 3 && (
                      <Badge variant="secondary" className="text-xs font-normal">+{char.tags.length - 3}</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-zinc-500 dark:text-zinc-400 line-clamp-2 min-h-[40px]">
                    {char.description || "No description provided."}
                  </p>
                </CardContent>
                <CardFooter className="pt-0 text-pink-500 font-medium text-sm flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                   <MessageCircle className="h-4 w-4" /> Start Chatting
                </CardFooter>
              </Card>
            </Link>
            
            {/* Edit Button */}
            <Link href={`/edit/${char.id}`} className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
               <Button variant="secondary" size="icon" className="h-8 w-8 rounded-full shadow-sm bg-white/80 dark:bg-black/50 backdrop-blur-sm hover:bg-white dark:hover:bg-black">
                 <Edit className="h-4 w-4 text-zinc-500 hover:text-pink-500" />
               </Button>
            </Link>
          </div>
        ))}
      </div>

    </div>
  );
}
