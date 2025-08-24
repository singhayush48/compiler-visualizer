import TokenTable from "./TokenTable";
import ASTVisualization from "./ASTVisualization";
import TACDisplay from "./TACDisplay";
import CodeOptimizer from "./CodeOptimizer";
import AssemblyCode from "./AssemblyCode";
import {
  FiCheckCircle,
  FiDatabase,
  FiInfo,
  FiCode,
  FiZap,
  FiCpu,
} from "react-icons/fi";

export default function PhaseVisualization({ phases }) {
  if (!phases) {
    return (
      <div className="mt-6 p-4 md:p-6 bg-blue-50 border border-blue-200 rounded-lg text-blue-800 flex items-center justify-center">
        <FiInfo className="mr-2 flex-shrink-0" />
        <p>Enter code and click "Analyze" to see the compiler phases.</p>
      </div>
    );
  }

  if (
    !phases.assemblyCode ||
    !Array.isArray(phases.assemblyCode) ||
    phases.assemblyCode.length === 0
  ) {
    const assemblyCode = [];

    if (phases.optimizedCode && phases.optimizedCode.length > 0) {
      phases.optimizedCode.forEach((line) => {
        if (line.includes("=")) {
          const parts = line.split("=").map((p) => p.trim());
          const leftSide = parts[0];
          const rightSide = parts[1];

          if (rightSide.includes("+")) {
            const addParts = rightSide.split("+").map((p) => p.trim());
            assemblyCode.push(`LOAD R1, ${addParts[0]}`);
            assemblyCode.push(`ADD R1, ${addParts[1]}`);
            assemblyCode.push(`STORE ${leftSide}, R1`);
          } else if (rightSide.includes("*")) {
            const mulParts = rightSide.split("*").map((p) => p.trim());
            assemblyCode.push(`LOAD R1, ${mulParts[0]}`);
            assemblyCode.push(`MUL R1, ${mulParts[1]}`);
            assemblyCode.push(`STORE ${leftSide}, R1`);
          } else if (rightSide.includes("-")) {
            const subParts = rightSide.split("-").map((p) => p.trim());
            assemblyCode.push(`LOAD R1, ${subParts[0]}`);
            assemblyCode.push(`SUB R1, ${subParts[1]}`);
            assemblyCode.push(`STORE ${leftSide}, R1`);
          } else {
            assemblyCode.push(`LOAD R1, ${rightSide}`);
            assemblyCode.push(`STORE ${leftSide}, R1`);
          }
        }
      });

      phases.assemblyCode = assemblyCode;
    }
  }

  const PhaseHeader = ({ number, title, icon: Icon, color }) => (
    <h2 className="text-xl font-semibold mb-4 flex items-center">
      <span
        className={`bg-${color}-100 text-${color}-800 w-7 h-7 rounded-full inline-flex items-center justify-center mr-2 text-sm font-bold`}
      >
        {number}
      </span>
      <span className="mr-2">{title}</span>
      {Icon && <Icon className={`text-${color}-500 ml-auto`} />}
    </h2>
  );

  return (
    <div className="mt-6 space-y-6">
      {/* Lexical Analysis */}
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-100">
        <PhaseHeader
          number="1"
          title="Lexical Analysis"
          icon={FiCode}
          color="gray"
        />
        <TokenTable tokens={phases.tokens} />
      </div>

      {/* Syntax Analysis */}
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-100">
        <PhaseHeader
          number="2"
          title="Syntax Analysis"
          icon={FiCode}
          color="blue"
        />
        <ASTVisualization astTree={phases.treeData} astString={phases.ast} />
      </div>

      {/* Semantic Analysis */}
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-100">
        <PhaseHeader
          number="3"
          title="Semantic Analysis"
          icon={FiDatabase}
          color="indigo"
        />

        <div className="mb-5">
          <h3 className="font-medium mb-2 text-gray-700 flex items-center">
            <FiCheckCircle className="h-5 w-5 mr-2 text-green-500" />
            Type Checking:
          </h3>
          <div className="md:ml-7 bg-green-50 p-3 rounded-md border border-green-200">
            <p className="text-sm text-green-800">
              {phases.semanticAnalysis?.typeChecking === "success" ? (
                <span className="font-medium">
                  All expressions are well-typed. No type errors detected.
                </span>
              ) : (
                phases.semanticAnalysis?.typeChecking ||
                "No type checking information available"
              )}
            </p>
          </div>
        </div>

        <div>
          <h3 className="font-medium mb-2 text-gray-700 flex items-center">
            <FiDatabase className="h-5 w-5 mr-2 text-blue-500" />
            Symbol Table:
          </h3>

          <div className="md:ml-7 overflow-auto">
            <table className="min-w-full divide-y divide-gray-200 border border-gray-200 rounded-lg overflow-hidden">
              <thead className="bg-blue-50">
                <tr>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider"
                  >
                    Name
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider"
                  >
                    Type
                  </th>
                  <th
                    scope="col"
                    className="px-4 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider"
                  >
                    Scope
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {phases.semanticAnalysis?.symbolTable?.map((symbol, index) => (
                  <tr
                    key={index}
                    className={index % 2 === 0 ? "bg-white" : "bg-gray-50"}
                  >
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">
                      {symbol.name}
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">
                      <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800">
                        {symbol.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-500">
                      {symbol.scope}
                    </td>
                  </tr>
                ))}
                {!phases.semanticAnalysis?.symbolTable?.length && (
                  <tr>
                    <td
                      colSpan="3"
                      className="px-4 py-3 text-sm text-gray-500 text-center"
                    >
                      No symbol table information available
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="mt-4 md:ml-7 bg-gray-50 p-3 rounded border border-gray-200 flex">
            <FiInfo className="h-4 w-4 text-gray-500 mr-2 flex-shrink-0 mt-0.5" />
            <p className="text-xs text-gray-500">
              <span className="font-medium">Note:</span> The symbol table stores
              information about variables, their types, and scopes. All
              variables in this analysis are inferred to be integers in global
              scope.
            </p>
          </div>
        </div>
      </div>

      {/* Intermediate Code */}
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-100">
        <PhaseHeader
          number="4"
          title="Intermediate Code Generation"
          icon={FiCode}
          color="purple"
        />
        <TACDisplay code={phases.intermediateCode} />
      </div>

      {/* Optimized Code */}
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-100">
        <PhaseHeader
          number="5"
          title="Code Optimization"
          icon={FiZap}
          color="amber"
        />
        <CodeOptimizer
          intermediateCode={phases.intermediateCode}
          optimizedCode={phases.optimizedCode}
        />
      </div>

      {/* Target Code */}
      <div className="bg-white p-4 md:p-6 rounded-lg shadow-sm border border-gray-100">
        <PhaseHeader
          number="6"
          title="Code Generation"
          icon={FiCpu}
          color="green"
        />
        <AssemblyCode
          optimizedCode={phases.optimizedCode}
          assemblyCode={phases.assemblyCode}
        />
      </div>
    </div>
  );
}
