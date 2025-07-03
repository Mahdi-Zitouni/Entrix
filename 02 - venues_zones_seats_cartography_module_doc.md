# DOCUMENTATION VENUES/CARTOGRAPHIE
## Plateforme Entrix - Système de Gestion des Lieux et Infrastructure

---

**Version :** 1.0  
**Date :** Juin 2025  
**Système :** Gestion flexible des lieux avec cartographies multiples  

---

## 📋 VUE D'ENSEMBLE DU SYSTÈME

### Principe général
Le système de gestion des venues d'Entrix repose sur une architecture flexible permettant plusieurs configurations d'un même lieu :

1. **VENUES** : Lieux physiques (stades, salles, complexes)
2. **CARTOGRAPHIES** : Configurations d'usage du lieu selon l'événement/période
3. **ZONES** : Organisation hiérarchique des espaces dans une cartographie
4. **PLACES** : Gestion optionnelle des places individuelles numérotées
5. **ACCÈS** : Points d'entrée et de contrôle par cartographie
6. **SERVICES** : Services disponibles (globaux ou spécifiques)
7. **MÉDIAS** : Support visuel pour aide à la vente et orientation

### Concept clé : Multiple cartographies
**Un même venue peut avoir plusieurs cartographies selon l'usage :**
- Configuration Football (45 000 places, tribunes traditionnelles)
- Configuration Concert (40 000 places, fosse + gradins)
- Configuration Conférence (5 000 places, disposition amphithéâtre)

---

## 🗄️ TABLES DU SYSTÈME

### **1. Table `venues`**

#### **Rôle de la table**
Table centrale représentant les lieux physiques. Contient les informations générales et invariantes du lieu, indépendamment de son usage spécifique.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | String | Primary Key, CUID | Identifiant unique du venue | `venue_stade_olympique_001` |
| `name` | String | NOT NULL | Nom officiel du lieu | `Stade Olympique de Tunis`, `Palais des Congrès`, `Salle Mohamed Ali` |
| `slug` | String | Unique, NOT NULL | Identifiant URL-friendly | `stade-olympique-tunis`, `palais-congres` |
| `address` | String | NOT NULL | Adresse complète | `Avenue Habib Bourguiba, Cité Olympique` |
| `city` | String | NOT NULL | Ville | `Tunis`, `Sfax`, `Sousse` |
| `postalCode` | String | Optional | Code postal | `1000`, `3000` |
| `country` | String | Default: "TN" | Code pays ISO | `TN`, `FR`, `MA` |
| `latitude` | Float | Optional | Coordonnée GPS latitude | `36.8065`, `34.7333` |
| `longitude` | Float | Optional | Coordonnée GPS longitude | `10.1815`, `10.7667` |
| `maxCapacity` | Integer | NOT NULL | Capacité maximale théorique | `45000`, `5000`, `500` |
| `description` | String | Optional | Description générale | `Stade principal du club, rénové en 2020` |
| `images` | String[] | Optional | URLs images générales | `["/media/venues/stade-general.jpg"]` |
| `globalServices` | String[] | Optional | Services globaux du venue | `["parking", "wifi", "restaurant", "boutique"]` |
| `defaultMappingId` | String | Foreign Key | Cartographie par défaut | `mapping_football_standard_001` |
| `isActive` | Boolean | Default: true | Venue actif ou fermé | `true`, `false` |
| `metadata` | JSON | Optional | Données spécifiques | `{"year_built": 1967, "architect": "Hassan Souissi"}` |

#### **Exemple de données**
```json
{
  "id": "venue_stade_olympique_001",
  "name": "Stade Olympique de Tunis",
  "slug": "stade-olympique-tunis",
  "address": "Avenue Habib Bourguiba, Cité Olympique",
  "city": "Tunis",
  "postalCode": "1000",
  "country": "TN",
  "latitude": 36.8065,
  "longitude": 10.1815,
  "maxCapacity": 45000,
  "description": "Stade principal du Club Africain, rénové en 2020 avec installations modernes",
  "images": [
    "/media/venues/stade-olympique-exterieur.jpg",
    "/media/venues/stade-olympique-pelouse.jpg"
  ],
  "globalServices": [
    "parking_1000_places",
    "wifi_gratuit",
    "boutique_officielle",
    "infirmerie",
    "toilettes_pmr"
  ],
  "defaultMappingId": "mapping_football_standard_001",
  "isActive": true,
  "metadata": {
    "year_built": 1967,
    "last_renovation": 2020,
    "architect": "Hassan Souissi",
    "surface_type": "pelouse_naturelle"
  }
}
```

---

### **2. Table `venue_mappings`**

