-- =====================================================
-- SCRIPT SQL POSTGRESQL - VENUES/CARTOGRAPHIE
-- Plateforme Entrix - Système de Gestion des Lieux
-- Version: 1.0
-- Date: Juin 2025
-- =====================================================

-- =====================================================
-- 1. SUPPRESSION DES OBJETS EXISTANTS (Ordre inverse)
-- =====================================================

-- Suppression des tables
DROP TABLE IF EXISTS venue_media CASCADE;
DROP TABLE IF EXISTS venue_services CASCADE;
DROP TABLE IF EXISTS access_points CASCADE;
DROP TABLE IF EXISTS seats CASCADE;
DROP TABLE IF EXISTS venue_zones CASCADE;
DROP TABLE IF EXISTS venue_mappings CASCADE;
DROP TABLE IF EXISTS venues CASCADE;

-- Suppression des énumérations
DROP TYPE IF EXISTS media_category CASCADE;
DROP TYPE IF EXISTS media_type CASCADE;
DROP TYPE IF EXISTS service_category CASCADE;
DROP TYPE IF EXISTS security_level CASCADE;
DROP TYPE IF EXISTS access_type CASCADE;
DROP TYPE IF EXISTS seat_status CASCADE;
DROP TYPE IF EXISTS seat_type CASCADE;
DROP TYPE IF EXISTS seat_layout CASCADE;
DROP TYPE IF EXISTS zone_category CASCADE;
DROP TYPE IF EXISTS zone_type CASCADE;
DROP TYPE IF EXISTS mapping_type CASCADE;

-- Suppression des fonctions et triggers
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS validate_venue_mapping_dates() CASCADE;
DROP FUNCTION IF EXISTS calculate_zone_total_capacity() CASCADE;
DROP FUNCTION IF EXISTS check_seat_zone_consistency() CASCADE;

-- =====================================================
-- 2. CRÉATION DES ÉNUMÉRATIONS
-- =====================================================

-- Type de cartographie
CREATE TYPE mapping_type AS ENUM (
    'DEFAULT',         -- Configuration par défaut
    'EVENT_SPECIFIC',  -- Spécifique à un type d'événement
    'SEASONAL',        -- Configuration saisonnière
    'MAINTENANCE'      -- Configuration temporaire (travaux)
);

-- Type de zone
CREATE TYPE zone_type AS ENUM (
    'SEATING_AREA',    -- Zone avec places assises
    'STANDING_AREA',   -- Zone debout
    'VIP_AREA',        -- Zone VIP/Premium
    'SERVICE_AREA',    -- Zone de service (bar, boutique)
    'STAFF_AREA',      -- Zone personnel
    'EMERGENCY_AREA'   -- Zone sécurité/évacuation
);

-- Catégorie de zone (tarifaire)
CREATE TYPE zone_category AS ENUM (
    'PREMIUM',         -- Places premium
    'STANDARD',        -- Places standard
    'BASIC',           -- Places économiques
    'VIP',             -- Places VIP
    'ACCESSIBLE',      -- Places PMR
    'COMPLIMENTARY'    -- Places gratuites
);

-- Disposition des places
CREATE TYPE seat_layout AS ENUM (
    'NUMBERED',        -- Places numérotées individuelles
    'TABLE',           -- Tables numérotées
    'SECTION',         -- Sections avec capacité libre
    'STANDING'         -- Debout sans numérotation
);

-- Type de place
CREATE TYPE seat_type AS ENUM (
    'STANDARD',        -- Place standard
    'PREMIUM',         -- Place confort/premium
    'VIP',             -- Place VIP
    'ACCESSIBLE',      -- Place PMR
    'OBSTRUCTED'       -- Vue limitée/obstruée
);

-- Statut de place
CREATE TYPE seat_status AS ENUM (
    'AVAILABLE',       -- Disponible à la vente
    'SOLD',            -- Vendue/Réservée
    'BLOCKED',         -- Bloquée administrativement
    'MAINTENANCE'      -- En maintenance
);

-- Type d'accès
CREATE TYPE access_type AS ENUM (
    'MAIN_ENTRANCE',   -- Entrée principale
    'VIP_ENTRANCE',    -- Entrée VIP
    'STAFF_ENTRANCE',  -- Entrée personnel
    'EMERGENCY_EXIT',  -- Sortie de secours
    'SERVICE_ENTRANCE' -- Entrée service
);

