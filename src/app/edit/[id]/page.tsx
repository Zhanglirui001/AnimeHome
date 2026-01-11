"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { api } from "@/lib/api-client";
import { DEFAULT_CHARACTER_TAGS } from "@/types/character";
import { PRESET_CHARACTERS } from "@/lib/presets";
import { toast } from "sonner";
import { ArrowLeft, Sparkles, Plus, Trash2, Import, Save } from "lucide-react";
import Link from "next/link";

export default function EditCharacterPage() {
  const router = useRouter();
  const params = useParams();
  const id = Number(params.id);
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  
  // Form State
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [systemPrompt, setSystemPrompt] = useState("");
  const [firstMessage, setFirstMessage] = useState("");
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [newTag, setNewTag] = useState("");
  const [avatar, setAvatar] = useState("");
  const [isUploading, setIsUploading] = useState(false);

  // Examples
  const [examples, setExamples] = useState<{user: string, assistant: string}[]>([
    { user: "", assistant: "" }
  ]);

  // Load existing character data
  useEffect(() => {
    if (id) {
      api.characters.get(id).then((char) => {
        if (char) {
          setName(char.name);
          setDescription(char.description || "");
          // Backend returns system_prompt, but api-client maps input? 
          // Wait, api-client get() returns raw JSON.
          // Python backend returns keys: system_prompt, first_message (snake_case)
          // Let's handle both just in case, or fix api-client to normalize.
          // Assuming raw backend response for now:
          setSystemPrompt(char.system_prompt || char.systemPrompt || "");
          setFirstMessage(char.first_message || char.firstMessage || "");
          setSelectedTags(char.tags || []);
          setAvatar(char.avatar || "");
          setExamples(char.examples?.length ? char.examples : [{ user: "", assistant: "" }]);
        } else {
          toast.error("Character not found");
          router.push("/");
        }
      }).catch(() => {
        toast.error("Error loading character");
        router.push("/");
      }).finally(() => {
        setLoadingData(false);
      });
    }
  }, [id, router]);

  const loadPreset = (presetName: string) => {
    const preset = PRESET_CHARACTERS.find(p => p.name === presetName);
    if (preset) {
      setName(preset.name || "");
      setDescription(preset.description || "");
      setSystemPrompt(preset.systemPrompt || "");
      setFirstMessage(preset.firstMessage || "");
      setSelectedTags(preset.tags || []);
      setAvatar(preset.avatar || "");
      toast.success(`Loaded preset: ${preset.name}`);
    }
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      setSelectedTags(selectedTags.filter(t => t !== tag));
    } else {
      setSelectedTags([...selectedTags, tag]);
    }
  };

  const handleAddCustomTag = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (newTag.trim() && !selectedTags.includes(newTag.trim())) {
        setSelectedTags([...selectedTags, newTag.trim()]);
        setNewTag("");
      }
    }
  };

  const handleExampleChange = (index: number, field: 'user' | 'assistant', value: string) => {
    const newExamples = [...examples];
    newExamples[index][field] = value;
    setExamples(newExamples);
  };

  const addExample = () => {
    setExamples([...examples, { user: "", assistant: "" }]);
  };

  const removeExample = (index: number) => {
    setExamples(examples.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !systemPrompt || !firstMessage) {
      toast.error("Please fill in the required fields (Name, System Prompt, First Message)");
      return;
    }

    setLoading(true);
    try {
      await api.characters.update(id, {
        name,
        description,
        system_prompt: systemPrompt,
        first_message: firstMessage,
        tags: selectedTags,
        avatar,
        examples: examples.filter(ex => ex.user && ex.assistant),
      });
      
      toast.success("Character updated successfully!");
      router.push("/");
    } catch (error) {
      console.error(error);
      toast.error("Failed to update character");
    } finally {
      setLoading(false);
    }
  };

  if (loadingData) {
    return <div className="flex h-screen items-center justify-center">Loading character...</div>;
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-6 dark:bg-zinc-950">
      <div className="mx-auto max-w-3xl space-y-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/">
              <Button variant="ghost" size="icon" className="rounded-full">
                <ArrowLeft className="h-5 w-5" />
              </Button>
            </Link>
            <div>
              <h1 className="text-2xl font-bold tracking-tight">Edit Character</h1>
              <p className="text-muted-foreground">Modify your AI companion.</p>
            </div>
          </div>

          <Button 
            variant="outline" 
            size="sm" 
            className="gap-2 text-pink-500 border-pink-200 hover:bg-pink-50 dark:hover:bg-pink-950/30 dark:border-pink-900"
            type="button"
            onClick={() => loadPreset("八奈见杏菜")}
          >
            <Import className="h-4 w-4" />
            Reset to Preset (Anna)
          </Button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle>Basic Information</CardTitle>
              <CardDescription>Who are they?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="name">Character Name *</Label>
                <Input 
                  id="name" 
                  placeholder="e.g. Asuka Langley" 
                  value={name}
                  onChange={e => setName(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Short Description</Label>
                <Input 
                  id="description" 
                  placeholder="e.g. A fiery tempered EVA pilot." 
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                 <Label htmlFor="avatar">Avatar</Label>
                 <div className="flex gap-4 items-start">
                   <div className="flex-1 space-y-2">
                     <Input
                       id="avatar"
                       placeholder="https://... or upload an image"
                       value={avatar}
                       onChange={e => setAvatar(e.target.value)}
                     />
                     <div className="flex items-center gap-2">
                       <Input
                         type="file"
                         accept="image/*"
                         className="cursor-pointer"
                         disabled={isUploading}
                         onChange={async (e) => {
                           const file = e.target.files?.[0];
                           if (file) {
                             setIsUploading(true);
                             try {
                               const res = await api.upload.avatar(file);
                               if (res.url) {
                                 setAvatar(res.url);
                                 toast.success("Avatar uploaded successfully");
                               }
                             } catch (error) {
                               toast.error("Failed to upload avatar");
                             } finally {
                               setIsUploading(false);
                             }
                           }
                         }}
                       />
                       {isUploading && <span className="text-xs text-muted-foreground animate-pulse">Uploading...</span>}
                     </div>
                   </div>
                   {/* Preview */}
                   {(avatar) && (
                     <div className="relative w-20 h-20 rounded-full overflow-hidden border">
                       <img src={avatar} alt="Avatar Preview" className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display = 'none'} />
                     </div>
                   )}
                 </div>
              </div>
            </CardContent>
          </Card>

          {/* Personality Engine */}
          <Card className="border-pink-200 dark:border-pink-900">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Sparkles className="h-5 w-5 text-pink-500" />
                Personality Engine
              </CardTitle>
              <CardDescription>Define how they think and speak.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              
              <div className="space-y-3">
                <Label>Personality Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {DEFAULT_CHARACTER_TAGS.map(tag => (
                    <Badge 
                      key={tag}
                      variant={selectedTags.includes(tag) ? "default" : "outline"}
                      className={`cursor-pointer px-3 py-1 ${selectedTags.includes(tag) ? 'bg-pink-500 hover:bg-pink-600' : ''}`}
                      onClick={() => toggleTag(tag)}
                    >
                      {tag}
                    </Badge>
                  ))}
                  {/* Show selected custom tags that are not in default list */}
                  {selectedTags.filter(t => !DEFAULT_CHARACTER_TAGS.includes(t)).map(tag => (
                    <Badge 
                      key={tag}
                      variant="default"
                      className="cursor-pointer px-3 py-1 bg-violet-500 hover:bg-violet-600"
                      onClick={() => toggleTag(tag)}
                    >
                      {tag} <span className="ml-1 text-[10px]">✕</span>
                    </Badge>
                  ))}
                  
                  <Input 
                    placeholder="Add custom tag (Press Enter)..." 
                    className="w-[200px] h-7 text-xs"
                    value={newTag}
                    onChange={e => setNewTag(e.target.value)}
                    onKeyDown={handleAddCustomTag}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="systemPrompt">System Prompt (Core Instructions) *</Label>
                <Textarea 
                  id="systemPrompt" 
                  placeholder="You are [Name]. You are [Personality traits]. You like [Likes]. You speak in a [Tone] way." 
                  className="min-h-[150px] font-mono text-sm"
                  value={systemPrompt}
                  onChange={e => setSystemPrompt(e.target.value)}
                  required
                />
                <p className="text-xs text-muted-foreground">The "soul" of your character. Be specific about their behavior.</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="firstMessage">First Message (Opening Line) *</Label>
                <Textarea 
                  id="firstMessage" 
                  placeholder="What they say when the chat starts..." 
                  value={firstMessage}
                  onChange={e => setFirstMessage(e.target.value)}
                  required
                />
              </div>

            </CardContent>
          </Card>

          {/* Few-Shot Examples */}
          <Card>
            <CardHeader>
              <CardTitle>Dialogue Examples (Optional)</CardTitle>
              <CardDescription>Teach the AI how to speak by example.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {examples.map((ex, idx) => (
                <div key={idx} className="relative grid gap-4 rounded-lg border p-4 bg-zinc-50/50 dark:bg-zinc-900/50">
                   <div className="absolute right-2 top-2">
                      <Button type="button" variant="ghost" size="icon" className="h-6 w-6 text-red-400 hover:text-red-500" onClick={() => removeExample(idx)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                   </div>
                   <div className="grid gap-2">
                     <Label className="text-xs uppercase text-muted-foreground">User</Label>
                     <Input 
                        value={ex.user} 
                        onChange={e => handleExampleChange(idx, 'user', e.target.value)}
                        placeholder="Hello!"
                        className="h-8"
                     />
                   </div>
                   <div className="grid gap-2">
                     <Label className="text-xs uppercase text-muted-foreground">Character</Label>
                     <Textarea 
                        value={ex.assistant} 
                        onChange={e => handleExampleChange(idx, 'assistant', e.target.value)}
                        placeholder="Hmph! Why are you talking to me?"
                        className="min-h-[60px]"
                     />
                   </div>
                </div>
              ))}
              
              <Button type="button" variant="outline" size="sm" onClick={addExample} className="w-full border-dashed">
                <Plus className="mr-2 h-4 w-4" /> Add Example
              </Button>
            </CardContent>
          </Card>

          {/* Submit */}
          <div className="flex justify-end gap-4 pb-12">
            <Link href="/">
               <Button type="button" variant="ghost">Cancel</Button>
            </Link>
            <Button type="submit" className="bg-pink-500 hover:bg-pink-600 text-white min-w-[120px] gap-2" disabled={loading}>
              <Save className="h-4 w-4" />
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>

        </form>
      </div>
    </div>
  );
}
