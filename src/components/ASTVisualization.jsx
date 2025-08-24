import { useState, useRef, useEffect } from "react";
import {
  FiAlertTriangle,
  FiCopy,
  FiMaximize,
  FiMinimize,
  FiZoomIn,
  FiZoomOut,
  FiCode,
  FiBookOpen,
} from "react-icons/fi";
import Tree from "react-d3-tree";

const ASTVisualization = ({ astString, astTree }) => {
  const [treeData, setTreeData] = useState(null);
  const [isExpanded, setIsExpanded] = useState(false);
  const [copied, setCopied] = useState(false);
  const [viewMode, setViewMode] = useState("visual");
  const [showLabels, setShowLabels] = useState(true);
  const [dimensions, setDimensions] = useState({ width: 800, height: 400 });
  const [zoom, setZoom] = useState(1);
  const treeContainerRef = useRef(null);

  //  Resize observer
  useEffect(() => {
    if (!treeContainerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      const { width } = entries[0].contentRect;
      setDimensions({ width, height: isExpanded ? 500 : 300 });
    });
    resizeObserver.observe(treeContainerRef.current);
    return () => resizeObserver.disconnect();
  }, [isExpanded]);

  //  Process tree data
  useEffect(() => {
    if (astTree) {
      setTreeData(astTree);
    } else if (astString) {
      const defaultTree = createDefaultTree(astString);
      setTreeData(defaultTree);
    }
  }, [astTree, astString]);

  const createDefaultTree = (code) => {
    const isAssignment = code.includes(":=") || code.includes("=");
    const hasAddition = code.includes("+");
    const hasMultiplication = code.includes("*");

    const assignOp = code.includes(":=") ? ":=" : "=";

    if (isAssignment && hasAddition && hasMultiplication) {
      const parts = code.split(assignOp);
      const leftSide = parts[0].trim();
      const rightSide = parts[1]?.trim() || "";

      const termBeforePlus = rightSide.split("+")[0].trim();
      const termAfterPlus = rightSide.split("+")[1].trim();
      const factorBeforeMul = termAfterPlus.split("*")[0].trim();
      const factorAfterMul = termAfterPlus.split("*")[1].trim();

      return {
        name: assignOp,
        attributes: { type: "operator", label: "Assignment" },
        children: [
          {
            name: leftSide,
            attributes: { type: "identifier", label: "Variable" },
          },
          {
            name: "+",
            attributes: { type: "operator", label: "Addition" },
            children: [
              {
                name: termBeforePlus,
                attributes: { type: "identifier", label: "Variable" },
              },
              {
                name: "*",
                attributes: { type: "operator", label: "Multiplication" },
                children: [
                  {
                    name: factorBeforeMul,
                    attributes: { type: "identifier", label: "Variable" },
                  },
                  {
                    name: factorAfterMul,
                    attributes: { type: "literal", label: "Number" },
                  },
                ],
              },
            ],
          },
        ],
      };
    }

    return {
      name: "=",
      attributes: { type: "operator", label: "Assignment" },
      children: [
        { name: "a", attributes: { type: "identifier", label: "Variable" } },
        {
          name: "+",
          attributes: { type: "operator", label: "Addition" },
          children: [
            {
              name: "b",
              attributes: { type: "identifier", label: "Variable" },
            },
            {
              name: "c",
              attributes: { type: "identifier", label: "Variable" },
            },
          ],
        },
      ],
    };
  };

  const copyToClipboard = () => {
    if (astString) {
      navigator.clipboard.writeText(astString);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleZoomIn = () => setZoom((prev) => Math.min(prev + 0.2, 3));
  const handleZoomOut = () => setZoom((prev) => Math.max(prev - 0.2, 0.5));

  const renderCustomNode = ({ nodeDatum }) => {
    const nodeType = nodeDatum.attributes?.type || "default";
    const nodeLabel = nodeDatum.attributes?.label || "";

    const colorMap = {
      operator: ["#2563eb", "#dbeafe", "#ffffff"],
      literal: ["#16a34a", "#dcfce7", "#ffffff"],
      identifier: ["#9333ea", "#f3e8ff", "#ffffff"],
      function: ["#ca8a04", "#fef9c3", "#ffffff"],
      default: ["#475569", "#f8fafc", "#ffffff"],
    };

    const [primaryColor, lightColor, textColor] =
      colorMap[nodeType] || colorMap.default;

    return (
      <g>
        <rect
          x="-70"
          y="-30"
          width="140"
          height="60"
          rx="12"
          fill={lightColor}
          stroke={primaryColor}
          strokeWidth="3"
          style={{ filter: "drop-shadow(0 4px 3px rgba(0, 0, 0, 0.07))" }}
        />

        <text
          x="0"
          y="3"
          textAnchor="middle"
          fill={primaryColor}
          style={{
            fontSize: "24px",
            fontFamily: "'Segoe UI', Roboto, sans-serif",
            fontWeight: "400",
            dominantBaseline: "middle",
          }}
        >
          {nodeDatum.name}
        </text>

        {showLabels && nodeLabel && (
          <>
            <rect
              x="-70"
              y="-65"
              width="140"
              height="30"
              rx="15"
              fill={primaryColor}
              opacity="0.9"
              style={{ filter: "drop-shadow(0 2px 2px rgba(0, 0, 0, 0.1))" }}
            />
            <text
              x="0"
              y="-50"
              textAnchor="middle"
              fill={textColor}
              style={{
                fontSize: "13px",
                fontFamily: "'Segoe UI', Roboto, sans-serif",
                fontWeight: "300",
                dominantBaseline: "middle",
                textTransform: "uppercase",
                letterSpacing: "0.09em",
              }}
            >
              {nodeLabel}
            </text>
          </>
        )}
      </g>
    );
  };

  const renderTextAST = () => {
    let code = "";
    let expressionType = "assignment";

    // Extract code from AST string
    if (astString) {
      if (astString.includes("Expression:")) {
        const match = astString.match(/Expression:\s*(.+?)(?:\n|$)/);
        if (match) {
          code = match[1].trim();
        }
      } else if (astString.includes("for")) {
        const forMatch = astString.match(
          /(?:^|\n)(?:for:?\s*)?(.+?\bdo\b.+?)(?:\n|$)/i
        );
        if (forMatch) {
          code = forMatch[1].trim();
          expressionType = "loop";
        }
      } else if (astString.includes(":=") || astString.includes("=")) {
        const match = astString.match(/([a-zA-Z0-9_]+)\s*(:=|=)\s*[^┌│├└─\n]+/);
        if (match) {
          code = match[0].trim();
        }
      } else {
        code = astString.trim();
      }
    }

    // If no code was extracted, use a default
    if (!code) {
      code = "a = b + c";
    }

    // Handle loops
    if (code.includes("for") && code.includes("do")) {
      return renderLoopAST(code);
    }

    // Handle assignments
    let assignOperator = "";
    if (code.includes(":=")) {
      assignOperator = ":=";
    } else if (code.includes("=")) {
      assignOperator = "=";
    }

    const leftSide = assignOperator
      ? code.split(assignOperator)[0]?.trim()
      : "";
    let rightSide = "";
    if (assignOperator && code.split(assignOperator).length > 1) {
      rightSide = code.split(assignOperator)[1]?.trim() || "";
    }

    const hasAssignment = code.includes(assignOperator);
    const hasMul = rightSide.includes("*");
    const hasAdd = rightSide.includes("+");
    const hasSub = rightSide.includes("-") && !rightSide.startsWith("-");

    return (
      <div className="h-full overflow-auto p-4 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              Abstract Syntax Tree Analysis
            </h3>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-600 mb-1">
                Expression:
              </h4>
              <p className="bg-blue-50 p-3 rounded border border-blue-200 font-mono text-sm">
                {code}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">
                  Tree Structure:
                </h4>

                <div className="pl-4 space-y-2">
                  {hasAssignment ? (
                    <>
                      <div className="flex items-center gap-2">
                        <span className="text-blue-600 font-bold">
                          {assignOperator}
                        </span>
                        <span className="text-gray-600">(Assignment)</span>
                      </div>

                      <div className="pl-4 space-y-2">
                        <div className="flex items-center gap-2">
                          <span className="text-gray-500">├─</span>
                          <span className="text-purple-600 font-semibold">
                            {leftSide}
                          </span>
                          <span className="text-gray-500 text-sm">
                            (Variable)
                          </span>
                        </div>

                        {renderExpressionTree(rightSide)}
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-600">
                      {code.includes("if")
                        ? "Conditional expression"
                        : code.includes("for") || code.includes("while")
                        ? "Loop expression"
                        : "Simple expression (no assignment operator)"}
                    </div>
                  )}
                </div>
              </div>

              {hasAssignment && (hasMul || hasAdd || hasSub) && (
                <div className="mt-6 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                  <h4 className="text-sm font-semibold text-yellow-800 mb-1">
                    Evaluation Order:
                  </h4>
                  <ul className="ml-3 list-disc mt-2 text-yellow-700 space-y-1 text-xs">
                    {hasMul && (
                      <li>
                        Multiplication (*) has higher precedence than
                        Addition/Subtraction
                      </li>
                    )}
                    <li>Expression evaluates as: {code}</li>
                    {hasMul && (
                      <li>First: multiplication operations are calculated</li>
                    )}
                    {(hasAdd || hasSub) && (
                      <li>
                        Then: addition/subtraction operations are calculated
                      </li>
                    )}
                    <li>Finally: result is assigned to {leftSide}</li>
                  </ul>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderLoopAST = (code) => {
    const hasFor = code.toLowerCase().includes("for");
    const hasWhile = code.toLowerCase().includes("while");
    const hasDo = code.toLowerCase().includes("do");

    let loopType = hasFor ? "For Loop" : hasWhile ? "While Loop" : "Loop";
    let condition = "";
    let body = "";

    if (hasFor && hasDo) {
      const parts = code.split(/\bdo\b/i);
      const forPart = parts[0].replace(/\bfor\b/i, "").trim();
      body = parts[1]?.trim() || "";
      condition = forPart;
    }

    return (
      <div className="h-full overflow-auto p-4 bg-gray-50">
        <div className="max-w-2xl mx-auto">
          <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-700 mb-4">
              Abstract Syntax Tree Analysis
            </h3>

            <div className="mb-4">
              <h4 className="text-sm font-medium text-gray-600 mb-1">
                Expression:
              </h4>
              <p className="bg-blue-50 p-3 rounded border border-blue-200 font-mono text-sm">
                {code}
              </p>
            </div>

            <div className="space-y-4">
              <div>
                <h4 className="font-semibold text-gray-700 mb-2">
                  Tree Structure:
                </h4>

                <div className="pl-4 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-orange-600 font-bold">
                      {loopType}
                    </span>
                  </div>

                  <div className="pl-4 space-y-2">
                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">├─</span>
                      <span className="text-blue-600 font-semibold">
                        Condition
                      </span>
                      <span className="text-gray-500 text-sm">
                        ({condition})
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-gray-500">└─</span>
                      <span className="text-green-600 font-semibold">Body</span>
                    </div>

                    {body && (
                      <div className="pl-8">
                        {renderExpressionTree(body, true)}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="mt-6 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
                <h4 className="text-sm font-semibold text-yellow-800 mb-1">
                  Execution Flow:
                </h4>
                <ul className="ml-3 list-disc mt-2 text-yellow-700 space-y-1 text-xs">
                  <li>First: evaluate loop condition</li>
                  <li>While condition is true: execute loop body</li>
                  {hasFor && <li>After each iteration: update loop counter</li>}
                  <li>Exit loop when condition becomes false</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderExpressionTree = (expr, isRoot = false) => {
    if (!expr) return null;

    const hasMul = expr.includes("*");
    const hasAdd = expr.includes("+");
    const hasSub = expr.includes("-") && !expr.startsWith("-");
    const hasAssign = expr.includes("=");

    // Handle assignment in loop body
    if (hasAssign) {
      const assignOp = expr.includes(":=") ? ":=" : "=";
      const parts = expr.split(assignOp);
      const leftSide = parts[0].trim();
      const rightSide = parts[1]?.trim() || "";

      return (
        <div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">{isRoot ? "" : "└─"}</span>
            <span className="text-blue-600 font-bold">{assignOp}</span>
            <span className="text-gray-600">(Assignment)</span>
          </div>

          <div className="pl-8 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">├─</span>
              <span className="text-purple-600 font-semibold">{leftSide}</span>
              <span className="text-gray-500 text-sm">(Variable)</span>
            </div>

            {renderExpressionTree(rightSide)}
          </div>
        </div>
      );
    }

    // For expressions with multiplication
    if (hasMul) {
      const mulParts = expr.split("*").map((p) => p.trim());

      return (
        <div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">{isRoot ? "" : "└─"}</span>
            <span className="text-green-600 font-bold">*</span>
            <span className="text-gray-600">(Multiplication)</span>
          </div>

          <div className="pl-8 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">├─</span>
              <span className="text-purple-600 font-semibold">
                {mulParts[0]}
              </span>
              <span className="text-gray-500 text-sm">
                {/^\d+$/.test(mulParts[0]) ? "(Number)" : "(Variable)"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">└─</span>
              <span className="text-purple-600 font-semibold">
                {mulParts[1]}
              </span>
              <span className="text-gray-500 text-sm">
                {/^\d+$/.test(mulParts[1]) ? "(Number)" : "(Variable)"}
              </span>
            </div>
          </div>
        </div>
      );
    }

    // For expressions with addition
    if (hasAdd) {
      const addParts = expr.split("+").map((p) => p.trim());

      return (
        <div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">{isRoot ? "" : "└─"}</span>
            <span className="text-blue-600 font-bold">+</span>
            <span className="text-gray-600">(Addition)</span>
          </div>

          <div className="pl-8 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">├─</span>
              <span className="text-purple-600 font-semibold">
                {addParts[0]}
              </span>
              <span className="text-gray-500 text-sm">
                {/^\d+$/.test(addParts[0]) ? "(Number)" : "(Variable)"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">└─</span>
              <span className="text-purple-600 font-semibold">
                {addParts[1]}
              </span>
              <span className="text-gray-500 text-sm">
                {/^\d+$/.test(addParts[1]) ? "(Number)" : "(Variable)"}
              </span>
            </div>
          </div>
        </div>
      );
    }

    // For expressions with subtraction
    if (hasSub) {
      const subParts = expr.split("-").map((p) => p.trim());

      return (
        <div>
          <div className="flex items-center gap-2">
            <span className="text-gray-500">{isRoot ? "" : "└─"}</span>
            <span className="text-red-600 font-bold">-</span>
            <span className="text-gray-600">(Subtraction)</span>
          </div>

          <div className="pl-8 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-gray-500">├─</span>
              <span className="text-purple-600 font-semibold">
                {subParts[0]}
              </span>
              <span className="text-gray-500 text-sm">
                {/^\d+$/.test(subParts[0]) ? "(Number)" : "(Variable)"}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-gray-500">└─</span>
              <span className="text-purple-600 font-semibold">
                {subParts[1]}
              </span>
              <span className="text-gray-500 text-sm">
                {/^\d+$/.test(subParts[1]) ? "(Number)" : "(Variable)"}
              </span>
            </div>
          </div>
        </div>
      );
    }

    // For simple expressions (just a variable or value)
    return (
      <div className="flex items-center gap-2">
        <span className="text-gray-500">{isRoot ? "" : "└─"}</span>
        <span className="text-purple-600 font-semibold">{expr}</span>
        <span className="text-gray-500 text-sm">
          {/^\d+$/.test(expr) ? "(Number)" : "(Variable)"}
        </span>
      </div>
    );
  };

  return (
    <div className="relative">
      <div className="flex flex-wrap gap-2 mb-4 justify-between items-center">
        <div className="flex gap-2">
          <button
            onClick={() => setViewMode("text")}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              viewMode === "text"
                ? "bg-blue-100 text-blue-800 border border-blue-300"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <FiCode className="inline mr-1" /> Text View
          </button>
          <button
            onClick={() => setViewMode("visual")}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              viewMode === "visual"
                ? "bg-blue-100 text-blue-800 border border-blue-300"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            <FiBookOpen className="inline mr-1" /> Visual Tree
          </button>
          <button
            onClick={() => setShowLabels(!showLabels)}
            className={`px-3 py-1 text-xs rounded transition-colors ${
              showLabels
                ? "bg-green-100 text-green-800 border border-green-300"
                : "bg-slate-100 text-slate-700 hover:bg-slate-200"
            }`}
          >
            {showLabels ? "Hide Labels" : "Show Labels"}
          </button>
        </div>
        <div className="flex gap-2">
          {viewMode === "visual" && (
            <>
              <button
                onClick={handleZoomIn}
                className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded"
              >
                <FiZoomIn className="w-3 h-3" />
              </button>
              <button
                onClick={handleZoomOut}
                className="px-2 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded"
              >
                <FiZoomOut className="w-3 h-3" />
              </button>
            </>
          )}
          <button
            onClick={copyToClipboard}
            className="px-3 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded"
          >
            <FiCopy className="w-3 h-3 inline mr-1" /> Copy
          </button>
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="px-3 py-1 text-xs bg-slate-100 hover:bg-slate-200 rounded"
          >
            {isExpanded ? (
              <FiMinimize className="w-3 h-3 inline mr-1" />
            ) : (
              <FiMaximize className="w-3 h-3 inline mr-1" />
            )}
            {isExpanded ? "Collapse" : "Expand"}
          </button>
        </div>
      </div>

      <div
        ref={treeContainerRef}
        className={`bg-white rounded-lg border border-slate-200 overflow-hidden ${
          isExpanded ? "h-[500px]" : "h-[300px]"
        }`}
      >
        {viewMode === "text" ? (
          renderTextAST()
        ) : treeData ? (
          <Tree
            data={treeData}
            orientation="vertical"
            renderCustomNodeElement={renderCustomNode}
            translate={{ x: dimensions.width / 2, y: 80 }}
            zoom={zoom}
            pathFunc="step"
            separation={{ siblings: 2.5, nonSiblings: 3 }}
            zoomable
            draggable
            collapsible
            initialDepth={5}
            nodeSize={{ x: 180, y: 120 }}
          />
        ) : (
          <div className="text-center text-slate-500 py-8">
            <FiAlertTriangle className="w-8 h-8 mx-auto mb-2 text-slate-400" />
            <p>Could not parse AST for visual representation</p>
            <p className="text-sm mt-2">Switching to text view...</p>
            {astString && renderTextAST()}
          </div>
        )}
      </div>

      {copied && (
        <div className="fixed bottom-4 right-4 bg-green-500 text-white px-3 py-2 rounded-lg shadow-lg animate-fadeInOut text-sm z-50">
          ✓ AST copied to clipboard!
        </div>
      )}
    </div>
  );
};

export default ASTVisualization;
