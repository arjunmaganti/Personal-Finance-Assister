import { useState } from 'react'
import { runAgentPipeline } from './api'

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
          <div style={{ fontSize: '0.95rem', lineHeight: '1.6', color: '#333' }}>
            {/* Logic to handle Variant A/B (string) vs C/D (JSON Object) */}
            {(v === 'A' || v === 'B') ? (
              <div style={{ whiteSpace: 'pre-wrap' }}>
                {/* Check if data.result exists, otherwise fallback to a string check */}
                {typeof data.result === 'string' ? data.result : JSON.stringify(data.result)}
              </div>
            ) : (
              <div>
                <p style={{ fontWeight: 'bold', color: '#2c3e50', marginBottom: '5px' }}>Final Strategy Summary:</p>
                <div style={{ background: '#f9f9f9', padding: '10px', borderRadius: '6px', borderLeft: '4px solid #27ae60' }}>
                  {data.result?.agent_4?.user_facing_summary || "Processing complex plan..."}
                </div>
                <p style={{ fontSize: '0.8rem', color: '#7f8c8d', marginTop: '15px' }}>
                  Click to expand for full JSON and QC report.
                </p>
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