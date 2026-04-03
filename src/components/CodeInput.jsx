import { useState, useRef } from "react";
import {
  FiPlay,
  FiCode,
  FiCopy,
  FiAlertCircle,
  FiBookOpen,
  FiChevronDown,
  FiChevronUp,
  FiX,
} from "react-icons/fi";

const examples = [
  {
    title: "Simple Assignment",
    code: "total := price + rate * 60",
    description: "Basic arithmetic with operator precedence",
  },
  {
    title: "Expression",
    code: "a = b + c - 10",
    description: "Multiple operations with variables",
  },
  {
    title: "Conditional",
    code: "if (x > 0) then y = x * 2 else y = 0",
    description: "If-else conditional logic",
  },
  {
    title: "Loop",
    code: "for i = 1 to 10 do sum = sum + i",
    description: "Simple for loop",
  },
  {
    title: "Complex Expression",
    code: "result = (a + b) * (c - d) / 2",
    description: "Nested expressions",
  },
  {
    title: "Function Call",
    code: "value = calculate(total * factor)",
    description: "Function with parameters",
  },
];

function validateCode(code) {
  if (!code.trim())
    return { isValid: false, message: "Code cannot be empty", level: "warning" };
  if (code.length > 1000)
    return { isValid: false, message: "Code is too long (max 1000 chars)", level: "error" };

  const bad = [
    { re: /<script>/i,            msg: "Script tags are not allowed" },
    { re: /javascript:/i,         msg: "JavaScript protocol is not allowed" },
    { re: /onerror|onload|onclick=/i, msg: "HTML event handlers are not allowed" },
  ];
  for (const { re, msg } of bad)
    if (re.test(code)) return { isValid: false, message: msg, level: "error" };

  // bracket matching
  const stack = [];
  const pairs = { "(": ")", "[": "]", "{": "}" };
  const quotes = [];
  for (let i = 0; i < code.length; i++) {
    const c = code[i];
    if (c === '"' || c === "'") {
      if (!quotes.length) quotes.push(c);
      else if (quotes[quotes.length - 1] === c) quotes.pop();
      else quotes.push(c);
      continue;
    }
    if (quotes.length) continue;
    if (pairs[c]) { stack.push({ c, pos: i }); continue; }
    if (Object.values(pairs).includes(c)) {
      if (!stack.length)
        return { isValid: false, message: `Unexpected '${c}' at position ${i + 1}`, level: "warning" };
      const top = stack.pop();
      if (pairs[top.c] !== c)
        return { isValid: false, message: `Mismatched '${top.c}' and '${c}'`, level: "warning" };
    }
  }
  if (stack.length)
    return { isValid: false, message: `Unclosed '${stack[stack.length - 1].c}'`, level: "warning" };
  if (quotes.length)
    return { isValid: false, message: "Unclosed string literal", level: "warning" };

  return { isValid: true, level: "success" };
}

const CodeInput = ({ code, onChange, onAnalyze, loading }) => {
  const [localCode, setLocalCode] = useState(code);
  const [showExamples, setShowExamples] = useState(false);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef(null);

  const handleChange = (e) => {
    setLocalCode(e.target.value);
    onChange(e.target.value);
  };

  const handleAnalyze = () => {
    if (localCode.trim()) onAnalyze();
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(localCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearCode = () => {
    setLocalCode("");
    onChange("");
    textareaRef.current?.focus();
  };

  const insertExample = (exampleCode) => {
    setLocalCode(exampleCode);
    onChange(exampleCode);
    setShowExamples(false);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const validation = validateCode(localCode);
  const hasIssue = !validation.isValid && localCode.trim();

  /* textarea border class */
  const textareaClass = [
    "ci-textarea",
    hasIssue
      ? validation.level === "error"
        ? "ci-textarea--error"
        : "ci-textarea--warn"
      : "",
  ]
    .filter(Boolean)
    .join(" ");

  return (
    <div className="ci-card">
      {/* ── Header row ── */}
      <div className="ci-header">
        <div className="ci-title-row">
          <div className="ci-icon">
            <FiCode className="w-4 h-4 text-white" />
          </div>
          <div>
            <div className="ci-title">Source Code Input</div>
            <div className="ci-sub">
              Enter an expression to trace through all 6 compiler phases
            </div>
          </div>
        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading || !localCode.trim()}
          className="ci-btn"
        >
          {loading ? (
            <>
              <span className="spinner" style={{ width: 14, height: 14 }} />
              Analysing…
            </>
          ) : (
            <>
              <FiPlay className="w-3.5 h-3.5" />
              Analyse Code
            </>
          )}
        </button>
      </div>

      {/* ── Textarea ── */}
      <div className="ci-editor-wrap">
        <textarea
          ref={textareaRef}
          value={localCode}
          onChange={handleChange}
          className={textareaClass}
          placeholder="e.g.  total := price + rate * 60"
          spellCheck="false"
          rows={5}
        />

        {/* Floating copy / clear buttons */}
        {localCode && (
          <div className="ci-actions">
            <button
              className="ci-action-btn"
              onClick={copyToClipboard}
              title="Copy"
            >
              <FiCopy className="w-3.5 h-3.5" />
            </button>
            <button
              className="ci-action-btn"
              onClick={clearCode}
              title="Clear"
            >
              <FiX className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Character count */}
        <div className="ci-char-count">{localCode.length} chars</div>
      </div>

      {/* ── Validation feedback ── */}
      {hasIssue && (
        <div
          className={`ci-validation ci-validation--${
            validation.level === "error" ? "error" : "warn"
          }`}
        >
          <FiAlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <strong>
              {validation.level === "error" ? "Security issue" : "Syntax issue"}
            </strong>{" "}
            — {validation.message}
          </div>
        </div>
      )}

      {/* ── Examples ── */}
      <div className="ci-divider">
        <button
          className="ci-examples-toggle"
          onClick={() => setShowExamples((v) => !v)}
        >
          <span className="ci-examples-toggle__icon">
            <FiBookOpen className="w-3.5 h-3.5" />
          </span>
          <span>Code Examples</span>
          <span style={{ fontSize: 11, color: "var(--text3)", marginLeft: 4 }}>
            — try these common patterns
          </span>
          {showExamples ? (
            <FiChevronUp className="ci-examples-toggle__chevron w-4 h-4" />
          ) : (
            <FiChevronDown className="ci-examples-toggle__chevron w-4 h-4" />
          )}
        </button>

        {showExamples && (
          <div className="ci-examples-grid">
            {examples.map((ex) => (
              <button
                key={ex.title}
                className="ci-example-btn"
                onClick={() => insertExample(ex.code)}
              >
                <div className="ci-example-btn__title">{ex.title}</div>
                <code className="ci-example-btn__code">{ex.code}</code>
                <div className="ci-example-btn__desc">{ex.description}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* ── Empty-state hint ── */}
      {!localCode.trim() && (
        <div className="ci-empty-hint">
          <FiAlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
          <div>
            <strong>Ready to analyse</strong> — type an expression above or
            pick an example, then click <em>Analyse Code</em>.
          </div>
        </div>
      )}

      {/* ── Copied toast ── */}
      {copied && <div className="ci-toast">✓ Copied to clipboard!</div>}
    </div>
  );
};

export default CodeInput;
