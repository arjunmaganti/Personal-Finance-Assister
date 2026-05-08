import { useState } from 'react'
import { runAgentPipeline } from './api'
import ReactMarkdown from 'react-markdown';

function App() {
  const [persona, setPersona] = useState('');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState({});
  const [errors, setErrors] = useState({});
  const [secondsElapsed, setSecondsElapsed] = useState(0);

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

  // --- LOGIC CHANGE: COMBINED COPY ---
  const handleCopy = (v) => {
    const data = results[v];
    if (!data) return;
    
    let textToCopy = "";

    if (v === 'A' || v === 'B') {
      // Simple string copy
      textToCopy = typeof data.result === 'string' ? data.result : data.result?.result;
    } else {
      // Combined Multi-Agent copy
      const plan = data.result?.agent_3?.optimized_plan;
      const summary = data.result?.agent_4?.user_facing_summary || "";
      
      let planText = "STRATEGY:\n";
      if (Array.isArray(plan)) {
        planText += plan.map(item => `- ${item.heuristic}: ${item.recommendation}`).join('\n');
      } else {
        planText += plan || "No plan details available.";
      }

      textToCopy = `${planText}\n\nFINAL SUMMARY:\n${summary}`;
    }

    navigator.clipboard.writeText(textToCopy);
    alert(`Variant ${v} (Full Strategy & Summary) copied to clipboard!`);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setErrors({});
    setResults({});
    setSecondsElapsed(0);
    const timer = setInterval(() => setSecondsElapsed((prev) => prev + 1), 1000);

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
        boxShadow: '0 8px 16px rgba(0,0,0,0.3)',
        minHeight: '450px',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative' 
      }}>
        {data && (
          <button 
            onClick={() => handleCopy(v)}
            style={{
              position: 'absolute', top: '15px', right: '15px',
              background: colors.stone, border: 'none', borderRadius: '4px',
              padding: '6px 10px', cursor: 'pointer', fontSize: '0.7rem',
              color: colors.oak, fontWeight: 'bold', boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
            }}
          >
            COPY ALL
          </button>
        )}

        <div style={{ borderBottom: `1px solid ${colors.stone}`, paddingBottom: '12px', marginBottom: '20px', paddingRight: '60px' }}>
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
          <div style={{ color: '#c0392b', fontSize: '0.9rem', background: '#fdf2f2', padding: '12px', borderRadius: '8px' }}>
            {error}
          </div>
        )}

        {data && (
          <div style={{ fontSize: '0.95rem', lineHeight: '1.7', color: colors.espresso, flex: 1, display: 'flex', flexDirection: 'column' }}>
            {(v === 'A' || v === 'B') ? (
              <ReactMarkdown>{typeof data.result === 'string' ? data.result : data.result?.result}</ReactMarkdown>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                <div>
                  <h4 style={{ color: '#2980b9', fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '8px' }}>Optimized Strategy</h4>
                  <div style={{ maxHeight: '250px', overflowY: 'auto', background: '#fff9f0', padding: '12px', borderRadius: '8px', border: `1px solid ${colors.stone}` }}>
                    {Array.isArray(data.result?.agent_3?.optimized_plan) ? 
                      data.result.agent_3.optimized_plan.map((item, i) => (
                        <div key={i} style={{marginBottom: '10px', borderBottom: i !== data.result.agent_3.optimized_plan.length -1 ? `1px solid ${colors.stone}` : 'none', paddingBottom: '5px'}}>
                          <strong>{item.heuristic}:</strong> {item.recommendation}
                        </div>
                      )) 
                      : <ReactMarkdown>{data.result?.agent_3?.optimized_plan}</ReactMarkdown>}
                  </div>
                </div>
                <div>
                  <h4 style={{ color: colors.sage, fontSize: '0.85rem', textTransform: 'uppercase', marginBottom: '8px' }}>Final Summary</h4>
                  <ReactMarkdown>{data.result?.agent_4?.user_facing_summary}</ReactMarkdown>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  return (
    <div style={{ 
      width: '100vw', minHeight: '100vh', backgroundColor: colors.oak, 
      backgroundImage: 'linear-gradient(rgba(0,0,0,0.5), rgba(0,0,0,0.5)), url("https://www.transparenttextures.com/patterns/dark-wood.png")',
      display: 'flex', justifyContent: 'center', fontFamily: '"Garamond", "Georgia", serif'
    }}>
      <div style={{ 
        width: '95%', maxWidth: '2500px', padding: '60px 0', 
        display: 'flex', flexDirection: 'column', alignItems: 'center' 
      }}>
        <header style={{ textAlign: 'center', marginBottom: '40px' }}>
          <h1 style={{ color: colors.cream, fontSize: 'clamp(2rem, 5vw, 3.5rem)', textShadow: '2px 2px 4px rgba(0,0,0,0.6)', marginBottom: '15px' }}>Side-by-Side Comparison Demo: Variants A-D</h1>
          <p style={{ color: colors.stone, fontSize: 'clamp(1rem, 2vw, 1.3rem)', fontStyle: 'italic' }}>Input a persona to compare the differences between each variant's response.</p>
        </header>

        <section style={{ 
          marginBottom: '50px', background: colors.cream, padding: '30px', borderRadius: '16px', 
          boxShadow: '0 12px 30px rgba(0,0,0,0.4)', width: '100%', maxWidth: '900px', border: `1px solid ${colors.stone}`
        }}>
          <form onSubmit={handleSubmit}>
            <textarea
              placeholder="Input a persona/financial situation"
              value={persona}
              onChange={(e) => setPersona(e.target.value)}
              required
              style={{ width: '100%', height: '120px', padding: '15px', borderRadius: '8px', border: `2px solid ${colors.stone}`, boxSizing: 'border-box', fontFamily: 'inherit', fontSize: '1.1rem', backgroundColor: '#fffcf5', color: colors.espresso }}
            />
            <button
              type="submit"
              disabled={loading || !persona}
              style={{ width: '100%', padding: '18px', marginTop: '15px', backgroundColor: colors.terracotta, color: colors.cream, border: 'none', borderRadius: '8px', fontWeight: 'bold', fontSize: '1.2rem', cursor: loading ? 'default' : 'pointer', textTransform: 'uppercase', letterSpacing: '1px' }}
            >
              {loading ? `Running All Pipelines (${secondsElapsed}s)...` : 'Run Comparison'}
            </button>
          </form>
        </section>

        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(min(100%, 400px), 1fr))', 
          gap: '30px', width: '100%', justifyContent: 'center' 
        }}>
          {['A', 'B', 'C', 'D'].map(v => renderCard(v))}
        </div>
      </div>
    </div>
  );
}

export default App;