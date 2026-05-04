console.log("VITE_API_URL check:", import.meta.env.VITE_API_URL);

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const runAgentPipeline = async (variant, persona) => {
  const endpoints = {
    'A': '/run/variant-a',
    'B': '/run/variant-b',
    'C': '/run/sequential',
    'D': '/run/hierarchical'
  };

  try {
    const response = await fetch(`${API_BASE_URL}${endpoints[variant]}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ persona }),
    });

    if (!response.ok) {
      // Handle Rate Limiting (Gemini Free Tier often hits this)
      if (response.status === 429) {
        throw new Error("Gemini API limit reached. Please wait 60 seconds before trying again.");
      }
      
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Server error: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
};