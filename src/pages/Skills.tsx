import { useState, useEffect } from "react";

interface Skill {
  id: string;
  name: string;
  description: string;
  enabled: boolean;
  category: string;
}

const STATIC_SKILLS: Skill[] = [
  {
    id: "web-search",
    name: "Web Search",
    description: "Search the internet for up-to-date information",
    enabled: true,
    category: "Research",
  },
  {
    id: "summarize",
    name: "Summarize",
    description: "Condense long articles or documents into clear key points",
    enabled: true,
    category: "Writing",
  },
  {
    id: "translate",
    name: "Translate",
    description: "Translate text between over 100 languages instantly",
    enabled: false,
    category: "Language",
  },
  {
    id: "schedule",
    name: "Scheduling",
    description: "Help manage your calendar and set friendly reminders",
    enabled: false,
    category: "Productivity",
  },
  {
    id: "email-draft",
    name: "Email Drafting",
    description: "Write professional emails from a few keywords",
    enabled: true,
    category: "Writing",
  },
  {
    id: "code-explain",
    name: "Code Explainer",
    description: "Explain code snippets in simple, everyday language",
    enabled: false,
    category: "Developer",
  },
  {
    id: "recipe",
    name: "Recipe Finder",
    description: "Find and suggest recipes based on ingredients you have",
    enabled: false,
    category: "Lifestyle",
  },
  {
    id: "news",
    name: "News Brief",
    description: "Get a daily summary of the top news stories",
    enabled: true,
    category: "Research",
  },
];

const CATEGORY_COLORS: Record<string, { bg: string; text: string }> = {
  Research: { bg: "#fff3e0", text: "#e65100" },
  Writing: { bg: "#e8f5e9", text: "#2e7d32" },
  Language: { bg: "#e3f2fd", text: "#1565c0" },
  Productivity: { bg: "#f3e5f5", text: "#7b1fa2" },
  Developer: { bg: "#ede7f6", text: "#4527a0" },
  Lifestyle: { bg: "#fce4ec", text: "#c62828" },
};

export default function Skills() {
  const [skills, setSkills] = useState<Skill[]>(STATIC_SKILLS);
  const [search, setSearch] = useState("");

  useEffect(() => {
    fetch("http://localhost:18789/api/v1/skills")
      .then((r) => r.json())
      .then((data: { skills?: Skill[] }) => {
        if (data.skills && data.skills.length > 0) setSkills(data.skills);
      })
      .catch(() => {});
  }, []);

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
    <div className="skills-page">
      <div className="page-header">
        <h1 className="page-title">Skills</h1>
        <p className="page-subtitle">Enable and manage what your assistant can do for you</p>
      </div>

      <div className="skills-search-bar">
        <span className="search-icon">🔍</span>
        <input
          className="skills-search"
          placeholder="Search skills…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        {search && (
          <button className="search-clear" onClick={() => setSearch("")}>
            ✕
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="skills-empty">
          <div className="skills-empty-icon">🌟</div>
          <div className="skills-empty-title">No skills found</div>
          <div className="skills-empty-desc">
            Try a different search term or check back later
          </div>
        </div>
      ) : (
        <div className="skills-list">
          {filtered.map((skill) => {
            const cat = CATEGORY_COLORS[skill.category] ?? { bg: "#f5f3ff", text: "#7c3aed" };
            return (
              <div key={skill.id} className={`skill-card ${skill.enabled ? "enabled" : ""}`}>
                <div className="skill-info">
                  <div className="skill-top">
                    <div className="skill-name">{skill.name}</div>
                    <div
                      className="skill-category"
                      style={{ background: cat.bg, color: cat.text }}
                    >
                      {skill.category}
                    </div>
                  </div>
                  <div className="skill-desc">{skill.description}</div>
                </div>
                <button
                  className={`skill-toggle ${skill.enabled ? "on" : "off"}`}
                  onClick={() => toggle(skill.id)}
                  aria-label={skill.enabled ? "Disable skill" : "Enable skill"}
                >
                  <span className="toggle-thumb" />
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
