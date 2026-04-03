import { useState } from "react";
import { BrowserRouter as Router, Routes, Route, Link } from "react-router";
import {
  FiCode,
  FiCpu,
  FiLayers,
  FiAlertTriangle,
  FiInfo,
  FiHome,
  FiHelpCircle,
  FiSun,
  FiMoon,
  FiZap,
  FiTerminal,
  FiChevronRight,
  FiActivity,
  FiDatabase,
} from "react-icons/fi";
import CodeInput from "./components/CodeInput";
import PhaseVisualization from "./components/PhaseVisualization";
import HowItWorks from "./components/HowItWorks";
import Footer from "./components/Footer";
import { useCompiler } from "./hooks/useCompiler";
import { ThemeProvider, useTheme } from "./context/ThemeContext";
import "./themes.css";

/* ── Phase metadata with technical explanations ──────────────────────────── */
export const PHASE_META = [
  {
    id: 1,
    label: "Phase 01",
    title: "Lexical Analysis",
    tagline: "Source Code → Token Stream",
    colorKey: "blue",
    explanation:
      "The lexer (scanner) reads the raw character stream left-to-right and partitions it into a flat sequence of tokens — the atomic units of the language. Each token carries a type (KEYWORD, IDENTIFIER, NUMBER, OPERATOR …) and its literal value. Whitespace, comments, and non-significant characters are stripped here. This phase is typically implemented as a DFA (deterministic finite automaton) built from regular expressions.",
  },
  {
    id: 2,
    label: "Phase 02",
    title: "Syntax Analysis",
    tagline: "Token Stream → Abstract Syntax Tree",
    colorKey: "purple",
    explanation:
      "The parser consumes the token stream and validates it against the language's context-free grammar (CFG). A recursive-descent or LALR(1) parser is common. A successful parse produces an Abstract Syntax Tree (AST) — a hierarchical tree where each internal node represents a grammatical construct and leaves represent terminals. Operator precedence and associativity are encoded in the tree structure.",
  },
  {
    id: 3,
    label: "Phase 03",
    title: "Semantic Analysis",
    tagline: "AST → Annotated AST + Symbol Table",
    colorKey: "green",
    explanation:
      "The semantic analyser traverses the AST and decorates nodes with type information. It builds and consults a symbol table that maps each identifier to its declared type, scope, and storage location. Type mismatches, use-before-declaration errors, and scope violations are caught here. The output is an annotated AST ready for code generation.",
  },
  {
    id: 4,
    label: "Phase 04",
    title: "Intermediate Code",
    tagline: "Annotated AST → Three-Address Code",
    colorKey: "amber",
    explanation:
      "The annotated AST is lowered to a machine-independent intermediate representation called Three-Address Code (TAC). Each TAC instruction has at most one operator and three addresses: result = operand₁ ⊕ operand₂. Temporary variables (t1, t2 …) hold sub-expression values. TAC decouples front-end (language-specific) concerns from back-end (architecture-specific) concerns, enabling portable optimisation.",
  },
  {
    id: 5,
    label: "Phase 05",
    title: "Code Optimisation",
    tagline: "TAC → Optimised TAC",
    colorKey: "orange",
    explanation:
      "The optimiser applies machine-independent transformations to the TAC to reduce execution cost without changing semantics. Common passes include: constant folding (evaluate compile-time constants), copy propagation (replace a copy variable with its source), dead-code elimination (remove instructions whose results are never used), and common-subexpression elimination (cache repeated computations in a temporary).",
  },
  {
    id: 6,
    label: "Phase 06",
    title: "Code Generation",
    tagline: "Optimised TAC → Target Assembly",
    colorKey: "red",
    explanation:
      "The code generator maps optimised TAC to actual target-architecture instructions (x86-like here). Key tasks: instruction selection (choosing the right opcode), register allocation (assigning temps to physical registers, spilling to memory when needed), and instruction scheduling (reordering to avoid pipeline stalls). The result is assembly that an assembler, linker, and OS loader can turn into a running process.",
  },
];

