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
        background: '#fff',
        padding: '20px',
        borderRadius: '12px',
        border: '1px solid #e0e0e0',
        minHeight: '450px',
        display: 'flex',
        flexDirection: 'column'
      }}>
        {/* Header with Title, Estimate, and Live Timer */}
        <div style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>
          <div style={{ fontWeight: 'bold', color: '#2c3e50', fontSize: '1rem' }}>
            Variant {v}: {config.title}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
            <span style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>Est: {config.est}</span>
            <span style={{ fontSize: '0.85rem', fontWeight: 'bold', color: data ? '#27ae60' : '#3498db' }}>
              {data ? `Done: ${data.duration_seconds}s` : loading ? `Timer: ${secondsElapsed}s` : ''}
            </span>
          </div>
        </div>

        {loading && !data && !error && (
          <div style={{ color: '#3498db', fontStyle: 'italic', textAlign: 'center', marginTop: '40px' }}>
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
            
            {(v === 'A' || v === 'B') ? (
              <div className="markdown-container">
                <ReactMarkdown>{typeof data.result === 'string' ? data.result : "No data available"}</ReactMarkdown>
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {/* Agent 3 section */}
                <div style={{ borderBottom: '1px solid #eee', paddingBottom: '15px' }}>
                  <h4 style={{ color: '#2980b9', marginBottom: '8px', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                    📍 Agent 3: Optimized Strategy
                  </h4>
                  <div style={{ maxHeight: '300px', overflowY: 'auto', background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #eaedf0' }}>
                    {Array.isArray(data.result?.agent_3?.optimized_plan) ? (
                      data.result.agent_3.optimized_plan.map((item, index) => (
                        <div key={index} style={{ marginBottom: '15px', borderBottom: '1px solid #e0e0e0', paddingBottom: '10px' }}>
                          <div style={{ fontWeight: 'bold', color: '#2c3e50', fontSize: '0.9rem' }}>{item.heuristic}</div>
                          <div style={{ fontSize: '0.9rem', color: '#333', marginTop: '4px' }}>
                            <ReactMarkdown>{item.recommendation}</ReactMarkdown>
                          </div>
                          {item.monthly_impact !== "N/A" && (
                            <div style={{ fontSize: '0.8rem', color: '#7f8c8d', marginTop: '4px' }}>Impact: {item.monthly_impact}</div>
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
                  <h4 style={{ color: '#27ae60', marginBottom: '8px', fontSize: '0.9rem', textTransform: 'uppercase' }}>
                    ✅ Agent 4: Final Summary
                  </h4>
                  <div style={{ padding: '0 5px' }}>
                    <ReactMarkdown>
                      {data.result?.agent_4?.user_facing_summary || "Summary data missing..."}
                    </ReactMarkdown>
                  </div>
                </div>

                <details style={{ marginTop: 'auto', background: '#f1f1f1', borderRadius: '6px', overflow: 'hidden' }}>
                  <summary style={{ padding: '10px', cursor: 'pointer', fontSize: '0.8rem', color: '#7f8c8d', fontWeight: 'bold' }}>View Full JSON</summary>
                  <pre style={{ fontSize: '0.75rem', padding: '10px', maxHeight: '150px', overflowY: 'auto', background: '#2c3e50', color: '#ecf0f1', margin: 0 }}>
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
    <div style={{ padding: '40px 20px', maxWidth: '1500px', margin: '0 auto', fontFamily: 'sans-serif', backgroundColor: '#787777', minHeight: '100vh' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1>Side-by-Side Comparison Demo: Variants A-D</h1>
        <p>Input a persona to compare the differences between each variant's response.</p>
      </header>

      <section style={{ marginBottom: '40px', background: 'white', padding: '25px', borderRadius: '12px', boxShadow: '0 2px 10px rgba(0,0,0,0.05)', maxWidth: '800px', margin: '0 auto 40px auto' }}>
        <form onSubmit={handleSubmit}>
          <textarea
            placeholder="Input a persona/financial situation"
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            required
            style={{ width: '100%', height: '100px', padding: '12px', borderRadius: '6px', border: '1px solid #ccc', marginBottom: '15px', boxSizing: 'border-box' }}
          />
          <button
            type="submit"
            disabled={loading || !persona}
            style={{ width: '100%', padding: '15px', backgroundColor: loading ? '#bdc3c7' : '#3498db', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: loading ? 'default' : 'pointer' }}
          >
            {loading ? `Running All Pipelines (${secondsElapsed}s)...` : 'Run Comparison'}
          </button>
        </form>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px' }}>
        {['A', 'B', 'C', 'D'].map(v => renderCard(v))}
      </div>
    </div>
  );
}

export default App;