-- Niveau de sécurité
CREATE TYPE security_level AS ENUM (
    'LOW',             -- Sécurité légère
    'STANDARD',        -- Sécurité standard
    'HIGH',            -- Sécurité renforcée
    'MAXIMUM'          -- Sécurité maximale
);

-- Catégorie de commodité
CREATE TYPE service_category AS ENUM (
    'PARKING',         -- Stationnement
    'FOOD_BEVERAGE',   -- Restauration/Boissons
    'ENTERTAINMENT',   -- Divertissement
    'ACCESSIBILITY',   -- Accessibilité
    'CONNECTIVITY',    -- Connectivité
    'SHOPPING',        -- Boutique/Commerce
    'SERVICES_INFO',   -- Info services
    'HEALTH_SAFETY'    -- Santé/Sécurité
);

-- Type de média
CREATE TYPE media_type AS ENUM (
    'IMAGE',           -- Photo/Image
    'VIDEO',           -- Vidéo
    'DOCUMENT',        -- Document PDF/DOC
    'AUDIO',           -- Audio
    'VR_360',          -- Vidéo 360°
    'PANORAMA'         -- Photo panoramique
);

-- Catégorie de média
CREATE TYPE media_category AS ENUM (
    'SEAT_VIEW',       -- Vue depuis la place
    'ZONE_OVERVIEW',   -- Vue d'ensemble de la zone
    'VENUE_OVERVIEW',  -- Vue d'ensemble du venue
    'ACCESS_GUIDE',    -- Guide d'accès
    'SERVICES_INFO',   -- Info services
    'SAFETY_INFO',     -- Info sécurité
    'PROMOTIONAL'      -- Matériel promotionnel
);

-- =====================================================
-- 3. CRÉATION DES TABLES PRINCIPALES
-- =====================================================

