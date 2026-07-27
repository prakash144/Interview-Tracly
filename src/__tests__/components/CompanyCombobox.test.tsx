import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import CompanyCombobox from "@/app/components/mock-test/wizard/CompanyCombobox";

const COMPANIES = [
  "Google", "Meta", "Amazon", "Apple", "Netflix", "Microsoft",
  "Stripe", "Palantir", "Databricks", "Uber", "Airbnb", "Twitter",
];

describe("CompanyCombobox", () => {
  const defaultProps = {
    value: "",
    companies: COMPANIES,
    onChange: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders input with placeholder", () => {
    render(<CompanyCombobox {...defaultProps} />);
    expect(screen.getByPlaceholderText("Any Company")).toBeInTheDocument();
  });

  it("displays the current value", () => {
    render(<CompanyCombobox {...defaultProps} value="Google" />);
    expect(screen.getByDisplayValue("Google")).toBeInTheDocument();
  });

  it("shows dropdown on focus", async () => {
    render(<CompanyCombobox {...defaultProps} />);
    const input = screen.getByPlaceholderText("Any Company");
    await userEvent.click(input);
    expect(screen.getByRole("listbox")).toBeInTheDocument();
  });

  it("shows up to 12 companies when no query", async () => {
    render(<CompanyCombobox {...defaultProps} />);
    await userEvent.click(screen.getByPlaceholderText("Any Company"));
    const options = screen.getAllByRole("option");
    expect(options.length).toBeLessThanOrEqual(12);
  });

  it("filters companies on input", async () => {
    render(<CompanyCombobox {...defaultProps} />);
    const input = screen.getByPlaceholderText("Any Company");
    await userEvent.type(input, "App");
    const options = screen.getAllByRole("option");
    expect(options).toHaveLength(1);
    expect(options[0]).toHaveTextContent("Apple");
  });

  it("calls onChange when selecting a company", async () => {
    const onChange = vi.fn();
    render(<CompanyCombobox {...defaultProps} onChange={onChange} />);
    await userEvent.click(screen.getByPlaceholderText("Any Company"));
    await userEvent.click(screen.getByText("Google"));
    expect(onChange).toHaveBeenCalledWith("Google");
  });

  it("closes dropdown after selection", async () => {
    render(<CompanyCombobox {...defaultProps} />);
    await userEvent.click(screen.getByPlaceholderText("Any Company"));
    await userEvent.click(screen.getByText("Google"));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("clears input when X is clicked", async () => {
    const onChange = vi.fn();
    render(<CompanyCombobox {...defaultProps} value="Google" onChange={onChange} />);
    const clearBtn = screen.getByRole("button");
    await userEvent.click(clearBtn);
    expect(onChange).toHaveBeenCalledWith("");
  });

  it("closes dropdown on Escape", async () => {
    render(<CompanyCombobox {...defaultProps} />);
    const input = screen.getByPlaceholderText("Any Company");
    await userEvent.click(input);
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    fireEvent.keyDown(input, { key: "Escape" });
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("selects highlighted item on Enter", async () => {
    const onChange = vi.fn();
    render(<CompanyCombobox {...defaultProps} onChange={onChange} />);
    const input = screen.getByPlaceholderText("Any Company");
    await userEvent.click(input);
    fireEvent.keyDown(input, { key: "ArrowDown" });
    fireEvent.keyDown(input, { key: "Enter" });
    expect(onChange).toHaveBeenCalled();
  });

  it("shows custom company hint when no match", async () => {
    render(<CompanyCombobox {...defaultProps} />);
    const input = screen.getByPlaceholderText("Any Company");
    await userEvent.type(input, "NonExistentCorp");
    expect(screen.getByText(/Use "NonExistentCorp" as custom company/i)).toBeInTheDocument();
  });

  it("closes dropdown on outside click", async () => {
    render(<div><div data-testid="outside" /><CompanyCombobox {...defaultProps} /></div>);
    await userEvent.click(screen.getByPlaceholderText("Any Company"));
    expect(screen.getByRole("listbox")).toBeInTheDocument();
    await userEvent.click(screen.getByTestId("outside"));
    expect(screen.queryByRole("listbox")).not.toBeInTheDocument();
  });

  it("navigates with ArrowDown and ArrowUp", async () => {
    render(<CompanyCombobox {...defaultProps} />);
    const input = screen.getByPlaceholderText("Any Company");
    await userEvent.click(input);

    fireEvent.keyDown(input, { key: "ArrowDown" });
    const firstOption = screen.getAllByRole("option")[0];
    expect(firstOption.getAttribute("aria-selected")).toBe("true");

    fireEvent.keyDown(input, { key: "ArrowDown" });
    const secondOption = screen.getAllByRole("option")[1];
    expect(secondOption.getAttribute("aria-selected")).toBe("true");

    fireEvent.keyDown(input, { key: "ArrowUp" });
    expect(firstOption.getAttribute("aria-selected")).toBe("true");
  });
});
