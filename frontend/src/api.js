const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export const runAgentPipeline = async (variant, persona) => {
  // Construct the endpoint mapping
  const endpoints = {
    'A': '/run/variant_a',
    'B': '/run/variant_b',
    'C': '/run/sequential',
    'D': '/run/hierarchical'
  };

  const response = await fetch(`${API_BASE_URL}${endpoints[variant]}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ persona })
  });

  if (!response.ok) {
    throw new Error(`Server error: ${response.statusText}`);
  }
  return response.json();
};

  try {
    const response = await fetch(`${API_BASE_URL}${endpointMap[variant]}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ persona }),
    });

    if (!response.ok) {
      // Handle the 429 Resource Exhausted error specifically
      if (response.status === 429) {
        throw new Error("Gemini API limit reached. Please wait 60 seconds before trying again.");
      }
      
      const errorData = await response.json();
      throw new Error(errorData.detail || "An unexpected error occurred.");
    }

    return await response.json();
  } catch (error) {
    console.error("API Error:", error);
    throw error;
  }
;