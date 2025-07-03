-- =====================================================
-- SCRIPT SQL POSTGRESQL - MODULE ÉVÉNEMENTS
-- Plateforme Entrix - Système de Gestion des Événements
-- Version: 1.0
-- Date: Juin 2025
-- =====================================================

-- =====================================================
-- 1. SUPPRESSION DES OBJETS EXISTANTS (Ordre inverse)
-- =====================================================

-- Suppression des tables dans l'ordre inverse des dépendances
DROP TABLE IF EXISTS event_stats CASCADE;
DROP TABLE IF EXISTS event_restrictions CASCADE;
DROP TABLE IF EXISTS event_media CASCADE;
DROP TABLE IF EXISTS event_schedules CASCADE;
DROP TABLE IF EXISTS participant_relationships CASCADE;
DROP TABLE IF EXISTS participant_staff CASCADE;
DROP TABLE IF EXISTS event_participants CASCADE;
DROP TABLE IF EXISTS events CASCADE;
DROP TABLE IF EXISTS event_groups CASCADE;
DROP TABLE IF EXISTS event_categories CASCADE;
DROP TABLE IF EXISTS participants CASCADE;

-- Suppression des énumérations
DROP TYPE IF EXISTS event_media_type CASCADE;
DROP TYPE IF EXISTS restriction_type CASCADE;
DROP TYPE IF EXISTS participant_relationship_type CASCADE;
DROP TYPE IF EXISTS event_participant_role CASCADE;
DROP TYPE IF EXISTS event_visibility CASCADE;
DROP TYPE IF EXISTS event_status CASCADE;
DROP TYPE IF EXISTS event_group_type CASCADE;
DROP TYPE IF EXISTS participant_type CASCADE;

-- Suppression des fonctions et triggers
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS validate_event_dates() CASCADE;
DROP FUNCTION IF EXISTS update_group_completed_events() CASCADE;

-- =====================================================
-- 2. CRÉATION DES ÉNUMÉRATIONS
-- =====================================================

-- Type de participant
CREATE TYPE participant_type AS ENUM (
    'TEAM',             -- Équipe sportive
    'ARTIST',           -- Artiste/Musicien
    'SPEAKER',          -- Conférencier
    'ORGANIZATION',     -- Organisation/Entreprise
    'INDIVIDUAL',       -- Individu
    'REFEREE'           -- Arbitre/Officiel
);

-- Type de groupe d'événements
CREATE TYPE event_group_type AS ENUM (
    'SEASON',           -- Saison sportive
    'TOURNAMENT',       -- Tournoi
    'FESTIVAL',         -- Festival culturel
    'CONFERENCE',       -- Série de conférences
    'CONCERT_TOUR',     -- Tournée de concerts
    'CHAMPIONSHIP',     -- Championnat
    'CUP',              -- Coupe
    'FRIENDLY'          -- Matchs amicaux
);

-- Statut d'événement
CREATE TYPE event_status AS ENUM (
    'DRAFT',            -- Brouillon
    'SCHEDULED',        -- Programmé
    'CONFIRMED',        -- Confirmé
    'LIVE',             -- En cours
    'FINISHED',         -- Terminé
    'CANCELLED',        -- Annulé
    'POSTPONED',        -- Reporté
    'SUSPENDED'         -- Suspendu
);

-- Visibilité d'événement
CREATE TYPE event_visibility AS ENUM (
    'PUBLIC',           -- Public
    'PRIVATE',          -- Privé
    'MEMBERS_ONLY',     -- Membres uniquement
    'VIP_ONLY',         -- VIP uniquement
    'STAFF_ONLY'        -- Personnel uniquement
);

-- Rôle de participant dans un événement
CREATE TYPE event_participant_role AS ENUM (
    'HOME_TEAM',        -- Équipe à domicile
    'AWAY_TEAM',        -- Équipe visiteur
    'MAIN_ARTIST',      -- Artiste principal
    'OPENING_ACT',      -- Première partie
    'GUEST',            -- Invité
    'KEYNOTE_SPEAKER',  -- Conférencier principal
    'PANELIST',         -- Membre du panel
    'MODERATOR',        -- Modérateur
    'ORGANIZER',        -- Organisateur
    'SPONSOR',          -- Sponsor
    'REFEREE',          -- Arbitre
    'OFFICIAL'          -- Officiel
);

-- Type de relation entre participants
CREATE TYPE participant_relationship_type AS ENUM (
    'RIVALRY',          -- Rivalité
    'PARTNERSHIP',      -- Partenariat
    'SUBSIDIARY',       -- Filiale
    'ALLIANCE',         -- Alliance
    'COMPETITION',      -- Compétition
    'COLLABORATION',    -- Collaboration
    'FEUD',             -- Conflit
    'FRIENDSHIP'        -- Amitié
);

-- Type de restriction
CREATE TYPE restriction_type AS ENUM (
    'AGE_LIMIT',        -- Limite d'âge
    'DRESS_CODE',       -- Code vestimentaire
    'GEOGRAPHICAL',     -- Restriction géographique
    'MEMBERSHIP',       -- Restriction de membre
    'SECURITY',         -- Restriction de sécurité
    'CAPACITY',         -- Restriction de capacité
    'SPECIAL_NEEDS',    -- Besoins spéciaux
    'CONTENT_WARNING'   -- Avertissement contenu
);

-- Type de média événement
CREATE TYPE event_media_type AS ENUM (
    'POSTER',           -- Affiche
    'PHOTO',            -- Photo
    'VIDEO',            -- Vidéo
    'AUDIO',            -- Audio
    'DOCUMENT',         -- Document
    'LIVESTREAM',       -- Diffusion en direct
    'HIGHLIGHT',        -- Résumé/Highlights
    'INTERVIEW'         -- Interview
);

-- =====================================================
-- 3. CRÉATION DES TABLES PRINCIPALES
-- =====================================================