#### **Rôle de la table**
Définit les différentes configurations possibles d'un venue. Permet d'adapter l'organisation des espaces selon le type d'événement ou les contraintes temporelles (rénovations, saisons).

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | String | Primary Key, CUID | Identifiant unique cartographie | `mapping_football_standard_001` |
| `venueId` | String | Foreign Key, NOT NULL | Référence vers venues.id | `venue_stade_olympique_001` |
| `name` | String | NOT NULL | Nom de la configuration | `Configuration Football Standard`, `Mode Concert`, `Période Rénovation` |
| `code` | String | NOT NULL | Code technique unique | `FOOTBALL_STD`, `CONCERT_2025`, `RENOVATION_Q2` |
| `description` | String | Optional | Description détaillée | `Configuration standard pour matchs de football avec toutes tribunes` |
| `mappingType` | Enum | NOT NULL | Type de cartographie | `DEFAULT`, `EVENT_SPECIFIC`, `SEASONAL`, `MAINTENANCE` |
| `eventCategories` | String[] | Optional | Types d'événements supportés | `["FOOTBALL_MATCH", "FRIENDLY_MATCH"]`, `["CONCERT", "FESTIVAL"]` |
| `effectiveCapacity` | Integer | NOT NULL | Capacité réelle de cette config | `45000`, `40000`, `37000` |
| `isActive` | Boolean | Default: true | Configuration active | `true`, `false` |
| `validFrom` | DateTime | Optional | Date début validité | `2025-01-01T00:00:00Z`, `null` |
| `validUntil` | DateTime | Optional | Date fin validité | `2025-12-31T23:59:59Z`, `null` |
| `metadata` | JSON | Optional | Configuration spécifique | `{"layout": "traditional", "modifications": ["tribune_nord_closed"]}` |

#### **Exemple de données**
```json
[
  {
    "id": "mapping_football_standard_001",
    "venueId": "venue_stade_olympique_001",
    "name": "Configuration Football Standard",
    "code": "FOOTBALL_STD",
    "description": "Configuration standard pour matchs de football avec toutes tribunes opérationnelles",
    "mappingType": "DEFAULT",
    "eventCategories": ["FOOTBALL_MATCH", "FRIENDLY_MATCH", "CUP_MATCH"],
    "effectiveCapacity": 45000,
    "isActive": true,
    "validFrom": "2024-01-01T00:00:00Z",
    "validUntil": null,
    "metadata": {
      "layout": "traditional_stadium",
      "pitch_size": "105x68m",
      "all_tribunes_open": true
    }
  },
  {
    "id": "mapping_concert_summer_001",
    "venueId": "venue_stade_olympique_001", 
    "name": "Configuration Concert Été",
    "code": "CONCERT_SUMMER",
    "description": "Configuration pour concerts avec fosse centrale et gradins périphériques",
    "mappingType": "EVENT_SPECIFIC",
    "eventCategories": ["CONCERT", "FESTIVAL", "SPECTACLE"],
    "effectiveCapacity": 40000,
    "isActive": true,
    "validFrom": "2025-05-01T00:00:00Z",
    "validUntil": "2025-09-30T23:59:59Z",
    "metadata": {
      "layout": "concert_stadium",
      "stage_position": "south_side",
      "pit_capacity": 15000,
      "seated_capacity": 25000
    }
  },
  {
    "id": "mapping_renovation_q2_001",
    "venueId": "venue_stade_olympique_001",
    "name": "Période Rénovation Tribune Nord",
    "code": "RENOVATION_Q2",
    "description": "Configuration temporaire avec Tribune Nord fermée pour rénovation",
    "mappingType": "MAINTENANCE", 
    "eventCategories": ["FOOTBALL_MATCH"],
    "effectiveCapacity": 37000,
    "isActive": true,
    "validFrom": "2025-03-01T00:00:00Z",
    "validUntil": "2025-08-31T23:59:59Z",
    "metadata": {
      "closed_sections": ["tribune_nord"],
      "capacity_reduction": 8000,
      "reason": "renovation_works"
    }
  }
]
```

---

### **3. Table `venue_zones`**

#### **Rôle de la table**
Définit l'organisation hiérarchique des espaces dans une cartographie. Permet une structure flexible à plusieurs niveaux (tribunes → sections → rangées).

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | String | Primary Key, CUID | Identifiant unique zone | `zone_tribune_principale_001` |
| `mappingId` | String | Foreign Key, NOT NULL | Référence vers venue_mappings.id | `mapping_football_standard_001` |
| `parentZoneId` | String | Foreign Key, Optional | Zone parent (hiérarchie) | `zone_tribune_principale_001`, `null` |
| `name` | String | NOT NULL | Nom de la zone | `Tribune Principale`, `Section VIP`, `Rangées A-K` |
| `code` | String | NOT NULL | Code technique | `TRIB_PRINC`, `SECT_VIP`, `ROWS_A_K` |
| `description` | String | Optional | Description de la zone | `Tribune couverte face aux bancs` |
| `level` | Integer | Default: 1 | Niveau hiérarchique | `1` (tribune), `2` (section), `3` (rangée) |
| `displayOrder` | Integer | Default: 0 | Ordre d'affichage | `10`, `20`, `30` |
| `zoneType` | Enum | NOT NULL | Type de zone | `SEATING_AREA`, `STANDING_AREA`, `VIP_AREA`, `SERVICE_AREA` |
| `category` | Enum | Default: STANDARD | Catégorie tarifaire | `PREMIUM`, `STANDARD`, `BASIC`, `VIP`, `ACCESSIBLE` |
| `capacity` | Integer | NOT NULL | Capacité de la zone | `12000`, `200`, `50` |
| `hasSeats` | Boolean | Default: false | Places numérotées ou libres | `true`, `false` |
| `seatLayout` | Enum | Optional | Type de numérotation | `NUMBERED`, `TABLE`, `SECTION`, `STANDING` |
| `details` | String | Optional | Informations pratiques | `1er étage, accès escalier C, vue surélevée` |
| `notes` | String | Optional | Notes administration | `Zone réservée VIP, contrôle renforcé` |
| `isActive` | Boolean | Default: true | Zone active dans la cartographie | `true`, `false` |
| `metadata` | JSON | Optional | Configuration spécifique | `{"floor": 1, "covered": true, "services": ["bar"]}` |

