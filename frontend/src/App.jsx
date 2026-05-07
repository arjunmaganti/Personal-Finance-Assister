import { useState } from 'react'
import { runAgentPipeline } from './api'
import ReactMarkdown from 'react-markdown';

function App() {
  const [persona, setPersona] = useState('');
  const [loading, setLoading] = useState(false);
  // Now stores results for all variants: { A: data, B: data, ... }
  const [results, setResults] = useState({}); 
  const [errors, setErrors] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setResults({});

    const variants = ['A', 'B', 'C', 'D'];

    // We create an array of promises
    const requests = variants.map(async (v) => {
      try {
        const data = await runAgentPipeline(v, persona);
        // Use functional update to ensure we don't lose other variants' data
        setResults(prev => ({ 
          ...prev, 
          [v]: data 
        }));
      } catch (err) {
        setErrors(prev => ({ 
          ...prev, 
          [v]: err.message 
        }));
      }
    });

    // Wait for all to settle
    await Promise.allSettled(requests);
    setLoading(false);
  };

const renderCard = (v) => {
    const data = results[v];
    const error = errors[v];

    return (
      <div key={v} style={{ 
        background: '#fff', 
        padding: '20px', 
        borderRadius: '12px', 
        border: '1px solid #e0e0e0',
        minHeight: '400px', // Ensures cards have consistent height
        display: 'flex',
        flexDirection: 'column'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', fontWeight: 'bold', borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>
          <span>VARIANT {v}</span>
          {data && <span style={{ fontSize: '0.8rem', color: '#95a5a6' }}>{data.duration_seconds}s</span>}
        </div>

        {/* Loading State for individual card */}
        {loading && !data && !error && (
          <div style={{ color: '#3498db', fontStyle: 'italic', textAlign: 'center', marginTop: '20px' }}>
            AI is thinking...
          </div>
        )}
        
        {error && (
          <div style={{ color: '#c0392b', fontSize: '0.9rem', background: '#fdf2f2', padding: '10px', borderRadius: '4px' }}>
            {error}
          </div>
        )}

        {data && (
  <div style={{ fontSize: '0.95rem', lineHeight: '1.6', color: '#333', flex: 1, display: 'flex', flexDirection: 'column' }}>
    
    {/* Variants A & B: Direct Markdown */}
    {(v === 'A' || v === 'B') ? (
      <div className="markdown-container">
        <ReactMarkdown>{typeof data.result === 'string' ? data.result : "No data available"}</ReactMarkdown>
      </div>
    ) : (
      /* Variants C & D: Multi-Agent Deep Dive */
      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        
        {/* Agent 3: The Optimized Plan */}
        <div style={{ borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
          <h4 style={{ color: '#2980b9', marginBottom: '8px', fontSize: '0.9rem', textTransform: 'uppercase' }}>
            📍 Agent 3: Optimized Strategy
          </h4>
          <div style={{ maxHeight: '300px', overflowY: 'auto', background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #eaedf0' }}>
            <ReactMarkdown>
              {/* This assumes your Agent 3 output is in result.agent_3.response or similar */}
              {data.result?.agent_3?.optimized_plan || data.result?.agent_3?.response || "Plan data missing..."}
            </ReactMarkdown>
          </div>
        </div>

        {/* Agent 4: The Summary */}
        <div>
          <h4 style={{ color: '#27ae60', marginBottom: '8px', fontSize: '0.9rem', textTransform: 'uppercase' }}>
            ✅ Agent 4: Final Summary
          </h4>
          <div style={{ padding: '0 5px' }}>
            <ReactMarkdown>
              {data.result?.agent_4?.user_facing_summary || "Summary data missing..."}
            </ReactMarkdown>
          </div>
        </div>

        {/* Expandable Debug Section */}
        <details style={{ marginTop: 'auto', background: '#f1f1f1', borderRadius: '6px', overflow: 'hidden' }}>
          <summary style={{ padding: '10px', cursor: 'pointer', fontSize: '0.8rem', color: '#7f8c8d', fontWeight: 'bold' }}>
            View Full Pipeline JSON
          </summary>
          <pre style={{ 
            fontSize: '0.75rem', 
            padding: '10px', 
            maxHeight: '200px', 
            overflowY: 'auto', 
            margin: 0,
            background: '#2c3e50',
            color: '#ecf0f1'
          }}>
            {JSON.stringify(data.result, null, 2)}
          </pre>
        </details>
      </div>
    )}
  </div>
)}
      </div>
    );
  };

  return (
    <div style={{ padding: '40px 20px', maxWidth: '1400px', margin: '0 auto', fontFamily: 'sans-serif' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1>Financial Advisory AI: Side-by-Side Comparison</h1>
        <p>Input a persona to see how different context engineering strategies perform.</p>
      </header>

      <section style={{ marginBottom: '40px', background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)' }}>
        <form onSubmit={handleSubmit}>
          <textarea 
            placeholder="Describe the financial situation..."
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            required
            style={{ width: '100%', height: '100px', padding: '12px', borderRadius: '6px', border: '1px solid #ccc', marginBottom: '15px' }}
          />
          <button 
            type="submit" 
            disabled={loading || !persona}
            style={{ width: '100%', padding: '15px', backgroundColor: '#3498db', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }}
          >
            {loading ? 'Running All Pipelines...' : 'Run Comparison'}
          </button>
        </form>
      </section>

      {/* Side-by-Side Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', 
        gap: '20px' 
      }}>
        {['A', 'B', 'C', 'D'].map(v => renderCard(v))}
      </div>
    </div>
  );
}

export default App;