-- Table des participants (référentiel centralisé)
CREATE TABLE participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    short_name VARCHAR(100),
    type participant_type NOT NULL,
    category VARCHAR(50),
    
    -- Informations géographiques
    nationality VARCHAR(2),
    city VARCHAR(100),
    
    -- Informations temporelles
    founded_date DATE,
    disbanded_date DATE,
    
    -- Médias
    logo_url TEXT,
    banner_url TEXT,
    website_url TEXT,
    
    -- Contact
    contact_email VARCHAR(255),
    contact_phone VARCHAR(20),
    contact_address TEXT,
    
    -- Réseaux sociaux
    social_media JSONB,
    
    -- Données étendues
    description TEXT,
    achievements TEXT[],
    statistics JSONB,
    metadata JSONB,
    
    -- Statut
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_verified BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT chk_participants_founded_disbanded CHECK (
        disbanded_date IS NULL OR disbanded_date >= founded_date
    ),
    CONSTRAINT chk_participants_nationality CHECK (
        nationality IS NULL OR LENGTH(nationality) = 2
    )
);

-- Table des catégories d'événements
CREATE TABLE event_categories (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    parent_category_id UUID,
    
    -- Configuration par défaut
    default_duration INTEGER, -- en minutes
    default_capacity INTEGER,
    requires_referee BOOLEAN NOT NULL DEFAULT FALSE,
    allows_draw BOOLEAN NOT NULL DEFAULT FALSE,
    has_overtime BOOLEAN NOT NULL DEFAULT FALSE,
    has_penalties BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Médias
    icon_url TEXT,
    color_primary VARCHAR(7),
    color_secondary VARCHAR(7),
    
    -- Configuration billetterie
    default_ticket_price DECIMAL(10,2),
    currency VARCHAR(3) NOT NULL DEFAULT 'TND',
    
    -- Métadonnées
    rules JSONB,
    metadata JSONB,
    
    -- Statut
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT fk_event_categories_parent 
        FOREIGN KEY (parent_category_id) REFERENCES event_categories(id) ON DELETE SET NULL,
    CONSTRAINT chk_event_categories_duration CHECK (
        default_duration IS NULL OR default_duration > 0
    ),
    CONSTRAINT chk_event_categories_capacity CHECK (
        default_capacity IS NULL OR default_capacity > 0
    ),
    CONSTRAINT chk_event_categories_price CHECK (
        default_ticket_price IS NULL OR default_ticket_price >= 0
    )
);

-- Table des groupes d'événements
CREATE TABLE event_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    type event_group_type NOT NULL,
    parent_group_id UUID,
    
    -- Configuration temporelle
    season VARCHAR(50),
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    
    -- Lieu par défaut
    venue_id UUID,
    
    -- Statistiques
    total_events INTEGER,
    completed_events INTEGER NOT NULL DEFAULT 0,
    
    -- Configuration
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    registration_open BOOLEAN NOT NULL DEFAULT FALSE,
    ranking_enabled BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Limites
    capacity_limit INTEGER,
    current_participants INTEGER NOT NULL DEFAULT 0,
    
    -- Métadonnées
    rules JSONB,
    prize_pool JSONB,
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT fk_event_groups_parent_group 
        FOREIGN KEY (parent_group_id) REFERENCES event_groups(id) ON DELETE SET NULL,
    CONSTRAINT fk_event_groups_venue 
        FOREIGN KEY (venue_id) REFERENCES venues(id) ON DELETE SET NULL,
    CONSTRAINT chk_event_groups_dates CHECK (end_date >= start_date),
    CONSTRAINT chk_total_events CHECK (total_events IS NULL OR total_events > 0),
    CONSTRAINT chk_completed_events CHECK (completed_events >= 0),
    CONSTRAINT chk_capacity_limit CHECK (capacity_limit IS NULL OR capacity_limit > 0),
    CONSTRAINT chk_current_participants CHECK (current_participants >= 0)
);

