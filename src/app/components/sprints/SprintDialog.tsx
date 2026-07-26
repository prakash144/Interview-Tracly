"use client";

import { useState } from "react";
import { Plus, Zap, Sparkles, Target, Building2, ListTodo, Briefcase, GraduationCap, BookOpen, Layers } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { SPRINT_TEMPLATES, COMPANY_TEMPLATES } from "@/lib/sprints";
import type { SprintTemplate, SprintType } from "@/lib/sprints";

interface SprintDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSave: (data: {
    name: string;
    goal: string;
    startDate: string;
    endDate: string;
    type?: SprintType;
    company?: string;
    role?: string;
    interviewDate?: string;
    targetLevel?: string;
    stages?: string[];
    template?: string;
    tasks?: { title: string; estimatedHours: number; priority: string }[];
  }) => void;
}

const sprintTypes: { value: SprintType; label: string; icon: React.ReactNode; desc: string }[] = [
  { value: "learning", label: "Learning", icon: <BookOpen className="size-3.5" />, desc: "Master topics at your own pace" },
  { value: "interview", label: "Interview", icon: <Briefcase className="size-3.5" />, desc: "Prep for a scheduled interview" },
  { value: "certification", label: "Certification", icon: <GraduationCap className="size-3.5" />, desc: "Earn a credential" },
  { value: "custom", label: "Custom", icon: <Layers className="size-3.5" />, desc: "Define your own focus" },
];

const templateIcons: Record<string, React.ReactNode> = {
  Zap: <Zap className="size-4 text-warning" />,
  Building2: <Building2 className="size-4 text-info" />,
  Sparkles: <Sparkles className="size-4 text-success" />,
  Target: <Target className="size-4 text-destructive" />,
};