#### **Exemple de données**
```json
[
  {
    "id": "zone_tribune_principale_001",
    "mappingId": "mapping_football_standard_001",
    "parentZoneId": null,
    "name": "Tribune Principale",
    "code": "TRIB_PRINC",
    "description": "Tribune couverte principale face aux bancs, vue optimale",
    "level": 1,
    "displayOrder": 10,
    "zoneType": "SEATING_AREA",
    "category": "STANDARD",
    "capacity": 12000,
    "hasSeats": false,
    "seatLayout": null,
    "details": "Tribune couverte, accès par portails A et B, parking adjacent",
    "notes": "Zone principale du stade",
    "isActive": true,
    "metadata": {
      "covered": true,
      "floor_count": 2,
      "access_points": ["portail_a", "portail_b"],
      "services": ["bar_premium", "climatisation"]
    }
  },
  {
    "id": "zone_loges_vip_001", 
    "mappingId": "mapping_football_standard_001",
    "parentZoneId": "zone_tribune_principale_001",
    "name": "Loges VIP",
    "code": "LOGES_VIP",
    "description": "Loges climatisées avec service traiteur inclus",
    "level": 2,
    "displayOrder": 10,
    "zoneType": "VIP_AREA",
    "category": "VIP",
    "capacity": 200,
    "hasSeats": true,
    "seatLayout": "NUMBERED",
    "details": "1er étage tribune principale, accès ascenseur VIP, service inclus",
    "notes": "Accès sur invitation uniquement",
    "isActive": true,
    "metadata": {
      "floor": 1,
      "air_conditioned": true,
      "catering_included": true,
      "vip_parking": true,
      "loges_count": 25
    }
  },
  {
    "id": "zone_pelouse_tp_001",
    "mappingId": "mapping_football_standard_001", 
    "parentZoneId": "zone_tribune_principale_001",
    "name": "Pelouse Tribune Principale",
    "code": "PELOUSE_TP",
    "description": "Places assises numérotées rez-de-chaussée",
    "level": 2,
    "displayOrder": 20,
    "zoneType": "SEATING_AREA",
    "category": "STANDARD",
    "capacity": 8800,
    "hasSeats": true,
    "seatLayout": "NUMBERED",
    "details": "Rez-de-chaussée, places assises standard avec dossier",
    "notes": "Zone principale abonnés",
    "isActive": true,
    "metadata": {
      "floor": 0,
      "seat_type": "plastic_with_back",
      "row_count": 40,
      "seats_per_row": 220
    }
  },
  {
    "id": "zone_tribune_nord_001",
    "mappingId": "mapping_football_standard_001",
    "parentZoneId": null,
    "name": "Tribune Nord - Kop",
    "code": "TRIB_NORD_KOP",
    "description": "Tribune des ultras et supporters passionnés",
    "level": 1,
    "displayOrder": 20,
    "zoneType": "STANDING_AREA",
    "category": "BASIC",
    "capacity": 8000,
    "hasSeats": false,
    "seatLayout": "STANDING",
    "details": "Tribune debout, ambiance garantie, animation supporters",
    "notes": "Zone ultras, contrôle spécifique",
    "isActive": true,
    "metadata": {
      "standing_only": true,
      "ultras_section": true,
      "drums_allowed": true,
      "flags_allowed": true
    }
  }
]
```

---

### **4. Table `seats`**

#### **Rôle de la table**
Gestion des places individuelles pour les zones qui nécessitent une numérotation précise. Permet l'attribution nominative et la gestion fine des places.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | String | Primary Key, CUID | Identifiant unique place | `seat_tp_a156_001` |
| `zoneId` | String | Foreign Key, NOT NULL | Référence vers venue_zones.id | `zone_pelouse_tp_001` |
| `reference` | String | NOT NULL | Référence de la place | `A156`, `Loge-05`, `Table-3`, `PMR-01` |
| `row` | String | Optional | Rangée/Niveau | `A`, `B`, `Mezzanine`, `PMR` |
| `number` | String | Optional | Numéro dans la rangée | `156`, `05`, `3`, `01` |
| `seatType` | Enum | Default: STANDARD | Type de place | `STANDARD`, `PREMIUM`, `VIP`, `ACCESSIBLE`, `OBSTRUCTED` |
| `category` | Enum | Default: STANDARD | Catégorie tarifaire | `STANDARD`, `PREMIUM`, `VIP`, `ACCESSIBLE` |
| `isAccessible` | Boolean | Default: false | Place PMR | `true`, `false` |
| `status` | Enum | Default: AVAILABLE | Statut de la place | `AVAILABLE`, `SOLD`, `BLOCKED`, `MAINTENANCE` |
| `notes` | String | Optional | Notes spécifiques | `Vue partielle poteau`, `Près sortie secours`, `Table 6 personnes` |
| `coordinates` | JSON | Optional | Position pour plan interactif | `{"x": 120, "y": 85}` |
| `metadata` | JSON | Optional | Données spécifiques | `{"view_quality": "excellent", "aisle_seat": true}` |