-- Table des événements
CREATE TABLE events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    title VARCHAR(300) NOT NULL,
    short_title VARCHAR(100),
    description TEXT,
    
    -- Classification
    category_id UUID NOT NULL,
    group_id UUID,
    parent_event_id UUID,
    
    -- Lieu et configuration
    venue_id UUID NOT NULL,
    venue_mapping_id UUID,
    
    -- Planification temporelle
    scheduled_start TIMESTAMPTZ NOT NULL,
    scheduled_end TIMESTAMPTZ NOT NULL,
    actual_start TIMESTAMPTZ,
    actual_end TIMESTAMPTZ,
    doors_open TIMESTAMPTZ,
    
    -- Statut et visibilité
    status event_status NOT NULL DEFAULT 'DRAFT',
    visibility event_visibility NOT NULL DEFAULT 'PUBLIC',
    
    -- Capacité et affluence
    capacity_override INTEGER,
    is_sold_out BOOLEAN NOT NULL DEFAULT FALSE,
    attendance INTEGER,
    
    -- Billetterie
    sales_start TIMESTAMPTZ,
    sales_end TIMESTAMPTZ,
    
    -- Gestion des modifications
    cancellation_reason TEXT,
    cancellation_date TIMESTAMPTZ,
    rescheduled_to UUID,
    
    -- Informations additionnelles
    broadcast_info JSONB,
    weather_conditions VARCHAR(100),
    special_instructions TEXT,
    
    -- Classification et recherche
    tags TEXT[],
    
    -- Métadonnées
    results JSONB,
    statistics JSONB,
    metadata JSONB,
    
    -- Audit
    created_by UUID,
    published_by UUID,
    published_at TIMESTAMPTZ,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT fk_events_category 
        FOREIGN KEY (category_id) REFERENCES event_categories(id),
    CONSTRAINT fk_events_group 
        FOREIGN KEY (group_id) REFERENCES event_groups(id) ON DELETE SET NULL,
    CONSTRAINT fk_events_parent 
        FOREIGN KEY (parent_event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT fk_events_venue 
        FOREIGN KEY (venue_id) REFERENCES venues(id),
    CONSTRAINT fk_events_venue_mapping 
        FOREIGN KEY (venue_mapping_id) REFERENCES venue_mappings(id) ON DELETE SET NULL,
    CONSTRAINT fk_events_rescheduled 
        FOREIGN KEY (rescheduled_to) REFERENCES events(id) ON DELETE SET NULL,
    CONSTRAINT fk_events_created_by 
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_events_published_by 
        FOREIGN KEY (published_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_events_dates CHECK (scheduled_end >= scheduled_start),
    CONSTRAINT chk_actual_dates CHECK (
        (actual_start IS NULL AND actual_end IS NULL) OR 
        (actual_start IS NOT NULL AND actual_end IS NOT NULL AND actual_end >= actual_start)
    ),
    CONSTRAINT chk_doors_open CHECK (doors_open IS NULL OR doors_open <= scheduled_start),
    CONSTRAINT chk_sales_dates CHECK (
        (sales_start IS NULL AND sales_end IS NULL) OR 
        (sales_start IS NOT NULL AND sales_end IS NOT NULL AND sales_end >= sales_start)
    ),
    CONSTRAINT chk_capacity_override CHECK (capacity_override IS NULL OR capacity_override > 0),
    CONSTRAINT chk_attendance CHECK (attendance IS NULL OR attendance >= 0)
);

-- Table de liaison événements-participants
CREATE TABLE event_participants (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    participant_id UUID NOT NULL,
    role event_participant_role NOT NULL,
    
    -- Confirmation
    is_confirmed BOOLEAN NOT NULL DEFAULT FALSE,
    confirmation_date TIMESTAMPTZ,
    
    -- Aspects financiers
    appearance_fee DECIMAL(12,2),
    contract_number VARCHAR(100),
    
    -- Performance
    performance_order INTEGER,
    performance_time TIMESTAMPTZ,
    performance_duration INTEGER, -- en minutes
    
    -- Exigences
    special_requirements TEXT,
    technical_requirements JSONB,
    cancellation_policy TEXT,
    
    -- Services fournis
    transport_provided BOOLEAN NOT NULL DEFAULT FALSE,
    accommodation_provided BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Résultats (pour événements sportifs)
    score INTEGER,
    position INTEGER,
    points INTEGER,
    
    -- Métadonnées
    metadata JSONB,
    
    -- Audit
    confirmed_at TIMESTAMPTZ,
    created_by UUID,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT fk_event_participants_event 
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT fk_event_participants_participant 
        FOREIGN KEY (participant_id) REFERENCES participants(id),
    CONSTRAINT fk_event_participants_created_by 
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uk_event_participants_event_participant_role 
        UNIQUE (event_id, participant_id, role),
    CONSTRAINT chk_appearance_fee CHECK (appearance_fee IS NULL OR appearance_fee >= 0),
    CONSTRAINT chk_performance_order CHECK (performance_order IS NULL OR performance_order > 0),
    CONSTRAINT chk_performance_duration CHECK (performance_duration IS NULL OR performance_duration > 0),
    CONSTRAINT chk_score CHECK (score IS NULL OR score >= 0),
    CONSTRAINT chk_position CHECK (position IS NULL OR position > 0),
    CONSTRAINT chk_points CHECK (points IS NULL OR points >= 0)
);

-- Table du personnel des participants
CREATE TABLE participant_staff (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_id UUID NOT NULL,
    name VARCHAR(200) NOT NULL,
    role VARCHAR(100) NOT NULL,
    
    -- Informations sportives (si applicable)
    jersey_number VARCHAR(10),
    position VARCHAR(50),
    
    -- Informations personnelles
    nationality VARCHAR(2),
    birth_date DATE,
    photo_url TEXT,
    bio TEXT,
    
    -- Statut
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_captain BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Dates de service
    joined_date DATE,
    left_date DATE,
    contract_end DATE,
    
    -- Valorisation
    market_value DECIMAL(10,2),
    
    -- Réseaux sociaux
    social_media JSONB,
    
    -- Accomplissements
    achievements TEXT[],
    
    -- Métadonnées
    statistics JSONB,
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT fk_participant_staff_participant 
        FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE CASCADE,
    CONSTRAINT chk_staff_dates CHECK (left_date IS NULL OR left_date >= joined_date),
    CONSTRAINT chk_contract_end CHECK (contract_end IS NULL OR contract_end >= joined_date),
    CONSTRAINT chk_market_value CHECK (market_value IS NULL OR market_value >= 0),
    CONSTRAINT chk_birth_date CHECK (birth_date IS NULL OR birth_date <= CURRENT_DATE),
    CONSTRAINT chk_nationality CHECK (
        nationality IS NULL OR LENGTH(nationality) = 2
    )
);

-- Table des relations entre participants
CREATE TABLE participant_relationships (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    participant_a_id UUID NOT NULL,
    participant_b_id UUID NOT NULL,
    relationship_type participant_relationship_type NOT NULL,
    
    -- Intensité de la relation (1-10)
    intensity INTEGER NOT NULL DEFAULT 5,
    description TEXT,
    
    -- Dates
    start_date DATE,
    end_date DATE,
    
    -- Statut
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_mutual BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Métadonnées
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT fk_participant_relationships_a 
        FOREIGN KEY (participant_a_id) REFERENCES participants(id) ON DELETE CASCADE,
    CONSTRAINT fk_participant_relationships_b 
        FOREIGN KEY (participant_b_id) REFERENCES participants(id) ON DELETE CASCADE,
    CONSTRAINT uk_participant_relationships 
        UNIQUE (participant_a_id, participant_b_id, relationship_type),
    CONSTRAINT chk_different_participants CHECK (participant_a_id != participant_b_id),
    CONSTRAINT chk_intensity_range CHECK (intensity >= 1 AND intensity <= 10),
    CONSTRAINT chk_relationship_dates CHECK (end_date IS NULL OR end_date >= start_date)
);

-- Table des plannings détaillés
CREATE TABLE event_schedules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    session_name VARCHAR(200) NOT NULL,
    session_code VARCHAR(100),
    session_type VARCHAR(50) NOT NULL,
    description TEXT,
    
    -- Planning
    start_time TIMESTAMPTZ NOT NULL,
    end_time TIMESTAMPTZ NOT NULL,
    
    -- Lieu
    venue_zone_id UUID,
    capacity_override INTEGER,
    
    -- Configuration
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    requires_separate_ticket BOOLEAN NOT NULL DEFAULT FALSE,
    display_order INTEGER NOT NULL DEFAULT 0,
    
    -- Métadonnées
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT fk_event_schedules_event 
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT fk_event_schedules_zone 
        FOREIGN KEY (venue_zone_id) REFERENCES venue_zones(id) ON DELETE SET NULL,
    CONSTRAINT chk_schedule_times CHECK (end_time > start_time),
    CONSTRAINT chk_schedule_capacity CHECK (capacity_override IS NULL OR capacity_override > 0)
);

