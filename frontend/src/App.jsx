import { useState } from 'react'
import { runAgentPipeline } from './api'
import ReactMarkdown from 'react-markdown';

function App() {
  const [persona, setPersona] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({});
  const [errors, setErrors] = useState({});
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  const variantConfig = {
    'A': { title: "Simple Prompt", est: "10-25s" },
    'B': { title: "Grounded Context", est: "15-30s" },
    'C': { title: "Sequential Pipeline", est: "95-120s" },
    'D': { title: "Hierarchical Pipeline", est: "60-100s" }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setResults({});
    setSecondsElapsed(0);

    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);

    const variants = ['A', 'B', 'C', 'D'];
    const requests = variants.map(async (v) => {
      try {
        const data = await runAgentPipeline(v, persona);
        setResults(prev => ({ ...prev, [v]: data }));
      } catch (err) {
        setErrors(prev => ({ ...prev, [v]: err.message }));
      }
    });

    await Promise.allSettled(requests);
    clearInterval(timer);
    setLoading(false);
  };

  const renderCard = (v) => {
    const data = results[v];
    const error = errors[v];
    const config = variantConfig[v];

    return (
      <div key={v} style={{
        background: '#fffaf5', // Soft cream
        padding: '25px',
        borderRadius: '16px',
        border: '1px solid #d7ccc8', // Light clay/wood border
        minHeight: '480px',
        display: 'flex',
        flexDirection: 'column',
        boxShadow: '0 8px 30px rgba(62, 39, 35, 0.1)', // Warm shadow
        textAlign: 'left' // Keep text left-aligned inside the centered card
      }}>
        {/* Card Header */}
        <div style={{ borderBottom: '2px solid #8d6e63', paddingBottom: '12px', marginBottom: '18px' }}>
          <div style={{ fontWeight: '700', color: '#3e2723', fontSize: '1.1rem', letterSpacing: '0.5px' }}>
            Variant {v}: {config.title}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8rem', color: '#6d4c41', fontWeight: '500' }}>Est: {config.est}</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: data ? '#4e342e' : '#bf360c' }}>
              {data ? `Complete: ${data.duration_seconds}s` : loading ? `Timing: ${secondsElapsed}s` : ''}
            </span>
          </div>
        </div>

        {loading && !data && !error && (
          <div style={{ color: '#8d6e63', fontStyle: 'italic', textAlign: 'center', marginTop: '60px' }}>
            <div className="tuscan-spinner">Harvesting insights...</div>
          </div>
        )}

        {error && (
          <div style={{ color: '#bf360c', fontSize: '0.9rem', background: '#ffebee', padding: '12px', borderRadius: '8px' }}>
            {error}
          </div>
        )}

        {data && (
          <div style={{ fontSize: '0.98rem', lineHeight: '1.7', color: '#4e342e', flex: 1, display: 'flex', flexDirection: 'column' }}>
            
            {(v === 'A' || v === 'B') ? (
              <div className="markdown-container">
                <ReactMarkdown>{typeof data.result === 'string' ? data.result : "No data available"}</ReactMarkdown>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '22px' }}>
                {/* Agent 3 section */}
                <div style={{ paddingBottom: '5px' }}>
                  <h4 style={{ color: '#a1887f', marginBottom: '10px', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', borderLeft: '3px solid #8d6e63', paddingLeft: '10px' }}>
                    Optimized Strategy
                  </h4>
                  <div style={{ maxHeight: '320px', overflowY: 'auto', background: '#fdf8f3', padding: '18px', borderRadius: '12px', border: '1px solid #efebe9' }}>
                    {Array.isArray(data.result?.agent_3?.optimized_plan) ? (
                      data.result.agent_3.optimized_plan.map((item, index) => (
                        <div key={index} style={{ marginBottom: '18px', borderBottom: '1px solid #d7ccc8', paddingBottom: '12px' }}>
                          <div style={{ fontWeight: 'bold', color: '#3e2723', fontSize: '0.9rem' }}>{item.heuristic}</div>
                          <div style={{ fontSize: '0.92rem', color: '#5d4037', marginTop: '6px' }}>
                            <ReactMarkdown>{item.recommendation}</ReactMarkdown>
                          </div>
                          {item.monthly_impact !== "N/A" && (
                            <div style={{ fontSize: '0.8rem', color: '#8d6e63', marginTop: '6px', fontWeight: '600' }}>Impact: {item.monthly_impact}</div>
                          )}
                        </div>
                      ))
                    ) : (
                      <ReactMarkdown>
                        {typeof data.result?.agent_3?.optimized_plan === 'string' ? data.result.agent_3.optimized_plan : "Optimized plan not found."}
                      </ReactMarkdown>
                    )}
                  </div>
                </div>

                {/* Agent 4 section */}
                <div>
                  <h4 style={{ color: '#a1887f', marginBottom: '10px', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '1px', borderLeft: '3px solid #5d4037', paddingLeft: '10px' }}>
                    Final Summary
                  </h4>
                  <div style={{ padding: '0 8px', color: '#3e2723' }}>
                    <ReactMarkdown>
                      {data.result?.agent_4?.user_facing_summary || "Summary data missing..."}
                    </ReactMarkdown>
                  </div>
                </div>

                <details style={{ marginTop: 'auto', background: '#efebe9', borderRadius: '8px', overflow: 'hidden' }}>
                  <summary style={{ padding: '12px', cursor: 'pointer', fontSize: '0.75rem', color: '#6d4c41', fontWeight: 'bold' }}>View Full JSON</summary>
                  <pre style={{ fontSize: '0.7rem', padding: '12px', maxHeight: '150px', overflowY: 'auto', background: '#3e2723', color: '#efebe9', margin: 0 }}>
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
    <div style={{ 
      padding: '60px 20px', 
      maxWidth: '1500px', 
      margin: '0 auto', 
      fontFamily: '"Georgia", serif', 
      backgroundColor: '#efebe9', // Warm earth-tone background
      backgroundImage: 'linear-gradient(rgba(255,255,255,0.4), rgba(255,255,255,0.4)), url("https://www.transparenttextures.com/patterns/wood-pattern-light.png")', // Sublte wood texture
      minHeight: '100vh',
      textAlign: 'center' // Centering all children
    }}>
      <header style={{ marginBottom: '50px' }}>
        <h1 style={{ color: '#3e2723', fontSize: '2.8rem', fontWeight: '800', marginBottom: '12px' }}>Comparison Demo: Variants A-D</h1>
        <p style={{ color: '#5d4037', fontSize: '1.2rem', fontStyle: 'italic' }}>Evaluating AI financial personas through a Tuscan lens.</p>
      </header>

      <section style={{ 
        marginBottom: '60px', 
        background: 'rgba(255, 255, 255, 0.9)', 
        padding: '35px', 
        borderRadius: '20px', 
        boxShadow: '0 10px 40px rgba(62, 39,  brown, 0.15)', 
        maxWidth: '850px', 
        margin: '0 auto 60px auto',
        border: '1px solid #d7ccc8'
      }}>
        <form onSubmit={handleSubmit}>
          <textarea
            placeholder="Describe the financial journey..."
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            required
            style={{ 
              width: '100%', 
              height: '120px', 
              padding: '18px', 
              borderRadius: '12px', 
              border: '2px solid #d7ccc8', 
              marginBottom: '20px', 
              boxSizing: 'border-box',
              fontSize: '1.1rem',
              fontFamily: '"Georgia", serif',
              backgroundColor: '#fffaf5',
              outline: 'none',
              color: '#3e2723'
            }}
          />
          <button
            type="submit"
            disabled={loading || !persona}
            style={{ 
              width: '100%', 
              padding: '18px', 
              backgroundColor: loading ? '#bcaaa4' : '#5d4037', 
              color: '#fffaf5', 
              border: 'none', 
              borderRadius: '12px', 
              fontWeight: '800', 
              fontSize: '1.1rem',
              cursor: loading ? 'default' : 'pointer',
              transition: 'all 0.3s ease',
              boxShadow: '0 4px 15px rgba(62, 39, 35, 0.2)'
            }}
          >
            {loading ? `Harvesting Comparison (${secondsElapsed}s)...` : 'Run Comparison Analysis'}
          </button>
        </form>
      </section>

      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', 
        gap: '30px',
        justifyContent: 'center', // Centers grid items
        maxWidth: '1450px',
        margin: '0 auto'
      }}>
        {['A', 'B', 'C', 'D'].map(v => renderCard(v))}
      </div>
      
      <footer style={{ marginTop: '80px', color: '#8d6e63', fontSize: '0.9rem', fontStyle: 'italic' }}>
        Tuscan Modern Advisor Framework • 2026
      </footer>
    </div>
  );
}

export default App;