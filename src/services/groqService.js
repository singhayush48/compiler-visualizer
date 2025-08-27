const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Tokenizer
function tokenize(expr) {
  const regex =
    /\s*([A-Za-z_][A-Za-z0-9_]*|\d+\.?\d*|'.'|"[^"]*"|\+\+|--|&&|\|\||<=|>=|==|!=|\+=|-=|\*=|\/=|%=|\?|:|,|\(|\)|\+|-|\*|\/|%|<|>|!|~|=)\s*/g;
  const tokens = [];
  let match;
  while ((match = regex.exec(expr)) !== null) {
    tokens.push(match[1]);
  }
  return tokens;
}

function createTreeFromCode(code) {
  try {
    // Handle ternary operator
    if (code.includes("?") && code.includes(":")) {
      const questionIndex = code.indexOf("?");
      const colonIndex = code.indexOf(":", questionIndex);
      const condition = code.substring(0, questionIndex).trim();
      const trueBranch = code.substring(questionIndex + 1, colonIndex).trim();
      const falseBranch = code.substring(colonIndex + 1).trim();

      return {
        name: "?:",
        attributes: { type: "operator", label: "Ternary" },
        children: [
          parseExpression(condition),
          parseExpression(trueBranch),
          parseExpression(falseBranch),
        ],
      };
    }

    // Handle function calls
    if (code.match(/[a-zA-Z_]\w*\s*\(/)) {
      const match = code.match(/([a-zA-Z_]\w*)\s*\((.*)\)/);
      if (match) {
        const funcName = match[1];
        const args = match[2].split(",").map((arg) => arg.trim());

        return {
          name: funcName,
          attributes: { type: "function", label: "Function Call" },
          children: args.map((arg) => parseExpression(arg)),
        };
      }
    }

    // Handle compound assignments
    const compoundOps = ["+=", "-=", "*=", "/=", "%="];
    for (const op of compoundOps) {
      if (code.includes(op)) {
        const parts = code.split(op);
        const leftSide = parts[0].trim();
        const rightSide = parts[1]?.trim() || "";

        return {
          name: op,
          attributes: { type: "operator", label: "Compound Assignment" },
          children: [
            {
              name: leftSide,
              attributes: { type: "identifier", label: "Variable" },
            },
            parseExpression(rightSide),
          ],
        };
      }
    }

    // Handle logical operators
    if (code.includes("&&") || code.includes("||")) {
      const op = code.includes("&&") ? "&&" : "||";
      const parts = code.split(op).map((p) => p.trim());

      return {
        name: op,
        attributes: {
          type: "operator",
          label: op === "&&" ? "Logical AND" : "Logical OR",
        },
        children: parts.map((part) => parseExpression(part)),
      };
    }

    // Handle relational operators
    const relOps = ["<=", ">=", "==", "!=", "<", ">"];
    for (const op of relOps) {
      if (code.includes(op)) {
        const parts = code.split(op).map((p) => p.trim());

        return {
          name: op,
          attributes: { type: "operator", label: getOperatorLabel(op) },
          children: parts.map((part) => parseExpression(part)),
        };
      }
    }

    // Handle unary operators
    if (
      code.startsWith("!") ||
      code.startsWith("~") ||
      code.startsWith("-") ||
      code.startsWith("+") ||
      code.startsWith("++") ||
      code.startsWith("--")
    ) {
      const unaryMatch = code.match(/^(--|\\+\\+|!|~|-|\\+)/);
      if (unaryMatch) {
        const unaryOp = unaryMatch[1];
        const operand = code.substring(unaryOp.length).trim();

        return {
          name: unaryOp,
          attributes: {
            type: "operator",
            label: getUnaryOperatorLabel(unaryOp),
          },
          children: [parseExpression(operand)],
        };
      }
    }

    return parseAssignmentOrArithmetic(code);
  } catch (err) {
    console.error("Error creating tree data:", err);
    return {
      name: "Expression",
      attributes: { type: "default", label: "Parse Error" },
      children: [
        { name: code, attributes: { type: "default", label: "Error" } },
      ],
    };
  }
}

// Helper function to parse expressions
function parseExpression(expr) {
  expr = expr.trim();

  if (expr.startsWith("(") && expr.endsWith(")")) {
    let depth = 0;
    let isWrapped = true;
    for (let i = 0; i < expr.length - 1; i++) {
      if (expr[i] === "(") depth++;
      else if (expr[i] === ")") depth--;
      if (depth === 0) {
        isWrapped = false;
        break;
      }
    }
    if (isWrapped) {
      expr = expr.substring(1, expr.length - 1).trim();
    }
  }

  // Check for literals
  if (/^\d+\.?\d*$/.test(expr)) {
    return { name: expr, attributes: { type: "literal", label: "Number" } };
  }

  if (/^'.'$/.test(expr)) {
    return { name: expr, attributes: { type: "literal", label: "Character" } };
  }

  if (/^[a-zA-Z_]\w*$/.test(expr)) {
    return {
      name: expr,
      attributes: { type: "identifier", label: "Variable" },
    };
  }

  // Recursively parse complex expressions
  return createTreeFromCode(expr);
}

function parseAssignmentOrArithmetic(code) {
  // Handle assignments
  if (
    code.includes("=") &&
    !code.includes("==") &&
    !code.includes("!=") &&
    !code.includes("<=") &&
    !code.includes(">=")
  ) {
    const assignOp = code.includes(":=") ? ":=" : "=";
    const eqIndex = code.indexOf(assignOp);
    const leftSide = code.substring(0, eqIndex).trim();
    const rightSide = code.substring(eqIndex + assignOp.length).trim();

    return {
      name: assignOp,
      attributes: { type: "operator", label: "Assignment" },
      children: [
        {
          name: leftSide,
          attributes: { type: "identifier", label: "Variable" },
        },
        parseArithmeticExpression(rightSide),
      ],
    };
  }

  return parseArithmeticExpression(code);
}

// Parse arithmetic expressions with proper precedence
function parseArithmeticExpression(expr) {
  expr = expr.trim();

  // Handle parentheses first
  let parenDepth = 0;
  let lastOpIndex = -1;
  let lastOp = "";
  let lowestPrecedence = 999;

  // Scan for operators outside parentheses
  for (let i = 0; i < expr.length; i++) {
    if (expr[i] === "(") parenDepth++;
    else if (expr[i] === ")") parenDepth--;
    else if (parenDepth === 0) {
      // Check for operators
      const ops = ["+", "-", "*", "/", "%"];
      for (const op of ops) {
        if (expr.substring(i).startsWith(op) && i > 0) {
          const precedence = getOperatorPrecedence(op);
          if (precedence <= lowestPrecedence) {
            lowestPrecedence = precedence;
            lastOpIndex = i;
            lastOp = op;
          }
        }
      }
    }
  }

  if (lastOpIndex > 0) {
    const leftExpr = expr.substring(0, lastOpIndex).trim();
    const rightExpr = expr.substring(lastOpIndex + lastOp.length).trim();

    return {
      name: lastOp,
      attributes: { type: "operator", label: getOperatorLabel(lastOp) },
      children: [
        parseArithmeticExpression(leftExpr),
        parseArithmeticExpression(rightExpr),
      ],
    };
  }

  return parseExpression(expr);
}

// Get operator precedence
function getOperatorPrecedence(op) {
  const precedence = {
    "||": 1,
    "&&": 2,
    "==": 3,
    "!=": 3,
    "<": 4,
    ">": 4,
    "<=": 4,
    ">=": 4,
    "+": 5,
    "-": 5,
    "*": 6,
    "/": 6,
    "%": 6,
  };
  return precedence[op] || 999;
}

// Get operator labels
function getOperatorLabel(op) {
  const labels = {
    "+": "Addition",
    "-": "Subtraction",
    "*": "Multiplication",
    "/": "Division",
    "%": "Modulo",
    "=": "Assignment",
    ":=": "Assignment",
    "+=": "Add Assign",
    "-=": "Subtract Assign",
    "*=": "Multiply Assign",
    "/=": "Divide Assign",
    "%=": "Modulo Assign",
    "<": "Less Than",
    ">": "Greater Than",
    "<=": "Less Equal",
    ">=": "Greater Equal",
    "==": "Equal",
    "!=": "Not Equal",
    "&&": "Logical AND",
    "||": "Logical OR",
    "?:": "Ternary",
  };
  return labels[op] || "Operator";
}

function getUnaryOperatorLabel(op) {
  const labels = {
    "!": "Logical NOT",
    "~": "Bitwise NOT",
    "-": "Unary Minus",
    "+": "Unary Plus",
    "++": "Increment",
    "--": "Decrement",
  };
  return labels[op] || "Unary Operator";
}

// Intermediate code generation
function generateIntermediateCode(code) {
  let tempCounter = 1;
  const instructions = [];

  function genTemp() {
    return `t${tempCounter++}`;
  }

  function generateForExpression(expr, target = null) {
    expr = expr.trim();

    // Handle ternary
    if (expr.includes("?") && expr.includes(":")) {
      const questionIndex = expr.indexOf("?");
      const colonIndex = expr.indexOf(":", questionIndex);
      const condition = expr.substring(0, questionIndex).trim();
      const trueBranch = expr.substring(questionIndex + 1, colonIndex).trim();
      const falseBranch = expr.substring(colonIndex + 1).trim();

      const condTemp = genTemp();
      generateForExpression(condition, condTemp);

      const result = target || genTemp();
      instructions.push(`if ${condTemp} goto L1`);
      generateForExpression(falseBranch, result);
      instructions.push(`goto L2`);
      instructions.push(`L1:`);
      generateForExpression(trueBranch, result);
      instructions.push(`L2:`);

      return result;
    }

    // Handle function calls
    if (expr.match(/[a-zA-Z_]\w*\s*\(/)) {
      const match = expr.match(/([a-zA-Z_]\w*)\s*\((.*)\)/);
      if (match) {
        const funcName = match[1];
        const args = match[2].split(",").map((arg) => arg.trim());
        const argTemps = args.map((arg) => generateForExpression(arg));

        const result = target || genTemp();
        instructions.push(
          `${result} = call ${funcName}(${argTemps.join(", ")})`
        );
        return result;
      }
    }

    // Handle binary operators
    const operators = [
      "||",
      "&&",
      "==",
      "!=",
      "<=",
      ">=",
      "<",
      ">",
      "+",
      "-",
      "*",
      "/",
      "%",
    ];
    for (const op of operators) {
      const opIndex = findOperatorIndex(expr, op);
      if (opIndex > 0) {
        const left = expr.substring(0, opIndex).trim();
        const right = expr.substring(opIndex + op.length).trim();

        const leftTemp = generateForExpression(left);
        const rightTemp = generateForExpression(right);
        const result = target || genTemp();

        instructions.push(`${result} = ${leftTemp} ${op} ${rightTemp}`);
        return result;
      }
    }

    // Handle unary operators
    if (expr.startsWith("!") || expr.startsWith("~") || expr.startsWith("-")) {
      const op = expr[0];
      const operand = expr.substring(1).trim();
      const operandTemp = generateForExpression(operand);
      const result = target || genTemp();

      instructions.push(`${result} = ${op}${operandTemp}`);
      return result;
    }

    // Handle literals and identifiers
    if (
      target &&
      (/^\d+\.?\d*$/.test(expr) ||
        /^[a-zA-Z_]\w*$/.test(expr) ||
        /^'.'$/.test(expr))
    ) {
      instructions.push(`${target} = ${expr}`);
      return target;
    }

    return expr;
  }

  function findOperatorIndex(expr, op) {
    let parenDepth = 0;
    for (let i = 0; i < expr.length; i++) {
      if (expr[i] === "(") parenDepth++;
      else if (expr[i] === ")") parenDepth--;
      else if (parenDepth === 0 && expr.substring(i).startsWith(op)) {
        return i;
      }
    }
    return -1;
  }

  if (code.includes("=") && !code.includes("==") && !code.includes("!=")) {
    const eqIndex = code.indexOf("=");
    const leftSide = code.substring(0, eqIndex).trim();
    const rightSide = code.substring(eqIndex + 1).trim();

    generateForExpression(rightSide, leftSide);
  } else {
    generateForExpression(code);
  }

  return instructions;
}

// Fallback parser function
export const getSampleDataForCode = (code) => {
  const tokens = tokenize(code);
  const astString = `Expression: ${code}`;
  const treeData = createTreeFromCode(code);

  const semanticAnalysis = {
    typeChecking: "Type checking passed",
    symbolTable: extractIdentifiers(code).map((id) => ({
      name: id,
      type: "auto",
      scope: "global",
    })),
  };

  const intermediateCode = generateIntermediateCode(code);
  const optimizedCode = optimizeIntermediateCode(intermediateCode);
  const assemblyCode = generateAssemblyCode(optimizedCode);

  return {
    tokens,
    ast: astString,
    treeData,
    semanticAnalysis,
    intermediateCode,
    optimizedCode,
    assemblyCode,
  };
};

// Helper function to extract identifiers
function extractIdentifiers(code) {
  const identifiers = new Set();
  const regex = /[a-zA-Z_]\w*/g;
  let match;
  while ((match = regex.exec(code)) !== null) {
    // Filter out keywords and function names
    if (
      !["if", "else", "while", "for", "return", "true", "false"].includes(
        match[0]
      )
    ) {
      identifiers.add(match[0]);
    }
  }
  return Array.from(identifiers);
}

// Simple optimizer
function optimizeIntermediateCode(intermediateCode) {
  const optimized = [];
  for (let i = 0; i < intermediateCode.length; i++) {
    const current = intermediateCode[i];
    const next = intermediateCode[i + 1];

    if (
      current.match(/^t\d+ = /) &&
      next &&
      next.includes(current.split(" = ")[0])
    ) {
      const temp = current.split(" = ")[0];
      const value = current.split(" = ")[1];
      const usageCount = intermediateCode
        .slice(i + 1)
        .filter((line) => line.includes(temp)).length;

      if (usageCount === 1) {
        optimized.push(next.replace(temp, `(${value})`));
        i++;
        continue;
      }
    }

    optimized.push(current);
  }

  return optimized.length > 0 ? optimized : intermediateCode;
}

// Generate assembly code
function generateAssemblyCode(intermediateCode) {
  const assembly = [];

  for (const line of intermediateCode) {
    if (line.includes(" = ")) {
      const [dest, expr] = line.split(" = ").map((s) => s.trim());

      // Handle different expression types
      if (expr.includes(" + ")) {
        const [left, right] = expr.split(" + ").map((s) => s.trim());
        assembly.push(`LOAD R1, ${left}`);
        assembly.push(`ADD R1, ${right}`);
        assembly.push(`STORE ${dest}, R1`);
      } else if (expr.includes(" - ")) {
        const [left, right] = expr.split(" - ").map((s) => s.trim());
        assembly.push(`LOAD R1, ${left}`);
        assembly.push(`SUB R1, ${right}`);
        assembly.push(`STORE ${dest}, R1`);
      } else if (expr.includes(" * ")) {
        const [left, right] = expr.split(" * ").map((s) => s.trim());
        assembly.push(`LOAD R1, ${left}`);
        assembly.push(`MUL R1, ${right}`);
        assembly.push(`STORE ${dest}, R1`);
      } else if (expr.includes(" / ")) {
        const [left, right] = expr.split(" / ").map((s) => s.trim());
        assembly.push(`LOAD R1, ${left}`);
        assembly.push(`DIV R1, ${right}`);
        assembly.push(`STORE ${dest}, R1`);
      } else {
        // Simple assignment
        assembly.push(`LOAD R1, ${expr}`);
        assembly.push(`STORE ${dest}, R1`);
      }
    }
  }

  return assembly;
}

export const analyzeWithGroq = async (code) => {
  if (!GROQ_API_KEY || GROQ_API_KEY === "undefined") {
    console.warn("No API key, using local fallback parser");
    return getSampleDataForCode(code);
  }

  const cleanedCode = code.trim();

  const prompt = `
You are a compiler expert. Analyze the following code through all compiler phases and return ONLY a JSON response with this exact structure:

{
  "tokens": [{"lexeme": string, "token": string, "attribute": string}],
  "ast": string,
  "treeData": {
    "name": string,
    "attributes": {"type": string, "label": string},
    "children": [...]
  },
  "semanticAnalysis": {"typeChecking": string, "symbolTable": [{"name": string, "type": string, "scope": string}]},
  "intermediateCode": [string],
  "optimizedCode": [string],
  "assemblyCode": [string]
}

Code to analyze: ${cleanedCode}

For treeData, generate a tree structure that represents the AST visually:
1. Each node must have a "name" (the operation or identifier value)
2. Each node must have "attributes" with "type" and "label" properties
3. For "type", use: "operator", "identifier", "literal", "function", or "default"
4. For operators, include "children" array with left and right child nodes
5. Follow operator precedence (*, / before +, -)
6. For "sum := a + b - c", the root should be ":=" with "sum" as left child and a subtree for "a + b - c" as right child

For intermediateCode, return code in Three-Address Code (TAC) format, where:
- Each instruction uses at most one operator
- Temporary variables (t1, t2, etc.) store intermediate results
- Example for "total := price + rate * 60": ["t1 = rate * 60", "t2 = price + t1", "total = t2"]
- Do NOT use assembly-like instructions (LOAD, STORE, etc.)

For optimizedCode, apply standard compiler optimizations like:
- For "a = b + c - 10", intermediate is ["t1 = b + c", "t2 = t1 - 10", "a = t2"], optimized is ["t1 = b + c", "a = t1 - 10"]
- For "total = price + rate * 60", keep the multiplication separate: ["t1 = rate * 60", "total = price + t1"]
- Always reduce the number of temporary variables when possible
- Combine operations where it makes sense

Return only valid JSON.
`;

  try {
    const response = await fetch(GROQ_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${GROQ_API_KEY}`,
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
        max_tokens: 3000,
        response_format: { type: "json_object" },
      }),
    });

    if (!response.ok) throw new Error("API request failed");

    const data = await response.json();
    const content = data.choices[0].message.content;

    try {
      const parsedResult = JSON.parse(content);

      if (!parsedResult.ast || parsedResult.ast === code) {
        parsedResult.ast = `Expression: ${code}`;
      }

      if (!parsedResult.treeData) {
        const fallback = getSampleDataForCode(code);
        parsedResult.treeData = fallback.treeData;
      }

      if (parsedResult.intermediateCode) {
        const hasAssemblyStyle = parsedResult.intermediateCode.some(
          (line) =>
            line.startsWith("LOAD") ||
            line.startsWith("STORE") ||
            line.startsWith("ADD") ||
            line.startsWith("MUL")
        );

        if (hasAssemblyStyle) {
          parsedResult.intermediateCode = generateIntermediateCode(code);
        }
      } else {
        parsedResult.intermediateCode = generateIntermediateCode(code);
      }

      return parsedResult;
    } catch (err) {
      console.error("Failed to parse API response:", err);
      return getSampleDataForCode(code);
    }
  } catch (err) {
    console.error("Groq API error:", err);
    return getSampleDataForCode(code);
  }
};