-- Table des médias événements
CREATE TABLE event_media (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    media_type event_media_type NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Fichier
    url TEXT NOT NULL,
    thumbnail_url TEXT,
    file_size INTEGER,
    duration INTEGER, -- en secondes pour vidéo/audio
    mime_type VARCHAR(100),
    
    -- Configuration
    is_primary BOOLEAN NOT NULL DEFAULT FALSE,
    is_public BOOLEAN NOT NULL DEFAULT TRUE,
    display_order INTEGER NOT NULL DEFAULT 0,
    
    -- Classification
    tags TEXT[],
    
    -- Métadonnées
    metadata JSONB,
    
    -- Audit
    uploaded_by UUID,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT fk_event_media_event 
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT fk_event_media_uploaded_by 
        FOREIGN KEY (uploaded_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_file_size CHECK (file_size IS NULL OR file_size > 0),
    CONSTRAINT chk_media_duration CHECK (duration IS NULL OR duration > 0)
);

-- Table des restrictions événements
CREATE TABLE event_restrictions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    restriction_type restriction_type NOT NULL,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    
    -- Restrictions d'âge
    min_age INTEGER,
    max_age INTEGER,
    
    -- Restrictions de groupes/rôles
    required_groups UUID[],
    required_roles VARCHAR(50)[],
    blocked_groups UUID[],
    
    -- Restrictions géographiques
    allowed_countries VARCHAR(2)[],
    blocked_countries VARCHAR(2)[],
    allowed_cities VARCHAR(100)[],
    
    -- Autres restrictions
    dress_code VARCHAR(200),
    special_conditions TEXT,
    
    -- Configuration de l'application
    is_enforced BOOLEAN NOT NULL DEFAULT TRUE,
    enforcement_level VARCHAR(20) NOT NULL DEFAULT 'STRICT',
    
    -- Métadonnées
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT fk_event_restrictions_event 
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT chk_min_age CHECK (min_age IS NULL OR min_age >= 0),
    CONSTRAINT chk_max_age CHECK (max_age IS NULL OR max_age >= 0),
    CONSTRAINT chk_age_range CHECK (
        (min_age IS NULL AND max_age IS NULL) OR 
        (min_age IS NOT NULL AND max_age IS NULL) OR
        (min_age IS NULL AND max_age IS NOT NULL) OR
        (min_age <= max_age)
    ),
    CONSTRAINT chk_enforcement_level CHECK (enforcement_level IN ('STRICT', 'FLEXIBLE', 'INFO_ONLY'))
);

-- Table des statistiques événements
CREATE TABLE event_stats (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    stat_type VARCHAR(50) NOT NULL,
    stat_category VARCHAR(50),
    stat_key VARCHAR(100) NOT NULL,
    stat_value VARCHAR(200) NOT NULL,
    
    -- Participant associé (optionnel)
    participant_id UUID,
    
    -- Timing
    recorded_at TIMESTAMPTZ NOT NULL,
    recorded_by UUID,
    
    -- Statut
    is_official BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Métadonnées
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT fk_event_stats_event 
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT fk_event_stats_participant 
        FOREIGN KEY (participant_id) REFERENCES participants(id) ON DELETE SET NULL,
    CONSTRAINT fk_event_stats_recorded_by 
        FOREIGN KEY (recorded_by) REFERENCES users(id) ON DELETE SET NULL
);

-- =====================================================
-- 4. INDEX POUR PERFORMANCES
-- =====================================================

-- Index sur participants
CREATE INDEX idx_participants_code ON participants(code);
CREATE INDEX idx_participants_type ON participants(type);
CREATE INDEX idx_participants_active ON participants(is_active);
CREATE INDEX idx_participants_category ON participants(category);
CREATE INDEX idx_participants_nationality ON participants(nationality);

-- Index sur event_categories
CREATE INDEX idx_event_categories_code ON event_categories(code);
CREATE INDEX idx_event_categories_parent ON event_categories(parent_category_id);
CREATE INDEX idx_event_categories_active ON event_categories(is_active);

-- Index sur event_groups
CREATE INDEX idx_event_groups_code ON event_groups(code);
CREATE INDEX idx_event_groups_type ON event_groups(type);
CREATE INDEX idx_event_groups_active ON event_groups(is_active);
CREATE INDEX idx_event_groups_dates ON event_groups(start_date, end_date);
CREATE INDEX idx_event_groups_season ON event_groups(season);