#### **Exemple de données**
```json
[
  {
    "id": "seat_tp_a156_001",
    "zoneId": "zone_pelouse_tp_001",
    "reference": "A156",
    "row": "A",
    "number": "156",
    "seatType": "STANDARD",
    "category": "STANDARD",
    "isAccessible": false,
    "status": "AVAILABLE",
    "notes": "Place centrale avec vue dégagée",
    "coordinates": {"x": 120, "y": 85},
    "metadata": {
      "view_quality": "excellent",
      "aisle_seat": false,
      "distance_to_field": "25m"
    }
  },
  {
    "id": "seat_loge_vip_05_001",
    "zoneId": "zone_loges_vip_001",
    "reference": "Loge-05",
    "row": "VIP",
    "number": "05",
    "seatType": "VIP",
    "category": "VIP",
    "isAccessible": false,
    "status": "AVAILABLE",
    "notes": "Loge 8 personnes, service traiteur inclus",
    "metadata": {
      "loge_capacity": 8,
      "catering_included": true,
      "private_entrance": true,
      "view_quality": "premium"
    }
  },
  {
    "id": "seat_pmr_01_001",
    "zoneId": "zone_pelouse_tp_001",
    "reference": "PMR-01",
    "row": "PMR",
    "number": "01",
    "seatType": "ACCESSIBLE",
    "category": "ACCESSIBLE",
    "isAccessible": true,
    "status": "AVAILABLE",
    "notes": "Place adaptée fauteuil roulant, accompagnant inclus",
    "metadata": {
      "wheelchair_accessible": true,
      "companion_seat": true,
      "easy_access": true,
      "adapted_facilities": true
    }
  }
]
```

---

### **5. Table `access_points`**

#### **Rôle de la table**
Définit les points d'entrée, de sortie et de contrôle pour chaque cartographie. Gère la configuration de sécurité et les flux de personnes.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | String | Primary Key, CUID | Identifiant unique point d'accès | `access_portail_a_001` |
| `mappingId` | String | Foreign Key, NOT NULL | Référence vers venue_mappings.id | `mapping_football_standard_001` |
| `name` | String | NOT NULL | Nom du point d'accès | `Portail A`, `Entrée VIP`, `Sortie Secours Nord` |
| `code` | String | NOT NULL | Code technique | `PORTAIL_A`, `ENTREE_VIP`, `SECOURS_NORD` |
| `description` | String | Optional | Description détaillée | `Entrée principale supporters Tribune Principale` |
| `accessType` | Enum | NOT NULL | Type d'accès | `MAIN_ENTRANCE`, `VIP_ENTRANCE`, `STAFF_ENTRANCE`, `EMERGENCY_EXIT` |
| `latitude` | Float | Optional | Coordonnée GPS latitude | `36.8065`, `36.8070` |
| `longitude` | Float | Optional | Coordonnée GPS longitude | `10.1815`, `10.1820` |
| `maxCapacity` | Integer | Optional | Flux maximum personnes/heure | `5000`, `500`, `100` |
| `allowedZones` | String[] | NOT NULL | Zones accessibles via ce point | `["zone_tribune_principale_001", "zone_pelouse_tp_001"]` |
| `requiresValidation` | Boolean | Default: true | Contrôle d'accès obligatoire | `true`, `false` |
| `isActive` | Boolean | Default: true | Point d'accès actif | `true`, `false` |
| `operatingHours` | JSON | Optional | Horaires d'ouverture | `{"open": "13:00", "close": "18:00"}` |
| `securityLevel` | Enum | Default: STANDARD | Niveau de sécurité | `LOW`, `STANDARD`, `HIGH`, `MAXIMUM` |
| `metadata` | JSON | Optional | Configuration spécifique | `{"turnstiles": 4, "metal_detector": true}` |

