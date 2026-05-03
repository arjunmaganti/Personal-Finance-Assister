import { useState } from 'react'
import { runAgentPipeline } from './api'

function App() {
  // --- 1. State Management ---
  const [persona, setPersona] = useState('');
  const [variant, setVariant] = useState('A');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  // --- 2. Action Handler ---
  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      // Calls the helper function in api.js
      const data = await runAgentPipeline(variant, persona);
      setResult(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // --- 3. Result Renderer (Handles Prose vs JSON) ---
  const renderResult = () => {
    if (!result) return null;

    // Variants A & B return simple strings
    if (variant === 'A' || variant === 'B') {
      return (
        <div style={{ whiteSpace: 'pre-wrap', lineHeight: '1.6', color: '#333' }}>
          {result.result}
        </div>
      );
    }

    // Variants C & D return the full Agent Pipeline JSON
    const finalPlan = result.result?.agent_4?.user_facing_summary || "No summary generated.";
    const qcReport = result.result?.agent_4?.overall_recommendation
    ? `Overall recommendation: ${result.result.agent_4.overall_recommendation}. ${result.result.agent_4.revision_suggestions?.join(" ") || ""}`
    : "No QC report available.";

    return (
      <div>
        <h3 style={{ color: '#2c3e50', marginBottom: '10px' }}>Final Financial Strategy</h3>
        <div style={{ 
          background: 'white', 
          padding: '20px', 
          borderRadius: '8px', 
          borderLeft: '5px solid #27ae60', 
          boxShadow: '0 2px 4px rgba(0,0,0,0.05)',
          marginBottom: '20px',
          lineHeight: '1.6'
        }}>
          {finalPlan}
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          <details style={{ background: '#fff', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}>
            <summary style={{ cursor: 'pointer', color: '#2980b9', fontWeight: 'bold' }}>
              View Agent 4 Quality Control Report
            </summary>
            <div style={{ marginTop: '10px', fontSize: '0.9em', fontStyle: 'italic', color: '#7f8c8d' }}>
              {qcReport}
            </div>
          </details>
          
          <details style={{ background: '#fff', padding: '10px', borderRadius: '4px', border: '1px solid #ddd' }}>
            <summary style={{ cursor: 'pointer', color: '#2980b9', fontWeight: 'bold' }}>
              View Raw Pipeline Data (Debug)
            </summary>
            <pre style={{ fontSize: '0.8em', overflowX: 'auto', marginTop: '10px', background: '#f1f1f1', padding: '10px' }}>
              {JSON.stringify(result, null, 2)}
            </pre>
          </details>
        </div>
      </div>
    );
  };

  // --- 4. Main UI Layout ---
  return (
    <div style={{ 
      padding: '40px 20px', 
      maxWidth: '900px', 
      margin: '0 auto', 
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
      color: '#2c3e50'
    }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ fontSize: '2.5rem', marginBottom: '10px' }}>Financial Advisory AI</h1>
        <p style={{ color: '#7f8c8d' }}>Context Engineering & Multi-Agent Pipeline Testbed</p>
      </header>

      <main>
        <section style={{ background: '#ffffff', padding: '30px', borderRadius: '12px', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', marginBottom: '30px' }}>
          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            
            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>1. Select Testing Variant</label>
              <select 
                value={variant} 
                onChange={(e) => setVariant(e.target.value)}
                style={{ padding: '12px', width: '100%', borderRadius: '6px', border: '1px solid #ccc', fontSize: '1rem' }}
              >
                <option value="A">Variant A: Simple Prompt (Zero-Shot)</option>
                <option value="B">Variant B: Grounded Context (Heuristics + Biases)</option>
                <option value="C">Variant C: Sequential Pipeline (4 Agents)</option>
                <option value="D">Variant D: Hierarchical Pipeline (Orchestrated)</option>
              </select>
            </div>

            <div>
              <label style={{ fontWeight: 'bold', display: 'block', marginBottom: '8px' }}>2. Enter Persona Details</label>
              <textarea 
                placeholder="Describe the financial situation (e.g., age, income, debt, goals...)"
                value={persona}
                onChange={(e) => setPersona(e.target.value)}
                required
                style={{ 
                  width: '100%', 
                  height: '150px', 
                  padding: '12px', 
                  borderRadius: '6px', 
                  border: '1px solid #ccc', 
                  fontSize: '1rem',
                  lineHeight: '1.5',
                  boxSizing: 'border-box'
                }}
              />
            </div>

            <button 
              type="submit" 
              disabled={loading || !persona}
              style={{ 
                padding: '15px', 
                backgroundColor: loading ? '#bdc3c7' : '#3498db', 
                color: 'white', 
                border: 'none', 
                borderRadius: '6px',
                cursor: loading ? 'not-allowed' : 'pointer',
                fontWeight: 'bold',
                fontSize: '1.1rem',
                transition: 'background 0.3s'
              }}
            >
              {loading ? 'Processing Agents...' : 'Generate Financial Plan'}
            </button>
          </form>
        </section>

        {/* Error Messaging */}
        {error && (
          <div style={{ padding: '15px', background: '#fdeaea', color: '#c0392b', borderRadius: '8px', marginBottom: '30px', border: '1px solid #f5b7b1' }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {/* Results Section */}
        {result && (
          <section style={{ 
            marginTop: '30px', 
            background: '#fdfdfd', 
            padding: '30px', 
            borderRadius: '12px', 
            border: '1px solid #e0e0e0',
            animation: 'fadeIn 0.5s ease-in'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '20px', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
              <span style={{ fontWeight: 'bold', color: '#95a5a6' }}>VARIANT {variant} RESULT</span>
              <span style={{ color: '#95a5a6', fontSize: '0.9rem' }}>Duration: {result.duration_seconds}s</span>
            </div>
            {renderResult()}
          </section>
        )}
      </main>

      <footer style={{ marginTop: '50px', textAlign: 'center', color: '#bdc3c7', fontSize: '0.8rem' }}>
        Senior Project Backend: FastAPI | Frontend: React (Vite) | Model: Gemini-2.5-Flash
      </footer>
    </div>
  )
}

export default App