const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY;
const GROQ_API_URL = "https://api.groq.com/openai/v1/chat/completions";

// Tokenizer
function tokenize(expr) {
  const regex = /\s*([A-Za-z_][A-Za-z0-9_]*|\d+|\+|\-|\*|\/|\(|\)|:=|=)\s*/g;
  const tokens = [];
  let match;
  while ((match = regex.exec(expr)) !== null) {
    tokens.push(match[1]);
  }
  return tokens;
}

// Generate intermediate
function generateIntermediateCode(code) {
  if (code.includes(":=") || code.includes("=")) {
    const assignOp = code.includes(":=") ? ":=" : "=";
    const parts = code.split(assignOp);
    const leftSide = parts[0].trim();
    const rightSide = parts[1]?.trim() || "";

    // Case: total := price + rate * 60
    if (rightSide.includes("+") && rightSide.includes("*")) {
      const addParts = rightSide.split("+").map((p) => p.trim());
      if (addParts[1].includes("*")) {
        const mulParts = addParts[1].split("*").map((p) => p.trim());
        return [
          `t1 = ${mulParts[0]} * ${mulParts[1]}`,
          `t2 = ${addParts[0]} + t1`,
          `${leftSide} = t2`,
        ];
      } else if (addParts[0].includes("*")) {
        const mulParts = addParts[0].split("*").map((p) => p.trim());
        return [
          `t1 = ${mulParts[0]} * ${mulParts[1]}`,
          `t2 = t1 + ${addParts[1]}`,
          `${leftSide} = t2`,
        ];
      }
    }

    if (rightSide.includes("+") && !rightSide.includes("*")) {
      const addParts = rightSide.split("+").map((p) => p.trim());
      return [`t1 = ${addParts[0]} + ${addParts[1]}`, `${leftSide} = t1`];
    }

    if (rightSide.includes("-") && !rightSide.includes("+")) {
      const subParts = rightSide.split("-").map((p) => p.trim());
      return [`t1 = ${subParts[0]} - ${subParts[1]}`, `${leftSide} = t1`];
    }

    if (rightSide.includes("*") && !rightSide.includes("+")) {
      const mulParts = rightSide.split("*").map((p) => p.trim());
      return [`t1 = ${mulParts[0]} * ${mulParts[1]}`, `${leftSide} = t1`];
    }

    return [`${leftSide} = ${rightSide}`];
  }

  return [`result = ${code}`];
}

