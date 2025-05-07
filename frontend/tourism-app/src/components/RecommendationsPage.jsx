import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRecommendations } from '../redux/actions/recommendationsActions';
import { default as RecommendationSection } from './RecommendationSection';
import { default as LoadingSpinner } from './LoadingSpinner';
import { default as ErrorAlert } from './ErrorAlert';
import './recommendationsPage.css';

// Debug: Confirm imports
console.log('Imported RecommendationSection:', RecommendationSection, typeof RecommendationSection);
console.log('Imported LoadingSpinner:', LoadingSpinner, typeof LoadingSpinner);
console.log('Imported ErrorAlert:', ErrorAlert, typeof ErrorAlert);
console.log('RecommendationsPage component loaded');

const RecommendationsPage = () => {
  const dispatch = useDispatch();
  // Select recommendations with fallback
  const { recommendations = {}, loading = false, error = null } =
    useSelector((state) => state.recommendations || {});

  // Debug: Log the state
  useEffect(() => {
    console.log('Selected recommendations state:', { recommendations, loading, error });
  }, [recommendations, loading, error]);

  useEffect(() => {
    dispatch(fetchRecommendations());
  }, [dispatch]);

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert error={error} />;

  // Ensure recommendations is defined before rendering sections
  if (!recommendations || Object.keys(recommendations).length === 0) {
    return <ErrorAlert error="No recommendations available." />;
  }

  return (
    <div className="container py-5">
      <h1 className="text-center mb-5" style={{ color: '#1a3c34' }}>
        Your Personalized Recommendations
      </h1>
      <RecommendationSection
        title="Recommended Circuits"
        items={recommendations.circuit || []}
        entityType="circuit"
      />
      <RecommendationSection
        title="Recommended Hotels"
        items={recommendations.hotel || []}
        entityType="hotel"
      />
      <RecommendationSection
        title="Recommended Guest Houses"
        items={recommendations.guest_house || []}
        entityType="guest_house"
      />
      <RecommendationSection
        title="Recommended Restaurants"
        items={recommendations.restaurant || []}
        entityType="restaurant"
      />
      <RecommendationSection
        title="Recommended Activities"
        items={recommendations.activity || []}
        entityType="activity"
      />
      <RecommendationSection
        title="Recommended Museums"
        items={recommendations.museum || []}
        entityType="museum"
      />
      <RecommendationSection
        title="Recommended Festivals"
        items={recommendations.festival || []}
        entityType="festival"
      />
      <RecommendationSection
        title="Recommended Archaeological Sites"
        items={recommendations.archaeological_site || []}
        entityType="archaeological_site"
      />
    </div>
  );
};

// Debug: Confirm export
console.log('Exporting RecommendationsPage:', RecommendationsPage, typeof RecommendationsPage);

export default RecommendationsPage;