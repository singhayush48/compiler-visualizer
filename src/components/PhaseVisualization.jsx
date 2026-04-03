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
  FiLayers,
} from "react-icons/fi";

/* ── colour config per phase ──────────────────────────────────────── */
const PHASE_COLORS = {
  blue:   { num: "ps-dot--blue",   icon: "var(--blue)"   },
  purple: { num: "ps-dot--purple", icon: "var(--purple)" },
  green:  { num: "ps-dot--green",  icon: "var(--green)"  },
  amber:  { num: "ps-dot--amber",  icon: "var(--amber)"  },
  orange: { num: "ps-dot--orange", icon: "var(--orange)" },
  red:    { num: "ps-dot--red",    icon: "var(--red)"    },
};

const PhasePanel = ({ number, colorKey, title, icon: Icon, children }) => {
  const col = PHASE_COLORS[colorKey] || PHASE_COLORS.blue;
  return (
    <div className={`pv-panel pv-panel--${colorKey}`}>
      <div className="pv-header">
        <div className={`pv-num ${col.num}`}>{number}</div>
        <span className="pv-title">{title}</span>
        {Icon && <Icon className="pv-icon w-4 h-4" style={{ color: col.icon }} />}
      </div>
      {children}
    </div>
  );
};

/* ── fix missing assembly code from optimized TAC ─────────────────── */
function ensureAssembly(phases) {
  if (
    phases.assemblyCode &&
    Array.isArray(phases.assemblyCode) &&
    phases.assemblyCode.length > 0
  )
    return phases;

  const asm = [];
  const OPS = { "+": "ADD", "-": "SUB", "*": "MUL", "/": "DIV" };

  (phases.optimizedCode || []).forEach((line) => {
    if (!line.includes("=")) return;
    const [lhs, rhs] = line.split("=").map((s) => s.trim());
    const match = rhs.match(/^(.+?)\s*([\+\-\*\/])\s*(.+)$/);
    if (match) {
      const [, l, op, r] = match;
      asm.push(`LOAD R1, ${l.trim()}`);
      asm.push(`${(OPS[op] || "ADD").padEnd(4)} R1, ${r.trim()}`);
      asm.push(`STORE ${lhs}, R1`);
    } else {
      asm.push(`LOAD R1, ${rhs}`);
      asm.push(`STORE ${lhs}, R1`);
    }
  });

  return { ...phases, assemblyCode: asm };
}

export default function PhaseVisualization({ phases }) {
  if (!phases) {
    return (
      <div className="banner banner--info" style={{ marginTop: 16 }}>
        <FiInfo className="w-4 h-4 flex-shrink-0" />
        <span>Enter code and click "Analyse" to see the compiler phases.</span>
      </div>
    );
  }

  const p = ensureAssembly(phases);

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 16, marginTop: 4 }}>

      {/* ── Phase 1: Lexical Analysis ── */}
      <PhasePanel number="1" colorKey="blue" title="Lexical Analysis" icon={FiCode}>
        <TokenTable tokens={p.tokens} />
      </PhasePanel>

      {/* ── Phase 2: Syntax Analysis ── */}
      <PhasePanel number="2" colorKey="purple" title="Syntax Analysis" icon={FiLayers}>
        <ASTVisualization astTree={p.treeData} astString={p.ast} />
      </PhasePanel>

      {/* ── Phase 3: Semantic Analysis ── */}
      <PhasePanel number="3" colorKey="green" title="Semantic Analysis" icon={FiDatabase}>
        {/* Type-check result */}
        <div className="pv-check-box">
          <FiCheckCircle className="w-4 h-4 flex-shrink-0" />
          <span>
            {p.semanticAnalysis?.typeChecking === "success"
              ? "All expressions are well-typed. No type errors detected."
              : p.semanticAnalysis?.typeChecking ||
                "Type checking passed — no errors detected."}
          </span>
        </div>

        {/* Symbol table */}
        <div className="pv-section-label">
          <FiDatabase className="w-3.5 h-3.5" style={{ color: "var(--accent)" }} />
          Symbol Table
        </div>

        <div className="pv-table-wrap" style={{ overflowX: "auto" }}>
          <table className="pv-table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Type</th>
                <th>Scope</th>
              </tr>
            </thead>
            <tbody>
              {p.semanticAnalysis?.symbolTable?.length ? (
                p.semanticAnalysis.symbolTable.map((sym, i) => (
                  <tr key={i}>
                    <td style={{ fontWeight: 600, color: "var(--accent2)" }}>
                      {sym.name}
                    </td>
                    <td>
                      <span
                        style={{
                          display: "inline-block",
                          padding: "1px 8px",
                          borderRadius: 6,
                          fontSize: 11,
                          fontWeight: 700,
                          background: "var(--purple-bg)",
                          color: "var(--purple)",
                          border: "1px solid var(--purple-bdr)",
                          textTransform: "uppercase",
                          letterSpacing: ".04em",
                        }}
                      >
                        {sym.type}
                      </span>
                    </td>
                    <td style={{ color: "var(--text2)", fontSize: 12 }}>
                      {sym.scope}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td
                    colSpan={3}
                    style={{
                      textAlign: "center",
                      color: "var(--text3)",
                      padding: "16px",
                    }}
                  >
                    No symbol table data available
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        <div className="pv-info-box" style={{ marginTop: 12 }}>
          <FiInfo
            className="w-3.5 h-3.5 flex-shrink-0"
            style={{ marginTop: 1, color: "var(--text3)" }}
          />
          <span>
            The symbol table maps each identifier to its inferred type and scope.
            Variables appearing on the left-hand side of an assignment are
            classified as <em>variable</em>; all others as <em>operand</em>.
          </span>
        </div>
      </PhasePanel>

      {/* ── Phase 4: Intermediate Code ── */}
      <PhasePanel
        number="4"
        colorKey="amber"
        title="Intermediate Code Generation"
        icon={FiCode}
      >
        <TACDisplay code={p.intermediateCode} />
      </PhasePanel>

      {/* ── Phase 5: Code Optimisation ── */}
      <PhasePanel number="5" colorKey="orange" title="Code Optimisation" icon={FiZap}>
        <CodeOptimizer
          intermediateCode={p.intermediateCode}
          optimizedCode={p.optimizedCode}
        />
      </PhasePanel>

      {/* ── Phase 6: Code Generation ── */}
      <PhasePanel number="6" colorKey="red" title="Code Generation" icon={FiCpu}>
        <AssemblyCode
          optimizedCode={p.optimizedCode}
          assemblyCode={p.assemblyCode}
        />
      </PhasePanel>
    </div>
  );
}