#### **Exemple de données**
```json
[
  {
    "id": "access_portail_a_001",
    "mappingId": "mapping_football_standard_001",
    "name": "Portail A - Tribune Principale",
    "code": "PORTAIL_A",
    "description": "Entrée principale pour supporters Tribune Principale et Pelouse",
    "accessType": "MAIN_ENTRANCE",
    "latitude": 36.8065,
    "longitude": 10.1815,
    "maxCapacity": 5000,
    "allowedZones": [
      "zone_tribune_principale_001",
      "zone_pelouse_tp_001"
    ],
    "requiresValidation": true,
    "isActive": true,
    "operatingHours": {
      "open": "13:00",
      "close": "17:30",
      "re_entry_allowed": false
    },
    "securityLevel": "STANDARD",
    "metadata": {
      "turnstiles_count": 6,
      "manual_gates": 2,
      "metal_detector": false,
      "bag_check": true,
      "staff_required": 4
    }
  },
  {
    "id": "access_entree_vip_001",
    "mappingId": "mapping_football_standard_001",
    "name": "Entrée VIP",
    "code": "ENTREE_VIP",
    "description": "Accès exclusif pour VIP, sponsors et loges",
    "accessType": "VIP_ENTRANCE",
    "latitude": 36.8070,
    "longitude": 10.1820,
    "maxCapacity": 500,
    "allowedZones": [
      "zone_loges_vip_001",
      "zone_salon_vip_001"
    ],
    "requiresValidation": true,
    "isActive": true,
    "operatingHours": {
      "open": "12:00",
      "close": "19:00",
      "re_entry_allowed": true
    },
    "securityLevel": "HIGH",
    "metadata": {
      "manual_check_only": true,
      "vip_parking_access": true,
      "concierge_service": true,
      "welcome_drink": true
    }
  },
  {
    "id": "access_staff_technique_001",
    "mappingId": "mapping_football_standard_001",
    "name": "Entrée Staff Technique",
    "code": "STAFF_TECH",
    "description": "Accès personnel technique et logistique",
    "accessType": "STAFF_ENTRANCE",
    "maxCapacity": 200,
    "allowedZones": ["all_zones"],
    "requiresValidation": true,
    "isActive": true,
    "operatingHours": {
      "open": "08:00",
      "close": "23:00",
      "access_24h": false
    },
    "securityLevel": "HIGH",
    "metadata": {
      "badge_required": true,
      "vehicle_access": true,
      "equipment_allowed": true
    }
  }
]
```

---

### **6. Table `venue_services`**

#### **Rôle de la table**
Catalogue des services et commodités disponibles, soit au niveau global du venue, soit spécifiquement pour certaines zones.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | String | Primary Key, CUID | Identifiant unique service | `service_parking_principal_001` |
| `venueId` | String | Foreign Key, Optional | Référence venue (si global) | `venue_stade_olympique_001` |
| `zoneId` | String | Foreign Key, Optional | Référence zone (si spécifique) | `zone_loges_vip_001` |
| `name` | String | NOT NULL | Nom du service | `Parking Principal`, `Bar VIP`, `Aire de Jeux Enfants` |
| `code` | String | NOT NULL | Code technique | `PARKING_MAIN`, `BAR_VIP`, `KIDS_AREA` |
| `category` | Enum | NOT NULL | Catégorie de service | `PARKING`, `FOOD_BEVERAGE`, `ENTERTAINMENT`, `ACCESSIBILITY` |
| `description` | String | Optional | Description détaillée | `Parking de 1000 places adjacent au stade` |
| `isIncludedInPrice` | Boolean | Default: false | Inclus dans le prix d'entrée | `true`, `false` |
| `additionalCost` | Float | Optional | Coût supplémentaire | `5.0`, `0.0`, `null` |
| `capacity` | Integer | Optional | Capacité/Places disponibles | `1000`, `50`, `200` |
| `operatingHours` | JSON | Optional | Horaires de fonctionnement | `{"open": "10:00", "close": "20:00"}` |
| `isActive` | Boolean | Default: true | Service actif | `true`, `false` |
| `metadata` | JSON | Optional | Informations spécifiques | `{"payment_methods": ["cash", "card"], "reservation_required": false}` |

#### **Exemple de données**
```json
[
  {
    "id": "service_parking_principal_001",
    "venueId": "venue_stade_olympique_001",
    "zoneId": null,
    "name": "Parking Principal",
    "code": "PARKING_MAIN",
    "category": "PARKING",
    "description": "Parking de 1000 places adjacent au stade avec accès direct",
    "isIncludedInPrice": false,
    "additionalCost": 5.0,
    "capacity": 1000,
    "operatingHours": {
      "open": "12:00",
      "close": "20:00",
      "match_day_extended": true
    },
    "isActive": true,
    "metadata": {
      "payment_methods": ["cash", "card", "mobile"],
      "covered": false,
      "security": true,
      "distance_to_entrance": "50m"
    }
  },
  {
    "id": "service_wifi_gratuit_001", 
    "venueId": "venue_stade_olympique_001",
    "zoneId": null,
    "name": "WiFi Gratuit",
    "code": "WIFI_FREE",
    "category": "CONNECTIVITY",
    "description": "Accès WiFi gratuit dans tout le stade",
    "isIncludedInPrice": true,
    "additionalCost": 0.0,
    "capacity": null,
    "operatingHours": null,
    "isActive": true,
    "metadata": {
      "network_name": "Stade_WiFi_Guest",
      "bandwidth": "100Mbps",
      "time_limit": "4h"
    }
  },
  {
    "id": "service_bar_vip_001",
    "venueId": null,
    "zoneId": "zone_loges_vip_001",
    "name": "Bar VIP Premium",
    "code": "BAR_VIP",
    "category": "FOOD_BEVERAGE",
    "description": "Bar exclusif avec service premium pour les loges VIP",
    "isIncludedInPrice": true,
    "additionalCost": 0.0,
    "capacity": 100,
    "operatingHours": {
      "open": "13:00",
      "close": "18:30",
      "pre_match_service": true
    },
    "isActive": true,
    "metadata": {
      "service_type": "table_service",
      "menu_type": "premium",
      "alcohol_available": true,
      "dress_code": "smart_casual"
    }
  },
  {
    "id": "service_aire_jeux_001",
    "venueId": null,
    "zoneId": "zone_tribune_est_001",
    "name": "Aire de Jeux Enfants",
    "code": "KIDS_PLAYGROUND",
    "category": "ENTERTAINMENT",
    "description": "Espace de jeux sécurisé pour enfants de 3 à 12 ans",
    "isIncludedInPrice": true,
    "additionalCost": 0.0,
    "capacity": 50,
    "operatingHours": {
      "open": "13:00",
      "close": "17:00",
      "supervision": true
    },
    "isActive": true,
    "metadata": {
      "age_range": "3-12",
      "supervised": true,
      "safety_certified": true,
      "activities": ["slides", "climbing", "ball_pit"]
    }
  }
]
```