/* ── Theme toggle ─────────────────────────────────────────────────────────── */
const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  return (
    <button
      onClick={toggleTheme}
      className="theme-toggle"
      aria-label="Toggle colour theme"
    >
      {theme === "dark" ? (
        <>
          <FiSun className="w-3.5 h-3.5" />
          <span>Light</span>
        </>
      ) : (
        <>
          <FiMoon className="w-3.5 h-3.5" />
          <span>Dark</span>
        </>
      )}
    </button>
  );
};

/* ── Pipeline progress strip ─────────────────────────────────────────────── */
const PipelineStrip = () => (
  <div className="pipeline-strip">
    {PHASE_META.map((m, i) => (
      <div key={m.id} className="ps-step">
        <div className={`ps-dot ps-dot--${m.colorKey}`}>{m.id}</div>
        <span className="ps-name">{m.title.split(" ")[0]}</span>
        {i < PHASE_META.length - 1 && (
          <FiChevronRight className="ps-arrow" />
        )}
      </div>
    ))}
  </div>
);

/* ── Per-phase explainer card injected above each result panel ─────────────── */
export const PhaseExplainer = ({ meta }) => (
  <div className={`phase-explainer pe--${meta.colorKey}`}>
    <div className="pe__head">
      <span className={`pe__label pe__label--${meta.colorKey}`}>
        {meta.label}
      </span>
      <FiChevronRight className="pe__arrow" />
      <span className="pe__tagline">{meta.tagline}</span>
    </div>
    <p className="pe__body">{meta.explanation}</p>
  </div>
);

