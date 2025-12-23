/**
 * Forensics API integration for image provenance and manipulation detection
 */

export async function analyzeForensics({ imageUrl }) {
  const baseUrl = import.meta.env.VITE_FORENSICS_API_BASE_URL;
  
  if (!baseUrl) {
    console.warn('VITE_FORENSICS_API_BASE_URL not configured - skipping forensics analysis');
    return null;
  }

  try {
    const response = await fetch(`${baseUrl}/api/analyze`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ imageUrl }),
      timeout: 30000
    });

    if (!response.ok) {
      console.warn(`Forensics API returned ${response.status}`);
      return null;
    }

    return await response.json();
  } catch (error) {
    console.warn('Forensics API call failed:', error.message);
    return null;
  }
}