---

### **7. Table `venue_media`**

#### **Rôle de la table**
Gestion des fichiers multimédias associés aux venues, zones et places. Permet aux utilisateurs de visualiser leur emplacement avant achat.

#### **Descriptif des champs**

| Champ | Type | Contraintes | Description | Exemples de valeurs |
|-------|------|-------------|-------------|-------------------|
| `id` | String | Primary Key, CUID | Identifiant unique média | `media_vue_a156_001` |
| `venueId` | String | Foreign Key, Optional | Référence venue | `venue_stade_olympique_001` |
| `zoneId` | String | Foreign Key, Optional | Référence zone | `zone_pelouse_tp_001` |
| `seatId` | String | Foreign Key, Optional | Référence place spécifique | `seat_tp_a156_001` |
| `title` | String | NOT NULL | Titre du média | `Vue depuis place A156`, `Plan Tribune Principale` |
| `description` | String | Optional | Description détaillée | `Vue panoramique du terrain depuis tribune principale` |
| `filename` | String | NOT NULL | Nom du fichier | `vue-a156-tribune-principale.jpg` |
| `originalName` | String | NOT NULL | Nom original du fichier | `photo_place_A156_match_derby.jpg` |
| `mediaType` | Enum | NOT NULL | Type de média | `IMAGE`, `VIDEO`, `DOCUMENT`, `VR_360`, `PANORAMA` |
| `category` | Enum | NOT NULL | Catégorie du média | `SEAT_VIEW`, `ZONE_OVERVIEW`, `ACCESS_GUIDE`, `SERVICES_INFO` |
| `url` | String | NOT NULL | URL d'accès au fichier | `/media/venues/stade/vue-a156.jpg` |
| `thumbnailUrl` | String | Optional | URL miniature | `/media/venues/stade/thumb-vue-a156.jpg` |
| `fileSize` | Integer | NOT NULL | Taille en bytes | `2048576` |
| `mimeType` | String | NOT NULL | Type MIME | `image/jpeg`, `video/mp4`, `application/pdf` |
| `duration` | Integer | Optional | Durée en secondes (vidéo/audio) | `120`, `null` |
| `isPublic` | Boolean | Default: true | Accessible au public | `true`, `false` |
| `displayOrder` | Integer | Default: 0 | Ordre d'affichage | `10`, `20`, `30` |
| `tags` | String[] | Optional | Tags pour recherche | `["vue_terrain", "tribune_principale", "centrale"]` |
| `metadata` | JSON | Optional | Métadonnées techniques | `{"resolution": "1920x1080", "camera": "iPhone14"}` |

