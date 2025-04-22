import pandas as pd
from sklearn.cluster import KMeans
from sklearn.linear_model import LinearRegression
from django.db.models import Avg, Q
from django.utils import timezone
from django.core.cache import cache
from datetime import timedelta
from django.contrib.postgres.search import SearchVector
from users.models import CustomUser, Preference, PreferenceActivityCategory, PreferenceCuisine, ClickHistory, SearchHistory
from tourism.models import Hotel, GuestHouse, Restaurant, Activity, Museum, Festival, ArchaeologicalSite, Destination, ActivityCategory, Cuisine, Favorite, Review
from itinerary.models import Circuit, CircuitSchedule, CircuitHistory

class RecommendationService:
    def __init__(self, user_id):
        self.user = CustomUser.objects.get(id=user_id)
        self.prefs = Preference.objects.filter(user=self.user).select_related('departure_city', 'arrival_city')
        self.pref_activities = PreferenceActivityCategory.objects.filter(preference__in=self.prefs).select_related('activity_category')
        self.pref_cuisines = PreferenceCuisine.objects.filter(preference__in=self.prefs).select_related('cuisine')
        self.circuit_history = CircuitHistory.objects.filter(user=self.user).select_related('circuit')
        self.search_history = SearchHistory.objects.filter(user=self.user)
        self.cache_key = f'recommendations_{user_id}'
        self.cities = set()
        for pref in self.prefs:
            self.cities.add(pref.departure_city_id)
            self.cities.add(pref.arrival_city_id)
        if self.user.location:
            self.cities.add(self.user.location.id)

    def get_content_score(self, entity_type, entity, schedules=None):
        score = 0
        if not self.prefs:
            return score

        for pref in self.prefs:
            temp_score = 0
            if entity_type == 'circuit':
                if entity.departure_city_id == pref.departure_city_id:
                    temp_score += 10
                if entity.arrival_city_id == pref.arrival_city_id:
                    temp_score += 10
                if entity.price <= pref.budget:
                    temp_score += 5
                else:
                    temp_score -= 5
                if pref.departure_date and pref.arrival_date:
                    trip_days = (pref.arrival_date - pref.departure_date).days + 1
                    if entity.duration <= trip_days:
                        temp_score += 5
                if schedules and entity.id in schedules:
                    schedule = schedules[entity.id]
                    if pref.accommodation == 'hôtel' and any(s.hotel_id for s in schedule):
                        if any(s.hotel.stars >= pref.stars for s in schedule if s.hotel):
                            temp_score += 5
                    elif pref.accommodation == "maison d'hôte" and any(s.guest_house_id for s in schedule):
                        temp_score += 5
            else:
                if entity.destination_id in [pref.departure_city_id, pref.arrival_city_id]:
                    temp_score += 10
                if entity_type == 'hotel' and pref.accommodation == 'hôtel' and entity.stars >= pref.stars:
                    temp_score += 5
                elif entity_type == 'guest_house' and pref.accommodation == "maison d'hôte":
                    temp_score += 5
                elif entity_type == 'activity' and any(pac.activity_category_id == entity.category_id for pac in self.pref_activities.filter(preference=pref)):
                    temp_score += 5
                elif entity_type == 'restaurant' and any(pc.cuisine_id == entity.cuisine_id for pc in self.pref_cuisines.filter(preference=pref)):
                    temp_score += 5
                elif entity_type == 'festival' and entity.date and pref.departure_date <= entity.date <= pref.arrival_date:
                    temp_score += 5
            score = max(score, temp_score)

        if self.user.location:
            if entity_type == 'circuit':
                if entity.departure_city_id == self.user.location.id:
                    score += 5
                if entity.arrival_city_id == self.user.location.id:
                    score += 5
            else:
                if entity.destination_id == self.user.location.id:
                    score += 5

        return score

    def get_behavior_score(self, entity_type, entity_id, click_counts, fav_counts, history_counts):
        if not isinstance(entity_type, str):
            raise ValueError(f"Expected string for entity_type, got {type(entity_type)}")
        clicks = click_counts.get((entity_type, entity_id), 0) * 5
        favs = fav_counts.get((entity_type, entity_id), 0) * 5
        history_boost = history_counts.get(entity_id, 0) * 10 if entity_type == 'circuit' else 0
        return clicks + favs + history_boost

    def get_search_score(self, entity_type, entity):
        if not isinstance(entity_type, str):
            raise ValueError(f"Expected string for entity_type, got {type(entity_type)}")
        score = 0
        if not self.search_history:
            return score
        recent_threshold = timezone.now() - timedelta(days=30)
        recent_searches = self.search_history.filter(searched_at__gte=recent_threshold, entity_type=entity_type)
        if not recent_searches.exists():
            return score
        search_terms = ' '.join(s.search_term for s in recent_searches)
        model = {
            'circuit': Circuit,
            'hotel': Hotel,
            'guest_house': GuestHouse,
            'restaurant': Restaurant,
            'activity': Activity,
            'museum': Museum,
            'festival': Festival,
            'archaeological_site': ArchaeologicalSite
        }[entity_type]
        search_vector = SearchVector('name', 'description') if entity_type == 'circuit' else SearchVector('name')
        matches = model.objects.filter(id=entity.id).annotate(
            search=search_vector
        ).filter(search=search_terms)
        score += 5 if matches.exists() else 0
        return score

    def get_review_score(self, entity_type, entity_id, review_avgs):
        if not isinstance(entity_type, str):
            raise ValueError(f"Expected string for entity_type, got {type(entity_type)}")
        if not review_avgs:
            return 0
        avg_rating = review_avgs.get((entity_type, entity_id), 3)
        return avg_rating * 2

    def cluster_users(self):
        cache_key = 'user_clusters'
        cached = cache.get(cache_key)
        if cached:
            user_cluster, cluster_id = cached
            return user_cluster, cluster_id

        clicks = ClickHistory.objects.values('user_id', 'entity_type', 'entity_id')[:10000]
        df = pd.DataFrame(list(clicks))
        if df.empty:
            return None, 0
        user_item = pd.pivot_table(df, index='user_id', columns=['entity_type', 'entity_id'], 
                                   aggfunc='size', fill_value=0)
        kmeans = KMeans(n_clusters=3, random_state=42)
        clusters = kmeans.fit_predict(user_item)
        user_cluster = dict(zip(user_item.index, clusters))
        result = (user_cluster, user_cluster.get(self.user.id, 0))
        cache.set(cache_key, result, timeout=3600)
        return result

    def regression_score(self, entity_type, entity, reg_models, click_counts, fav_counts, history_counts, review_avgs):
        if not isinstance(entity_type, str):
            raise ValueError(f"Expected string for entity_type, got {type(entity_type)}")
        reg = reg_models.get(entity_type)
        if not reg:
            return 0
        entity_price = float(entity.price) if hasattr(entity, 'price') and entity.price is not None else 0.0
        entity_features = [
            entity_price,
            self.get_behavior_score(entity_type, entity.id, click_counts, fav_counts, history_counts),
            self.get_review_score(entity_type, entity.id, review_avgs),
            self.get_search_score(entity_type, entity)
        ]
        return reg.predict([entity_features])[0] * 10

    def train_regression(self, entity_type, items, click_counts, fav_counts, history_counts, review_avgs):
        if not isinstance(entity_type, str):
            raise ValueError(f"Expected string for entity_type, got {type(entity_type)}")
        model = {
            'circuit': Circuit,
            'hotel': Hotel,
            'guest_house': GuestHouse,
            'restaurant': Restaurant,
            'activity': Activity,
            'museum': Museum,
            'festival': Festival,
            'archaeological_site': ArchaeologicalSite
        }[entity_type]
        X, y = [], []
        for e in items:
            price = float(e.price) if hasattr(e, 'price') and e.price is not None else 0.0
            features = [
                price,
                self.get_behavior_score(entity_type, e.id, click_counts, fav_counts, history_counts),
                self.get_review_score(entity_type, e.id, review_avgs),
                self.get_search_score(entity_type, e)
            ]
            target = 1 if (entity_type, e.id) in click_counts else 0
            X.append(features)
            y.append(target)
        if not X or len(X) < 2:
            return None
        reg = LinearRegression()
        reg.fit(X, y)
        return reg

    def get_circuit_boost(self, entity_type, entity, top_circuits, schedules, history_schedules):
        if not isinstance(entity_type, str):
            raise ValueError(f"Expected string for entity_type, got {type(entity_type)}")
        if entity_type == 'circuit':
            return 0
        boost = 0
        for circuit in top_circuits:
            circuit_id = circuit['id']
            if circuit_id in schedules:
                for s in schedules[circuit_id]:
                    if entity_type == 'hotel' and s.hotel_id == entity.id:
                        boost += 10
                    elif entity_type == 'guest_house' and s.guest_house_id == entity.id:
                        boost += 10
                    elif entity_type == 'restaurant' and s.restaurant_id == entity.id:
                        boost += 10
                    elif entity_type == 'activity' and s.activity_id == entity.id:
                        boost += 10
                    elif entity_type == 'museum' and s.museum_id == entity.id:
                        boost += 10
                    elif entity_type == 'festival' and s.festival_id == entity.id:
                        boost += 10
                    elif entity_type == 'archaeological_site' and s.archaeological_site_id == entity.id:
                        boost += 10
        for history in self.circuit_history:
            if history.circuit_id in history_schedules:
                for s in history_schedules[history.circuit_id]:
                    if entity_type == 'hotel' and s.hotel_id == entity.id:
                        boost += 5
                    elif entity_type == 'guest_house' and s.guest_house_id == entity.id:
                        boost += 5
                    elif entity_type == 'restaurant' and s.restaurant_id == entity.id:
                        boost += 5
                    elif entity_type == 'activity' and s.activity_id == entity.id:
                        boost += 5
                    elif entity_type == 'museum' and s.museum_id == entity.id:
                        boost += 5
                    elif entity_type == 'festival' and s.festival_id == entity.id:
                        boost += 5
                    elif entity_type == 'archaeological_site' and s.archaeological_site_id == entity.id:
                        boost += 5
        return boost

    def recommend_all(self, top_n_per_type=3):
        cached = cache.get(self.cache_key)
        if cached:
            return cached

        entity_types = {
            'circuit': Circuit,
            'hotel': Hotel,
            'guest_house': GuestHouse,
            'restaurant': Restaurant,
            'activity': Activity,
            'museum': Museum,
            'festival': Festival,
            'archaeological_site': ArchaeologicalSite
        }
        user_cluster, cluster_id = self.cluster_users()
        recommendations = {}

        circuits = Circuit.objects.filter(
            Q(departure_city_id__in=self.cities) | Q(arrival_city_id__in=self.cities)
        ).select_related('departure_city', 'arrival_city').prefetch_related('schedules')
        schedules = {c.id: list(c.schedules.all()) for c in circuits}
        history_schedules = {
            h.circuit_id: list(CircuitSchedule.objects.filter(circuit_id=h.circuit_id))
            for h in self.circuit_history
        }
        
        click_counts = {}
        try:
            click_counts = {(c.entity_type, c.entity_id): 1 for c in ClickHistory.objects.filter(user=self.user)}
        except AttributeError as e:
            print(f"Error loading ClickHistory: {e}")
        
        fav_counts = {}
        try:
            fav_counts = {(f.entity_type, f.entity_id): 1 for f in Favorite.objects.filter(user=self.user)}
        except AttributeError as e:
            print(f"Error loading Favorite: {e}")
        
        history_counts = {h.circuit_id: 1 for h in self.circuit_history}
        
        review_avgs = {}
        try:
            review_avgs = {
                (r['entity_type'], r['entity_id']): r['avg_rating']
                for r in Review.objects.values('entity_type', 'entity_id').annotate(avg_rating=Avg('rating'))
            }
        except (AttributeError, KeyError) as e:
            print(f"Error loading Review: {e}")
        
        reg_models = {}
        for entity_type in entity_types:
            if not isinstance(entity_type, str):
                raise ValueError(f"Expected string for entity_type in reg_models, got {type(entity_type)}")
            model = entity_types[entity_type]
            items = model.objects.filter(destination_id__in=self.cities) if entity_type != 'circuit' else circuits
            reg_models[entity_type] = self.train_regression(entity_type, items, click_counts, fav_counts, history_counts, review_avgs)
        
        circuit_scores = []
        for circuit in circuits:
            content_score = self.get_content_score('circuit', circuit, schedules)
            behavior_score = self.get_behavior_score('circuit', circuit.id, click_counts, fav_counts, history_counts)
            review_score = self.get_review_score('circuit', circuit.id, review_avgs)
            search_score = self.get_search_score('circuit', circuit)
            reg_score = self.regression_score('circuit', circuit, reg_models, click_counts, fav_counts, history_counts, review_avgs)
            cluster_clicks = ClickHistory.objects.filter(
                user_id__in=[uid for uid, cid in user_cluster.items() if cid == cluster_id],
                entity_type='circuit', entity_id=circuit.id
            ).count() * 5 if user_cluster else 0

            total_score = content_score + behavior_score + review_score + search_score + reg_score + cluster_clicks
            circuit_scores.append({
                'id': circuit.id,
                'name': circuit.name,
                'circuit_code': circuit.circuit_code,
                'departure_city': circuit.departure_city.name if circuit.departure_city else 'Unknown',
                'arrival_city': circuit.arrival_city.name if circuit.arrival_city else 'Unknown',
                'price': float(circuit.price),
                'duration': circuit.duration,
                'score': total_score
            })
        
        recommendations['circuit'] = sorted(circuit_scores, key=lambda x: x['score'], reverse=True)[:top_n_per_type]
        top_circuits = recommendations['circuit']

        for entity_type in entity_types:
            if not isinstance(entity_type, str):
                raise ValueError(f"Expected string for entity_type in entity loop, got {type(entity_type)}")
            if entity_type == 'circuit':
                continue
            scores = []
            model = entity_types[entity_type]
            entities = model.objects.filter(destination_id__in=self.cities).select_related('destination')
            for entity in entities:
                content_score = self.get_content_score(entity_type, entity)
                behavior_score = self.get_behavior_score(entity_type, entity.id, click_counts, fav_counts, history_counts)
                review_score = self.get_review_score(entity_type, entity.id, review_avgs)
                search_score = self.get_search_score(entity_type, entity)
                reg_score = self.regression_score(entity_type, entity, reg_models, click_counts, fav_counts, history_counts, review_avgs)
                circuit_boost = self.get_circuit_boost(entity_type, entity, top_circuits, schedules, history_schedules)
                cluster_clicks = ClickHistory.objects.filter(
                    user_id__in=[uid for uid, cid in user_cluster.items() if cid == cluster_id],
                    entity_type=entity_type, entity_id=entity.id
                ).count() * 5 if user_cluster else 0

                total_score = content_score + behavior_score + review_score + search_score + reg_score + circuit_boost + cluster_clicks
                entity_data = {
                    'id': entity.id,
                    'name': entity.name,
                    'destination': entity.destination.name if entity.destination else 'Unknown',
                    'price': float(entity.price) if hasattr(entity, 'price') and entity.price is not None else None,
                    'score': total_score
                }
                if entity_type == 'hotel':
                    entity_data['stars'] = entity.stars
                elif entity_type == 'restaurant':
                    entity_data['forks'] = entity.forks
                elif entity_type == 'festival':
                    entity_data['date'] = entity.date.isoformat() if entity.date else None

                scores.append(entity_data)

            recommendations[entity_type] = sorted(scores, key=lambda x: x['score'], reverse=True)[:top_n_per_type]

        cache.set(self.cache_key, recommendations, timeout=600)
        return recommendations