export default async function handler(req, res) {
  // Ensure this exact variable name is saved in Vercel Settings > Environment Variables
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  const placeId = 'ChIJ53WcipXPsGoRUNlQs7FYfE4';
  
  // Use the Places API (New) endpoint
  const endpoint = `https://places.googleapis.com/v1/places/${placeId}`;

  try {
    const response = await fetch(endpoint, {
      method: 'GET',
      headers: {
        'X-Goog-Api-Key': apiKey,
        // The FieldMask is strictly required for the New Places API
        'X-Goog-FieldMask': 'rating,userRatingCount,reviews'
      }
    });

    const data = await response.json();

    // The New API returns standard HTTP status codes
    if (!response.ok) {
      return res.status(400).json({ error: data.error?.message || 'Google API Error' });
    }

    // Cache the response at the edge for 24 hours
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=86400');
    
    // Filter for 5-star reviews
    const fiveStarReviews = (data.reviews || []).filter(review => review.rating === 5);
    
    // Map the new API structure to match your existing frontend code
    const formattedReviews = fiveStarReviews.map(review => ({
      author_name: review.authorAttribution?.displayName,
      profile_photo_url: review.authorAttribution?.photoUri,
      text: review.text?.text,
      rating: review.rating
    }));
    
    res.status(200).json({
        rating: data.rating,
        total: data.userRatingCount,
        reviews: formattedReviews
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
}
