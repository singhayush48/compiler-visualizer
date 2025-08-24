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

const CodeInput = ({ code, onChange, onAnalyze, loading }) => {
  const [localCode, setLocalCode] = useState(code);
  const [showExamples, setShowExamples] = useState(false);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef(null);

  const handleChange = (e) => {
    const newCode = e.target.value;
    setLocalCode(newCode);
    onChange(newCode);
  };

  const handleAnalyze = () => {
    if (!localCode.trim()) {
      return;
    }
    onAnalyze();
  };

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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(localCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const clearCode = () => {
    setLocalCode("");
    onChange("");
    if (textareaRef.current) {
      textareaRef.current.focus();
    }
  };

  const insertExample = (exampleCode) => {
    setLocalCode(exampleCode);
    onChange(exampleCode);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const validateCode = (code) => {
    if (!code.trim()) {
      return {
        isValid: false,
        message: "Code cannot be empty",
        level: "warning",
      };
    }

    if (code.length > 1000) {
      return {
        isValid: false,
        message: "Code is too long for analysis (max 1000 characters)",
        level: "error",
      };
    }

    const suspiciousPatterns = [
      { pattern: /<script>/i, message: "Script tags are not allowed" },
      {
        pattern: /javascript:/i,
        message: "JavaScript protocol is not allowed",
      },
      {
        pattern: /onerror|onload|onclick=/i,
        message: "HTML event handlers are not allowed",
      },
    ];

    for (const { pattern, message } of suspiciousPatterns) {
      if (pattern.test(code)) {
        return { isValid: false, message, level: "error" };
      }
    }

    const bracketStack = [];
    const brackets = { "(": ")", "[": "]", "{": "}" };
    const quoteStack = [];

    for (let i = 0; i < code.length; i++) {
      const char = code[i];

      if (char === '"' || char === "'") {
        if (quoteStack.length === 0) {
          quoteStack.push(char);
        } else if (quoteStack[quoteStack.length - 1] === char) {
          quoteStack.pop();
        } else {
          quoteStack.push(char);
        }
        continue;
      }

      if (quoteStack.length === 0) {
        if (brackets[char]) {
          bracketStack.push({ char, position: i });
        } else if (Object.values(brackets).includes(char)) {
          if (bracketStack.length === 0) {
            return {
              isValid: false,
              message: `Unexpected closing '${char}' at position ${i + 1}`,
              level: "warning",
            };
          }
          const last = bracketStack.pop();
          if (brackets[last.char] !== char) {
            return {
              isValid: false,
              message: `Mismatched brackets: '${last.char}' at position ${
                last.position + 1
              } and '${char}' at position ${i + 1}`,
              level: "warning",
            };
          }
        }
      }
    }

    if (bracketStack.length > 0) {
      const last = bracketStack.pop();
      return {
        isValid: false,
        message: `Unclosed '${last.char}' at position ${last.position + 1}`,
        level: "warning",
      };
    }

    if (quoteStack.length > 0) {
      return {
        isValid: false,
        message: "Unclosed string literal",
        level: "warning",
      };
    }

    const operatorPatterns = [
      { pattern: /(\+\+|--){3,}/, message: "Suspicious operator sequence" },
      { pattern: /\/\/.*\n.*\/*/s, message: "Potential comment syntax issues" },
    ];

    for (const { pattern, message } of operatorPatterns) {
      if (pattern.test(code)) {
        return { isValid: false, message, level: "warning" };
      }
    }

    return { isValid: true, message: "Code appears valid", level: "success" };
  };

  const validation = validateCode(localCode);
  const hasSyntaxIssues = !validation.isValid && localCode.trim();

  return (
    <div className="bg-white rounded-2xl p-4 md:p-6 shadow-lg border border-slate-200 mb-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-4">
        <div className="flex items-center">
          <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-2 rounded-xl mr-3">
            <FiCode className="w-4 h-4 md:w-5 md:h-5 text-white" />
          </div>
          <div>
            <h2 className="text-lg md:text-xl font-semibold text-slate-800">
              Code Input
            </h2>
            <p className="text-xs md:text-sm text-slate-600">
              Enter code to analyze compilation phases
            </p>
          </div>
        </div>
        <button
          onClick={handleAnalyze}
          disabled={loading || !localCode.trim()}
          className="flex items-center justify-center bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white font-medium py-2 md:py-2.5 px-4 md:px-5 rounded-xl disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg w-full md:w-auto cursor-pointer transform hover:scale-[1.02] active:scale-[0.98]"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-3 w-3 md:h-4 md:w-4 border-b-2 border-white mr-2"></div>
              <span className="text-sm md:text-base">Analyzing...</span>
            </>
          ) : (
            <>
              <FiPlay className="w-3 h-3 md:w-4 md:h-4 mr-1 md:mr-2" />
              <span className="text-sm md:text-base">Analyze Code</span>
            </>
          )}
        </button>
      </div>

      <div className="relative mb-4 group">
        <textarea
          ref={textareaRef}
          value={localCode}
          onChange={handleChange}
          className={`outline-none w-full h-40 md:h-48 p-3 md:p-4 font-mono text-sm rounded-xl transition-all resize-none border-2
            ${
              hasSyntaxIssues
                ? validation.level === "error"
                  ? "border-red-300 bg-red-50 focus:border-red-500 focus:ring-2 focus:ring-red-200"
                  : "border-amber-300 bg-amber-50 focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
                : "border-slate-300 bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
            }`}
          placeholder="Enter code to analyze (e.g., total := price + rate * 60)"
          spellCheck="false"
        />

        {/* Code Actions - Always visible on mobile, hover on desktop */}
        {localCode && (
          <div className="absolute top-2 right-2 md:top-3 md:right-3 flex gap-1 md:gap-2 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
            <button
              onClick={copyToClipboard}
              className="bg-white hover:bg-slate-100 text-slate-600 p-1.5 md:p-2 rounded-lg shadow-sm border border-slate-200 transition-colors cursor-pointer hover:text-blue-600"
              title="Copy code"
            >
              <FiCopy className="w-3 h-3 md:w-4 md:h-4" />
            </button>
            <button
              onClick={clearCode}
              className="bg-white hover:bg-rose-100 text-slate-600 p-1.5 md:p-2 rounded-lg shadow-sm border border-slate-200 transition-colors cursor-pointer hover:text-rose-600"
              title="Clear code"
            >
              <FiX className="w-3 h-3 md:w-4 md:h-4" />
            </button>
          </div>
        )}

        {/* Character Count */}
        <div className="absolute bottom-2 right-2 md:right-3 text-xs text-slate-500 bg-white/80 px-1.5 md:px-2 py-0.5 md:py-1 rounded">
          {localCode.length} chars
        </div>
      </div>

      {/* Validation Feedback */}
      {hasSyntaxIssues && (
        <div
          className={`flex items-start rounded-xl mb-4 p-3 md:p-4 border
          ${
            validation.level === "error"
              ? "bg-red-50 border-red-200 text-red-800"
              : "bg-amber-50 border-amber-200 text-amber-800"
          }`}
        >
          <FiAlertCircle className="w-4 h-4 md:w-5 md:h-5 mr-2 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="font-medium text-sm md:text-base">
              {validation.level === "error" ? "Security Issue" : "Syntax Issue"}{" "}
              Detected
            </p>
            <p className="text-xs md:text-sm">{validation.message}</p>
          </div>
        </div>
      )}

      {/* Copy Feedback */}
      {copied && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-3 py-2 rounded-lg shadow-lg animate-fadeInOut text-sm z-50">
          ✓ Copied to clipboard!
        </div>
      )}

      {/* Examples Section */}
      <div className="border-t border-slate-200 pt-4">
        <button
          onClick={() => setShowExamples(!showExamples)}
          className="flex items-center w-full text-left text-slate-700 hover:text-slate-900 mb-2 p-1 rounded-lg hover:bg-slate-50 transition-colors cursor-pointer group"
        >
          <div className="bg-slate-100 group-hover:bg-slate-200 p-1.5 md:p-2 rounded-lg mr-2 md:mr-3 transition-colors">
            <FiBookOpen className="w-3 h-3 md:w-4 md:h-4" />
          </div>
          <div className="flex-1">
            <h3 className="font-medium text-sm md:text-base">Code Examples</h3>
            <p className="text-xs md:text-sm text-slate-600">
              Try these common patterns
            </p>
          </div>
          {showExamples ? (
            <FiChevronUp className="w-4 h-4 md:w-5 md:h-5 text-slate-500 group-hover:text-slate-700" />
          ) : (
            <FiChevronDown className="w-4 h-4 md:w-5 md:h-5 text-slate-500 group-hover:text-slate-700" />
          )}
        </button>

        {showExamples && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 md:gap-3 mt-3">
            {examples.map((example, index) => (
              <button
                key={index}
                onClick={() => insertExample(example.code)}
                className="text-left p-2 md:p-3 bg-slate-50 hover:bg-blue-50 border border-slate-200 rounded-lg transition-all hover:border-blue-300 hover:shadow-sm group cursor-pointer"
                title={example.description}
              >
                <div className="font-medium text-slate-800 text-xs md:text-sm mb-1 line-clamp-1 group-hover:text-blue-700">
                  {example.title}
                </div>
                <div className="font-mono text-xs text-slate-600 bg-white/50 p-1.5 md:p-2 rounded border group-hover:bg-white transition-colors">
                  <code className="line-clamp-1">{example.code}</code>
                </div>
                <div className="text-xs text-slate-500 mt-1 line-clamp-2 group-hover:text-slate-600">
                  {example.description}
                </div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Empty State Guidance */}
      {!localCode.trim() && (
        <div className="bg-blue-50 border border-blue-200 text-blue-800 px-3 md:px-4 py-2 md:py-3 rounded-xl mt-4">
          <div className="flex items-start">
            <FiAlertCircle className="w-4 h-4 md:w-5 md:h-5 mr-2 flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-medium text-sm md:text-base">
                Ready to analyze
              </p>
              <p className="text-xs md:text-sm">
                Enter code above or select an example to begin
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CodeInput;
