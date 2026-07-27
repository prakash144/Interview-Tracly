import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import WizardStepSections from "@/app/components/mock-test/wizard/WizardStepSections";
import type { MockInterviewConfig } from "@/lib/mockTest";

let nextSectionId = 1;
vi.mock("@/lib/mockTest", async () => {
  const actual = await vi.importActual<typeof import("@/lib/mockTest")>("@/lib/mockTest");
  return {
    ...actual,
    generateSectionId: vi.fn(() => `test_sec_${nextSectionId++}`),
  };
});

function emptyConfig(): MockInterviewConfig {
  return {
    sections: [],
    company: "",
    role: "",
    level: "",
    durationMinutes: 30,
    round: "",
  };
}

function renderWithState(overrides: Partial<MockInterviewConfig> = {}) {
  const configRef = { current: { ...emptyConfig(), ...overrides } };
  const setConfigCalls: unknown[] = [];

  const setConfig = vi.fn((updater: MockInterviewConfig | ((prev: MockInterviewConfig) => MockInterviewConfig)) => {
    if (typeof updater === "function") {
      configRef.current = updater(configRef.current);
    } else {
      configRef.current = updater;
    }
    setConfigCalls.push(updater);
  });

  const topicSearch: Record<string, string> = {};
  const setTopicSearch = vi.fn();
  const onBack = vi.fn();
  const onNext = vi.fn();

  const view = render(
    <WizardStepSections
      config={configRef.current}
      setConfig={setConfig}
      availableTopics={["arrays", "strings", "trees", "graphs", "dp"]}
      topicSearch={topicSearch}
      setTopicSearch={setTopicSearch}
      onBack={onBack}
      onNext={onNext}
    />
  );

  return {
    ...view,
    getConfig: () => configRef.current,
    setConfig,
    setConfigCalls,
    topicSearch,
    setTopicSearch,
    onBack,
    onNext,
    rerender: () => {
      view.rerender(
        <WizardStepSections
          config={configRef.current}
          setConfig={setConfig}
          availableTopics={["arrays", "strings", "trees", "graphs", "dp"]}
          topicSearch={topicSearch}
          setTopicSearch={setTopicSearch}
          onBack={onBack}
          onNext={onNext}
        />
      );
    },
  };
}

beforeEach(() => {
  nextSectionId = 1;
});

