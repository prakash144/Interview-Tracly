"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { BarChart3, Columns3, Database, Eye, ListChecks, RotateCcw, Star } from "lucide-react";
import type { Problem, ProgressMap, CustomList } from "@/lib/progressTypes";
import EmptyState from "@/components/states/EmptyState";
import DifficultyBadge from "@/components/data-display/DifficultyBadge";
import TopicBadge from "@/components/data-display/TopicBadge";
import { PremiumSurface, SectionHeader } from "@/components/ui/premium";
import {
    DropdownMenu,
    DropdownMenuCheckboxItem,
    DropdownMenuContent,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import {
    type ProblemStatusFilter,
    useFilteredProblems,
} from "@/features/problems/hooks/useFilteredProblems";
import { loadCodingPrefs, mapSortingToState } from "@/lib/codingPreferences";
import { useProblemSorting } from "@/features/problems/hooks/useProblemSorting";
import { usePagination } from "@/features/problems/hooks/usePagination";
import { useKeyboardNav } from "@/hooks/useKeyboardNav";
import ProblemPagination from "@/features/problems/components/ProblemPagination";
import ProblemCardList from "@/features/problems/components/ProblemCardList";
import AddToListDialog from "@/features/problems/components/AddToListDialog";

const NotesDialog = dynamic(() => import("./NotesDialog"), { ssr: false });

interface QuestionTableProps {
    questions: Problem[];
    difficultyFilter: string;
    selectedTopics: string[];
    searchTerm: string;
    statusFilter: ProblemStatusFilter;
    progressMap: ProgressMap;
    progressLoading: boolean;
    progressEnabled: boolean;
    onRequireAuth: () => void;
    onToggleSolved: (problem: Problem) => void;
    onToggleAttempted: (problem: Problem) => void;
    onToggleBookmarked: (problem: Problem) => void;
    onToggleRevision: (problem: Problem) => void;
    onSaveNotes: (problem: Problem, notes: string) => void;
    customLists?: {
        lists: CustomList[];
        loading: boolean;
        addProblem: (listId: string, problemId: string) => Promise<void>;
        removeProblem: (listId: string, problemId: string) => Promise<void>;
        create: (name: string, description?: string) => Promise<void>;
        isProblemInAnyList: (problemId: string) => string[];
    };
    collectionProblemIds?: Set<string>;
}

const COLUMNS = [
    { key: "index", label: "#" },
    { key: "problem", label: "Problem" },
    { key: "acceptance", label: "Acceptance" },
    { key: "difficulty", label: "Difficulty" },
    { key: "frequency", label: "Frequency" },
    { key: "topic", label: "Topic" },
    { key: "status", label: "Status" },
    { key: "attempted", label: "Attempted" },
    { key: "bookmarked", label: "Saved" },
    { key: "revision", label: "Revision" },
    { key: "notes", label: "Notes" },
    { key: "list", label: "List" },
] as const;

type ColumnKey = (typeof COLUMNS)[number]["key"];

const STORAGE_KEY = "qtable-columns";

const defaultVisibility: Record<ColumnKey, boolean> = {
    index: true,
    problem: true,
    acceptance: true,
    difficulty: true,
    frequency: true,
    topic: true,
    status: true,
    attempted: true,
    bookmarked: true,
    revision: true,
    notes: true,
    list: true,
};

const QuestionTable = ({
                             questions,
                             difficultyFilter,
                             selectedTopics,
                             searchTerm,
                             statusFilter,
                             progressMap,
                             progressLoading,
                             progressEnabled,
                             onRequireAuth,
                             onToggleSolved,
                             onToggleAttempted,
                             onToggleBookmarked,
                             onToggleRevision,
                             onSaveNotes,
                             customLists,
                             collectionProblemIds,
                         }: QuestionTableProps) => {
    const [columnVisibility, setColumnVisibility] = useState<Record<ColumnKey, boolean>>(() => {
        if (typeof window !== "undefined") {
            try {
                const stored = localStorage.getItem(STORAGE_KEY);
                if (stored) return { ...defaultVisibility, ...JSON.parse(stored) };
            } catch {}
        }
        return defaultVisibility;
    });

    useEffect(() => {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(columnVisibility));
    }, [columnVisibility]);

    const toggleColumn = (key: ColumnKey) => {
        setColumnVisibility((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    const filteredQuestions = useFilteredProblems(questions, {
        difficulty: difficultyFilter,
        selectedTopics,
        searchTerm,
        status: statusFilter,
        progressMap,
        collectionProblemIds,
    });
    const prefs = loadCodingPrefs();
    const initialSort = mapSortingToState(prefs.sorting);
    const { sortedProblems, sortBy, sortDirection, handleSort } =
        useProblemSorting(filteredQuestions, initialSort.sortBy, initialSort.sortDirection);
    const {
        currentPage,
        pageSize,
        range,
        setCurrentPage,
        setPageSize,
        totalPages,
    } = usePagination(sortedProblems.length, prefs.pageSize);
    const paginatedProblems = sortedProblems.slice(
        (currentPage - 1) * pageSize,
        currentPage * pageSize
    );

    const { focusedIndex, register: registerNav } = useKeyboardNav(paginatedProblems.length);
    useEffect(() => {
        registerNav({
            onToggleSolved: (i) => {
                const p = paginatedProblems[i];
                if (p) onToggleSolved(p);
            },
            onToggleFavorite: (i) => {
                const p = paginatedProblems[i];
                if (p) onToggleBookmarked(p);
            },
        });
    }, [paginatedProblems, onToggleSolved, onToggleBookmarked, registerNav]);

    const filteredAttempted = filteredQuestions.filter((q) => progressMap[q.problemId]?.attempted);
    const filteredBookmarked = filteredQuestions.filter((q) => progressMap[q.problemId]?.bookmarked);

    const requireProgressOrRun = (action: () => void) => {
        if (!progressEnabled) {
            onRequireAuth();
            return;
        }

        action();
    };

    const summaryItems = [
        { label: "Dataset", value: questions.length, icon: Database, tone: "text-info bg-info/10 border-info/20" },
        { label: "Filtered", value: filteredQuestions.length, icon: BarChart3, tone: "text-success bg-success/10 border-success/20" },
    ];

    return (
        <div className="space-y-4">
            <div className="grid gap-3 sm:grid-cols-2">
                {summaryItems.map((item) => (
                    <div key={item.label} className="rounded-lg border border-border/70 bg-card/90 p-3 shadow-sm backdrop-blur transition-colors hover:border-foreground/15">
                        <div className="flex items-center justify-between gap-3">
                            <div>
                                <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{item.label}</p>
                                <p className="mt-1 text-2xl font-semibold tracking-tight text-foreground">{item.value}</p>
                            </div>
                            <span className={`flex size-9 items-center justify-center rounded-md border shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] ${item.tone}`}>
                                <item.icon className="size-4" />
                            </span>
                        </div>
                    </div>
                ))}
            </div>

            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span className="rounded-md border border-border/70 bg-card/80 px-2.5 py-1 shadow-sm">
                    Page {range.from}-{range.to}
                </span>
                <span className="rounded-md border border-border/70 bg-card/80 px-2.5 py-1 shadow-sm">
                    Attempted {filteredAttempted.length}
                </span>
                <span className="rounded-md border border-border/70 bg-card/80 px-2.5 py-1 shadow-sm">
                    Saved {filteredBookmarked.length}
                </span>
                {progressLoading && (
                    <span className="rounded-md border border-info/20 bg-info/10 px-2.5 py-1 text-info">
                        Syncing...
                    </span>
                )}
                {filteredQuestions.length > 1 && (
                    <span className="ml-auto hidden sm:flex items-center gap-1">
                        <button
                            type="button"
                            onClick={() => filteredQuestions.forEach((q) => onToggleSolved(q))}
                            className="rounded-md border border-border/60 bg-secondary/70 px-2 py-1 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        >
                            Mark all solved
                        </button>
                        <button
                            type="button"
                            onClick={() => filteredQuestions.forEach((q) => onToggleRevision(q))}
                            className="rounded-md border border-border/60 bg-secondary/70 px-2 py-1 text-[10px] text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
                        >
                            Add all to revision
                        </button>
                    </span>
                )}
            </div>

            {sortedProblems.length === 0 && (
                <EmptyState message="No questions match the current filters." />
            )}

            {/* Mobile Problem Cards */}
            <div className="block lg:hidden">
                {sortedProblems.length > 0 && (
                    <ProblemCardList
                        problems={paginatedProblems}
                        startIndex={range.from}
                        progressMap={progressMap}
                        progressEnabled={progressEnabled}
                        onRequireAuth={onRequireAuth}
                        onToggleSolved={onToggleSolved}
                        onToggleAttempted={onToggleAttempted}
                        onToggleBookmarked={onToggleBookmarked}
                        onToggleRevision={onToggleRevision}
                        onSaveNotes={onSaveNotes}
                    />
                )}
            </div>

            {/* Desktop Question Table */}
            <div className="hidden lg:block">
            {sortedProblems.length > 0 && (
            <PremiumSurface className="overflow-hidden">
            <div className="border-b border-border/70 bg-card/70 p-4">
                <SectionHeader
                    eyebrow="Question queue"
                    title={`${sortedProblems.length} matching problems`}
                    description="Sort by acceptance and frequency, then mark solved, attempted, saved, or revision in place."
                    icon={ListChecks}
                    action={
                        <div className="flex items-center gap-2">
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <Button variant="outline" size="sm" className="h-7 gap-1 text-[11px] px-2.5">
                                        <Columns3 className="size-3" />
                                        Columns
                                    </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-40">
                                    {COLUMNS.filter((col) => col.key !== "list" || customLists).map((col) => (
                                        <DropdownMenuCheckboxItem
                                            key={col.key}
                                            checked={columnVisibility[col.key]}
                                            onCheckedChange={() => toggleColumn(col.key)}
                                        >
                                            {col.label}
                                        </DropdownMenuCheckboxItem>
                                    ))}
                                </DropdownMenuContent>
                            </DropdownMenu>
                            <span className="inline-flex items-center gap-1 rounded-md border border-border/70 bg-background/70 px-2.5 py-1 text-[11px] text-muted-foreground">
                                <Eye className="size-3" />{pageSize} per page
                            </span>
                            <span className="hidden sm:inline-flex items-center gap-1 rounded-md border border-border/70 bg-background/70 px-2.5 py-1 text-[10px] text-muted-foreground/60">
                                j/k ↑↓ · s solve · f fav
                            </span>
                        </div>
                    }
                />
            </div>
            <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-foreground" aria-label="Problems table">
                <thead className="sticky top-0 z-10 border-b border-border/70 bg-card/95 text-[10px] uppercase tracking-wide text-muted-foreground backdrop-blur">
                <tr>
                    {columnVisibility.index && <th className="w-10 px-3 py-2.5">#</th>}
                    {columnVisibility.problem && <th className="sticky left-0 z-20 min-w-56 bg-card/95 px-3 py-2.5 backdrop-blur">Problem</th>}
                    {columnVisibility.acceptance && (
                        <th
                            className="cursor-pointer px-3 py-2.5 transition-colors hover:text-foreground"
                            onClick={() => handleSort("acceptanceRate")}
                            aria-sort={sortBy === "acceptanceRate" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
                        >
                            Acceptance
                            {sortBy === "acceptanceRate" && (
                                <span className={sortDirection === "asc" ? "text-success" : "text-destructive"}>
                                        {sortDirection === "asc" ? "↑" : "↓"}
                                    </span>
                            )}
                        </th>
                    )}
                    {columnVisibility.difficulty && <th className="px-3 py-2.5">Difficulty</th>}
                    {columnVisibility.frequency && (
                        <th
                            className="cursor-pointer px-3 py-2.5 transition-colors hover:text-foreground"
                            onClick={() => handleSort("frequency")}
                            aria-sort={sortBy === "frequency" ? (sortDirection === "asc" ? "ascending" : "descending") : "none"}
                        >
                            Frequency
                            {sortBy === "frequency" && (
                                <span className={sortDirection === "asc" ? "text-success" : "text-destructive"}>
                                        {sortDirection === "asc" ? "↑" : "↓"}
                                    </span>
                            )}
                        </th>
                    )}
                    {columnVisibility.topic && <th className="px-3 py-2.5">Topic</th>}
                    {columnVisibility.status && <th className="px-3 py-2.5 text-center">Status</th>}
                    {columnVisibility.attempted && <th className="px-3 py-2.5 text-center">Attempted</th>}
                    {columnVisibility.bookmarked && <th className="px-3 py-2.5 text-center"><Star className="size-3.5 inline-block text-yellow-400" /></th>}
                    {columnVisibility.revision && <th className="px-3 py-2.5 text-center">Revision</th>}
                    {columnVisibility.notes && <th className="px-3 py-2.5 text-center">Notes</th>}
                    {customLists && columnVisibility.list && <th className="px-3 py-2.5 text-center">List</th>}
                </tr>
                </thead>
                <tbody>
                {paginatedProblems.map((q, index) => {
                    const progress = progressMap[q.problemId];

                    return (
                    <tr key={`${q.company}-${q.list}-${q.problemId}`} className={`border-b border-border/60 transition-colors duration-150 ${focusedIndex === index ? "bg-accent/60 ring-1 ring-inset ring-info/30" : "bg-background/35 hover:bg-accent/45"}`}>
                        {columnVisibility.index && <td className="px-3 py-2.5 tabular-nums text-muted-foreground">{range.from + index}</td>}
                        {columnVisibility.problem && (
                            <td className="sticky left-0 z-10 bg-background/95 px-3 py-2.5 font-medium backdrop-blur">
                                <a href={q.link} target="_blank" rel="noopener noreferrer" title={q.title} className="line-clamp-2 text-foreground transition-colors hover:text-info leading-snug">
                                    {q.title}
                                </a>
                            </td>
                        )}
                        {columnVisibility.acceptance && (
                            <td className="px-3 py-2.5 tabular-nums text-muted-foreground">
                                {typeof q.acceptanceRate === "number" ? q.acceptanceRate.toFixed(2) : q.acceptanceRate}
                            </td>
                        )}
                        {columnVisibility.difficulty && (
                            <td className="px-3 py-2.5">
                                <DifficultyBadge difficulty={q.difficulty} />
                            </td>
                        )}
                        {columnVisibility.frequency && (
                            <td className="px-3 py-2.5 tabular-nums text-muted-foreground">{q.frequency}</td>
                        )}
                        {columnVisibility.topic && (
                            <td className="px-3 py-2.5">
                                {q.topicTag.split(",").map((topic) => {
                                    const trimmed = topic.trim();
                                    const isSelected = selectedTopics.includes(trimmed);
                                    return (
                                        <TopicBadge key={trimmed} topic={trimmed} active={isSelected} className="mr-1 mb-1" />
                                    );
                                })}
                            </td>
                        )}
                        {columnVisibility.status && (
                            <td className="px-3 py-2.5 text-center">
                                <input
                                    type="checkbox"
                                    title="Mark as solved"
                                    aria-label={progress?.solved ? "Mark as unsolved" : "Mark as solved"}
                                    checked={Boolean(progress?.solved)}
                                    onChange={() => requireProgressOrRun(() => onToggleSolved(q))}
                                    className="form-checkbox size-3.5 cursor-pointer rounded border-border bg-muted text-success"
                                />
                            </td>
                        )}
                        {columnVisibility.attempted && (
                            <td className="px-3 py-2.5 text-center">
                                <input
                                    type="checkbox"
                                    title="Mark as attempted"
                                    aria-label={progress?.attempted ? "Remove attempt" : "Mark as attempted"}
                                    checked={Boolean(progress?.attempted)}
                                    onChange={() => requireProgressOrRun(() => onToggleAttempted(q))}
                                    className="form-checkbox size-3.5 cursor-pointer rounded border-border bg-muted text-info"
                                />
                            </td>
                        )}
                        {columnVisibility.bookmarked && (
                            <td className="px-3 py-2.5 text-center">
                                <button
                                    type="button"
                                    onClick={() => requireProgressOrRun(() => onToggleBookmarked(q))}
                                    title={progress?.bookmarked ? "Remove from favorites" : "Add to favorites"}
                                    aria-label={progress?.bookmarked ? "Remove from favorites" : "Add to favorites"}
                                    aria-pressed={Boolean(progress?.bookmarked)}
                                    className={`inline-flex cursor-pointer items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] transition-colors ${
                                        progress?.bookmarked
                                            ? "border border-warning/25 bg-yellow-400/10 text-warning"
                                            : "text-muted-foreground hover:bg-accent hover:text-warning"
                                    }`}
                                >
                                    <Star className={`size-3.5 ${progress?.bookmarked ? "fill-yellow-400 text-yellow-400" : ""}`} />
                                    <span className="sr-only sm:not-sr-only">
                                        {progress?.bookmarked ? "Saved" : "Save"}
                                    </span>
                                </button>
                            </td>
                        )}
                        {columnVisibility.revision && (
                            <td className="px-3 py-2.5 text-center">
                                <button
                                    onClick={() => requireProgressOrRun(() => onToggleRevision(q))}
                                    title="Toggle revision"
                                    aria-label={progress?.inRevisionList ? "Remove from revision list" : "Add to revision list"}
                                    className={`cursor-pointer inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] transition-colors ${
                                        progress?.inRevisionList
                                            ? "border border-cyan-500/25 bg-cyan-500/15 text-cyan-400"
                                            : "text-muted-foreground hover:bg-accent hover:text-cyan-400"
                                    }`}
                                >
                                    <RotateCcw className="size-3" />
                                    <span className="sr-only sm:not-sr-only">Revise</span>
                                </button>
                            </td>
                        )}
                        {columnVisibility.notes && (
                            <td className="px-3 py-2.5 text-center">
                                <NotesDialog
                                    problem={q}
                                    notes={progress?.notes ?? ""}
                                    disabled={!progressEnabled}
                                    onRequireAuth={onRequireAuth}
                                    onSave={onSaveNotes}
                                />
                            </td>
                        )}
                        {customLists && columnVisibility.list && (
                            <td className="px-3 py-2.5 text-center">
                                <AddToListDialog
                                    problemId={q.problemId}
                                    problemTitle={q.title}
                                    lists={customLists.lists}
                                    isProblemInList={customLists.isProblemInAnyList}
                                    onAddProblem={customLists.addProblem}
                                    onRemoveProblem={customLists.removeProblem}
                                    onCreateList={customLists.create}
                                />
                            </td>
                        )}
                    </tr>
                )})}
                </tbody>
            </table>
            </div>
            </PremiumSurface>
            )}
            </div>
            <ProblemPagination
                currentPage={currentPage}
                pageSize={pageSize}
                rangeFrom={range.from}
                rangeTo={range.to}
                totalItems={sortedProblems.length}
                totalPages={totalPages}
                onPageChange={setCurrentPage}
                onPageSizeChange={setPageSize}
            />
        </div>
    );
};

export default QuestionTable;