-- Table des venues (lieux physiques)
CREATE TABLE venues (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    name VARCHAR(200) NOT NULL,
    slug VARCHAR(200) NOT NULL UNIQUE,
    
    -- Localisation
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    postal_code VARCHAR(20),
    country VARCHAR(2) NOT NULL DEFAULT 'TN',
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Capacité et description
    max_capacity INTEGER NOT NULL,
    description TEXT,
    
    -- Médias et services globaux
    images TEXT[],
    global_services TEXT[],
    
    -- Configuration
    default_mapping_id VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des cartographies (configurations d'usage)
CREATE TABLE venue_mappings (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    venue_id VARCHAR(255) NOT NULL,
    
    -- Identification
    name VARCHAR(200) NOT NULL,
    code VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Configuration
    mapping_type mapping_type NOT NULL,
    event_categories TEXT[],
    effective_capacity INTEGER NOT NULL,
    
    -- Validité temporelle
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    
    -- Statut
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT fk_venue_mappings_venue_id 
        FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE,
    CONSTRAINT uk_venue_mappings_venue_code 
        UNIQUE (venue_id, code)
);

-- Table des zones (organisation hiérarchique)
CREATE TABLE venue_zones (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    mapping_id VARCHAR(255) NOT NULL,
    parent_zone_id VARCHAR(255),
    
    -- Identification
    name VARCHAR(200) NOT NULL,
    code VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Hiérarchie
    level INTEGER NOT NULL DEFAULT 1,
    display_order INTEGER NOT NULL DEFAULT 0,
    
    -- Type et catégorie
    zone_type zone_type NOT NULL,
    category zone_category NOT NULL DEFAULT 'STANDARD',
    
    -- Configuration des places
    capacity INTEGER NOT NULL,
    has_seats BOOLEAN NOT NULL DEFAULT FALSE,
    seat_layout seat_layout,
    
    -- Informations pratiques
    details TEXT,
    notes TEXT,
    
    -- Statut
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT fk_venue_zones_mapping_id 
        FOREIGN KEY (mapping_id) REFERENCES venue_mappings(id) ON DELETE CASCADE,
    CONSTRAINT fk_venue_zones_parent_zone_id 
        FOREIGN KEY (parent_zone_id) REFERENCES venue_zones(id) ON DELETE CASCADE,
    CONSTRAINT uk_venue_zones_mapping_code 
        UNIQUE (mapping_id, code)
);

-- Table des places (places individuelles)
CREATE TABLE seats (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    zone_id VARCHAR(255) NOT NULL,
    
    -- Identification de la place
    reference VARCHAR(50) NOT NULL,
    row_name VARCHAR(20),
    number VARCHAR(20),
    
    -- Type et catégorie
    seat_type seat_type NOT NULL DEFAULT 'STANDARD',
    category zone_category NOT NULL DEFAULT 'STANDARD',
    is_accessible BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Statut
    status seat_status NOT NULL DEFAULT 'AVAILABLE',
    notes TEXT,
    
    -- Coordonnées pour plan interactif
    coordinates JSONB,
    
    -- Métadonnées
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT fk_seats_zone_id 
        FOREIGN KEY (zone_id) REFERENCES venue_zones(id) ON DELETE CASCADE,
    CONSTRAINT uk_seats_zone_reference 
        UNIQUE (zone_id, reference)
);

-- Table des points d'accès
CREATE TABLE access_points (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    mapping_id VARCHAR(255) NOT NULL,
    
    -- Identification
    name VARCHAR(200) NOT NULL,
    code VARCHAR(100) NOT NULL,
    description TEXT,
    
    -- Type et sécurité
    access_type access_type NOT NULL,
    security_level security_level NOT NULL DEFAULT 'STANDARD',
    
    -- Localisation
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    
    -- Configuration
    max_capacity INTEGER,
    allowed_zones TEXT[] NOT NULL,
    requires_validation BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Horaires
    operating_hours JSONB,
    
    -- Statut
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT fk_access_points_mapping_id 
        FOREIGN KEY (mapping_id) REFERENCES venue_mappings(id) ON DELETE CASCADE,
    CONSTRAINT uk_access_points_mapping_code 
        UNIQUE (mapping_id, code)
);

-- Table des services
CREATE TABLE venue_services (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    venue_id VARCHAR(255),
    zone_id VARCHAR(255),
    
    -- Identification
    name VARCHAR(200) NOT NULL,
    code VARCHAR(100) NOT NULL,
    category service_category NOT NULL,
    description TEXT,
    
    -- Tarification
    is_included_in_price BOOLEAN NOT NULL DEFAULT FALSE,
    additional_cost DECIMAL(10, 2),
    
    -- Capacité et horaires
    capacity INTEGER,
    operating_hours JSONB,
    
    -- Statut
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT fk_venue_services_venue_id 
        FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE,
    CONSTRAINT fk_venue_services_zone_id 
        FOREIGN KEY (zone_id) REFERENCES venue_zones(id) ON DELETE CASCADE,
    CONSTRAINT chk_venue_services_association 
        CHECK ((venue_id IS NOT NULL AND zone_id IS NULL) OR 
               (venue_id IS NULL AND zone_id IS NOT NULL))
);

-- Table des médias
CREATE TABLE venue_media (
    id VARCHAR(255) PRIMARY KEY DEFAULT gen_random_uuid()::TEXT,
    venue_id VARCHAR(255),
    zone_id VARCHAR(255),
    seat_id VARCHAR(255),
    access_point_id VARCHAR(255),
    
    -- Identification
    title VARCHAR(200) NOT NULL,
    description TEXT,
    filename VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    
    -- Type et catégorie
    media_type media_type NOT NULL,
    category media_category NOT NULL,
    
    -- Fichier
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    duration INTEGER,
    
    -- Métadonnées
    metadata JSONB,
    
    -- Organisation et affichage
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    tags TEXT[],
    
    -- Multilangue
    language VARCHAR(5) DEFAULT 'fr',
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT fk_venue_media_venue_id 
        FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE CASCADE,
    CONSTRAINT fk_venue_media_zone_id 
        FOREIGN KEY (zone_id) REFERENCES venue_zones(id) ON DELETE CASCADE,
    CONSTRAINT fk_venue_media_seat_id 
        FOREIGN KEY (seat_id) REFERENCES seats(id) ON DELETE CASCADE,
    CONSTRAINT fk_venue_media_access_point_id 
        FOREIGN KEY (access_point_id) REFERENCES access_points(id) ON DELETE CASCADE,
    CONSTRAINT chk_venue_media_association 
        CHECK (
            (venue_id IS NOT NULL AND zone_id IS NULL AND seat_id IS NULL AND access_point_id IS NULL) OR
            (venue_id IS NULL AND zone_id IS NOT NULL AND seat_id IS NULL AND access_point_id IS NULL) OR
            (venue_id IS NULL AND zone_id IS NULL AND seat_id IS NOT NULL AND access_point_id IS NULL) OR
            (venue_id IS NULL AND zone_id IS NULL AND seat_id IS NULL AND access_point_id IS NOT NULL)
        )
);

-- =====================================================
-- 4. CRÉATION DES INDEX POUR PERFORMANCES
-- =====================================================

-- Index sur la table venues
CREATE INDEX idx_venues_slug ON venues(slug);
CREATE INDEX idx_venues_city ON venues(city);
CREATE INDEX idx_venues_active ON venues(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_venues_location ON venues USING GIST(point(longitude, latitude));

-- Index sur la table venue_mappings
CREATE INDEX idx_venue_mappings_venue_id ON venue_mappings(venue_id);
CREATE INDEX idx_venue_mappings_code ON venue_mappings(code);
CREATE INDEX idx_venue_mappings_type ON venue_mappings(mapping_type);
CREATE INDEX idx_venue_mappings_active ON venue_mappings(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_venue_mappings_valid_period ON venue_mappings(valid_from, valid_until);
CREATE INDEX idx_venue_mappings_metadata ON venue_mappings USING GIN(metadata);

-- Index sur la table venue_zones
CREATE INDEX idx_venue_zones_mapping_id ON venue_zones(mapping_id);
CREATE INDEX idx_venue_zones_parent_id ON venue_zones(parent_zone_id);
CREATE INDEX idx_venue_zones_code ON venue_zones(code);
CREATE INDEX idx_venue_zones_type ON venue_zones(zone_type);
CREATE INDEX idx_venue_zones_category ON venue_zones(category);
CREATE INDEX idx_venue_zones_active ON venue_zones(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_venue_zones_metadata ON venue_zones USING GIN(metadata);

-- Index sur la table seats
CREATE INDEX idx_seats_zone_id ON seats(zone_id);
CREATE INDEX idx_seats_reference ON seats(reference);
CREATE INDEX idx_seats_type ON seats(seat_type);
CREATE INDEX idx_seats_status ON seats(status);
CREATE INDEX idx_seats_available ON seats(zone_id, status) WHERE status = 'AVAILABLE';
CREATE INDEX idx_seats_coordinates ON seats USING GIN(coordinates);

-- Index sur la table access_points
CREATE INDEX idx_access_points_mapping_id ON access_points(mapping_id);
CREATE INDEX idx_access_points_code ON access_points(code);
CREATE INDEX idx_access_points_type ON access_points(access_type);
CREATE INDEX idx_access_points_active ON access_points(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_access_points_location ON access_points USING GIST(point(longitude, latitude));

-- Index sur la table venue_services
CREATE INDEX idx_venue_services_venue_id ON venue_services(venue_id);
CREATE INDEX idx_venue_services_zone_id ON venue_services(zone_id);
CREATE INDEX idx_venue_services_category ON venue_services(category);
CREATE INDEX idx_venue_services_active ON venue_services(is_active) WHERE is_active = TRUE;

-- Index sur la table venue_media
CREATE INDEX idx_venue_media_venue_id ON venue_media(venue_id);
CREATE INDEX idx_venue_media_zone_id ON venue_media(zone_id);
CREATE INDEX idx_venue_media_seat_id ON venue_media(seat_id);
CREATE INDEX idx_venue_media_access_point_id ON venue_media(access_point_id);
CREATE INDEX idx_venue_media_type ON venue_media(media_type);
CREATE INDEX idx_venue_media_category ON venue_media(category);
CREATE INDEX idx_venue_media_public ON venue_media(is_public) WHERE is_public = TRUE;
CREATE INDEX idx_venue_media_tags ON venue_media USING GIN(tags);

-- =====================================================
-- 5. CONTRAINTES D'INTÉGRITÉ AVANCÉES
-- =====================================================

-- Contrainte: Le slug du venue doit être en minuscules
ALTER TABLE venues ADD CONSTRAINT chk_venues_slug_format 
    CHECK (slug = LOWER(slug) AND slug ~ '^[a-z0-9-]+$');

-- Contrainte: La capacité max doit être positive
ALTER TABLE venues ADD CONSTRAINT chk_venues_capacity 
    CHECK (max_capacity > 0);

-- Contrainte: La capacité effective ne peut pas dépasser la capacité max du venue
ALTER TABLE venue_mappings ADD CONSTRAINT chk_venue_mappings_capacity 
    CHECK (effective_capacity > 0);

-- Contrainte: Les dates de validité des mappings doivent être cohérentes
ALTER TABLE venue_mappings ADD CONSTRAINT chk_venue_mappings_valid_dates 
    CHECK (valid_until IS NULL OR valid_until > valid_from);

-- Contrainte: Le niveau de zone doit être positif
ALTER TABLE venue_zones ADD CONSTRAINT chk_venue_zones_level 
    CHECK (level > 0);

-- Contrainte: La capacité de zone doit être positive ou nulle
ALTER TABLE venue_zones ADD CONSTRAINT chk_venue_zones_capacity 
    CHECK (capacity >= 0);

-- Contrainte: Si has_seats est true, seat_layout doit être défini
ALTER TABLE venue_zones ADD CONSTRAINT chk_venue_zones_seats_consistency 
    CHECK ((has_seats = FALSE) OR (has_seats = TRUE AND seat_layout IS NOT NULL));

-- Contrainte: Le coût additionnel des services doit être positif ou nul
ALTER TABLE venue_services ADD CONSTRAINT chk_venue_services_cost 
    CHECK (additional_cost IS NULL OR additional_cost >= 0);

-- Contrainte: La taille du fichier média doit être positive
ALTER TABLE venue_media ADD CONSTRAINT chk_venue_media_file_size 
    CHECK (file_size > 0);

-- Contrainte: La durée des médias vidéo/audio doit être positive
ALTER TABLE venue_media ADD CONSTRAINT chk_venue_media_duration 
    CHECK (duration IS NULL OR duration > 0);

-- =====================================================
-- 6. FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour valider les dates de validité des mappings
CREATE OR REPLACE FUNCTION validate_venue_mapping_dates()
RETURNS TRIGGER AS $$
BEGIN
    -- Vérifier qu'il n'y a pas de chevauchement avec d'autres mappings actifs
    IF EXISTS (
        SELECT 1 FROM venue_mappings
        WHERE venue_id = NEW.venue_id
        AND id != COALESCE(NEW.id, '')
        AND is_active = TRUE
        AND mapping_type = NEW.mapping_type
        AND (
            (NEW.valid_from IS NULL AND NEW.valid_until IS NULL) OR
            (valid_from IS NULL AND valid_until IS NULL) OR
            (NEW.valid_from <= COALESCE(valid_until, '2999-12-31'::TIMESTAMPTZ) AND 
             COALESCE(NEW.valid_until, '2999-12-31'::TIMESTAMPTZ) >= valid_from)
        )
    ) THEN
        RAISE EXCEPTION 'Les périodes de validité des cartographies ne peuvent pas se chevaucher pour un même type';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer la capacité totale d'une zone avec ses sous-zones
CREATE OR REPLACE FUNCTION calculate_zone_total_capacity(p_zone_id VARCHAR(255))
RETURNS INTEGER AS $$
DECLARE
    total_capacity INTEGER := 0;
BEGIN
    WITH RECURSIVE zone_hierarchy AS (
        -- Zone de base
        SELECT id, capacity FROM venue_zones WHERE id = p_zone_id
        UNION ALL
        -- Sous-zones récursives
        SELECT z.id, z.capacity 
        FROM venue_zones z
        JOIN zone_hierarchy zh ON z.parent_zone_id = zh.id
    )
    SELECT SUM(capacity) INTO total_capacity FROM zone_hierarchy;
    
    RETURN COALESCE(total_capacity, 0);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier la cohérence des places avec leur zone
CREATE OR REPLACE FUNCTION check_seat_zone_consistency()
RETURNS TRIGGER AS $$
DECLARE
    zone_has_seats BOOLEAN;
    zone_layout seat_layout;
BEGIN
    -- Récupérer les infos de la zone
    SELECT has_seats, seat_layout INTO zone_has_seats, zone_layout
    FROM venue_zones WHERE id = NEW.zone_id;
    
    -- Vérifier que la zone accepte des places
    IF NOT zone_has_seats THEN
        RAISE EXCEPTION 'La zone % n''accepte pas de places individuelles', NEW.zone_id;
    END IF;
    
    -- Vérifier la cohérence du layout
    IF zone_layout = 'STANDING' AND NEW.seat_type != 'STANDARD' THEN
        RAISE EXCEPTION 'Les zones debout ne peuvent avoir que des places standard';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. TRIGGERS
-- =====================================================

-- Triggers pour updated_at automatique
CREATE TRIGGER trigger_venues_updated_at
    BEFORE UPDATE ON venues
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_venue_mappings_updated_at
    BEFORE UPDATE ON venue_mappings
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_venue_zones_updated_at
    BEFORE UPDATE ON venue_zones
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_seats_updated_at
    BEFORE UPDATE ON seats
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_access_points_updated_at
    BEFORE UPDATE ON access_points
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_venue_services_updated_at
    BEFORE UPDATE ON venue_services
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_venue_media_updated_at
    BEFORE UPDATE ON venue_media
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour validation des dates de mapping
CREATE TRIGGER trigger_validate_venue_mapping_dates
    BEFORE INSERT OR UPDATE ON venue_mappings
    FOR EACH ROW
    EXECUTE FUNCTION validate_venue_mapping_dates();

-- Trigger pour validation de cohérence des places
CREATE TRIGGER trigger_check_seat_zone_consistency
    BEFORE INSERT OR UPDATE ON seats
    FOR EACH ROW
    EXECUTE FUNCTION check_seat_zone_consistency();

-- =====================================================
-- 8. VUES UTILES
-- =====================================================

-- Vue des venues avec mapping par défaut
CREATE VIEW v_venues_with_default_mapping AS
SELECT 
    v.id,
    v.name,
    v.slug,
    v.city,
    v.max_capacity,
    v.is_active,
    vm.id as default_mapping_id,
    vm.name as default_mapping_name,
    vm.effective_capacity,
    vm.mapping_type
FROM venues v
LEFT JOIN venue_mappings vm ON v.default_mapping_id = vm.id;

-- Vue des zones avec capacité totale incluant sous-zones
CREATE VIEW v_zones_with_total_capacity AS
SELECT 
    z.id,
    z.mapping_id,
    z.name,
    z.code,
    z.zone_type,
    z.category,
    z.capacity as direct_capacity,
    calculate_zone_total_capacity(z.id) as total_capacity,
    z.level,
    z.parent_zone_id
FROM venue_zones z;

-- Vue des mappings actifs avec compteurs
CREATE VIEW v_active_mappings_summary AS
SELECT 
    vm.id,
    vm.venue_id,
    v.name as venue_name,
    vm.name as mapping_name,
    vm.mapping_type,
    vm.effective_capacity,
    COUNT(DISTINCT vz.id) as zone_count,
    COUNT(DISTINCT ap.id) as access_point_count,
    vm.is_active,
    vm.valid_from,
    vm.valid_until
FROM venue_mappings vm
JOIN venues v ON vm.venue_id = v.id
LEFT JOIN venue_zones vz ON vm.id = vz.mapping_id
LEFT JOIN access_points ap ON vm.id = ap.mapping_id
WHERE vm.is_active = TRUE
GROUP BY vm.id, v.name;

-- Vue des places disponibles par zone
CREATE VIEW v_seats_availability_by_zone AS
SELECT 
    z.id as zone_id,
    z.name as zone_name,
    z.code as zone_code,
    COUNT(s.id) as total_seats,
    COUNT(s.id) FILTER (WHERE s.status = 'AVAILABLE') as available_seats,
    COUNT(s.id) FILTER (WHERE s.status = 'SOLD') as sold_seats,
    COUNT(s.id) FILTER (WHERE s.status = 'BLOCKED') as blocked_seats,
    COUNT(s.id) FILTER (WHERE s.is_accessible = TRUE) as accessible_seats
FROM venue_zones z
LEFT JOIN seats s ON z.id = s.zone_id
WHERE z.has_seats = TRUE
GROUP BY z.id, z.name, z.code;

-- =====================================================
-- 9. DONNÉES D'INITIALISATION (Exemples)
-- =====================================================

-- Insertion d'un venue exemple
INSERT INTO venues (id, name, slug, address, city, postal_code, country, latitude, longitude, max_capacity, description, global_services) VALUES
('venue_stade_olympique_001', 'Stade Olympique de Tunis', 'stade-olympique-tunis', 
 'Avenue Habib Bourguiba, Cité Olympique', 'Tunis', '1000', 'TN', 
 36.8065, 10.1815, 45000, 
 'Stade principal du Club Africain, rénové en 2020 avec installations modernes',
 ARRAY['parking_1000_places', 'wifi_gratuit', 'boutique_officielle', 'infirmerie']);

-- Insertion d'une cartographie par défaut
INSERT INTO venue_mappings (id, venue_id, name, code, description, mapping_type, event_categories, effective_capacity) VALUES
('mapping_football_standard_001', 'venue_stade_olympique_001', 
 'Configuration Football Standard', 'FOOTBALL_STD', 
 'Configuration standard pour matchs de football avec toutes tribunes opérationnelles',
 'DEFAULT', ARRAY['FOOTBALL_MATCH', 'FRIENDLY_MATCH', 'CUP_MATCH'], 45000);

-- Mise à jour du venue avec la cartographie par défaut
UPDATE venues SET default_mapping_id = 'mapping_football_standard_001' 
WHERE id = 'venue_stade_olympique_001';

-- =====================================================
-- 10. PROCÉDURES DE MAINTENANCE
-- =====================================================

-- Procédure pour créer une nouvelle cartographie avec copie de zones
CREATE OR REPLACE FUNCTION create_mapping_from_template(
    p_venue_id VARCHAR(255),
    p_template_mapping_id VARCHAR(255),
    p_new_name VARCHAR(200),
    p_new_code VARCHAR(100),
    p_mapping_type mapping_type,
    p_effective_capacity INTEGER
) RETURNS VARCHAR(255) AS $$
DECLARE
    new_mapping_id VARCHAR(255);
    zone_mapping JSONB := '{}'::JSONB;
BEGIN
    -- Créer la nouvelle cartographie
    INSERT INTO venue_mappings (venue_id, name, code, mapping_type, effective_capacity)
    VALUES (p_venue_id, p_new_name, p_new_code, p_mapping_type, p_effective_capacity)
    RETURNING id INTO new_mapping_id;
    
    -- Copier les zones de la cartographie template
    WITH RECURSIVE zone_copy AS (
        -- Copier les zones de niveau 1
        INSERT INTO venue_zones (
            mapping_id, parent_zone_id, name, code, description, 
            level, display_order, zone_type, category, capacity, 
            has_seats, seat_layout, details, notes, metadata
        )
        SELECT 
            new_mapping_id, NULL, name, code, description,
            level, display_order, zone_type, category, capacity,
            has_seats, seat_layout, details, notes, metadata
        FROM venue_zones
        WHERE mapping_id = p_template_mapping_id AND parent_zone_id IS NULL
        RETURNING id, code
    )
    SELECT jsonb_object_agg(code, id) INTO zone_mapping FROM zone_copy;
    
    -- TODO: Gérer les sous-zones récursivement si nécessaire
    
    RETURN new_mapping_id;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 11. COMMENTAIRES SUR LES TABLES
-- =====================================================

COMMENT ON TABLE venues IS 'Lieux physiques (stades, salles) avec capacité maximale théorique';
COMMENT ON TABLE venue_mappings IS 'Configurations multiples d''un même venue selon usage (football, concert, maintenance)';
COMMENT ON TABLE venue_zones IS 'Organisation hiérarchique des espaces dans une cartographie';
COMMENT ON TABLE seats IS 'Places individuelles numérotées pour les zones qui le nécessitent';
COMMENT ON TABLE access_points IS 'Points d''entrée/sortie avec configuration de sécurité';
COMMENT ON TABLE venue_services IS 'Services disponibles au niveau venue ou zone';
COMMENT ON TABLE venue_media IS 'Fichiers multimédias pour visualisation et aide à la vente';

-- Commentaires sur les colonnes importantes
COMMENT ON COLUMN venue_mappings.mapping_type IS 'Type de configuration: DEFAULT, EVENT_SPECIFIC, SEASONAL, MAINTENANCE';
COMMENT ON COLUMN venue_zones.level IS 'Niveau hiérarchique: 1=tribune, 2=section, 3=sous-section';
COMMENT ON COLUMN seats.coordinates IS 'Position JSON {x, y} pour affichage sur plan interactif';
COMMENT ON COLUMN access_points.allowed_zones IS 'Array des IDs de zones accessibles via ce point';

-- =====================================================
-- SCRIPT TERMINÉ AVEC SUCCÈS
-- =====================================================

-- Vérification finale
SELECT 'Script SQL Venues exécuté avec succès!' AS status;
SELECT 'Tables créées: venues, venue_mappings, venue_zones, seats, access_points, venue_services, venue_media' AS tables_created;
SELECT 'Énumérations créées: mapping_type, zone_type, zone_category, seat_layout, seat_type, seat_status, access_type, security_level, service_category, media_type, media_category' AS enums_created;