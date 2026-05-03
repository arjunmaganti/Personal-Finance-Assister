const API_BASE_URL = "http://localhost:8000";

/**
 * Sends a persona to a specific backend variant endpoint.
 * @param {string} variant - 'A', 'B', 'C', or 'D'
 * @param {string} persona - The financial scenario text
 */
export const runAgentPipeline = async (variant, persona) => {
  const endpointMap = {
    'A': '/run/variant-a',
    'B': '/run/variant-b',
    'C': '/run/sequential',
    'D': '/run/hierarchical',
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
};