-- Index critiques sur events (haute fréquence)
CREATE INDEX idx_events_code ON events(code);
CREATE INDEX idx_events_status ON events(status);
CREATE INDEX idx_events_visibility ON events(visibility);
CREATE INDEX idx_events_category ON events(category_id);
CREATE INDEX idx_events_group ON events(group_id);
CREATE INDEX idx_events_venue ON events(venue_id);
CREATE INDEX idx_events_scheduled_dates ON events(scheduled_start, scheduled_end);
CREATE INDEX idx_events_sales_dates ON events(sales_start, sales_end);
CREATE INDEX idx_events_tags ON events USING GIN(tags);

-- Index composite pour recherche d'événements
CREATE INDEX idx_events_public_upcoming ON events(status, visibility, scheduled_start)
    WHERE status IN ('SCHEDULED', 'CONFIRMED') AND visibility = 'PUBLIC';

-- Index sur event_participants
CREATE INDEX idx_event_participants_event ON event_participants(event_id);
CREATE INDEX idx_event_participants_participant ON event_participants(participant_id);
CREATE INDEX idx_event_participants_role ON event_participants(role);
CREATE INDEX idx_event_participants_confirmed ON event_participants(is_confirmed);

-- Index sur participant_staff
CREATE INDEX idx_participant_staff_participant ON participant_staff(participant_id);
CREATE INDEX idx_participant_staff_active ON participant_staff(is_active);
CREATE INDEX idx_participant_staff_role ON participant_staff(role);

-- Index sur participant_relationships
CREATE INDEX idx_participant_relationships_a ON participant_relationships(participant_a_id);
CREATE INDEX idx_participant_relationships_b ON participant_relationships(participant_b_id);
CREATE INDEX idx_participant_relationships_type ON participant_relationships(relationship_type);
CREATE INDEX idx_participant_relationships_active ON participant_relationships(is_active);

-- Index sur event_schedules
CREATE INDEX idx_event_schedules_event ON event_schedules(event_id);
CREATE INDEX idx_event_schedules_times ON event_schedules(start_time, end_time);

-- Index sur event_media
CREATE INDEX idx_event_media_event ON event_media(event_id);
CREATE INDEX idx_event_media_type ON event_media(media_type);
CREATE INDEX idx_event_media_public ON event_media(is_public);
CREATE INDEX idx_event_media_primary ON event_media(is_primary);

-- Index sur event_restrictions
CREATE INDEX idx_event_restrictions_event ON event_restrictions(event_id);
CREATE INDEX idx_event_restrictions_type ON event_restrictions(restriction_type);

-- Index sur event_stats
CREATE INDEX idx_event_stats_event ON event_stats(event_id);
CREATE INDEX idx_event_stats_participant ON event_stats(participant_id);
CREATE INDEX idx_event_stats_type ON event_stats(stat_type);
CREATE INDEX idx_event_stats_recorded ON event_stats(recorded_at);

-- =====================================================
-- 5. FONCTIONS UTILITAIRES
-- =====================================================

-- Fonction pour mettre à jour automatiquement updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction de validation des dates d'événement
CREATE OR REPLACE FUNCTION validate_event_dates()
RETURNS TRIGGER AS $$
BEGIN
    -- Vérifier que la vente ne commence pas après l'événement
    IF NEW.sales_start IS NOT NULL AND NEW.sales_start >= NEW.scheduled_start THEN
        RAISE EXCEPTION 'Sales start date must be before event start date';
    END IF;
    
    -- Vérifier que la vente se termine avant l'événement
    IF NEW.sales_end IS NOT NULL AND NEW.sales_end > NEW.scheduled_start THEN
        RAISE EXCEPTION 'Sales end date must be before or equal to event start date';
    END IF;
    
    -- Vérifier que l'ouverture des portes est avant le début
    IF NEW.doors_open IS NOT NULL AND NEW.doors_open > NEW.scheduled_start THEN
        RAISE EXCEPTION 'Doors open time must be before event start time';
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour le nombre d'événements terminés dans un groupe
CREATE OR REPLACE FUNCTION update_group_completed_events()
RETURNS TRIGGER AS $$
DECLARE
    v_group_id UUID;
    v_completed_count INTEGER;
BEGIN
    -- Récupérer l'ID du groupe
    IF TG_OP = 'DELETE' THEN
        v_group_id := OLD.group_id;
    ELSE
        v_group_id := NEW.group_id;
    END IF;
    
    -- Ne rien faire si pas de groupe
    IF v_group_id IS NULL THEN
        RETURN COALESCE(NEW, OLD);
    END IF;
    
    -- Compter les événements terminés
    SELECT COUNT(*) 
    INTO v_completed_count
    FROM events 
    WHERE group_id = v_group_id 
    AND status = 'FINISHED';
    
    -- Mettre à jour le groupe
    UPDATE event_groups 
    SET completed_events = v_completed_count,
        updated_at = NOW()
    WHERE id = v_group_id;
    
    RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les événements à venir d'un participant
