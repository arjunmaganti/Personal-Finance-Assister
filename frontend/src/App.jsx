import { useState } from 'react'
import { runAgentPipeline } from './api'
import ReactMarkdown from 'react-markdown';

function App() {
  const [persona, setPersona] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({});
  const [errors, setErrors] = useState({});
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  // Tuscan-Modern Color Palette
  const colors = {
    espresso: '#3d2b1f',
    terracotta: '#a0522d',
    cream: '#fdf5e6',
    sage: '#6b8e23',
    stone: '#d2b48c',
    oak: '#4b3621'
  };

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
        background: colors.cream,
        padding: '25px',
        borderRadius: '16px',
        borderLeft: `6px solid ${colors.terracotta}`,
        boxShadow: '0 8px 16px rgba(0,0,0,0.2)',
        minHeight: '480px',
        display: 'flex',
        flexDirection: 'column',
        transition: 'transform 0.2s ease-in-out'
      }}>
        {/* Header with Title, Estimate, and Live Timer */}
        <div style={{ borderBottom: `1px solid ${colors.stone}`, paddingBottom: '12px', marginBottom: '20px' }}>
          <div style={{ fontWeight: 'bold', color: colors.oak, fontSize: '1.1rem', letterSpacing: '0.5px' }}>
            Variant {v}: {config.title}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '8px' }}>
            <span style={{ fontSize: '0.85rem', color: colors.terracotta, fontStyle: 'italic' }}>Est: {config.est}</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: data ? colors.sage : '#3498db' }}>
              {data ? `Done: ${data.duration_seconds}s` : loading ? `Timer: ${secondsElapsed}s` : ''}
            </span>
          </div>
        </div>

        {loading && !data && !error && (
          <div style={{ color: colors.terracotta, fontStyle: 'italic', textAlign: 'center', marginTop: '60px' }}>
             Processing...
          </div>
        )}

        {error && (
          <div style={{ color: '#c0392b', fontSize: '0.9rem', background: '#fdf2f2', padding: '12px', borderRadius: '8px', border: '1px solid #efcccc' }}>
            {error}
          </div>
        )}

        {data && (
          <div style={{ fontSize: '0.95rem', lineHeight: '1.7', color: colors.espresso, flex: 1, display: 'flex', flexDirection: 'column' }}>
            
            {(v === 'A' || v === 'B') ? (
              <div className="markdown-container">
                <ReactMarkdown>{typeof data.result === 'string' ? data.result : "No data available"}</ReactMarkdown>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>
                {/* Agent 3 section */}
                <div style={{ borderBottom: `1px solid ${colors.stone}`, paddingBottom: '18px' }}>
                  <h4 style={{ color: '#2980b9', marginBottom: '10px', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Optimized Strategy
                  </h4>
                  <div style={{ maxHeight: '300px', overflowY: 'auto', background: '#fff9f0', padding: '15px', borderRadius: '10px', border: `1px solid ${colors.stone}` }}>
                    {Array.isArray(data.result?.agent_3?.optimized_plan) ? (
                      data.result.agent_3.optimized_plan.map((item, index) => (
                        <div key={index} style={{ marginBottom: '15px', borderBottom: `1px solid ${colors.stone}`, paddingBottom: '10px' }}>
                          <div style={{ fontWeight: 'bold', color: colors.oak, fontSize: '0.9rem' }}>{item.heuristic}</div>
                          <div style={{ fontSize: '0.9rem', color: colors.espresso, marginTop: '5px' }}>
                            <ReactMarkdown>{item.recommendation}</ReactMarkdown>
                          </div>
                          {item.monthly_impact !== "N/A" && (
                            <div style={{ fontSize: '0.8rem', color: colors.terracotta, marginTop: '6px', fontWeight: 'bold' }}>Impact: {item.monthly_impact}</div>
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
                  <h4 style={{ color: colors.sage, marginBottom: '10px', fontSize: '0.95rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                    Final Summary
                  </h4>
                  <div style={{ padding: '0 5px' }}>
                    <ReactMarkdown>
                      {data.result?.agent_4?.user_facing_summary || "Summary data missing..."}
                    </ReactMarkdown>
                  </div>
                </div>

                <details style={{ marginTop: 'auto', background: colors.stone, borderRadius: '8px', overflow: 'hidden' }}>
                  <summary style={{ padding: '12px', cursor: 'pointer', fontSize: '0.8rem', color: colors.oak, fontWeight: 'bold' }}>View Full JSON</summary>
                  <pre style={{ fontSize: '0.75rem', padding: '12px', maxHeight: '150px', overflowY: 'auto', background: colors.oak, color: colors.cream, margin: 0 }}>
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
      maxWidth: '100%', 
      margin: '0 auto', 
      fontFamily: '"Garamond", "Georgia", serif', 
      backgroundColor: colors.oak, 
      backgroundImage: 'linear-gradient(rgba(0, 0, 0, 0.4), rgba(0, 0, 0, 0.4)), url("https://www.transparenttextures.com/patterns/dark-wood.png")',
      minHeight: '100vh',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <div style={{ maxWidth: '3000px', width: '100%' }}>
        <header style={{ textAlign: 'center', marginBottom: '50px' }}>
          <h1 style={{ color: colors.cream, fontSize: '3rem', textShadow: '2px 2px 4px rgba(0,0,0,0.5)', marginBottom: '15px' }}>Side-by-Side Comparison Demo: Variants A-D</h1>
          <p style={{ color: colors.stone, fontSize: '1.2rem', fontStyle: 'italic' }}>Input a persona to compare the differences between each variant's response.</p>
        </header>

        <section style={{ 
          marginBottom: '60px', 
          background: colors.cream, 
          padding: '35px', 
          borderRadius: '16px', 
          boxShadow: '0 10px 25px rgba(0,0,0,0.3)', 
          maxWidth: '900px', 
          margin: '0 auto 60px auto',
          border: `1px solid ${colors.stone}`
        }}>
          <form onSubmit={handleSubmit}>
            <textarea
              placeholder="Input a persona/financial situation"
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              required
              style={{ 
                width: '100%', 
                height: '120px', 
                padding: '15px', 
                borderRadius: '8px', 
                border: `2px solid ${colors.stone}`, 
                marginBottom: '20px', 
                boxSizing: 'border-box',
                fontFamily: 'inherit',
                fontSize: '1.1rem',
                backgroundColor: '#fffcf5'
              }}
            />
            <button
              type="submit"
              disabled={loading || !persona}
              style={{ 
                width: '100%', 
                padding: '18px', 
                backgroundColor: loading ? '#bdc3c7' : colors.terracotta, 
                color: colors.cream, 
                border: 'none', 
                borderRadius: '8px', 
                fontWeight: 'bold', 
                fontSize: '1.2rem',
                cursor: loading ? 'default' : 'pointer',
                boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
                textTransform: 'uppercase',
                letterSpacing: '1px'
              }}
            >
              {loading ? `Running All Pipelines (${secondsElapsed}s)...` : 'Run Comparison'}
            </button>
          </form>
        </section>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', 
          gap: '30px',
          justifyContent: 'center'
        }}>
          {['A', 'B', 'C', 'D'].map(v => renderCard(v))}
        </div>
      </div>
    </div>
  );
}

export default App;