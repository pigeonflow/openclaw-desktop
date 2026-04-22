import { useState } from "react";
import { Search, X } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

interface Skill {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: string;
}

const STATIC_SKILLS: Skill[] = [
  { id: "web-search", name: "Web Search", description: "Search the internet for up-to-date information", enabled: true, category: "Research" },
  { id: "summarize", name: "Summarize", description: "Condense long articles or documents into clear key points", enabled: true, category: "Writing" },
  { id: "translate", name: "Translate", description: "Translate text between over 100 languages instantly", enabled: false, category: "Language" },
  { id: "schedule", name: "Scheduling", description: "Help manage your calendar and set friendly reminders", enabled: false, category: "Productivity" },
  { id: "email-draft", name: "Email Drafting", description: "Write professional emails from a few keywords", enabled: true, category: "Writing" },
  { id: "code-explain", name: "Code Explainer", description: "Explain code snippets in simple, everyday language", enabled: false, category: "Developer" },
  { id: "recipe", name: "Recipe Finder", description: "Find and suggest recipes based on ingredients you have", enabled: false, category: "Lifestyle" },
  { id: "news", name: "News Brief", description: "Get a daily summary of the top news stories", enabled: true, category: "Research" },
];

const CATEGORY_COLORS: Record<string, string> = {
  Research: "bg-orange-100 text-orange-700",
  Writing: "bg-emerald-100 text-emerald-700",
  Language: "bg-blue-100 text-blue-700",
  Productivity: "bg-purple-100 text-purple-700",
  Developer: "bg-violet-100 text-violet-700",
  Lifestyle: "bg-rose-100 text-rose-700",
};

function Switch({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      onClick={onToggle}
      className={`relative inline-flex h-6 w-11 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-orange-500 ${
        checked ? "bg-orange-500" : "bg-gray-200"
      }`}
    >
      <span
        className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow-lg ring-0 transition duration-200 ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

export default function Skills() {
  const [skills, setSkills] = useState<Skill[]>(STATIC_SKILLS);
  const [search, setSearch] = useState("");

  const filtered = skills.filter(
    (s) =>
      s.name.toLowerCase().includes(search.toLowerCase()) ||
      s.description.toLowerCase().includes(search.toLowerCase()) ||
      s.category.toLowerCase().includes(search.toLowerCase()),
  );

  function toggle(id: string) {
    setSkills((prev) => prev.map((s) => (s.id === id ? { ...s, enabled: !s.enabled } : s)));
  }

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Skills</h1>
        <p className="text-sm text-gray-500 mt-1">Enable and manage what your assistant can do for you</p>
      </div>

      <div className="relative mb-5 max-w-sm">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <Input
          className="pl-9 pr-9"
          placeholder="Search skills…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
            onClick={() => setSearch("")}
          >
            <X size={14} />
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <div className="text-4xl mb-3">🔍</div>
          <div className="font-medium">No skills found</div>
          <div className="text-sm mt-1">Try a different search term</div>
        </div>
      ) : (
        <div className="space-y-2 max-w-2xl">
          {filtered.map((skill) => (
            <Card key={skill.id} className={`transition-all ${skill.enabled ? "border-orange-200 bg-orange-50/30" : ""}`}>
              <CardContent className="py-4 px-4">
                <div className="flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="font-semibold text-gray-900 text-sm">{skill.name}</span>
                      <span className={`text-[11px] font-medium px-1.5 py-0.5 rounded-md ${CATEGORY_COLORS[skill.category] ?? "bg-gray-100 text-gray-600"}`}>
                        {skill.category}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500">{skill.description}</p>
                  </div>
                  <Switch checked={skill.enabled} onToggle={() => toggle(skill.id)} />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
