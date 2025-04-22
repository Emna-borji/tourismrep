import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import axios from '../api/api'; // Adjust the path to your axios instance

const CircuitSummary = () => {
  const { id } = useParams(); // Extract the circuit ID from the URL
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchReviews = async () => {
      try {
        const response = await axios.get(`/api/tourism/reviews/`, {
          params: {
            entity_type: 'circuit',
            entity_id: id, // Use the circuit ID from the URL
          },
        });
        setReviews(response.data);
      } catch (err) {
        console.error('Error fetching reviews:', err);
        setError('Failed to load reviews. Please try again.');
      }
    };

    fetchReviews();
  }, [id]);

  return (
    <div className="max-w-5xl mx-auto p-6">
      <h1 className="text-3xl font-bold text-gray-800 mb-6">Circuit Summary</h1>
      {error && <p className="text-red-500 bg-red-100 p-4 rounded-md">{error}</p>}
      <div>
        <h2 className="text-2xl font-semibold text-gray-700 mb-4">Reviews</h2>
        {reviews.length > 0 ? (
          <ul className="space-y-4">
            {reviews.map(review => (
              <li key={review.id} className="bg-white p-4 rounded-lg shadow-md">
                <p className="text-gray-800">{review.comment}</p>
                <p className="text-sm text-gray-600">Rating: {review.rating}/5</p>
                <p className="text-sm text-gray-600">By: {review.user?.username || 'Anonymous'}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 italic">No reviews yet for this circuit.</p>
        )}
      </div>
    </div>
  );
};

export default CircuitSummary;