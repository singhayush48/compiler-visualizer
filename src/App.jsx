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
  FiGithub,
} from "react-icons/fi";
import CodeInput from "./components/CodeInput";
import PhaseVisualization from "./components/PhaseVisualization";
import HowItWorks from "./components/HowItWorks";
import Footer from "./components/Footer";
import { useCompiler } from "./hooks/useCompiler";

const CompilerVisualizer = () => {
  const [code, setCode] = useState("total := price + rate * 60");
  const { phases, loading, error, analyzeCode, usingFallback } = useCompiler();

  const handleAnalyze = async () => {
    await analyzeCode(code);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-3 md:p-6">
      <div className="max-w-6xl mx-auto">
        <nav className="flex flex-col md:flex-row md:justify-between items-center mb-6 md:mb-8 gap-3 md:gap-0">
          <Link
            to="/"
            className="inline-flex items-center bg-white/80 backdrop-blur-sm rounded-2xl p-3 md:p-4 shadow-lg border border-slate-200 hover:shadow-xl transition-shadow w-full md:w-auto justify-center md:justify-start"
          >
            <div className="size-9 md:size-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center mr-3 shadow-md">
              <FiCode className="size-5 md:size-6 text-white" />
            </div>
            <div className="text-left">
              <h1 className="text-lg md:text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                Compiler Visualizer
              </h1>
              <p className="text-xs md:text-sm text-slate-600 hidden md:block">
                See code transformation
              </p>
            </div>
          </Link>

          <div className="flex gap-2 w-full md:w-auto justify-center md:justify-start">
            <Link
              to="/"
              className="flex items-center bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-slate-200 hover:bg-gray-100 transition-colors hover:cursor-pointer flex-1 md:flex-none justify-center"
            >
              <FiHome className="w-4 h-4 md:w-5 md:h-5 text-slate-700" />
              <span className="ml-2 text-slate-700 hidden sm:block">Home</span>
            </Link>
            <Link
              to="/how-it-works"
              className="flex items-center bg-white/80 backdrop-blur-sm rounded-xl p-3 shadow-lg border border-slate-200 hover:bg-gray-100 transition-colors hover:cursor-pointer flex-1 md:flex-none justify-center"
            >
              <FiHelpCircle className="w-4 h-4 md:w-5 md:h-5 text-slate-700" />
              <span className="ml-2 text-slate-700 hidden sm:block">Guide</span>
            </Link>

            <a
              href="https://github.com/danielace1/compiler-visualizer"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:flex items-center bg-gray-800 text-white rounded-xl p-3 shadow-lg border border-gray-700 hover:bg-gray-700 transition-colors"
            >
              <FiGithub className="w-5 h-5" />
              <span className="ml-2 font-medium">Repo</span>
            </a>
          </div>
        </nav>

        {/* Status Indicators */}
        <div className="flex flex-col sm:flex-row gap-3 mb-3 md:mb-6">
          {usingFallback && (
            <div className="flex items-center bg-amber-100 border border-amber-200 text-amber-800 px-4 py-3 rounded-xl">
              <FiAlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
              <span className="text-sm">
                Using fallback data. API may be unavailable.
              </span>
            </div>
          )}

          {loading && (
            <div className="flex items-center bg-blue-100 border border-blue-200 text-blue-800 px-4 py-3 rounded-xl">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
              <span className="text-sm">Analyzing your code...</span>
            </div>
          )}
        </div>

        {/* Quick Info Section */}
        {!phases && !loading && (
          <div className="bg-white rounded-2xl p-3 md:p-6 shadow-sm border border-slate-200 mb-6">
            <div className="flex items-center mb-4">
              <FiInfo className="w-5 h-5 text-blue-600 mr-2" />
              <h3 className="text-lg font-medium text-slate-800">
                Quick Start
              </h3>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-slate-600 mb-4">
              <div className="flex items-center">
                <div className="bg-blue-100 p-2 rounded-lg mr-3">
                  <FiCode className="w-4 h-4 text-blue-600" />
                </div>
                <p>Enter code or try an example to see compilation phases</p>
              </div>
              <div className="flex items-center">
                <div className="bg-purple-100 p-2 rounded-lg mr-3">
                  <FiCpu className="w-4 h-4 text-purple-600" />
                </div>
                <p>View each phase from tokens to assembly code</p>
              </div>
            </div>
            <div className="text-center">
              <Link
                to="/how-it-works"
                className="inline-flex items-center text-blue-600 hover:text-blue-700 font-medium text-sm"
              >
                <FiHelpCircle className="w-4 h-4 mr-1" />
                Learn more about how it works
              </Link>
            </div>
          </div>
        )}

        {/* Code Input Section */}
        <CodeInput
          code={code}
          onChange={setCode}
          onAnalyze={handleAnalyze}
          loading={loading}
        />

        {/* Error Display */}
        {error && (
          <div className="flex items-center bg-red-100 border border-red-200 text-red-800 px-4 py-3 rounded-xl mb-6">
            <FiAlertTriangle className="w-5 h-5 mr-2 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Compilation Phases */}
        {phases && (
          <div className="mt-6 mb-10">
            <div className="flex items-center mb-4">
              <FiLayers className="w-5 h-5 md:w-6 md:h-6 text-blue-600 mr-2" />
              <h2 className="text-lg md:text-xl font-semibold text-slate-800">
                Compilation Phases
              </h2>
            </div>
            <PhaseVisualization phases={phases} />
          </div>
        )}
      </div>
    </div>
  );
};

const App = () => {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<CompilerVisualizer />} />
        <Route path="/how-it-works" element={<HowItWorks />} />
      </Routes>
      <Footer />
    </Router>
  );
};

export default App;