CREATE OR REPLACE FUNCTION get_participant_upcoming_events(
    p_participant_id UUID,
    p_limit INTEGER DEFAULT 10
)
RETURNS TABLE(
    event_id UUID,
    event_title VARCHAR,
    event_date TIMESTAMPTZ,
    venue_name VARCHAR,
    role event_participant_role,
    is_confirmed BOOLEAN
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        e.id,
        e.title,
        e.scheduled_start,
        v.name,
        ep.role,
        ep.is_confirmed
    FROM events e
    JOIN event_participants ep ON e.id = ep.event_id
    JOIN venues v ON e.venue_id = v.id
    WHERE ep.participant_id = p_participant_id
    AND e.scheduled_start > NOW()
    AND e.status IN ('SCHEDULED', 'CONFIRMED')
    ORDER BY e.scheduled_start ASC
    LIMIT p_limit;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir les statistiques d'un participant
CREATE OR REPLACE FUNCTION get_participant_stats(
    p_participant_id UUID,
    p_stat_type VARCHAR DEFAULT NULL
)
RETURNS TABLE(
    stat_type VARCHAR,
    stat_key VARCHAR,
    stat_value VARCHAR,
    event_count BIGINT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        es.stat_type,
        es.stat_key,
        es.stat_value,
        COUNT(*) as event_count
    FROM event_stats es
    JOIN events e ON es.event_id = e.id
    WHERE es.participant_id = p_participant_id
    AND (p_stat_type IS NULL OR es.stat_type = p_stat_type)
    AND es.is_official = TRUE
    GROUP BY es.stat_type, es.stat_key, es.stat_value
    ORDER BY es.stat_type, es.stat_key;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour générer un code d'événement automatique
CREATE OR REPLACE FUNCTION generate_event_code(
    p_category_code VARCHAR,
    p_venue_code VARCHAR DEFAULT NULL,
    p_date DATE DEFAULT CURRENT_DATE
)
RETURNS VARCHAR AS $$
DECLARE
    v_event_code VARCHAR;
    v_counter INTEGER := 1;
    v_date_str VARCHAR := TO_CHAR(p_date, 'YYYY-MM-DD');
    v_venue_part VARCHAR := COALESCE(p_venue_code, 'GEN');
BEGIN
    LOOP
        v_event_code := format('%s-%s-%s-%s', 
            p_category_code, 
            v_venue_part, 
            v_date_str, 
            LPAD(v_counter::TEXT, 3, '0')
        );
        
        -- Vérifier l'unicité
        IF NOT EXISTS (SELECT 1 FROM events WHERE code = v_event_code) THEN
            RETURN v_event_code;
        END IF;
        
        v_counter := v_counter + 1;
        
        -- Sécurité pour éviter boucle infinie
        IF v_counter > 999 THEN
            RAISE EXCEPTION 'Unable to generate unique event code after % attempts', v_counter;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Fonction de nettoyage des événements brouillon anciens
CREATE OR REPLACE FUNCTION cleanup_old_draft_events(
    p_days_old INTEGER DEFAULT 30
)
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    DELETE FROM events 
    WHERE status = 'DRAFT'
    AND created_at < NOW() - INTERVAL '1 day' * p_days_old;
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. TRIGGERS
-- =====================================================

-- Triggers pour updated_at automatique
CREATE TRIGGER trigger_participants_updated_at
    BEFORE UPDATE ON participants
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_event_categories_updated_at
    BEFORE UPDATE ON event_categories
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_event_groups_updated_at
    BEFORE UPDATE ON event_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_events_updated_at
    BEFORE UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_participant_staff_updated_at
    BEFORE UPDATE ON participant_staff
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_participant_relationships_updated_at
    BEFORE UPDATE ON participant_relationships
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Triggers de validation
CREATE TRIGGER trigger_events_date_validation
    BEFORE INSERT OR UPDATE ON events
    FOR EACH ROW
    EXECUTE FUNCTION validate_event_dates();

-- Trigger pour mettre à jour les statistiques de groupe
CREATE TRIGGER trigger_events_group_stats_update
    AFTER INSERT OR UPDATE OR DELETE ON events
    FOR EACH ROW
    EXECUTE FUNCTION update_group_completed_events();

-- =====================================================
-- 7. VUES UTILES
-- =====================================================

-- Vue complète des événements avec détails
CREATE VIEW v_events_full AS
SELECT 
    e.id,
    e.code,
    e.title,
    e.short_title,
    e.description,
    e.scheduled_start,
    e.scheduled_end,
    e.actual_start,
    e.actual_end,
    e.status,
    e.visibility,
    e.attendance,
    e.is_sold_out,
    
    -- Catégorie
    ec.name as category_name,
    ec.code as category_code,
    
    -- Groupe
    eg.name as group_name,
    eg.code as group_code,
    eg.season,
    
    -- Venue
    v.name as venue_name,
    v.address as venue_address,
    v.city as venue_city,
    COALESCE(e.capacity_override, v.total_capacity) as capacity,
    
    -- Participants principaux
    home_team.name as home_team_name,
    away_team.name as away_team_name,
    main_artist.name as main_artist_name,
    
    -- Métadonnées
    e.tags,
    e.metadata,
    e.results,
    e.statistics
    
FROM events e
JOIN event_categories ec ON e.category_id = ec.id
LEFT JOIN event_groups eg ON e.group_id = eg.id
JOIN venues v ON e.venue_id = v.id
LEFT JOIN event_participants ep_home ON e.id = ep_home.event_id AND ep_home.role = 'HOME_TEAM'
LEFT JOIN participants home_team ON ep_home.participant_id = home_team.id
LEFT JOIN event_participants ep_away ON e.id = ep_away.event_id AND ep_away.role = 'AWAY_TEAM'
LEFT JOIN participants away_team ON ep_away.participant_id = away_team.id
LEFT JOIN event_participants ep_artist ON e.id = ep_artist.event_id AND ep_artist.role = 'MAIN_ARTIST'
LEFT JOIN participants main_artist ON ep_artist.participant_id = main_artist.id;

-- Vue des participants d'événements avec détails
CREATE VIEW v_event_participants_details AS
SELECT 
    ep.id,
    ep.event_id,
    ep.participant_id,
    ep.role,
    ep.is_confirmed,
    ep.performance_order,
    ep.score,
    ep.position,
    
    -- Événement
    e.title as event_title,
    e.scheduled_start as event_date,
    e.status as event_status,
    
    -- Participant
    p.name as participant_name,
    p.short_name as participant_short_name,
    p.type as participant_type,
    p.logo_url as participant_logo,
    
    -- Finances
    ep.appearance_fee,
    
    -- Métadonnées
    ep.metadata
    
FROM event_participants ep
JOIN events e ON ep.event_id = e.id
JOIN participants p ON ep.participant_id = p.id;

-- Vue des rivalités actives
CREATE VIEW v_active_rivalries AS
SELECT 
    pr.id,
    pr.relationship_type,
    pr.intensity,
    pr.description,
    pr.start_date,
    
    -- Participant A
    pa.name as participant_a_name,
    pa.short_name as participant_a_short,
    pa.logo_url as participant_a_logo,
    
    -- Participant B
    pb.name as participant_b_name,
    pb.short_name as participant_b_short,
    pb.logo_url as participant_b_logo,
    
    -- Derniers événements
    COUNT(e.id) as total_confrontations,
    MAX(e.scheduled_start) as last_confrontation
    
FROM participant_relationships pr
JOIN participants pa ON pr.participant_a_id = pa.id
JOIN participants pb ON pr.participant_b_id = pb.id
LEFT JOIN events e ON e.id IN (
    SELECT ep1.event_id 
    FROM event_participants ep1 
    JOIN event_participants ep2 ON ep1.event_id = ep2.event_id
    WHERE ep1.participant_id = pr.participant_a_id 
    AND ep2.participant_id = pr.participant_b_id
)
WHERE pr.is_active = TRUE
AND pr.relationship_type IN ('RIVALRY', 'COMPETITION')
GROUP BY pr.id, pr.relationship_type, pr.intensity, pr.description, pr.start_date,
         pa.name, pa.short_name, pa.logo_url, pb.name, pb.short_name, pb.logo_url;

-- Vue calendrier des événements
CREATE VIEW v_events_calendar AS
SELECT 
    e.id,
    e.code,
    e.title,
    e.scheduled_start,
    e.scheduled_end,
    e.status,
    e.visibility,
    
    -- Classification
    ec.name as category,
    eg.name as group_name,
    
    -- Lieu
    v.name as venue,
    v.city,
    
    -- Participants
    string_agg(DISTINCT p.short_name, ' vs ' ORDER BY p.short_name) as participants,
    
    -- Capacité et billetterie
    COALESCE(e.capacity_override, v.total_capacity) as capacity,
    e.is_sold_out,
    e.sales_start,
    e.sales_end
    
FROM events e
JOIN event_categories ec ON e.category_id = ec.id
LEFT JOIN event_groups eg ON e.group_id = eg.id
JOIN venues v ON e.venue_id = v.id
LEFT JOIN event_participants ep ON e.id = ep.event_id AND ep.is_confirmed = TRUE
LEFT JOIN participants p ON ep.participant_id = p.id
WHERE e.visibility = 'PUBLIC'
AND e.status IN ('SCHEDULED', 'CONFIRMED', 'LIVE')
GROUP BY e.id, e.code, e.title, e.scheduled_start, e.scheduled_end, e.status, e.visibility,
         ec.name, eg.name, v.name, v.city, e.capacity_override, v.total_capacity,
         e.is_sold_out, e.sales_start, e.sales_end
ORDER BY e.scheduled_start;

-- Vue des statistiques de participant par événement
CREATE VIEW v_participant_event_stats AS
SELECT 
    es.participant_id,
    p.name as participant_name,
    p.type as participant_type,
    es.stat_type,
    es.stat_key,
    COUNT(*) as stat_occurrences,
    AVG(CASE WHEN es.stat_value ~ '^[0-9]+\.?[0-9]*$' THEN es.stat_value::NUMERIC ELSE NULL END) as avg_numeric_value,
    MAX(es.recorded_at) as last_recorded
    
FROM event_stats es
JOIN participants p ON es.participant_id = p.id
WHERE es.is_official = TRUE
AND es.participant_id IS NOT NULL
GROUP BY es.participant_id, p.name, p.type, es.stat_type, es.stat_key
ORDER BY p.name, es.stat_type, es.stat_key;

-- =====================================================
-- 8. DONNÉES D'INITIALISATION
-- =====================================================

-- Catégories d'événements standards
INSERT INTO event_categories (id, code, name, description, default_duration, requires_referee, allows_draw, default_ticket_price, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'FOOTBALL', 'Football', 'Matchs de football', 90, TRUE, TRUE, 25.00, TRUE),
('550e8400-e29b-41d4-a716-446655440002', 'BASKETBALL', 'Basketball', 'Matchs de basketball', 48, TRUE, FALSE, 20.00, TRUE),
('550e8400-e29b-41d4-a716-446655440003', 'CONCERT', 'Concert', 'Concerts et spectacles musicaux', 120, FALSE, FALSE, 40.00, TRUE),
('550e8400-e29b-41d4-a716-446655440004', 'THEATER', 'Théâtre', 'Représentations théâtrales', 180, FALSE, FALSE, 30.00, TRUE),
('550e8400-e29b-41d4-a716-446655440005', 'CONFERENCE', 'Conférence', 'Conférences et séminaires', 60, FALSE, FALSE, 15.00, TRUE);

-- Participants standards (équipes tunisiennes)
INSERT INTO participants (id, code, name, short_name, type, category, nationality, city, founded_date, is_active, is_verified) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'CA_TUNIS', 'Club Africain', 'CA', 'TEAM', 'FOOTBALL', 'TN', 'Tunis', '1920-10-04', TRUE, TRUE),
('660e8400-e29b-41d4-a716-446655440002', 'EST_TUNIS', 'Espérance Sportive de Tunis', 'EST', 'TEAM', 'FOOTBALL', 'TN', 'Tunis', '1919-01-15', TRUE, TRUE),
('660e8400-e29b-41d4-a716-446655440003', 'ETOILE_SAHEL', 'Étoile Sportive du Sahel', 'ESS', 'TEAM', 'FOOTBALL', 'TN', 'Sousse', '1925-05-11', TRUE, TRUE),
('660e8400-e29b-41d4-a716-446655440004', 'CSS_SFAX', 'Club Sportif Sfaxien', 'CSS', 'TEAM', 'FOOTBALL', 'TN', 'Sfax', '1928-09-02', TRUE, TRUE);

-- Groupes d'événements standards
INSERT INTO event_groups (id, code, name, description, type, season, start_date, end_date, is_active) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'LIGUE1_2024_2025', 'Ligue 1 Saison 2024-2025', 'Championnat de Tunisie de football Ligue 1', 'SEASON', '2024-2025', '2024-09-01', '2025-05-31', TRUE),
('770e8400-e29b-41d4-a716-446655440002', 'COUPE_TUNISIE_2025', 'Coupe de Tunisie 2025', 'Coupe de Tunisie de football', 'CUP', '2024-2025', '2024-10-01', '2025-06-15', TRUE),
('770e8400-e29b-41d4-a716-446655440003', 'FESTIVAL_CARTHAGE_2025', 'Festival de Carthage 2025', 'Festival international de Carthage', 'FESTIVAL', '2025', '2025-07-01', '2025-08-31', TRUE);

