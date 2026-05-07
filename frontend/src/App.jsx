import { useState, useEffect } from 'react'
import { runAgentPipeline } from './api'
import ReactMarkdown from 'react-markdown'

function App() {
  const [persona, setPersona] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({});
  const [errors, setErrors] = useState({});
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  const variantConfig = {
    'A': { title: "Simple Prompt (Zero-Shot)", est: "10-25s" },
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

  const renderAgent3Plan = (plan) => {
    if (!plan) return <p>No plan data found.</p>;
    if (!Array.isArray(plan)) {
      return <ReactMarkdown>{typeof plan === 'string' ? plan : JSON.stringify(plan)}</ReactMarkdown>;
    }

    return plan.map((item, index) => (
      <div key={index} style={{ marginBottom: '15px', borderBottom: '1px solid #e0e0e0', paddingBottom: '10px' }}>
        <div style={{ fontWeight: 'bold', color: '#2c3e50', fontSize: '0.9rem' }}>
          {item.heuristic || "Recommendation"}
        </div>
        <div style={{ fontSize: '0.9rem', color: '#333', marginTop: '4px' }}>
          <ReactMarkdown>{item.recommendation || ""}</ReactMarkdown>
        </div>
        {item.monthly_impact && item.monthly_impact !== "N/A" && (
          <div style={{ fontSize: '0.8rem', color: '#7f8c8d', marginTop: '4px' }}>
            Impact: {item.monthly_impact}
          </div>
        )}
      </div>
    ));
  };

  const renderCard = (v) => {
    const data = results[v];
    const error = errors[v];
    const config = variantConfig[v];

    return (
      <div key={v} style={{ 
        background: '#fff', padding: '20px', borderRadius: '12px', border: '1px solid #e0e0e0',
        minHeight: '500px', display: 'flex', flexDirection: 'column', boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
      }}>
        {/* Card Header */}
        <div style={{ borderBottom: '1px solid #eee', paddingBottom: '10px', marginBottom: '15px' }}>
          <div style={{ fontWeight: 'bold', color: '#2c3e50', fontSize: '1rem' }}>
            Variant {v}: {config.title}
          </div>
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '5px' }}>
            <span style={{ fontSize: '0.8rem', color: '#7f8c8d' }}>Est: {config.est}</span>
            <span style={{ fontSize: '0.9rem', fontWeight: '600', color: data ? '#27ae60' : '#3498db' }}>
              {data ? `Done: ${data.duration_seconds}s` : loading ? `Running: ${secondsElapsed}s` : 'Waiting'}
            </span>
          </div>
        </div>

        {loading && !data && !error && (
          <div style={{ textAlign: 'center', marginTop: '50px', color: '#3498db' }}>
            <div style={{ fontSize: '2rem', marginBottom: '10px' }}>⚙️</div>
            <div style={{ fontStyle: 'italic', fontSize: '0.9rem' }}>AI Processing...</div>
          </div>
        )}

        {error && (
          <div style={{ color: '#c0392b', fontSize: '0.85rem', background: '#fdf2f2', padding: '12px', borderRadius: '6px' }}>
            <strong>Error:</strong> {error}
          </div>
        )}

        {data && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
            {/* Logic for A & B (Simple Text) */}
            {(v === 'A' || v === 'B') ? (
              <div style={{ fontSize: '0.95rem', lineHeight: '1.6' }}>
                <ReactMarkdown>
                  {typeof data.result === 'string' ? data.result : (data.result?.result || "No response text found.")}
                </ReactMarkdown>
              </div>
            ) : (
              /* Logic for C & D (Multi-Agent) */
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <section>
                  <h4 style={{ color: '#2980b9', marginBottom: '8px', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    📍 Agent 3: Optimized Strategy
                  </h4>
                  <div style={{ maxHeight: '350px', overflowY: 'auto', background: '#f8f9fa', padding: '15px', borderRadius: '8px', border: '1px solid #eaedf0' }}>
                    {renderAgent3Plan(data.result?.agent_3?.optimized_plan)}
                  </div>
                </section>

                <section>
                  <h4 style={{ color: '#27ae60', marginBottom: '8px', fontSize: '0.85rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                    ✅ Agent 4: Final Summary
                  </h4>
                  <div style={{ fontSize: '0.95rem', lineHeight: '1.5', padding: '0 5px' }}>
                    <ReactMarkdown>
                      {data.result?.agent_4?.user_facing_summary || "Summary data missing from response."}
                    </ReactMarkdown>
                  </div>
                </section>

                <details style={{ marginTop: 'auto', background: '#f1f1f1', borderRadius: '6px' }}>
                  <summary style={{ padding: '8px', cursor: 'pointer', fontSize: '0.75rem', color: '#7f8c8d' }}>View Raw JSON</summary>
                  <pre style={{ fontSize: '0.7rem', padding: '10px', maxHeight: '150px', overflowY: 'auto', background: '#2c3e50', color: '#ecf0f1', margin: 0 }}>
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
    <div style={{ padding: '40px 20px', maxWidth: '1600px', margin: '0 auto', fontFamily: 'system-ui, sans-serif', backgroundColor: '#f4f7f6', minHeight: '100vh' }}>
      <header style={{ textAlign: 'center', marginBottom: '40px' }}>
        <h1 style={{ color: '#2c3e50', fontSize: '2.5rem', marginBottom: '10px' }}>Financial Advisory AI</h1>
        <p style={{ color: '#7f8c8d', fontSize: '1.1rem' }}>Multi-Agent Context Engineering Performance Benchmarking</p>
      </header>

      <section style={{ maxWidth: '900px', margin: '0 auto 50px auto', background: '#fff', padding: '30px', borderRadius: '16px', boxShadow: '0 4px 20px rgba(0,0,0,0.08)' }}>
        <form onSubmit={handleSubmit}>
          <textarea 
            placeholder="e.g. Near-retiree, high net worth, significant credit card debt..."
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            required
            style={{ width: '100%', height: '120px', padding: '15px', borderRadius: '10px', border: '1px solid #dcdfe6', marginBottom: '20px', fontSize: '1rem', boxSizing: 'border-box' }}
          />
          <button 
            type="submit" 
            disabled={loading || !persona}
            style={{ 
              width: '100%', padding: '16px', backgroundColor: loading ? '#bdc3c7' : '#3498db', 
              color: 'white', border: 'none', borderRadius: '10px', fontWeight: 'bold', 
              fontSize: '1.1rem', cursor: loading ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? `Generating Comparison (${secondsElapsed}s)...` : 'Run Side-by-Side Comparison'}
          </button>
        </form>
      </section>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '25px', alignItems: 'start' }}>
        {['A', 'B', 'C', 'D'].map(v => renderCard(v))}
      </div>
    </div>
  );
}

export default App;