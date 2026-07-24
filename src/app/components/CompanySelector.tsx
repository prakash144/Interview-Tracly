"use client";

import React, { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import CompanyLogo from "@/components/data-display/CompanyLogo";
import CompanySearch from "./CompanySearch";

// Define types for company categories
type CompanyCategory = {
    [category: string]: string[];
};

const companies: CompanyCategory = {
    "Tech Giants": ["Google", "Microsoft", "Apple", "Amazon", "Meta", "Tesla", "IBM", "Intel", "Oracle", "Samsung"],
    Startups: ["Stripe", "Airbnb", "OpenAI", "Notion", "Figma", "Duolingo", "Canva", "Plaid", "Gusto", "Razorpay"],
    Consulting: ["McKinsey", "BCG", "Bain", "Deloitte", "PwC", "EY", "KPMG", "Accenture", "ZS Associates", "Capgemini"],
    Other: ["Spotify", "Slack", "Reddit", "Zoom", "Pinterest", "Atlassian", "Salesforce", "Cisco", "Twilio", "Shopify"],
};

interface CompanySelectorProps {
    selectedCompanies: string;
    onCompanyChange: (company: string) => void;
}

const CompanySelector: React.FC<CompanySelectorProps> = ({
                                                              selectedCompanies,
                                                              onCompanyChange,
                                                          }) => {
    const allCompanies = Object.values(companies).flat();

    const [selectedCompany, setSelectedCompany] = useState<string>(selectedCompanies || allCompanies[0]);
    const [query, setQuery] = useState<string>("");
    const [userTyping, setUserTyping] = useState(false);
    const [open, setOpen] = useState(false);

    const handleCompanySelect = (company: string) => {
        setSelectedCompany(company);
        onCompanyChange(company);
        setQuery(company);
        setUserTyping(false); // Prevent dropdown from staying open
        setOpen(false);
    };

    const clearSelection = () => {
        const fallback = "Google";
        setSelectedCompany(fallback);
        onCompanyChange(fallback);
        setQuery(""); // Reset search box
    };

    return (
        <Dialog.Root open={open} onOpenChange={setOpen}>
            <Dialog.Trigger asChild>
                <Button
                    variant="outline"
                    className="h-7 text-xs text-foreground hover:text-foreground border border-border bg-secondary hover:bg-accent cursor-pointer transition-colors duration-150 rounded-md"
                    aria-label="Open company selector"
                >
                    <span className="truncate max-w-20">{selectedCompany || "Company"}</span>
                    <ChevronDown size={12} className="ml-1" />
                </Button>
            </Dialog.Trigger>

            <Dialog.Portal>
                <Dialog.Overlay className="fixed inset-0 bg-background/80 z-40" />
                <Dialog.Content className="fixed top-1/2 left-1/2 max-h-[90vh] w-[calc(100vw-2rem)] max-w-md overflow-hidden bg-card border border-border text-foreground p-4 rounded-xl -translate-x-1/2 -translate-y-1/2 z-50 sm:p-6">
                    <Dialog.Title className="text-xl font-semibold mb-2">Select a Company</Dialog.Title>

                    {/* Search Box */}
                    <CompanySearch
                        onCompanySelect={handleCompanySelect}
                        query={query}
                        setQuery={setQuery}
                        userTyping={userTyping}
                        setUserTyping={setUserTyping}
                    />

                    {/* Company Categories */}
                    <ScrollArea className="h-64 pr-2 mt-4 space-y-4">
                        {Object.entries(companies).map(([category, companyList]) => (
                            <div key={category}>
                                <h3 className="text-sm text-muted-foreground font-medium mb-1">{category}</h3>
                                <div className="flex flex-wrap gap-2">
                                    {companyList.map((company) => (
                                        <button
                                            type="button"
                                            key={company}
                                            onClick={() => handleCompanySelect(company)}
                                            aria-pressed={selectedCompany === company}
                                            className={`inline-flex items-center gap-1.5 px-3 py-1 text-xs rounded-full border cursor-pointer transition-colors duration-200 ${
                                                selectedCompany === company
                                                    ? "bg-success text-foreground border-success"
                                                    : "bg-secondary border-border hover:bg-accent"
                                            }`}
                                        >
                                            <CompanyLogo company={company} size="sm" />
                                            {company}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}
                    </ScrollArea>

                    {/* Action Buttons */}
                    <div className="flex justify-between gap-2 mt-6">
                        <Button
                            onClick={clearSelection}
                            variant="outline"
                            className="flex-1 text-sm text-foreground hover:text-foreground border border-border bg-secondary hover:bg-accent"
                        >
                            Clear
                        </Button>
                        <Dialog.Close asChild>
                            <Button
                                variant="outline"
                                className="flex-1 text-sm text-foreground hover:text-foreground border border-border bg-secondary hover:bg-accent"
                            >
                                Close
                            </Button>
                        </Dialog.Close>
                    </div>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
};

export default CompanySelector;
