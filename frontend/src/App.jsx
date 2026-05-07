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

    // Launch all 4 requests simultaneously
    const requests = variants.map(async (v) => {
      try {
        const data = await runAgentPipeline(v, persona);
        setResults(prev => ({ ...prev, [v]: data }));
      } catch (err) {
        setErrors(prev => ({ ...prev, [v]: err.message }));
      }
    });

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
        display: 'flex',
        flexDirection: 'column',
        gap: '15px'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '20px', fontWeight: 'bold', borderBottom: '1px solid #eee', paddingBottom: '10px' }}>
          <span>VARIANT {v}</span>
          {data && <span style={{ fontSize: '0.8rem', color: '#95a5a6' }}>{data.duration_seconds}s</span>}
        </div>

        {loading && !data && !error && <div style={{ color: '#3498db', fontStyle: 'italic' }}>Processing...</div>}
        
        {error && <div style={{ color: '#c0392b', fontSize: '0.9rem' }}>Error: {error}</div>}

        {data && (
          <div style={{ fontSize: '0.95rem', lineHeight: '1.5' }}>
            {/* Logic to handle Variant A/B (string) vs C/D (JSON) */}
            {(v === 'A' || v === 'B') ? (
              <div style={{ whiteSpace: 'pre-wrap' }}>{data.result}</div>
            ) : (
              <div>
                <p><strong>Agent 4 Strategy:</strong></p>
                <p>{data.result?.agent_4?.user_facing_summary?.substring(0, 200)}...</p>
                <em style={{fontSize: '0.8rem', color: '#7f8c8d'}}>Full plan viewable in expanded mode (Coming next)</em>
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