const SprintDialog = ({ open, onOpenChange, onSave }: SprintDialogProps) => {
  const [name, setName] = useState("");
  const [goal, setGoal] = useState("");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 14);
    return d.toISOString().slice(0, 10);
  });
  const [type, setType] = useState<SprintType>("learning");
  const [selectedTemplate, setSelectedTemplate] = useState<SprintTemplate | null>(null);
  const [interviewCompany, setInterviewCompany] = useState("");
  const [interviewRole, setInterviewRole] = useState("");
  const [interviewDate, setInterviewDate] = useState("");
  const [targetLevel, setTargetLevel] = useState("");
  const [selectedCompanyTemplate, setSelectedCompanyTemplate] = useState<string>("");

  const handleTemplateClick = (template: SprintTemplate) => {
    setName(template.name);
    setGoal(template.goal);
    setSelectedTemplate(template);
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + template.durationDays);
    setStartDate(start.toISOString().slice(0, 10));
    setEndDate(end.toISOString().slice(0, 10));
  };

  const handleCompanyTemplateSelect = (id: string) => {
    const tpl = COMPANY_TEMPLATES.find((c) => c.id === id);
    if (!tpl) return;
    setSelectedCompanyTemplate(id);
    setInterviewCompany(tpl.company);
    setGoal(`Interview prep for ${tpl.company}`);
    setName(`${tpl.company} Interview Prep`);
    const start = new Date();
    const end = new Date();
    end.setDate(end.getDate() + 21);
    setStartDate(start.toISOString().slice(0, 10));
    setEndDate(end.toISOString().slice(0, 10));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    onSave({
      name: name.trim(),
      goal: goal.trim(),
      startDate,
      endDate,
      type,
      company: interviewCompany || undefined,
      role: interviewRole || undefined,
      interviewDate: interviewDate || undefined,
      targetLevel: targetLevel || undefined,
      stages: type === "interview" ? COMPANY_TEMPLATES.find((c) => c.company === interviewCompany)?.stages : undefined,
      template: selectedCompanyTemplate || selectedTemplate?.name,
      tasks: selectedTemplate?.tasks,
    });
    setName("");
    setGoal("");
    setSelectedTemplate(null);
    setType("learning");
    setInterviewCompany("");
    setInterviewRole("");
    setInterviewDate("");
    setTargetLevel("");
    setSelectedCompanyTemplate("");
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center gap-2.5">
            <div className="flex size-8 items-center justify-center rounded-lg bg-gradient-to-br from-success/20 to-info/20">
              <Zap className="size-4 text-success" />
            </div>
            <div>
              <DialogTitle className="text-base">New Sprint</DialogTitle>
              <p className="text-xs text-muted-foreground/70 mt-0.5">Plan your next focused preparation sprint</p>
            </div>
          </div>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Sprint Type</label>
            <div className="grid grid-cols-2 gap-1.5">
              {sprintTypes.map((st) => (
                <button
                  key={st.value}
                  type="button"
                  onClick={() => { setType(st.value); setSelectedTemplate(null); }}
                  className={`text-left rounded-lg border p-2.5 transition-all text-[11px] ${
                    type === st.value
                      ? "border-success/50 bg-success/10"
                      : "border-border bg-secondary/40 hover:bg-accent hover:border-foreground/20"
                  }`}
                >
                  <span className="block mb-1">{st.icon}</span>
                  <div className="font-medium text-foreground text-[12px]">{st.label}</div>
                  <div className="text-muted-foreground/60">{st.desc}</div>
                </button>
              ))}
            </div>
          </div>

          {type === "interview" && (
            <div className="rounded-lg border border-cyan-500/20 bg-cyan-500/5 p-3 space-y-3">
              <p className="text-[11px] font-semibold text-cyan-600 dark:text-cyan-400 flex items-center gap-1.5">
                <Briefcase className="size-3" />
                Interview Details
              </p>
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1 block">Company Template</label>
                <select
                  value={selectedCompanyTemplate}
                  onChange={(e) => handleCompanyTemplateSelect(e.target.value)}
                  className="w-full rounded-md border border-border bg-secondary px-3 py-1.5 text-sm text-foreground outline-none"
                >
                  <option value="">Select company...</option>
                  {COMPANY_TEMPLATES.map((c) => (
                    <option key={c.id} value={c.id}>{c.company} — {c.topics.slice(0, 2).join(", ")}…</option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Company</label>
                  <Input value={interviewCompany} onChange={(e) => setInterviewCompany(e.target.value)} placeholder="e.g. Google" className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Role</label>
                  <Input value={interviewRole} onChange={(e) => setInterviewRole(e.target.value)} placeholder="e.g. SWE" className="h-8 text-sm" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Interview Date</label>
                  <Input type="date" value={interviewDate} onChange={(e) => setInterviewDate(e.target.value)} className="h-8 text-sm" />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground font-medium">Target Level</label>
                  <Input value={targetLevel} onChange={(e) => setTargetLevel(e.target.value)} placeholder="e.g. L4, E5" className="h-8 text-sm" />
                </div>
              </div>
            </div>
          )}

          {type !== "interview" && (
            <>
              <div>
                <label className="text-xs text-muted-foreground font-medium mb-1.5 block">Pre-built Templates</label>
                <div className="grid grid-cols-2 gap-1.5">
                  {SPRINT_TEMPLATES.map((template) => (
                    <button
                      key={template.name}
                      type="button"
                      onClick={() => handleTemplateClick(template)}
                      className={`text-left rounded-lg border p-2.5 transition-all text-[11px] group ${
                        selectedTemplate?.name === template.name
                          ? "border-success/50 bg-success/10"
                          : "border-border bg-secondary/40 hover:bg-accent hover:border-foreground/20"
                      }`}
                    >
                      <span className="block mb-1">{templateIcons[template.icon] || <ListTodo className="size-4 text-muted-foreground" />}</span>
                      <div className="font-medium text-foreground text-[12px]">{template.name}</div>
                      <div className="text-muted-foreground/60 truncate group-hover:text-muted-foreground/80 transition-colors">{template.description}</div>
                      <span className="mt-1 inline-block text-[10px] text-muted-foreground/50">{template.durationDays}d · {template.tasks.length} tasks</span>
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">Sprint Name</label>
            <Input
              placeholder="e.g. Sprint 1 — Arrays & Graphs"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="h-8 text-sm"
              required
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground font-medium">Goal (optional)</label>
            <Input
              placeholder="What do you want to achieve?"
              value={goal}
              onChange={(e) => setGoal(e.target.value)}
              className="h-8 text-sm"
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">Start Date</label>
              <Input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="h-8 text-sm"
                required
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs text-muted-foreground font-medium">End Date</label>
              <Input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="h-8 text-sm"
                required
              />
            </div>
          </div>
          <div className="flex justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="h-8 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="h-8 text-xs bg-primary text-primary-foreground hover:bg-primary/80"
            >
              <Plus className="size-3 mr-1" />
              Create Sprint
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default SprintDialog;
