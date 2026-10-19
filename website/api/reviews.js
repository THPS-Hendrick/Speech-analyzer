export default async function handler(req, res) {
  // Pulls the secure API key from Vercel's Environment Variables
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  
  // PASTE YOUR GOOGLE PLACE ID HERE
  const placeId = 'ChIJ53WcipXPsGoRUNlQs7FYfE4'; 
  
  const endpoint = `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&fields=name,rating,user_ratings_total,reviews&key=${apiKey}`;

  try {
    const response = await fetch(endpoint);
    const data = await response.json();

    if (data.status !== 'OK') {
      return res.status(400).json({ error: data.error_message || 'Google API Error' });
    }

    // THE MAGIC: Instructs Vercel's CDN to cache this response at the edge for 24 hours (86400 seconds)
    // This makes the frontend load instantly and protects your API billing limit.
    res.setHeader('Cache-Control', 's-maxage=86400, stale-while-revalidate=86400');
    
    // Return only the 5-star reviews to ensure maximum E-E-A-T impact
    const fiveStarReviews = data.result.reviews.filter(review => review.rating === 5);
    
    res.status(200).json({
        rating: data.result.rating,
        total: data.result.user_ratings_total,
        reviews: fiveStarReviews
    });
    
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch reviews' });
  }
}
