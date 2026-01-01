import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";

interface HashtagInputProps {
  value: string[];
  onChange: (value: string[]) => void;
}

export function HashtagInput({ value, onChange }: HashtagInputProps) {
  const [input, setInput] = useState("");

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    
    // Check if space was typed
    if (newValue.endsWith(" ")) {
      const tag = newValue.trim().replace(/^#/, "");
      if (tag && !value.includes(tag)) {
        onChange([...value, tag]);
      }
      setInput("");
    } else {
      setInput(newValue);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      const tag = input.trim().replace(/^#/, "");
      if (tag && !value.includes(tag)) {
        onChange([...value, tag]);
      }
      setInput("");
    } else if (e.key === "Backspace" && !input && value.length > 0) {
      onChange(value.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove: string) => {
    onChange(value.filter((tag) => tag !== tagToRemove));
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-semibold">Hashtags</label>
      <div className="flex flex-wrap gap-2 p-3 border border-border bg-card shadow-brutal-sm min-h-[52px]">
        {value.map((tag) => (
          <span
            key={tag}
            className={cn(
              "inline-flex items-center gap-1 px-2 py-1 text-sm font-medium",
              "bg-mood-5 border border-border shadow-brutal-sm"
            )}
          >
            #{tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="hover:text-destructive transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        <input
          type="text"
          value={input}
          onChange={handleInputChange}
          onKeyDown={handleKeyDown}
          placeholder={value.length === 0 ? "Ajoute des hashtags (espace pour séparer)" : ""}
          className="flex-1 min-w-[150px] bg-transparent outline-none text-sm placeholder:text-muted-foreground"
        />
      </div>
    </div>
  );
}
