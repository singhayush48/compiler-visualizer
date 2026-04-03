import { FiCode, FiZap, FiInfo } from "react-icons/fi";

const CodeOptimizer = ({ intermediateCode, optimizedCode }) => {
  if (!optimizedCode || optimizedCode.length === 0) {
    return <div className="text-[var(--text2)]">No optimized code available</div>;
  }

  const getOptimizationType = (before, after) => {
    if (before.length > after.length) {
      return "Redundant Code Elimination";
    } else if (
      before.some((line) => line.includes("t2")) &&
      !after.some((line) => line.includes("t2"))
    ) {
      return "Temporary Variable Elimination";
    } else if (
      before.length === after.length &&
      JSON.stringify(before) !== JSON.stringify(after)
    ) {
      return "Algebraic Simplification";
    } else {
      return "No Optimization Applied";
    }
  };

  const optimizationType = getOptimizationType(
    intermediateCode || [],
    optimizedCode
  );

  const getOptimizationDetails = () => {
    if (intermediateCode && intermediateCode.length > optimizedCode.length) {
      const removedLines = intermediateCode.filter(
        (line) => !optimizedCode.includes(line)
      );
      return `Eliminated ${
        removedLines.length
      } instruction(s): ${removedLines.join(", ")}`;
    }

    if (intermediateCode && intermediateCode.length === optimizedCode.length) {
      const changes = intermediateCode
        .map((line, i) => {
          if (line !== optimizedCode[i]) {
            return `"${line}" → "${optimizedCode[i]}"`;
          }
          return null;
        })
        .filter(Boolean);

      if (changes.length > 0) {
        return `Simplified expressions: ${changes.join(", ")}`;
      }
    }

    if (
      intermediateCode &&
      intermediateCode.some((line) => line.includes("t2")) &&
      !optimizedCode.some((line) => line.includes("t2"))
    ) {
      return "Combined operations to reduce temporary variables";
    }

    return "Applied standard compiler optimizations";
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center text-sm text-[var(--text2)]">
          <FiZap className="mr-2 text-[var(--accent)]" />
          Optimized Three-Address Code:
        </div>
        <div className="hidden md:flex px-4 py-1.5 bg-[var(--surface2)] text-[var(--text)] text-xs rounded-full font-semibold border border-[var(--border)]">
          {optimizationType}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-4">
        <div className="bg-transparent p-4 rounded-lg border border-[var(--border)] font-mono">
          <div className="text-xs text-[var(--text2)] mb-2">Before Optimization:</div>
          <div className="space-y-1 opacity-90">
            {intermediateCode &&
              intermediateCode.map((line, index) => (
                <div key={index} className="flex">
                  <span className="text-[var(--text3)] w-7 flex-shrink-0 text-right mr-3">
                    {index + 1}
                  </span>
                  <code className="text-[var(--text)]">{line}</code>
                </div>
              ))}
          </div>
        </div>

        <div className="bg-transparent p-3 rounded-lg border border-[var(--border)] font-mono">
          <div className="text-xs text-[var(--text2)] mb-2">After Optimization:</div>
          <div className="space-y-1">
            {optimizedCode.map((line, index) => (
              <div key={index} className="flex">
                <span className="text-[var(--accent2)] w-7 flex-shrink-0 text-right mr-3">
                  {index + 1}
                </span>
                <code className="text-[var(--accent)] font-medium">{line}</code>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="mt-5 flex items-start space-x-3 bg-[var(--surface2)] p-4 rounded border border-[var(--border)] text-sm">
        <FiInfo className="text-[var(--accent)] mt-0.5 flex-shrink-0" />
        <div>
          <p className="text-[var(--text)]">
            <span className="font-medium">Optimization Applied:</span>{" "}
            {getOptimizationDetails()}
          </p>
          <ul className="-ml-2 list-disc list-inside mt-2 text-amber-700 space-y-1 text-xs">
            <li>Reduced code size and improved execution efficiency</li>
            <li>Eliminated unnecessary temporary variables</li>
            <li>Combined multiple operations where possible</li>
            <li>
              This optimization preserves the semantic meaning of the code
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default CodeOptimizer;
