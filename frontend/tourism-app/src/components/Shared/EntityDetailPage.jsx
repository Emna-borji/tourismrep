// // src/pages/EntityDetailPage.jsx
// import React, { useEffect } from 'react';
// import { useDispatch, useSelector } from 'react-redux';
// import { useParams, useLocation } from 'react-router-dom';
// import { Container, Row, Col, Button, Spinner, Image } from 'react-bootstrap';
// import { FaMapMarkerAlt, FaLocationArrow, FaPhone, FaGlobe, FaStar } from 'react-icons/fa';
// import { fetchRestaurantById } from '../../redux/actions/restaurantActions'; // We’ll generalize this
// import './entityDetailPageStyle.css';


// const EntityDetailPage = () => {
//   const { id } = useParams(); // Get the entity ID from the URL
//   const location = useLocation();
//   const dispatch = useDispatch();
//   const { restaurant: entity, loading, error } = useSelector((state) => state.restaurants); // We’ll generalize this

//   // Determine the entity type from the URL (e.g., /restaurant/1 → entityType = 'restaurant')
//   const entityType = location.pathname.split('/')[1]; // e.g., 'restaurant', 'hotel', etc.

//   useEffect(() => {
//     // Dispatch the appropriate action based on entityType
//     if (entityType === 'restaurant') {
//       dispatch(fetchRestaurantById(id));
//     }
//     // Add more conditions for other entity types (e.g., hotel, museum) as needed
//   }, [dispatch, id, entityType]);

//   if (loading) {
//     return (
//       <div className="d-flex justify-content-center mt-5">
//         <Spinner animation="border" role="status" />
//       </div>
//     );
//   }

//   if (error) {
//     return <p className="text-center text-danger">Error: {error}</p>;
//   }

//   if (!entity) {
//     return <p className="text-center">Entity not found</p>;
//   }

//   // Display stars for the rating
//   const renderStars = (rating) => {
//     const stars = [];
//     const roundedRating = Math.round(rating * 2) / 2; // Round to nearest 0.5
//     for (let i = 1; i <= 5; i++) {
//       if (i <= roundedRating) {
//         stars.push(<FaStar key={i} className="text-warning" />);
//       } else if (i - 0.5 <= roundedRating) {
//         stars.push(<FaStar key={i} className="text-warning" style={{ opacity: 0.5 }} />);
//       } else {
//         stars.push(<FaStar key={i} className="text-muted" />);
//       }
//     }
//     return stars;
//   };

//   // Combine the main image and additional images
//   const images = [
//     { image_url: entity.image }, // Main image
//     ...(entity.additional_images || []), // Additional images
//   ];

//   return (
//     <Container className="mt-5">
//       {/* Header Section */}
//       <h1>{entity.name}</h1>
//       <p className="text-muted">
//         {entityType.charAt(0).toUpperCase() + entityType.slice(1)}s • {entity.destination}
//       </p>

//       {/* Forks (for restaurants) */}
//       {entityType === 'restaurant' && (
//         <p>
//           <strong>Forks:</strong> {entity.forks} / 3
//         </p>
//       )}

//       {/* Itinéraire Button */}
//       <Button variant="primary" className="mb-3">
//         Itinéraire <FaLocationArrow className="ms-2" />
//       </Button>

//       {/* Rating and Cuisine */}
//       <div className="d-flex align-items-center mb-3">
//         <div className="me-3">
//           {entity.rating !== null ? (
//             <>
//               {renderStars(entity.rating)} ({entity.rating})
//             </>
//           ) : (
//             'No reviews yet'
//           )}
//         </div>
//         {entityType === 'restaurant' && entity.cuisine && (
//           <p className="mb-0">
//             <strong>Cuisine:</strong> {entity.cuisine}
//           </p>
//         )}
//       </div>

//       {/* Images Grid */}
//       <Row className="mb-4">
//         {images.map((img, index) => (
//           <Col md={4} key={index} className="mb-3">
//             <Image
//               src={img.image_url}
//               alt={`Image ${index + 1}`}
//               fluid
//               rounded
//               style={{ height: '200px', objectFit: 'cover', width: '100%' }}
//             />
//           </Col>
//         ))}
//       </Row>

//       {/* Description and Map */}
//       <Row>
//         <Col md={8}>
//           <h3>Description</h3>
//           <p>{entity.description || 'No description available'}</p>
//         </Col>
//         <Col md={4}>
//           <h3>Plan</h3>
//           {/* Embed a Google Map using latitude and longitude */}
//           {entity.latitude && entity.longitude ? (
//             <iframe
//               title="Entity Location"
//               width="100%"
//               height="300"
//               style={{ border: 0 }}
//               src={`https://www.google.com/maps/embed/v1/place?key=YOUR_GOOGLE_MAPS_API_KEY&q=${entity.latitude},${entity.longitude}`}
//               allowFullScreen
//             />
//           ) : (
//             <p>No location available</p>
//           )}
//         </Col>
//       </Row>
//     </Container>
//   );
// };

// export default EntityDetailPage;