describe("WizardStepSections", () => {
  describe("empty state", () => {
    it("shows empty message when no sections", () => {
      const { getConfig } = renderWithState();
      expect(screen.getByText("No sections yet")).toBeInTheDocument();
      expect(getConfig().sections).toHaveLength(0);
    });

    it("renders section type preset buttons", () => {
      renderWithState();
      expect(screen.getByText("DSA")).toBeInTheDocument();
      expect(screen.getByText("System Design")).toBeInTheDocument();
      expect(screen.getByText("Behavioral")).toBeInTheDocument();
      expect(screen.getByText("Backend Engineering")).toBeInTheDocument();
      expect(screen.getByText("Leadership Principles")).toBeInTheDocument();
      expect(screen.getByText("AI & Machine Learning")).toBeInTheDocument();
    });

    it("shows 0 sections 0 questions count", () => {
      renderWithState();
      expect(screen.getByText("0 questions across 0 sections")).toBeInTheDocument();
    });

    it("Next button is disabled when no sections", () => {
      renderWithState();
      const nextBtn = screen.getByText("Next: Review");
      expect(nextBtn).toBeDisabled();
    });

    it("Back button calls onBack", async () => {
      const { onBack } = renderWithState();
      await userEvent.click(screen.getByText("Back"));
      expect(onBack).toHaveBeenCalled();
    });
  });

  describe("adding sections", () => {
    it("adds DSA section when DSA button clicked", async () => {
      const { getConfig, rerender } = renderWithState();
      await userEvent.click(screen.getByText("DSA"));
      rerender();
      const config = getConfig();
      expect(config.sections).toHaveLength(1);
      expect(config.sections[0].type).toBe("dsa");
      expect(config.sections[0].title).toBe("Coding Problems");
      expect(config.sections[0].problemCount).toBe(1);
      expect(config.sections[0].customQuestions).toEqual([]);
    });

    it("adds System Design section", async () => {
      const { getConfig, rerender } = renderWithState();
      await userEvent.click(screen.getByText("System Design"));
      rerender();
      const config = getConfig();
      expect(config.sections).toHaveLength(1);
      expect(config.sections[0].type).toBe("system-design");
      expect(config.sections[0].problemCount).toBe(1);
    });

    it("adds Behavioral section", async () => {
      const { getConfig, rerender } = renderWithState();
      await userEvent.click(screen.getByText("Behavioral"));
      rerender();
      const config = getConfig();
      expect(config.sections).toHaveLength(1);
      expect(config.sections[0].type).toBe("behavioral");
      expect(config.sections[0].problemCount).toBe(1);
    });

    it("disables a preset button once a section of that type exists", async () => {
      const { rerender } = renderWithState();
      await userEvent.click(screen.getByText("DSA"));
      rerender();
      const dsaButtons = screen.getAllByText("DSA");
      const presetBtn = dsaButtons.find((el) => el.tagName === "BUTTON" && el.closest("[class*='inline-flex']"));
      expect(presetBtn).toBeTruthy();
      expect(presetBtn).toBeDisabled();
      expect(presetBtn!.className).toContain("cursor-not-allowed");
    });

    it("allows multiple sections of different types", async () => {
      const { getConfig, rerender } = renderWithState();
      await userEvent.click(screen.getByText("DSA"));
      rerender();
      await userEvent.click(screen.getByText("System Design"));
      rerender();
      expect(getConfig().sections).toHaveLength(2);
    });

    it("shows total question count after adding sections", async () => {
      const { rerender } = renderWithState();
      await userEvent.click(screen.getByText("DSA"));
      rerender();
      await userEvent.click(screen.getByText("System Design"));
      rerender();
      expect(screen.getByText("2 questions across 2 sections")).toBeInTheDocument();
    });
  });

  describe("removing sections", () => {
    it("removes a section when X is clicked", async () => {
      const { getConfig, rerender } = renderWithState();
      await userEvent.click(screen.getByText("DSA"));
      rerender();
      expect(getConfig().sections).toHaveLength(1);

      const xButtons = screen.getAllByRole("button").filter((b) =>
        b.innerHTML.includes("lucide-x")
      );
      await userEvent.click(xButtons[xButtons.length - 1]);
      rerender();
      expect(getConfig().sections).toHaveLength(0);
    });
  });

  describe("section reordering", () => {
    it("moves section up when ArrowUp clicked", async () => {
      const { getConfig, rerender } = renderWithState();
      await userEvent.click(screen.getByText("DSA"));
      rerender();
      await userEvent.click(screen.getByText("System Design"));
      rerender();

      expect(getConfig().sections[0].type).toBe("dsa");
      expect(getConfig().sections[1].type).toBe("system-design");

      const upButtons = screen.getAllByTitle("Move up");
      await userEvent.click(upButtons[1]);
      rerender();
      expect(getConfig().sections[0].type).toBe("system-design");
      expect(getConfig().sections[1].type).toBe("dsa");
    });

    it("moves section down when ArrowDown clicked", async () => {
      const { getConfig, rerender } = renderWithState();
      await userEvent.click(screen.getByText("DSA"));
      rerender();
      await userEvent.click(screen.getByText("System Design"));
      rerender();

      const downButtons = screen.getAllByTitle("Move down");
      await userEvent.click(downButtons[0]);
      rerender();
      expect(getConfig().sections[0].type).toBe("system-design");
      expect(getConfig().sections[1].type).toBe("dsa");
    });

    it("disables up button for first section", async () => {
      const { rerender } = renderWithState();
      await userEvent.click(screen.getByText("DSA"));
      rerender();
      const upButtons = screen.getAllByTitle("Move up");
      expect(upButtons[0]).toBeDisabled();
    });

    it("disables down button for last section", async () => {
      const { rerender } = renderWithState();
      await userEvent.click(screen.getByText("DSA"));
      rerender();
      const downButtons = screen.getAllByTitle("Move down");
      expect(downButtons[0]).toBeDisabled();
    });
  });

  describe("section configuration", () => {
    it("allows editing the section title", async () => {
      const { getConfig, rerender } = renderWithState();
      await userEvent.click(screen.getByText("DSA"));
      rerender();

      const titleInput = screen.getByDisplayValue("Coding Problems");
      fireEvent.change(titleInput, { target: { value: "My Custom Title" } });
      rerender();

      expect(getConfig().sections[0].title).toBe("My Custom Title");
    });

    it("increments problem count", async () => {
      const { getConfig, rerender } = renderWithState();
      await userEvent.click(screen.getByText("DSA"));
      rerender();

      const plusBtn = screen.getAllByText("+")[0];
      await userEvent.click(plusBtn);
      rerender();
      expect(getConfig().sections[0].problemCount).toBe(2);
    });

    it("decrements problem count", async () => {
      const { getConfig, rerender } = renderWithState();
      await userEvent.click(screen.getByText("DSA"));
      rerender();

      const minusBtn = screen.getAllByText("−")[0];
      await userEvent.click(minusBtn);
      rerender();
      expect(getConfig().sections[0].problemCount).toBe(1);
    });

    it("does not decrement below 1", async () => {
      const { getConfig, rerender } = renderWithState({
        sections: [{ id: "sec1", type: "dsa", title: "Coding", problemCount: 1, difficulties: ["Easy"], topics: [], tags: [], customQuestions: [] }],
      });
      rerender();
      const minusBtn = screen.getAllByText("−")[0];
      await userEvent.click(minusBtn);
      rerender();
      expect(getConfig().sections[0].problemCount).toBe(1);
    });

    it("does not increment above 20", async () => {
      const { getConfig, rerender } = renderWithState({
        sections: [{ id: "sec1", type: "dsa", title: "Coding", problemCount: 20, difficulties: ["Easy"], topics: [], tags: [], customQuestions: [] }],
      });
      rerender();
      const plusBtn = screen.getAllByText("+")[0];
      await userEvent.click(plusBtn);
      rerender();
      expect(getConfig().sections[0].problemCount).toBe(20);
    });

    it("toggles difficulty selection", async () => {
      const { getConfig, rerender } = renderWithState();
      await userEvent.click(screen.getByText("DSA"));
      rerender();

      const mediumBtn = screen.getByText("Medium");
      await userEvent.click(mediumBtn);
      rerender();
      expect(getConfig().sections[0].difficulties).not.toContain("Medium");

      await userEvent.click(mediumBtn);
      rerender();
      expect(getConfig().sections[0].difficulties).toContain("Medium");
    });
  });

  describe("custom questions for non-DSA sections", () => {
    it("shows custom questions editor for non-DSA sections", async () => {
      const { rerender } = renderWithState();
      await userEvent.click(screen.getByText("System Design"));
      rerender();
      expect(screen.getByText(/Custom Questions/)).toBeInTheDocument();
    });

    it("does NOT show custom questions editor for DSA sections", async () => {
      const { rerender } = renderWithState();
      await userEvent.click(screen.getByText("DSA"));
      rerender();
      expect(screen.queryByText(/Custom Questions/)).not.toBeInTheDocument();
    });

    it("adds a custom question", async () => {
      const { getConfig, rerender } = renderWithState();
      await userEvent.click(screen.getByText("System Design"));
      rerender();

      const input = screen.getByPlaceholderText("Type a question and press Enter...");
      await userEvent.type(input, "Design a URL shortener");
      await userEvent.keyboard("{Enter}");
      rerender();

      expect(getConfig().sections[0].customQuestions).toContain("Design a URL shortener");
    });

    it("adds custom question on Enter key", async () => {
      const { getConfig, rerender } = renderWithState();
      await userEvent.click(screen.getByText("System Design"));
      rerender();

      const input = screen.getByPlaceholderText("Type a question and press Enter...");
      await userEvent.type(input, "Design Twitter{Enter}");
      rerender();

      expect(getConfig().sections[0].customQuestions).toContain("Design Twitter");
    });

    it("does not add empty question", async () => {
      const { getConfig, rerender } = renderWithState();
      await userEvent.click(screen.getByText("System Design"));
      rerender();

      const input = screen.getByPlaceholderText("Type a question and press Enter...");
      await userEvent.type(input, "   {Enter}");
      rerender();

      expect(getConfig().sections[0].customQuestions ?? []).toHaveLength(0);
    });

    it("removes a custom question", async () => {
      const { getConfig, rerender } = renderWithState({
        sections: [{
          id: "sec1", type: "behavioral", title: "Behavioral", problemCount: 2,
          difficulties: ["Easy"], topics: [], tags: [],
          customQuestions: ["Tell me about yourself", "Why this company?"],
        }],
      });
      rerender();

      const xButtons = screen.getAllByRole("button").filter((b) =>
        b.innerHTML.includes("lucide-x")
      );
      await userEvent.click(xButtons[xButtons.length - 1]);
      rerender();

      expect(getConfig().sections[0].customQuestions).toEqual(["Tell me about yourself"]);
    });

    it("hides add input when custom questions reach problemCount", async () => {
      renderWithState({
        sections: [{
          id: "sec1", type: "behavioral", title: "Behavioral", problemCount: 1,
          difficulties: ["Easy"], topics: [], tags: [],
          customQuestions: ["Tell me about yourself"],
        }],
      });

      expect(screen.queryByPlaceholderText("Type a question and press Enter...")).not.toBeInTheDocument();
    });
  });

  describe("Next button behavior", () => {
    it("enables Next when at least one section exists", async () => {
      const { rerender } = renderWithState();
      await userEvent.click(screen.getByText("DSA"));
      rerender();
      const nextBtn = screen.getByText("Next: Review");
      expect(nextBtn).not.toBeDisabled();
    });

    it("calls onNext when clicked", async () => {
      const { onNext, rerender } = renderWithState();
      await userEvent.click(screen.getByText("DSA"));
      rerender();
      await userEvent.click(screen.getByText("Next: Review"));
      expect(onNext).toHaveBeenCalled();
    });
  });
});