-- Relations entre participants (rivalités)
INSERT INTO participant_relationships (id, participant_a_id, participant_b_id, relationship_type, intensity, description, is_active) VALUES
('880e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440002', 'RIVALRY', 10, 'Derby historique de Tunis - CA vs EST', TRUE),
('880e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440004', 'RIVALRY', 8, 'Rivalité traditionnelle Sahel vs Sfax', TRUE);

-- =====================================================
-- 9. COMMENTAIRES SUR LES TABLES
-- =====================================================

COMMENT ON TABLE participants IS 'Référentiel centralisé des participants aux événements (équipes, artistes, speakers)';
COMMENT ON TABLE event_categories IS 'Types d''événements disponibles avec configuration par défaut';
COMMENT ON TABLE event_groups IS 'Groupes d''événements (saisons, tournois, festivals)';
COMMENT ON TABLE events IS 'Événements individuels avec toutes leurs caractéristiques';
COMMENT ON TABLE event_participants IS 'Liaison entre événements et participants avec rôles spécifiques';
COMMENT ON TABLE participant_staff IS 'Personnel des participants (joueurs, musiciens, staff)';
COMMENT ON TABLE participant_relationships IS 'Relations entre participants (rivalités, partenariats)';
COMMENT ON TABLE event_schedules IS 'Programme détaillé pour événements complexes';
COMMENT ON TABLE event_media IS 'Médias associés aux événements';
COMMENT ON TABLE event_restrictions IS 'Restrictions et conditions d''accès aux événements';
COMMENT ON TABLE event_stats IS 'Statistiques et résultats des événements';

