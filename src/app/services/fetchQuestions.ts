"use client";
import { useState, useEffect } from "react";
import type { Problem } from "@/lib/progressTypes";
import { getProblemId } from "@/lib/problemId";
import { cachedFetchCSVWithStale } from "@/lib/csvCache";

interface CsvItem {
    Title: string;
    Link: string;
    Difficulty: string;
    Topics: string;
    Frequency: string;
    "Acceptance Rate": string;
}

interface FetchQuestionsContext {
    company: string;
    list: string;
}

const fetchCSV = async (url: string): Promise<CsvItem[]> => {
    const text = typeof window !== "undefined"
        ? await cachedFetchCSVWithStale(url)
        : await (await fetch(url)).text();

    const Papa = await import("papaparse");
    const result = Papa.parse<CsvItem>(text, {
        header: true,
        skipEmptyLines: true,
    });

    return result.data;
};

// Custom hook to fetch questions and manage loading/error state
const useFetchQuestions = (url: string, context: FetchQuestionsContext) => {
    const [questions, setQuestions] = useState<Problem[]>([]);
    const [loading, setLoading] = useState<boolean>(true);
    const [error, setError] = useState<string>("");

    useEffect(() => {
        const loadQuestions = async () => {
            setLoading(true);
            setError(""); // Reset error before fetching

            try {
                const data = await fetchCSV(url);

                // Map data to desired structure
                const formattedData = data.map((item) => {
                    const topicTag = item.Topics || "";
                    const title = item.Title || "";
                    const link = item.Link || "";

                    return {
                        problemId: getProblemId(link, title),
                        title,
                        link,
                        difficulty: item.Difficulty || "",
                        topicTag,
                        topics: topicTag
                            .split(",")
                            .map((topic) => topic.trim())
                            .filter(Boolean),
                        company: context.company,
                        list: context.list,
                        frequency: item.Frequency || "",
                        acceptanceRate: convertToPercentage(item["Acceptance Rate"] || ""),
                    };
                });

                setQuestions(formattedData);
                setLoading(false);
            } catch (err) {
                console.error("Error loading CSV data:", err);
                setError(err instanceof Error ? err.message : "Error loading CSV data");
                setLoading(false);
            }
        };

        loadQuestions();
    }, [url, context.company, context.list]); // Refetch when the URL changes

    return { questions, loading, error };
};

// Utility function to convert a value to percentage
const convertToPercentage = (rate: string): string => {
    const parsedRate = parseFloat(rate);
    if (!isNaN(parsedRate)) {
        return (parsedRate * 100).toFixed(2) + "%"; // Convert to percentage and keep 2 decimal places
    }
    return rate; // Return the original value if it's not a valid number
};

export default useFetchQuestions;
