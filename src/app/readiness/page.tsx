"use client";

import { useMemo } from "react";
import AppShell from "@/components/layout/AppShell";
import Footer from "@/app/components/Footer";
import PageHeader from "@/components/layout/PageHeader";
import ErrorState from "@/components/states/ErrorState";
import { ReadinessSkeleton } from "@/components/states/PageSkeletons";
import { useCompanyReadiness } from "@/hooks/useCompanyReadiness";
import { useRevisionTracker } from "@/hooks/useRevisionTracker";
import { useInterviewReadiness } from "@/hooks/useInterviewReadiness";
import { useCalendarData } from "@/hooks/useCalendarData";
import { useGoals } from "@/hooks/useGoals";
import { useProblemWorkspaceData } from "@/features/problems/hooks/useProblemWorkspaceData";

import CompanySelector from "@/app/components/readiness/CompanySelector";
import HeroCard from "@/app/components/readiness/HeroCard";
import ReadinessBreakdown from "@/app/components/readiness/ReadinessBreakdown";
import ActionPlan from "@/app/components/readiness/ActionPlan";
import WeakAreas from "@/app/components/readiness/WeakAreas";
import CompanyProgress from "@/app/components/readiness/CompanyProgress";
import MockInterviewSection from "@/app/components/readiness/MockInterviewSection";

const ReadinessPage = () => {
  const { auth, progress, questionsState, unifiedProblems, unifiedLoading, unifiedError } = useProblemWorkspaceData();
  const allQuestions = unifiedProblems.length > 0 ? unifiedProblems : questionsState.questions;
  const companyReadiness = useCompanyReadiness(progress.progressMap);
  const revisionTracker = useRevisionTracker(progress.progressMap, allQuestions);
  const { settings } = useGoals();
  const calendarData = useCalendarData(
    auth.user?.uid,
    progress.progressMap,
    allQuestions,
    "this-year"
  );

  const weeklySolved = useMemo(() => {
    if (!progress.progressMap) return 0;
    const today = new Date();
    const weekStart = new Date(today);
    weekStart.setDate(today.getDate() - today.getDay());
    weekStart.setHours(0, 0, 0, 0);

    let count = 0;
    for (const [, p] of Object.entries(progress.progressMap)) {
      if (p.solved && p.solvedAt) {
        const solvedDate = new Date(p.solvedAt.seconds * 1000);
        if (solvedDate >= weekStart) count++;
      }
    }
    return count;
  }, [progress.progressMap]);

  const interviewReadiness = useInterviewReadiness(
    progress.progressMap,
    allQuestions,
    companyReadiness.stats,
    revisionTracker.stats,
    calendarData.stats,
    calendarData.insights,
    settings,
    weeklySolved,
    companyReadiness.selectedCompany,
  );

  const { overallScore, level, factors, weakTopics, weakDifficulties, weakPatterns, actionPlan, remainingProblems, estimatedTime, mockReadiness } = interviewReadiness;

  return (
    <AppShell footer={<Footer />}>
      <PageHeader
        eyebrow="Readiness"
        title="Interview Readiness"
        description="Are you ready for your target company&apos;s coding interview?"
        actions={
          <CompanySelector
            companies={companyReadiness.allCompanies}
            selected={companyReadiness.selectedCompany}
            onChange={companyReadiness.selectCompany}
          />
        }
      />
      <div className="mx-auto max-w-7xl p-4 sm:px-6 lg:px-8 pb-10">
        {questionsState.error && (
          <ErrorState message={questionsState.error} />
        )}

        {auth.error && typeof auth.error === "string" && (
          <ErrorState message={auth.error} />
        )}

        {progress.error && (
          <ErrorState message={progress.error} />
        )}

        {unifiedError && (
          <ErrorState message={unifiedError} />
        )}

        {calendarData.error && (
          <ErrorState message={calendarData.error} />
        )}

        {!auth.user ? (
          <div className="rounded-xl border border-dashed border-border bg-card/70 px-4 py-12 text-center">
            <p className="text-sm text-muted-foreground">Sign in to view your readiness data.</p>
          </div>
        ) : questionsState.loading || progress.loading || calendarData.loading || unifiedLoading ? (
          <ReadinessSkeleton />
        ) : (
          <div className="space-y-5">
            <HeroCard
              overallScore={overallScore}
              level={level}
              remainingProblems={remainingProblems}
              estimatedTime={estimatedTime}
              selectedCompany={companyReadiness.selectedCompany}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <ReadinessBreakdown factors={factors} />
              <ActionPlan actions={actionPlan} />
            </div>

            <WeakAreas
              weakTopics={weakTopics}
              weakDifficulties={weakDifficulties}
              weakPatterns={weakPatterns}
            />

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <CompanyProgress
                stats={companyReadiness.stats}
                allCompanies={companyReadiness.allCompanies}
                loading={companyReadiness.loading}
                selectedCompany={companyReadiness.selectedCompany}
                onSelectCompany={companyReadiness.selectCompany}
                onLoadCompany={companyReadiness.loadCompanyData}
                fetchingCompany={companyReadiness.fetchingCompany}
              />
              <MockInterviewSection
                items={mockReadiness}
                selectedCompany={companyReadiness.selectedCompany}
              />
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
};

export default ReadinessPage;