#### **Exemple de données**
```json
[
  {
    "id": "media_vue_a156_001",
    "venueId": null,
    "zoneId": null,
    "seatId": "seat_tp_a156_001",
    "title": "Vue depuis place A156",
    "description": "Vue panoramique du terrain depuis la place A156 en tribune principale",
    "filename": "vue-a156-tribune-principale.jpg",
    "originalName": "photo_place_A156_match_derby.jpg",
    "mediaType": "IMAGE",
    "category": "SEAT_VIEW",
    "url": "/media/venues/stade/seats/vue-a156.jpg",
    "thumbnailUrl": "/media/venues/stade/seats/thumb-vue-a156.jpg",
    "fileSize": 2048576,
    "mimeType": "image/jpeg",
    "duration": null,
    "isPublic": true,
    "displayOrder": 10,
    "tags": ["vue_terrain", "tribune_principale", "place_centrale"],
    "metadata": {
      "resolution": "1920x1080",
      "camera": "iPhone 14",
      "weather": "ensoleillé",
      "match_context": "CA vs EST Derby"
    }
  },
  {
    "id": "media_plan_stade_001",
    "venueId": "venue_stade_olympique_001",
    "zoneId": null,
    "seatId": null,
    "title": "Plan Général du Stade",
    "description": "Plan détaillé avec toutes les zones et points d'accès",
    "filename": "plan-stade-olympique-2025.pdf",
    "originalName": "plan_stade_complet_2025.pdf",
    "mediaType": "DOCUMENT",
    "category": "VENUE_OVERVIEW",
    "url": "/media/venues/stade/plans/plan-general.pdf",
    "thumbnailUrl": "/media/venues/stade/plans/thumb-plan-general.jpg",
    "fileSize": 5242880,
    "mimeType": "application/pdf",
    "duration": null,
    "isPublic": true,
    "displayOrder": 5,
    "tags": ["plan", "acces", "zones", "orientation"],
    "metadata": {
      "pages": 3,
      "version": "2025.1",
      "created_by": "Cabinet Architecture"
    }
  },
  {
    "id": "media_visite_360_vip_001",
    "venueId": null,
    "zoneId": "zone_loges_vip_001",
    "seatId": null,
    "title": "Visite Virtuelle Loges VIP",
    "description": "Découverte immersive des loges VIP avec vue 360°",
    "filename": "visite-360-loges-vip.mp4",
    "originalName": "VIP_loges_360_tour.mp4",
    "mediaType": "VR_360",
    "category": "ZONE_OVERVIEW",
    "url": "/media/venues/stade/360/loges-vip-tour.mp4",
    "thumbnailUrl": "/media/venues/stade/360/thumb-loges-vip.jpg",
    "fileSize": 52428800,
    "mimeType": "video/mp4",
    "duration": 180,
    "isPublic": true,
    "displayOrder": 10,
    "tags": ["vip", "360", "immersif", "premium"],
    "metadata": {
      "resolution": "4K",
      "fps": 30,
      "equipment": "Insta360 Pro",
      "tour_points": ["loge_05", "salon_vip", "terrasse"]
    }
  },
  {
    "id": "media_guide_acces_001",
    "venueId": null,
    "zoneId": "zone_tribune_principale_001",
    "seatId": null,
    "title": "Guide d'Accès Tribune Principale",
    "description": "Instructions détaillées pour accéder à la tribune principale",
    "filename": "guide-acces-tribune-principale.pdf",
    "originalName": "access_guide_main_stand.pdf",
    "mediaType": "DOCUMENT",
    "category": "ACCESS_GUIDE",
    "url": "/media/venues/stade/guides/acces-tribune-principale.pdf",
    "thumbnailUrl": "/media/venues/stade/guides/thumb-acces-tp.jpg",
    "fileSize": 1048576,
    "mimeType": "application/pdf",
    "duration": null,
    "isPublic": true,
    "displayOrder": 15,
    "tags": ["acces", "tribune_principale", "guide", "parking"],
    "metadata": {
      "languages": ["fr", "ar"],
      "includes": ["parking_info", "transport_public", "horaires"]
    }
  }
]
```

---

## 📊 ÉNUMÉRATIONS

### **Enum `MappingType`**
```sql
CREATE TYPE mapping_type AS ENUM ('DEFAULT', 'EVENT_SPECIFIC', 'SEASONAL', 'MAINTENANCE');
```
- `DEFAULT` : Configuration par défaut du venue
- `EVENT_SPECIFIC` : Configuration spécifique à un type d'événement
- `SEASONAL` : Configuration saisonnière
- `MAINTENANCE` : Configuration temporaire (travaux, rénovations)

### **Enum `ZoneType`**
```sql
CREATE TYPE zone_type AS ENUM ('SEATING_AREA', 'STANDING_AREA', 'VIP_AREA', 'SERVICE_AREA', 'STAFF_AREA', 'EMERGENCY_AREA');
```
- `SEATING_AREA` : Zone avec places assises
- `STANDING_AREA` : Zone debout
- `VIP_AREA` : Zone VIP/Premium
- `SERVICE_AREA` : Zone de service (bar, boutique, etc.)
- `STAFF_AREA` : Zone personnel
- `EMERGENCY_AREA` : Zone sécurité/évacuation

### **Enum `SeatLayout`**
```sql
CREATE TYPE seat_layout AS ENUM ('NUMBERED', 'TABLE', 'SECTION', 'STANDING');
```
- `NUMBERED` : Places numérotées individuelles
- `TABLE` : Tables numérotées
- `SECTION` : Sections avec capacité libre
- `STANDING` : Debout sans numérotation

### **Enum `SeatType`**
```sql
CREATE TYPE seat_type AS ENUM ('STANDARD', 'PREMIUM', 'VIP', 'ACCESSIBLE', 'OBSTRUCTED');
```
- `STANDARD` : Place standard
- `PREMIUM` : Place confort/premium
- `VIP` : Place VIP
- `ACCESSIBLE` : Place PMR
- `OBSTRUCTED` : Vue limitée/obstruée

### **Enum `SeatStatus`**
```sql
CREATE TYPE seat_status AS ENUM ('AVAILABLE', 'SOLD', 'BLOCKED', 'MAINTENANCE');
```
- `AVAILABLE` : Disponible à la vente
- `SOLD` : Vendue/Réservée
- `BLOCKED` : Bloquée administrativement
- `MAINTENANCE` : En maintenance

### **Enum `AccessType`**
```sql
CREATE TYPE access_type AS ENUM ('MAIN_ENTRANCE', 'VIP_ENTRANCE', 'STAFF_ENTRANCE', 'EMERGENCY_EXIT', 'SERVICE_ENTRANCE');
```

### **Enum `SecurityLevel`**
```sql
CREATE TYPE security_level AS ENUM ('LOW', 'STANDARD', 'HIGH', 'MAXIMUM');
```