// Fallback Parser
export const getSampleDataForCode = (code) => {
  const tokens = tokenize(code);
  const astString = `Expression: ${code}`;
  const treeData = createTreeFromCode(code);

  const semanticAnalysis = {
    typeChecking: "All variables are of type integer",
    symbolTable: [
      { name: "total", type: "integer", scope: "global" },
      { name: "price", type: "integer", scope: "global" },
      { name: "rate", type: "integer", scope: "global" },
    ],
  };

  const intermediateCode = generateIntermediateCode(code);

  let optimizedCode;
  if (code.includes("price + rate * 60")) {
    optimizedCode = ["t1 = rate * 60", "total = price + t1"];
  } else if (code.includes("*")) {
    const assignOp = code.includes(":=") ? ":=" : "=";
    const parts = code.split(assignOp);
    const leftSide = parts[0].trim();
    const rightSide = parts[1]?.trim() || "";
    if (rightSide.includes("*")) {
      const mulParts = rightSide.split("*").map((p) => p.trim());
      optimizedCode = [`${leftSide} = ${mulParts[0]} * ${mulParts[1]}`];
    } else {
      optimizedCode = intermediateCode;
    }
  } else if (code.includes("+")) {
    const assignOp = code.includes(":=") ? ":=" : "=";
    const parts = code.split(assignOp);
    const leftSide = parts[0].trim();
    const rightSide = parts[1]?.trim() || "";
    if (rightSide.includes("+")) {
      const addParts = rightSide.split("+").map((p) => p.trim());
      optimizedCode = [`${leftSide} = ${addParts[0]} + ${addParts[1]}`];
    } else {
      optimizedCode = intermediateCode;
    }
  } else {
    optimizedCode = intermediateCode;
  }

  // Generate assembly code
  let assemblyCode;
  if (code.includes("price + rate * 60")) {
    assemblyCode = [
      "LOAD R1, rate",
      "MUL R1, 60",
      "LOAD R2, price",
      "ADD R2, R1",
      "STORE total, R2",
    ];
  } else if (code.includes("+")) {
    const assignOp = code.includes(":=") ? ":=" : "=";
    const parts = code.split(assignOp);
    const leftSide = parts[0].trim();
    const rightSide = parts[1]?.trim() || "";
    if (rightSide.includes("+")) {
      const addParts = rightSide.split("+").map((p) => p.trim());
      assemblyCode = [
        `LOAD R1, ${addParts[0]}`,
        `ADD R1, ${addParts[1]}`,
        `STORE ${leftSide}, R1`,
      ];
    } else {
      assemblyCode = [`LOAD R1, ${rightSide}`, `STORE ${leftSide}, R1`];
    }
  } else if (code.includes("*")) {
    const assignOp = code.includes(":=") ? ":=" : "=";
    const parts = code.split(assignOp);
    const leftSide = parts[0].trim();
    const rightSide = parts[1]?.trim() || "";
    if (rightSide.includes("*")) {
      const mulParts = rightSide.split("*").map((p) => p.trim());
      assemblyCode = [
        `LOAD R1, ${mulParts[0]}`,
        `MUL R1, ${mulParts[1]}`,
        `STORE ${leftSide}, R1`,
      ];
    } else {
      assemblyCode = [`LOAD R1, ${rightSide}`, `STORE ${leftSide}, R1`];
    }
  } else {
    const assignOp = code.includes(":=") ? ":=" : "=";
    const parts = code.split(assignOp);
    const leftSide = parts[0].trim();
    const rightSide = parts[1]?.trim() || "";
    assemblyCode = [`LOAD R1, ${rightSide}`, `STORE ${leftSide}, R1`];
  }

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

export function formatASTString(code) {
  return `Expression: ${code}`;
}

function createTreeFromCode(code) {
  try {
    if (code.includes("*")) {
      const assignOp = code.includes(":=") ? ":=" : "=";
      const parts = code.split(assignOp);
      const leftSide = parts[0].trim();
      const rightSide = parts[1]?.trim() || "";

      if (rightSide.includes("+") && rightSide.includes("*")) {
        const addParts = rightSide.split("+").map((p) => p.trim());

        if (addParts[1].includes("*")) {
          const mulParts = addParts[1].split("*").map((p) => p.trim());

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
                    name: addParts[0],
                    attributes: {
                      type: isNumeric(addParts[0]) ? "literal" : "identifier",
                      label: isNumeric(addParts[0]) ? "Number" : "Variable",
                    },
                  },
                  {
                    name: "*",
                    attributes: { type: "operator", label: "Multiplication" },
                    children: [
                      {
                        name: mulParts[0],
                        attributes: {
                          type: isNumeric(mulParts[0])
                            ? "literal"
                            : "identifier",
                          label: isNumeric(mulParts[0]) ? "Number" : "Variable",
                        },
                      },
                      {
                        name: mulParts[1],
                        attributes: {
                          type: isNumeric(mulParts[1])
                            ? "literal"
                            : "identifier",
                          label: isNumeric(mulParts[1]) ? "Number" : "Variable",
                        },
                      },
                    ],
                  },
                ],
              },
            ],
          };
        } else if (addParts[0].includes("*")) {
          const mulParts = addParts[0].split("*").map((p) => p.trim());

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
                    name: "*",
                    attributes: { type: "operator", label: "Multiplication" },
                    children: [
                      {
                        name: mulParts[0],
                        attributes: {
                          type: isNumeric(mulParts[0])
                            ? "literal"
                            : "identifier",
                          label: isNumeric(mulParts[0]) ? "Number" : "Variable",
                        },
                      },
                      {
                        name: mulParts[1],
                        attributes: {
                          type: isNumeric(mulParts[1])
                            ? "literal"
                            : "identifier",
                          label: isNumeric(mulParts[1]) ? "Number" : "Variable",
                        },
                      },
                    ],
                  },
                  {
                    name: addParts[1],
                    attributes: {
                      type: isNumeric(addParts[1]) ? "literal" : "identifier",
                      label: isNumeric(addParts[1]) ? "Number" : "Variable",
                    },
                  },
                ],
              },
            ],
          };
        }
      } else if (rightSide.includes("*")) {
        const mulParts = rightSide.split("*").map((p) => p.trim());

        return {
          name: assignOp,
          attributes: { type: "operator", label: "Assignment" },
          children: [
            {
              name: leftSide,
              attributes: { type: "identifier", label: "Variable" },
            },
            {
              name: "*",
              attributes: { type: "operator", label: "Multiplication" },
              children: [
                {
                  name: mulParts[0],
                  attributes: {
                    type: isNumeric(mulParts[0]) ? "literal" : "identifier",
                    label: isNumeric(mulParts[0]) ? "Number" : "Variable",
                  },
                },
                {
                  name: mulParts[1],
                  attributes: {
                    type: isNumeric(mulParts[1]) ? "literal" : "identifier",
                    label: isNumeric(mulParts[1]) ? "Number" : "Variable",
                  },
                },
              ],
            },
          ],
        };
      }
    }

    if (code.includes(":=") || code.includes("=")) {
      const assignOp = code.includes(":=") ? ":=" : "=";
      const parts = code.split(assignOp);
      const leftSide = parts[0].trim();
      const rightSide = parts[1]?.trim() || "";

      // Handle addition
      if (rightSide.includes("+")) {
        const addParts = rightSide.split("+").map((p) => p.trim());
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
                  name: addParts[0],
                  attributes: {
                    type: isNumeric(addParts[0]) ? "literal" : "identifier",
                    label: isNumeric(addParts[0]) ? "Number" : "Variable",
                  },
                },
                {
                  name: addParts[1],
                  attributes: {
                    type: isNumeric(addParts[1]) ? "literal" : "identifier",
                    label: isNumeric(addParts[1]) ? "Number" : "Variable",
                  },
                },
              ],
            },
          ],
        };
      }

      if (rightSide.includes("-")) {
        const subParts = rightSide.split("-").map((p) => p.trim());
        return {
          name: assignOp,
          attributes: { type: "operator", label: "Assignment" },
          children: [
            {
              name: leftSide,
              attributes: { type: "identifier", label: "Variable" },
            },
            {
              name: "-",
              attributes: { type: "operator", label: "Subtraction" },
              children: [
                {
                  name: subParts[0] || leftSide,
                  attributes: {
                    type: isNumeric(subParts[0]) ? "literal" : "identifier",
                    label: isNumeric(subParts[0]) ? "Number" : "Variable",
                  },
                },
                {
                  name: subParts[1],
                  attributes: {
                    type: isNumeric(subParts[1]) ? "literal" : "identifier",
                    label: isNumeric(subParts[1]) ? "Number" : "Variable",
                  },
                },
              ],
            },
          ],
        };
      }

      return {
        name: assignOp,
        attributes: { type: "operator", label: "Assignment" },
        children: [
          {
            name: leftSide,
            attributes: { type: "identifier", label: "Variable" },
          },
          {
            name: rightSide,
            attributes: {
              type: isNumeric(rightSide) ? "literal" : "identifier",
              label: isNumeric(rightSide) ? "Number" : "Variable",
            },
          },
        ],
      };
    }

    // Fallback
    return {
      name: "Expression",
      attributes: { type: "default", label: "Expression Root" },
      children: [
        {
          name: code,
          attributes: { type: "default", label: "Code" },
        },
      ],
    };
  } catch (err) {
    console.error("Error creating tree data:", err);
    return {
      name: "Expression",
      attributes: { type: "default", label: "Parse Error" },
      children: [
        {
          name: "Error Parsing",
          attributes: { type: "default", label: "Try simpler expression" },
        },
      ],
    };
  }
}

function isNumeric(str) {
  return /^\d+$/.test(str);
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
      // console.log("API returned:", parsedResult);

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
