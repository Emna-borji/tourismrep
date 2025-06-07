import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { fetchRecommendations } from '../redux/actions/recommendationsActions';
import { fetchBestRatedEntities } from '../redux/actions/entityActions';
import RecommendationSection from './RecommendationSection';
import LoadingSpinner from './LoadingSpinner';
import ErrorAlert from './ErrorAlert';
import './recommendationsPage.css';
import HeroSection from './Shared/HeroSection';

// Debug: Confirm imports
console.log('Imported RecommendationSection:', RecommendationSection, typeof RecommendationSection);
console.log('Imported LoadingSpinner:', LoadingSpinner, typeof LoadingSpinner);
console.log('Imported ErrorAlert:', ErrorAlert, typeof ErrorAlert);
console.log('Imported HeroSection:', HeroSection, typeof HeroSection);
console.log('RecommendationsPage component loaded');

const RecommendationsPage = () => {
  const dispatch = useDispatch();
  const { recommendations = {}, loading: recLoading, error: recError } =
    useSelector((state) => state.recommendations || {});
  const { bestRatedEntities = {}, loading: bestLoading, error: bestError } =
    useSelector((state) => state.entities || {});
  const { userInfo } = useSelector((state) => state.auth || {});

  useEffect(() => {
    console.log('Recommendations state:', recommendations);
    console.log('BestRatedEntities state:', bestRatedEntities);
    if (userInfo) {
      dispatch(fetchRecommendations());
    } else {
      dispatch(fetchBestRatedEntities());
    }
  }, [dispatch, userInfo]);

  const loading = recLoading || bestLoading;
  const error = recError || bestError;

  if (loading) return <LoadingSpinner />;
  if (error) return <ErrorAlert error={error} />;

  const dataToUse = userInfo ? recommendations : bestRatedEntities;
  console.log('Data to use:', dataToUse);

  // Check if dataToUse is missing or completely empty
  const expectedKeys = ['circuit', 'hotel', 'guest_house', 'restaurant', 'activity', 'museum', 'festival', 'archaeological_site'];
  if (!dataToUse || !expectedKeys.some(key => dataToUse[key])) {
    return <ErrorAlert error="No recommendations or best-rated entities available." />;
  }

  return (
    <>
      <HeroSection
        image="https://images.unsplash.com/photo-1501785888041-af3ef285b470?ixlib=rb-4.0.3&auto=format&fit=crop&w=1350&q=80" // Scenic Tunisian landscape
        title={userInfo ? 'Vos Recommandations Personnalisées' : 'Entités les Mieux Notées'}
        subtitle="Découvrez le meilleur de la Tunisie, rien que pour vous"
      />
      <div className="container py-5">
        <RecommendationSection
          title="Circuits"
          items={dataToUse.circuit || []}
          entityType="circuit"
        />
        <RecommendationSection
          title="Hôtels"
          items={dataToUse.hotel || []}
          entityType="hotel"
        />
        <RecommendationSection
          title="Maisons d'Hôtes"
          items={dataToUse.guest_house || []}
          entityType="guest_house"
        />
        <RecommendationSection
          title="Restaurants"
          items={dataToUse.restaurant || []}
          entityType="restaurant"
        />
        <RecommendationSection
          title="Activités"
          items={dataToUse.activity || []}
          entityType="activity"
        />
        <RecommendationSection
          title="Musées"
          items={dataToUse.museum || []}
          entityType="museum"
        />
        <RecommendationSection
          title="Festivals"
          items={dataToUse.festival || []}
          entityType="festival"
        />
        <RecommendationSection
          title="Sites Archéologiques"
          items={dataToUse.archaeological_site || []}
          entityType="archaeological_site"
        />
      </div>
    </>
  );
};

export default RecommendationsPage;