-- Commentaires sur les colonnes importantes
COMMENT ON COLUMN participants.metadata IS 'Données JSON spécifiques au type de participant';
COMMENT ON COLUMN events.capacity_override IS 'Capacité spécifique si différente du venue';
COMMENT ON COLUMN event_participants.role IS 'Rôle du participant dans cet événement spécifique';
COMMENT ON COLUMN participant_relationships.intensity IS 'Intensité de la relation de 1 (faible) à 10 (maximale)';
COMMENT ON COLUMN events.created_by IS 'Utilisateur ayant créé l''événement';
COMMENT ON COLUMN events.published_by IS 'Utilisateur ayant publié l''événement';

-- =====================================================
-- 10. CONFIGURATION DE SÉCURITÉ ROW LEVEL
-- =====================================================

-- Activer RLS sur les tables sensibles
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_participants ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_stats ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_media ENABLE ROW LEVEL SECURITY;

-- Politique pour les événements publics
CREATE POLICY events_public_read ON events
    FOR SELECT
    USING (visibility = 'PUBLIC' AND status != 'DRAFT');

-- Politique pour les participants confirmés
CREATE POLICY participants_confirmed_read ON event_participants
    FOR SELECT
    USING (is_confirmed = TRUE);

-- Politique pour les créateurs d'événements
CREATE POLICY events_creator_access ON events
    FOR ALL
    USING (created_by = current_setting('app.current_user_id')::UUID);

-- Politique pour staff - accès complet en lecture
CREATE POLICY staff_events_read_policy ON events
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = current_setting('app.current_user_id')::UUID
            AND r.code IN ('STAFF', 'ADMIN')
            AND ur.status = 'ACTIVE'
        )
    );

-- =====================================================
-- 11. GRANTS ET SÉCURITÉ
-- =====================================================

-- Exemple de grants pour différents rôles applicatifs
/*
-- Rôle pour l'application événements
CREATE ROLE entrix_events_role;
GRANT SELECT, INSERT, UPDATE ON participants, event_categories, event_groups, events TO entrix_events_role;
GRANT ALL PRIVILEGES ON event_participants, event_stats TO entrix_events_role;

-- Rôle pour les organisateurs d'événements
CREATE ROLE entrix_organizers_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO entrix_organizers_role;
GRANT INSERT, UPDATE ON events, event_participants, event_media TO entrix_organizers_role;

-- Rôle pour les rapports (lecture seule)
CREATE ROLE entrix_events_readonly_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO entrix_events_readonly_role;
*/

-- =====================================================
-- SCRIPT TERMINÉ AVEC SUCCÈS
-- =====================================================

-- Vérification finale
SELECT 'Script SQL Module Événements exécuté avec succès!' AS status;
SELECT 'Tables créées: participants, event_categories, event_groups, events, event_participants, participant_staff, participant_relationships, event_schedules, event_media, event_restrictions, event_stats' AS tables_created;
SELECT 'Énumérations créées: participant_type, event_group_type, event_status, event_visibility, event_participant_role, participant_relationship_type, restriction_type, event_media_type' AS enums_created;
SELECT 'Fonctions créées: update_updated_at_column, validate_event_dates, update_group_completed_events, get_participant_upcoming_events, get_participant_stats, generate_event_code, cleanup_old_draft_events' AS functions_created;
SELECT 'Vues créées: v_events_full, v_event_participants_details, v_active_rivalries, v_events_calendar, v_participant_event_stats' AS views_created;