### **Enum `ServiceCategory`**
```sql
CREATE TYPE service_category AS ENUM ('PARKING', 'FOOD_BEVERAGE', 'ENTERTAINMENT', 'ACCESSIBILITY', 'CONNECTIVITY', 'SHOPPING', 'HEALTH_SAFETY');
```

### **Enum `MediaType`**
```sql
CREATE TYPE media_type AS ENUM ('IMAGE', 'VIDEO', 'DOCUMENT', 'AUDIO', 'VR_360', 'PANORAMA');
```

### **Enum `MediaCategory`**
```sql
CREATE TYPE media_category AS ENUM ('SEAT_VIEW', 'ZONE_OVERVIEW', 'VENUE_OVERVIEW', 'ACCESS_GUIDE', 'SERVICES_INFO', 'SAFETY_INFO', 'PROMOTIONAL');
```

---

## 🎯 EXEMPLES COMPLETS D'UTILISATION

### **Cas 1 : Stade de Football Complet**

**Venue principal avec cartographie par défaut :**
```json
{
  "venue": {
    "name": "Stade Olympique de Tunis",
    "maxCapacity": 45000,
    "globalServices": ["parking", "wifi", "boutique"],
    "defaultMapping": "Configuration Football Standard"
  },
  "mapping_football": {
    "name": "Configuration Football Standard",
    "effectiveCapacity": 45000,
    "zones": [
      {
        "name": "Tribune Principale",
        "capacity": 12000,
        "hasSeats": false,
        "subZones": [
          {
            "name": "Loges VIP",
            "capacity": 200,
            "hasSeats": true,
            "services": ["bar_premium", "climatisation"]
          },
          {
            "name": "Pelouse TP",
            "capacity": 8800,
            "hasSeats": true,
            "seats": ["A001", "A002", "...", "Z220"]
          }
        ]
      },
      {
        "name": "Tribune Nord - Kop",
        "capacity": 8000,
        "hasSeats": false,
        "type": "STANDING_AREA"
      }
    ],
    "accessPoints": [
      {
        "name": "Portail A",
        "type": "MAIN_ENTRANCE",
        "allowedZones": ["Tribune Principale"],
        "maxCapacity": 5000
      },
      {
        "name": "Entrée VIP",
        "type": "VIP_ENTRANCE", 
        "allowedZones": ["Loges VIP"],
        "securityLevel": "HIGH"
      }
    ]
  }
}
```

### **Cas 2 : Configuration Concert Temporaire**

**Même venue, configuration différente :**
```json
{
  "mapping_concert": {
    "name": "Configuration Concert Été",
    "mappingType": "EVENT_SPECIFIC",
    "effectiveCapacity": 40000,
    "validFrom": "2025-05-01",
    "validUntil": "2025-09-30",
    "zones": [
      {
        "name": "Fosse Centrale",
        "capacity": 15000,
        "type": "STANDING_AREA",
        "hasSeats": false
      },
      {
        "name": "Gradins Latéraux",
        "capacity": 25000,
        "hasSeats": true,
        "subZones": [
          {
            "name": "Catégorie Or",
            "capacity": 8000,
            "category": "PREMIUM"
          },
          {
            "name": "Catégorie Argent", 
            "capacity": 17000,
            "category": "STANDARD"
          }
        ]
      }
    ],
    "accessPoints": [
      {
        "name": "Entrée Principale Concert",
        "type": "MAIN_ENTRANCE",
        "allowedZones": ["Fosse Centrale", "Gradins Latéraux"]
      }
    ]
  }
}
```

### **Cas 3 : Gestion des Médias par Place**

**Supporter consultant sa place avant achat :**
```json
{
  "seat_a156": {
    "reference": "A156",
    "zone": "Pelouse Tribune Principale",
    "category": "STANDARD",
    "media": [
      {
        "title": "Vue depuis votre place",
        "type": "IMAGE",
        "url": "/media/seats/vue-a156.jpg",
        "description": "Vue panoramique du terrain"
      },
      {
        "title": "Visite 360° de votre zone", 
        "type": "VR_360",
        "url": "/media/zones/tribune-principale-360.mp4",
        "description": "Découvrez l'ambiance de votre tribune"
      },
      {
        "title": "Guide d'accès à votre place",
        "type": "DOCUMENT", 
        "url": "/media/guides/acces-tribune-principale.pdf",
        "description": "Comment arriver à votre place"
      }
    ]
  }
}
```

---

## 🔄 FLUX DE GESTION DES CARTOGRAPHIES

### **Création d'un nouvel événement**

```
1. Sélection du venue → "Stade Olympique"
2. Choix du type d'événement → "Match de Football"
3. Système propose cartographie par défaut → "Configuration Football Standard"
4. Validation ou création cartographie spécifique
5. Zones disponibles selon cartographie choisie
6. Configuration billetterie par zone
```

### **Gestion des rénovations**

```
1. Création cartographie "Rénovation Tribune Nord"
2. Désactivation zone "Tribune Nord" 
3. Réduction capacité : 45000 → 37000
4. Période de validité : Mars-Août 2025
5. Événements automatiquement limités à 37000 places
6. Retour configuration normale après travaux
```

---

**Ce système de venues et cartographies offre une flexibilité maximale pour gérer tous types de lieux et configurations, de la simple salle aux complexes sportifs multi-usages.**