/* ── Main Visualiser page ────────────────────────────────────────────────── */
const CompilerVisualizer = () => {
  const [code, setCode] = useState("total := price + rate * 60");
  const { phases, loading, error, analyzeCode, usingFallback } = useCompiler();
  const { theme } = useTheme();

  const handleAnalyze = async () => {
    await analyzeCode(code);
  };

  return (
    <div className="cv-root" data-theme={theme}>

      {/* ── Top navigation bar ──────────────────────────────────────────── */}
      <header className="topbar">
        <div className="topbar__inner">

          {/* Brand / Logo area */}
          <Link to="/" className="brand">
            {/* ┌──────────────────────────────────────────┐
                │  LOGO SLOT — replace the <img> src=""    │
                │  with your own logo path or import.      │
                │  The fallback icon shows when src is     │
                │  empty or the image fails to load.       │
                └──────────────────────────────────────────┘ */}
            <div className="brand__logo-slot">
              <img
                src=""
                alt=""
                className="brand__logo-img"
                onError={(e) => {
                  e.currentTarget.style.display = "none";
                  e.currentTarget.nextElementSibling.style.display = "flex";
                }}
              />
              <div className="brand__logo-fallback">
                <FiTerminal className="w-5 h-5" />
              </div>
            </div>

            <div className="brand__text">
              <span className="brand__title">Compiler Visualizer</span>
              <span className="brand__sub">
                // tokens → AST → IR → asm
              </span>
            </div>
          </Link>

          {/* Nav links */}
          <nav className="topbar__nav">
            <Link to="/" className="nav-pill nav-pill--active">
              <FiHome className="w-3.5 h-3.5" />
              <span>Home</span>
            </Link>
            <Link to="/how-it-works" className="nav-pill">
              <FiHelpCircle className="w-3.5 h-3.5" />
              <span>Guide</span>
            </Link>
            <ThemeToggle />
          </nav>
        </div>
      </header>

      <main className="cv-main">

        {/* ── Hero section ──────────────────────────────────────────────── */}
        <section className="hero">
          <div className="hero__eyebrow">
            <FiActivity className="w-3 h-3" />
            <span>Interactive Compiler Pipeline Visualiser</span>
          </div>

          <h1 className="hero__title">
            Watch Source Code Flow Through{" "}
            <span className="hero__accent">Every Compiler Phase</span>
          </h1>

          <p className="hero__desc">
            Enter any arithmetic expression and trace its journey — character
            stream to token list, parse tree, semantic checks, three-address
            code, optimisation, and final assembly — with a technical
            explanation at every step.
          </p>

          <PipelineStrip />
        </section>

        {/* ── Status banners ────────────────────────────────────────────── */}
        <div className="banners">
          {usingFallback && (
            <div className="banner banner--warn">
              <FiAlertTriangle className="w-4 h-4 flex-shrink-0" />
              <div>
                <strong>Local parser active</strong> — no API key detected.
                Analysis uses the built-in fallback parser. Results are
                accurate for standard arithmetic expressions.
              </div>
            </div>
          )}
          {loading && (
            <div className="banner banner--info">
              <span className="spinner" />
              <div>
                <strong>Analysing…</strong> Running the expression through all
                6 compiler phases.
              </div>
            </div>
          )}
        </div>

        {/* ── Empty-state / quick-start ─────────────────────────────────── */}
        {!phases && !loading && (
          <div className="qs-card">
            <div className="qs-card__head">
              <FiInfo className="w-4 h-4 flex-shrink-0" />
              <span>Quick start</span>
            </div>
            <div className="qs-grid">
              {[
                {
                  icon: <FiCode />,
                  color: "blue",
                  title: "Write an expression",
                  desc: 'Type arithmetic like total := price + rate * 60 or choose an example from the editor.',
                },
                {
                  icon: <FiZap />,
                  color: "purple",
                  title: "Click Analyse",
                  desc: "The pipeline runs all 6 phases instantly and renders the output of each stage.",
                },
                {
                  icon: <FiLayers />,
                  color: "green",
                  title: "Explore phase panels",
                  desc: "Each collapsible panel shows output data and a technical brief on what the compiler is doing.",
                },
                {
                  icon: <FiDatabase />,
                  color: "amber",
                  title: "Read the Guide",
                  desc: "The Guide page has theory, grammar rules, and worked examples for every phase.",
                },
              ].map((item) => (
                <div key={item.title} className="qs-item">
                  <div className={`qs-icon qs-icon--${item.color}`}>
                    {item.icon}
                  </div>
                  <div>
                    <p className="qs-item__title">{item.title}</p>
                    <p className="qs-item__desc">{item.desc}</p>
                  </div>
                </div>
              ))}
            </div>
            <div className="qs-card__footer">
              <Link to="/how-it-works" className="guide-cta">
                <FiHelpCircle className="w-4 h-4" />
                Open the Compiler Phases Guide
                <FiChevronRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        )}

        {/* ── Code input ────────────────────────────────────────────────── */}
        <CodeInput
          code={code}
          onChange={setCode}
          onAnalyze={handleAnalyze}
          loading={loading}
        />

        {/* ── Error ─────────────────────────────────────────────────────── */}
        {error && (
          <div className="banner banner--error">
            <FiAlertTriangle className="w-4 h-4 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* ── Results ───────────────────────────────────────────────────── */}
        {phases && (
          <section className="results">
            {/* Results header */}
            <div className="results__head">
              <div className="results__head-left">
                <FiLayers className="w-5 h-5" />
                <h2>Compilation Pipeline Output</h2>
              </div>
              <span className="results__badge">6 / 6 phases</span>
            </div>

            {/* Phase explainer cards — one per phase, shown before each panel */}
            <div className="explainers-grid">
              {PHASE_META.map((meta) => (
                <PhaseExplainer key={meta.id} meta={meta} />
              ))}
            </div>

            <PhaseVisualization phases={phases} />
          </section>
        )}
      </main>
    </div>
  );
};

/* ── App root ──────────────────────────────────────────────────────────────── */
const App = () => (
  <ThemeProvider>
    <Router>
      <Routes>
        <Route path="/" element={<CompilerVisualizer />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
      </Routes>
      <Footer />
    </Router>
  </ThemeProvider>
);

export default App;
