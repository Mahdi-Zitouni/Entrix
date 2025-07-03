-- =====================================================
-- SCRIPT SQL POSTGRESQL - MODULE BILLETTERIE & CONTRÔLE D'ACCÈS
-- Plateforme Entrix - Système de Gestion des Droits d'Accès
-- Version: 1.0
-- Date: Juin 2025
-- =====================================================

-- =====================================================
-- 1. SUPPRESSION DES OBJETS EXISTANTS (Ordre inverse)
-- =====================================================

-- Suppression des tables de liaison et logs
DROP TABLE IF EXISTS blacklist CASCADE;
DROP TABLE IF EXISTS ticket_templates CASCADE;
DROP TABLE IF EXISTS zone_mapping_overrides CASCADE;
DROP TABLE IF EXISTS access_control_log CASCADE;
DROP TABLE IF EXISTS access_transactions_log CASCADE;
DROP TABLE IF EXISTS access_rights CASCADE;
DROP TABLE IF EXISTS tickets CASCADE;
DROP TABLE IF EXISTS pricing_rules CASCADE;
DROP TABLE IF EXISTS event_ticket_config CASCADE;
DROP TABLE IF EXISTS subscriptions CASCADE;
DROP TABLE IF EXISTS subscription_plan_zones CASCADE;
DROP TABLE IF EXISTS subscription_plan_events CASCADE;
DROP TABLE IF EXISTS subscription_plan_event_groups CASCADE;
DROP TABLE IF EXISTS ticket_types CASCADE;
DROP TABLE IF EXISTS subscription_plans CASCADE;

-- Suppression des énumérations
DROP TYPE IF EXISTS appeal_status CASCADE;
DROP TYPE IF EXISTS blacklist_scope CASCADE;
DROP TYPE IF EXISTS severity_level CASCADE;
DROP TYPE IF EXISTS blacklist_type CASCADE;
DROP TYPE IF EXISTS orientation_type CASCADE;
DROP TYPE IF EXISTS template_format CASCADE;
DROP TYPE IF EXISTS template_type CASCADE;
DROP TYPE IF EXISTS transaction_status CASCADE;
DROP TYPE IF EXISTS denial_reason CASCADE;
DROP TYPE IF EXISTS access_status CASCADE;
DROP TYPE IF EXISTS access_action CASCADE;
DROP TYPE IF EXISTS access_transaction_type CASCADE;
DROP TYPE IF EXISTS access_source_type CASCADE;
DROP TYPE IF EXISTS access_right_status CASCADE;
DROP TYPE IF EXISTS booking_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS pricing_rule_type CASCADE;
DROP TYPE IF EXISTS subscription_status CASCADE;
DROP TYPE IF EXISTS subscription_plan_type CASCADE;

-- Suppression des fonctions et triggers
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS generate_qr_code() CASCADE;
DROP FUNCTION IF EXISTS validate_subscription_overlaps() CASCADE;

-- =====================================================
-- 2. CRÉATION DES ÉNUMÉRATIONS
-- =====================================================

-- Types de plans d'abonnement
CREATE TYPE subscription_plan_type AS ENUM (
    'FULL_SEASON',      -- Saison complète
    'HALF_SEASON',      -- Mi-saison
    'PACKAGE',          -- Package multi-sports/événements
    'FLEX',             -- Flexible (X matchs au choix)
    'MINI',             -- Mini abonnement (5-10 matchs)
    'VIP_ANNUAL'        -- VIP annuel tous événements
);

-- Statuts d'abonnement
CREATE TYPE subscription_status AS ENUM (
    'PENDING',          -- En attente de paiement
    'ACTIVE',           -- Actif et valide
    'SUSPENDED',        -- Suspendu temporairement
    'EXPIRED',          -- Expiré
    'CANCELLED',        -- Annulé/Résilié
    'TRANSFERRED'       -- Transféré à un autre utilisateur
);

-- Types de règles de prix
CREATE TYPE pricing_rule_type AS ENUM (
    'PERCENTAGE',       -- Réduction en pourcentage
    'FIXED_AMOUNT',     -- Montant fixe de réduction
    'BULK_DISCOUNT',    -- Réduction par quantité
    'EARLY_BIRD',       -- Tarif anticipé
    'LOYALTY',          -- Fidélité
    'GROUP',            -- Tarif groupe
    'PROMOTIONAL'       -- Code promotionnel
);

-- Statuts de paiement
CREATE TYPE payment_status AS ENUM (
    'PENDING',          -- En attente
    'PROCESSING',       -- En cours de traitement
    'PAID',             -- Payé avec succès
    'FAILED',           -- Échec paiement
    'CANCELLED',        -- Annulé
    'REFUNDED',         -- Remboursé
    'PARTIAL_REFUND'    -- Remboursement partiel
);

-- Statuts de réservation
CREATE TYPE booking_status AS ENUM (
    'PENDING',          -- En attente
    'RESERVED',         -- Réservé temporairement
    'CONFIRMED',        -- Confirmé
    'CANCELLED',        -- Annulé
    'EXPIRED',          -- Expiré (délai dépassé)
    'TRANSFERRED'       -- Transféré
);

-- Statuts des droits d'accès
CREATE TYPE access_right_status AS ENUM (
    'ENABLED',          -- Actif et utilisable
    'DISABLED',         -- Désactivé temporairement
    'USED',             -- Déjà utilisé
    'EXPIRED',          -- Expiré
    'TRANSFERRED',      -- Transféré à un autre utilisateur
    'CANCELLED',        -- Annulé définitivement
    'SUSPENDED'         -- Suspendu pour violation
);

-- Types de source des droits d'accès
CREATE TYPE access_source_type AS ENUM (
    'SUBSCRIPTION',     -- Issu d'un abonnement
    'TICKET',           -- Issu d'un billet individuel
    'INVITATION',       -- Invitation gratuite
    'STAFF',            -- Accès personnel
    'PRESS',            -- Accréditation presse
    'VIP',              -- Invitation VIP
    'TRANSFER'          -- Transfert d'un autre utilisateur
);

-- Types de transactions d'accès
CREATE TYPE access_transaction_type AS ENUM (
    'CREATION',         -- Création initiale
    'TRANSFER',         -- Transfert à un autre utilisateur
    'RESALE',           -- Revente
    'REFUND',           -- Remboursement
    'UPGRADE',          -- Mise à niveau
    'DOWNGRADE',        -- Rétrogradation
    'CANCELLATION',     -- Annulation
    'SUSPENSION'        -- Suspension
);

-- Actions de contrôle d'accès
CREATE TYPE access_action AS ENUM (
    'ENTRY',            -- Entrée
    'EXIT',             -- Sortie
    'RE_ENTRY',         -- Re-entrée
    'ZONE_CHANGE',      -- Changement de zone
    'VALIDATION'        -- Validation simple
);

-- Statuts de contrôle d'accès
CREATE TYPE access_status AS ENUM (
    'SUCCESS',          -- Succès
    'DENIED',           -- Refusé
    'WARNING',          -- Avertissement mais autorisé
    'ERROR'             -- Erreur technique
);

-- Raisons de refus d'accès
CREATE TYPE denial_reason AS ENUM (
    'INVALID_QR',       -- QR code invalide
    'ALREADY_USED',     -- Déjà utilisé
    'EXPIRED',          -- Expiré
    'WRONG_EVENT',      -- Mauvais événement
    'WRONG_ZONE',       -- Mauvaise zone
    'WRONG_TIME',       -- Mauvais horaire
    'BLACKLISTED',      -- Sur liste noire
    'TECHNICAL_ERROR',  -- Erreur technique
    'INSUFFICIENT_RIGHTS', -- Droits insuffisants
    'CAPACITY_FULL'     -- Capacité atteinte
);

-- Statuts de transaction
CREATE TYPE transaction_status AS ENUM (
    'SUCCESS',          -- Succès
    'PENDING',          -- En attente
    'FAILED',           -- Échec
    'CANCELLED'         -- Annulé
);

-- Types de templates
CREATE TYPE template_type AS ENUM (
    'TICKET',           -- Template de billet
    'SUBSCRIPTION',     -- Template d'abonnement
    'INVITATION',       -- Template d'invitation
    'PASS',             -- Template de laissez-passer
    'RECEIPT'           -- Template de reçu
);

-- Formats de templates
CREATE TYPE template_format AS ENUM (
    'PDF',              -- PDF généré
    'HTML',             -- HTML pour impression
    'PNG',              -- Image PNG
    'THERMAL'           -- Impression thermique
);

-- Orientations
CREATE TYPE orientation_type AS ENUM (
    'PORTRAIT',         -- Portrait
    'LANDSCAPE'         -- Paysage
);

-- Types de blacklist
CREATE TYPE blacklist_type AS ENUM (
    'USER',             -- Utilisateur
    'EMAIL',            -- Adresse email
    'PHONE',            -- Numéro de téléphone
    'IP',               -- Adresse IP
    'DEVICE',           -- Appareil/Device ID
    'CARD'              -- Carte de crédit
);

-- Niveaux de sévérité
CREATE TYPE severity_level AS ENUM (
    'LOW',              -- Faible
    'MEDIUM',           -- Moyen
    'HIGH',             -- Élevé
    'CRITICAL'          -- Critique
);

-- Portée de blacklist
CREATE TYPE blacklist_scope AS ENUM (
    'EVENT',            -- Événement spécifique
    'VENUE',            -- Lieu spécifique
    'CLUB',             -- Club/Organisation
    'GLOBAL'            -- Global plateforme
);

-- Statuts d'appel
CREATE TYPE appeal_status AS ENUM (
    'NONE',             -- Pas d'appel
    'PENDING',          -- En cours d'examen
    'ACCEPTED',         -- Appel accepté
    'REJECTED'          -- Appel rejeté
);

-- =====================================================
-- 3. CRÉATION DES TABLES PRINCIPALES
-- =====================================================

-- Table des plans d'abonnements (catalogue)
CREATE TABLE subscription_plans (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    type subscription_plan_type NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'TND',
    max_subscribers INTEGER,
    current_subscribers INTEGER NOT NULL DEFAULT 0,
    
    -- Validité
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    sale_start_date DATE,
    sale_end_date DATE,
    
    -- Configuration
    transferable BOOLEAN NOT NULL DEFAULT FALSE,
    max_transfers INTEGER DEFAULT 0,
    auto_renew BOOLEAN NOT NULL DEFAULT FALSE,
    includes_playoffs BOOLEAN NOT NULL DEFAULT FALSE,
    priority_booking BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Métadonnées
    benefits JSONB,
    restrictions JSONB,
    metadata JSONB,
    
    -- Statut
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT chk_subscription_plans_price CHECK (price >= 0),
    CONSTRAINT chk_subscription_plans_max_subscribers CHECK (max_subscribers IS NULL OR max_subscribers > 0),
    CONSTRAINT chk_subscription_plans_current_subscribers CHECK (current_subscribers >= 0),
    CONSTRAINT chk_subscription_plans_valid_dates CHECK (valid_until >= valid_from),
    CONSTRAINT chk_subscription_plans_sale_dates CHECK (
        sale_start_date IS NULL OR sale_end_date IS NULL OR sale_end_date >= sale_start_date
    ),
    CONSTRAINT chk_subscription_plans_max_transfers CHECK (
        (transferable = FALSE AND max_transfers = 0) OR
        (transferable = TRUE AND max_transfers > 0)
    )
);

-- Table des types de billets (catalogue)
CREATE TABLE ticket_types (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    base_price DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'TND',
    
    -- Configuration
    transferable BOOLEAN NOT NULL DEFAULT TRUE,
    refundable BOOLEAN NOT NULL DEFAULT FALSE,
    max_quantity_per_order INTEGER DEFAULT 8,
    
    -- Validité
    valid_from DATE,
    valid_until DATE,
    
    -- Métadonnées
    benefits JSONB,
    restrictions JSONB,
    metadata JSONB,
    
    -- Statut
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT chk_ticket_types_base_price CHECK (base_price >= 0),
    CONSTRAINT chk_ticket_types_max_quantity CHECK (max_quantity_per_order IS NULL OR max_quantity_per_order > 0),
    CONSTRAINT chk_ticket_types_valid_dates CHECK (
        valid_from IS NULL OR valid_until IS NULL OR valid_until >= valid_from
    )
);

-- Table de liaison plans-groupes d'événements
CREATE TABLE subscription_plan_event_groups (
    subscription_plan_id UUID NOT NULL,
    event_group_id UUID NOT NULL,
    access_level VARCHAR(50) NOT NULL DEFAULT 'FULL',
    included_match_types TEXT[],
    excluded_events UUID[],
    metadata JSONB,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    PRIMARY KEY (subscription_plan_id, event_group_id),
    CONSTRAINT fk_sub_plan_groups_plan 
        FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE,
    CONSTRAINT fk_sub_plan_groups_group 
        FOREIGN KEY (event_group_id) REFERENCES event_groups(id) ON DELETE CASCADE,
    CONSTRAINT chk_sub_plan_groups_access_level 
        CHECK (access_level IN ('FULL', 'HOME_ONLY', 'PARTIAL', 'AWAY_ONLY'))
);

-- Table de liaison plans-événements spécifiques
CREATE TABLE subscription_plan_events (
    subscription_plan_id UUID NOT NULL,
    event_id UUID NOT NULL,
    access_level VARCHAR(50) NOT NULL DEFAULT 'FULL',
    requires_supplement BOOLEAN NOT NULL DEFAULT FALSE,
    supplement_amount DECIMAL(10,2),
    booking_window_days INTEGER,
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    PRIMARY KEY (subscription_plan_id, event_id),
    CONSTRAINT fk_sub_plan_events_plan 
        FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE,
    CONSTRAINT fk_sub_plan_events_event 
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT chk_sub_plan_events_supplement CHECK (
        (requires_supplement = FALSE AND supplement_amount IS NULL) OR
        (requires_supplement = TRUE AND supplement_amount >= 0)
    ),
    CONSTRAINT chk_sub_plan_events_booking_window 
        CHECK (booking_window_days IS NULL OR booking_window_days > 0)
);

-- Table de liaison plans-zones
CREATE TABLE subscription_plan_zones (
    subscription_plan_id UUID NOT NULL,
    zone_category zone_category NOT NULL,
    is_primary BOOLEAN NOT NULL DEFAULT TRUE,
    upgrade_allowed BOOLEAN NOT NULL DEFAULT FALSE,
    upgrade_fee DECIMAL(10,2),
    metadata JSONB,
    
    -- Contraintes
    PRIMARY KEY (subscription_plan_id, zone_category),
    CONSTRAINT fk_sub_plan_zones_plan 
        FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans(id) ON DELETE CASCADE,
    CONSTRAINT chk_sub_plan_zones_upgrade_fee 
        CHECK (upgrade_fee IS NULL OR upgrade_fee >= 0)
);

-- Table des abonnements (instances)
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    subscription_number VARCHAR(50) NOT NULL UNIQUE,
    user_id UUID NOT NULL,
    subscription_plan_id UUID NOT NULL,
    seat_id UUID,
    price_paid DECIMAL(10,2) NOT NULL,
    payment_id UUID,
    valid_from DATE NOT NULL,
    valid_until DATE NOT NULL,
    status subscription_status NOT NULL DEFAULT 'PENDING',
    suspension_reason TEXT,
    suspension_date TIMESTAMPTZ,
    auto_renew BOOLEAN NOT NULL DEFAULT FALSE,
    renewal_date DATE,
    transfers_used INTEGER NOT NULL DEFAULT 0,
    last_transfer_date TIMESTAMPTZ,
    activation_date TIMESTAMPTZ,
    cancellation_date TIMESTAMPTZ,
    cancellation_reason TEXT,
    metadata JSONB,
    created_by UUID,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT fk_subscriptions_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_subscriptions_plan 
        FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans(id),
    CONSTRAINT fk_subscriptions_seat 
        FOREIGN KEY (seat_id) REFERENCES seats(id) ON DELETE SET NULL,
    CONSTRAINT fk_subscriptions_created_by 
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_subscriptions_price CHECK (price_paid >= 0),
    CONSTRAINT chk_subscriptions_valid_dates CHECK (valid_until >= valid_from),
    CONSTRAINT chk_subscriptions_transfers CHECK (transfers_used >= 0),
    CONSTRAINT chk_subscriptions_status_dates CHECK (
        (status != 'CANCELLED') OR (status = 'CANCELLED' AND cancellation_date IS NOT NULL)
    )
);

-- Table de configuration billetterie par événement
CREATE TABLE event_ticket_config (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL UNIQUE,
    sale_start_date TIMESTAMPTZ,
    sale_end_date TIMESTAMPTZ,
    max_tickets_per_user INTEGER DEFAULT 8,
    requires_registration BOOLEAN NOT NULL DEFAULT FALSE,
    allows_guest_purchase BOOLEAN NOT NULL DEFAULT TRUE,
    refund_policy TEXT,
    transfer_policy TEXT,
    booking_window_minutes INTEGER DEFAULT 15,
    auto_release_enabled BOOLEAN NOT NULL DEFAULT TRUE,
    price_includes_fees BOOLEAN NOT NULL DEFAULT FALSE,
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT fk_event_ticket_config_event 
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT chk_event_ticket_config_sale_dates CHECK (
        sale_start_date IS NULL OR sale_end_date IS NULL OR sale_end_date >= sale_start_date
    ),
    CONSTRAINT chk_event_ticket_config_max_tickets CHECK (
        max_tickets_per_user IS NULL OR max_tickets_per_user > 0
    ),
    CONSTRAINT chk_event_ticket_config_booking_window CHECK (
        booking_window_minutes IS NULL OR booking_window_minutes > 0
    )
);

-- Table des règles de tarification
CREATE TABLE pricing_rules (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    rule_type pricing_rule_type NOT NULL,
    applies_to VARCHAR(20) NOT NULL DEFAULT 'TICKETS',
    discount_value DECIMAL(10,4) NOT NULL,
    min_quantity INTEGER,
    min_amount DECIMAL(10,2),
    max_discount_amount DECIMAL(10,2),
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    usage_limit_total INTEGER,
    usage_limit_per_user INTEGER,
    usage_count INTEGER NOT NULL DEFAULT 0,
    combinable BOOLEAN NOT NULL DEFAULT FALSE,
    priority INTEGER NOT NULL DEFAULT 0,
    promo_code VARCHAR(50),
    auto_apply BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT chk_pricing_rules_applies_to CHECK (applies_to IN ('TICKETS', 'SUBSCRIPTIONS', 'BOTH')),
    CONSTRAINT chk_pricing_rules_discount_value CHECK (discount_value >= 0),
    CONSTRAINT chk_pricing_rules_usage_limits CHECK (
        (usage_limit_total IS NULL OR usage_limit_total > 0) AND
        (usage_limit_per_user IS NULL OR usage_limit_per_user > 0)
    ),
    CONSTRAINT chk_pricing_rules_usage_count CHECK (usage_count >= 0),
    CONSTRAINT chk_pricing_rules_valid_dates CHECK (
        valid_until IS NULL OR valid_from IS NULL OR valid_until >= valid_from
    )
);

-- Table des billets (instances)
CREATE TABLE tickets (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    ticket_number VARCHAR(50) NOT NULL UNIQUE,
    user_id UUID,
    event_id UUID NOT NULL,
    ticket_type_id UUID NOT NULL,
    event_ticket_config_id UUID,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    pricing_rule_id UUID,
    payment_id UUID,
    payment_status payment_status NOT NULL DEFAULT 'PENDING',
    booking_status booking_status NOT NULL DEFAULT 'PENDING',
    booking_expires_at TIMESTAMPTZ,
    purchase_channel VARCHAR(50) NOT NULL,
    purchase_ip INET,
    is_guest_purchase BOOLEAN NOT NULL DEFAULT FALSE,
    guest_email VARCHAR(255),
    guest_phone VARCHAR(20),
    metadata JSONB,
    confirmed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT fk_tickets_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_tickets_event 
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT fk_tickets_type 
        FOREIGN KEY (ticket_type_id) REFERENCES ticket_types(id),
    CONSTRAINT fk_tickets_config 
        FOREIGN KEY (event_ticket_config_id) REFERENCES event_ticket_config(id) ON DELETE SET NULL,
    CONSTRAINT fk_tickets_pricing_rule 
        FOREIGN KEY (pricing_rule_id) REFERENCES pricing_rules(id) ON DELETE SET NULL,
    CONSTRAINT chk_tickets_quantity CHECK (quantity > 0),
    CONSTRAINT chk_tickets_prices CHECK (
        unit_price >= 0 AND 
        total_price >= 0 AND 
        discount_amount >= 0 AND
        total_price = (unit_price * quantity) - discount_amount
    ),
    CONSTRAINT chk_tickets_guest_info CHECK (
        (is_guest_purchase = FALSE) OR 
        (is_guest_purchase = TRUE AND guest_email IS NOT NULL)
    )
);

-- Table centrale des droits d'accès
CREATE TABLE access_rights (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    qr_code VARCHAR(100) NOT NULL UNIQUE,
    user_id UUID NOT NULL,
    event_id UUID NOT NULL,
    zone_id UUID,
    seat_id UUID,
    status access_right_status NOT NULL DEFAULT 'ENABLED',
    source_type access_source_type NOT NULL,
    source_id UUID NOT NULL,
    original_user_id UUID NOT NULL,
    transfer_count INTEGER NOT NULL DEFAULT 0,
    last_transfer_date TIMESTAMPTZ,
    valid_from TIMESTAMPTZ NOT NULL,
    valid_until TIMESTAMPTZ NOT NULL,
    used_at TIMESTAMPTZ,
    used_at_access_point UUID,
    metadata JSONB,
    created_by UUID,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT fk_access_rights_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_access_rights_event 
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT fk_access_rights_zone 
        FOREIGN KEY (zone_id) REFERENCES venue_zones(id) ON DELETE SET NULL,
    CONSTRAINT fk_access_rights_seat 
        FOREIGN KEY (seat_id) REFERENCES seats(id) ON DELETE SET NULL,
    CONSTRAINT fk_access_rights_original_user 
        FOREIGN KEY (original_user_id) REFERENCES users(id),
    CONSTRAINT fk_access_rights_access_point 
        FOREIGN KEY (used_at_access_point) REFERENCES access_points(id) ON DELETE SET NULL,
    CONSTRAINT fk_access_rights_created_by 
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_access_rights_transfer_count CHECK (transfer_count >= 0),
    CONSTRAINT chk_access_rights_valid_dates CHECK (valid_until >= valid_from),
    CONSTRAINT chk_access_rights_used_status CHECK (
        (status != 'USED') OR (status = 'USED' AND used_at IS NOT NULL)
    )
);

-- Table de log des transactions d'accès
CREATE TABLE access_transactions_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    access_right_id UUID NOT NULL,
    transaction_type access_transaction_type NOT NULL,
    from_user_id UUID,
    to_user_id UUID,
    event_id UUID NOT NULL,
    price DECIMAL(10,2),
    currency VARCHAR(3) NOT NULL DEFAULT 'TND',
    reason TEXT,
    ip_address INET,
    user_agent TEXT,
    device_id VARCHAR(100),
    location JSONB,
    status transaction_status NOT NULL DEFAULT 'SUCCESS',
    error_message TEXT,
    metadata JSONB,
    created_by UUID,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT fk_access_transactions_access_right 
        FOREIGN KEY (access_right_id) REFERENCES access_rights(id) ON DELETE CASCADE,
    CONSTRAINT fk_access_transactions_from_user 
        FOREIGN KEY (from_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_access_transactions_to_user 
        FOREIGN KEY (to_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_access_transactions_event 
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT fk_access_transactions_created_by 
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_access_transactions_price CHECK (price IS NULL OR price >= 0)
);

-- Table de log du contrôle d'accès
CREATE TABLE access_control_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    access_right_id UUID,
    event_id UUID NOT NULL,
    user_id UUID,
    access_point_id UUID NOT NULL,
    zone_id UUID,
    qr_code_scanned VARCHAR(100) NOT NULL,
    action access_action NOT NULL,
    status access_status NOT NULL,
    denial_reason denial_reason,
    controller_id UUID NOT NULL,
    device_id VARCHAR(100) NOT NULL,
    scan_method VARCHAR(50) NOT NULL,
    response_time_ms INTEGER,
    location JSONB,
    weather_conditions VARCHAR(100),
    queue_size INTEGER,
    metadata JSONB,
    
    -- Timestamps
    timestamp TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT fk_access_control_log_access_right 
        FOREIGN KEY (access_right_id) REFERENCES access_rights(id) ON DELETE SET NULL,
    CONSTRAINT fk_access_control_log_event 
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT fk_access_control_log_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_access_control_log_access_point 
        FOREIGN KEY (access_point_id) REFERENCES access_points(id),
    CONSTRAINT fk_access_control_log_zone 
        FOREIGN KEY (zone_id) REFERENCES venue_zones(id) ON DELETE SET NULL,
    CONSTRAINT fk_access_control_log_controller 
        FOREIGN KEY (controller_id) REFERENCES users(id),
    CONSTRAINT chk_access_control_log_response_time CHECK (response_time_ms IS NULL OR response_time_ms >= 0),
    CONSTRAINT chk_access_control_log_queue_size CHECK (queue_size IS NULL OR queue_size >= 0),
    CONSTRAINT chk_access_control_log_denial CHECK (
        (status != 'DENIED') OR (status = 'DENIED' AND denial_reason IS NOT NULL)
    )
);

-- Table des overrides de mapping de zones
CREATE TABLE zone_mapping_overrides (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_id UUID NOT NULL,
    user_group_id UUID,
    subscription_id UUID,
    ticket_id UUID,
    access_right_id UUID,
    original_zone_id UUID NOT NULL,
    override_zone_id UUID NOT NULL,
    reason TEXT NOT NULL,
    valid_from TIMESTAMPTZ,
    valid_until TIMESTAMPTZ,
    capacity_impact INTEGER,
    requires_notification BOOLEAN NOT NULL DEFAULT TRUE,
    notification_sent BOOLEAN NOT NULL DEFAULT FALSE,
    approved_by UUID,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT fk_zone_overrides_event 
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE CASCADE,
    CONSTRAINT fk_zone_overrides_user_group 
        FOREIGN KEY (user_group_id) REFERENCES groups(id) ON DELETE CASCADE,
    CONSTRAINT fk_zone_overrides_subscription 
        FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE CASCADE,
    CONSTRAINT fk_zone_overrides_ticket 
        FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    CONSTRAINT fk_zone_overrides_access_right 
        FOREIGN KEY (access_right_id) REFERENCES access_rights(id) ON DELETE CASCADE,
    CONSTRAINT fk_zone_overrides_original_zone 
        FOREIGN KEY (original_zone_id) REFERENCES venue_zones(id),
    CONSTRAINT fk_zone_overrides_override_zone 
        FOREIGN KEY (override_zone_id) REFERENCES venue_zones(id),
    CONSTRAINT fk_zone_overrides_approved_by 
        FOREIGN KEY (approved_by) REFERENCES users(id),
    CONSTRAINT chk_zone_overrides_valid_dates CHECK (
        valid_until IS NULL OR valid_from IS NULL OR valid_until >= valid_from
    ),
    CONSTRAINT chk_zone_overrides_scope CHECK (
        (user_group_id IS NOT NULL)::INTEGER + 
        (subscription_id IS NOT NULL)::INTEGER + 
        (ticket_id IS NOT NULL)::INTEGER + 
        (access_right_id IS NOT NULL)::INTEGER = 1
    )
);

-- Table des templates de billets
CREATE TABLE ticket_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    type template_type NOT NULL,
    category VARCHAR(50),
    format template_format NOT NULL,
    paper_size VARCHAR(20),
    orientation orientation_type NOT NULL DEFAULT 'PORTRAIT',
    design_url TEXT,
    css_url TEXT,
    elements JSONB NOT NULL,
    layout JSONB NOT NULL,
    languages TEXT[] NOT NULL DEFAULT ARRAY['fr'],
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    requires_printer VARCHAR(100),
    version VARCHAR(20) NOT NULL DEFAULT '1.0.0',
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table de blacklist
CREATE TABLE blacklist (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    blacklist_type blacklist_type NOT NULL,
    identifier VARCHAR(255) NOT NULL,
    reason TEXT NOT NULL,
    severity severity_level NOT NULL,
    scope blacklist_scope NOT NULL,
    scope_id UUID,
    start_date TIMESTAMPTZ NOT NULL,
    end_date TIMESTAMPTZ,
    is_permanent BOOLEAN NOT NULL DEFAULT FALSE,
    reported_by UUID,
    approved_by UUID,
    evidence JSONB,
    appeal_status appeal_status,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT fk_blacklist_reported_by 
        FOREIGN KEY (reported_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_blacklist_approved_by 
        FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_blacklist_dates CHECK (
        end_date IS NULL OR end_date >= start_date
    ),
    CONSTRAINT chk_blacklist_scope_id CHECK (
        (scope IN ('EVENT', 'VENUE') AND scope_id IS NOT NULL) OR
        (scope IN ('CLUB', 'GLOBAL') AND scope_id IS NULL)
    )
);

-- =====================================================
-- 4. INDEX POUR PERFORMANCES
-- =====================================================

-- Index sur subscription_plans
CREATE INDEX idx_subscription_plans_code ON subscription_plans(code);
CREATE INDEX idx_subscription_plans_type ON subscription_plans(type);
CREATE INDEX idx_subscription_plans_active ON subscription_plans(is_active);
CREATE INDEX idx_subscription_plans_valid_dates ON subscription_plans(valid_from, valid_until);
CREATE INDEX idx_subscription_plans_sale_dates ON subscription_plans(sale_start_date, sale_end_date);

-- Index sur ticket_types
CREATE INDEX idx_ticket_types_code ON ticket_types(code);
CREATE INDEX idx_ticket_types_active ON ticket_types(is_active);
CREATE INDEX idx_ticket_types_valid_dates ON ticket_types(valid_from, valid_until);

-- Index sur subscriptions
CREATE INDEX idx_subscriptions_user_id ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_plan_id ON subscriptions(subscription_plan_id);
CREATE INDEX idx_subscriptions_status ON subscriptions(status);
CREATE INDEX idx_subscriptions_valid_dates ON subscriptions(valid_from, valid_until);
CREATE INDEX idx_subscriptions_number ON subscriptions(subscription_number);

-- Index sur tickets
CREATE INDEX idx_tickets_user_id ON tickets(user_id);
CREATE INDEX idx_tickets_event_id ON tickets(event_id);
CREATE INDEX idx_tickets_status ON tickets(payment_status, booking_status);
CREATE INDEX idx_tickets_number ON tickets(ticket_number);
CREATE INDEX idx_tickets_guest_email ON tickets(guest_email) WHERE is_guest_purchase = TRUE;

-- Index critiques sur access_rights (haute fréquence)
CREATE INDEX idx_access_rights_qr_code ON access_rights(qr_code);
CREATE INDEX idx_access_rights_user_id ON access_rights(user_id);
CREATE INDEX idx_access_rights_event_id ON access_rights(event_id);
CREATE INDEX idx_access_rights_status ON access_rights(status);
CREATE INDEX idx_access_rights_valid_dates ON access_rights(valid_from, valid_until);
CREATE INDEX idx_access_rights_source ON access_rights(source_type, source_id);

-- Index composite pour validation temps réel
CREATE INDEX idx_access_rights_validation ON access_rights(qr_code, status, valid_from, valid_until)
    WHERE status IN ('ENABLED', 'TRANSFERRED');

-- Index sur access_control_log (volume important)
CREATE INDEX idx_access_control_log_event ON access_control_log(event_id);
CREATE INDEX idx_access_control_log_user ON access_control_log(user_id);
CREATE INDEX idx_access_control_log_timestamp ON access_control_log(timestamp);
CREATE INDEX idx_access_control_log_access_point ON access_control_log(access_point_id);
CREATE INDEX idx_access_control_log_status ON access_control_log(status);

-- Index sur access_transactions_log
CREATE INDEX idx_access_transactions_access_right ON access_transactions_log(access_right_id);
CREATE INDEX idx_access_transactions_event ON access_transactions_log(event_id);
CREATE INDEX idx_access_transactions_users ON access_transactions_log(from_user_id, to_user_id);
CREATE INDEX idx_access_transactions_timestamp ON access_transactions_log(created_at);

-- Index sur pricing_rules
CREATE INDEX idx_pricing_rules_code ON pricing_rules(code);
CREATE INDEX idx_pricing_rules_type ON pricing_rules(rule_type);
CREATE INDEX idx_pricing_rules_active ON pricing_rules(is_active);
CREATE INDEX idx_pricing_rules_valid_dates ON pricing_rules(valid_from, valid_until);
CREATE INDEX idx_pricing_rules_promo_code ON pricing_rules(promo_code) WHERE promo_code IS NOT NULL;

-- Index sur blacklist
CREATE INDEX idx_blacklist_type_identifier ON blacklist(blacklist_type, identifier);
CREATE INDEX idx_blacklist_active ON blacklist(is_active);
CREATE INDEX idx_blacklist_scope ON blacklist(scope, scope_id);
CREATE INDEX idx_blacklist_dates ON blacklist(start_date, end_date);

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

-- Fonction pour générer un QR code unique
CREATE OR REPLACE FUNCTION generate_qr_code(
    p_event_code VARCHAR,
    p_user_prefix VARCHAR DEFAULT 'USR'
)
RETURNS VARCHAR AS $$
DECLARE
    v_qr_code VARCHAR;
    v_counter INTEGER := 1;
    v_date_str VARCHAR := TO_CHAR(NOW(), 'YYYY');
BEGIN
    LOOP
        v_qr_code := format('QR-%s-%s-%s-%s', 
            v_date_str, 
            p_event_code, 
            p_user_prefix, 
            LPAD(v_counter::TEXT, 6, '0')
        );
        
        -- Vérifier l'unicité
        IF NOT EXISTS (SELECT 1 FROM access_rights WHERE qr_code = v_qr_code) THEN
            RETURN v_qr_code;
        END IF;
        
        v_counter := v_counter + 1;
        
        -- Sécurité pour éviter boucle infinie
        IF v_counter > 999999 THEN
            RAISE EXCEPTION 'Unable to generate unique QR code after % attempts', v_counter;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql;

-- Fonction de validation des chevauchements d'abonnements
CREATE OR REPLACE FUNCTION validate_subscription_overlaps()
RETURNS TRIGGER AS $$
DECLARE
    v_overlap_count INTEGER;
BEGIN
    -- Vérifier les chevauchements pour le même utilisateur et plan
    SELECT COUNT(*)
    INTO v_overlap_count
    FROM subscriptions
    WHERE user_id = NEW.user_id
    AND subscription_plan_id = NEW.subscription_plan_id
    AND status IN ('ACTIVE', 'PENDING')
    AND id != COALESCE(NEW.id, gen_random_uuid())
    AND (
        (NEW.valid_from BETWEEN valid_from AND valid_until) OR
        (NEW.valid_until BETWEEN valid_from AND valid_until) OR
        (valid_from BETWEEN NEW.valid_from AND NEW.valid_until)
    );
    
    IF v_overlap_count > 0 THEN
        RAISE EXCEPTION 'Subscription periods overlap for user % and plan %', 
            NEW.user_id, NEW.subscription_plan_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer automatiquement les droits d'accès
CREATE OR REPLACE FUNCTION create_access_rights_from_subscription()
RETURNS TRIGGER AS $$
DECLARE
    v_event RECORD;
    v_qr_code VARCHAR;
BEGIN
    -- Créer des droits d'accès pour tous les événements couverts
    -- seulement si l'abonnement devient ACTIVE
    IF NEW.status = 'ACTIVE' AND (OLD IS NULL OR OLD.status != 'ACTIVE') THEN
        
        FOR v_event IN 
            SELECT DISTINCT e.id as event_id, e.code as event_code
            FROM events e
            JOIN subscription_plan_event_groups speg ON speg.event_group_id = e.event_group_id
            WHERE speg.subscription_plan_id = NEW.subscription_plan_id
            AND e.date BETWEEN NEW.valid_from AND NEW.valid_until
            AND e.status IN ('SCHEDULED', 'CONFIRMED')
        LOOP
            -- Générer QR code unique
            v_qr_code := generate_qr_code(v_event.event_code, 'SUB');
            
            -- Créer le droit d'accès
            INSERT INTO access_rights (
                qr_code,
                user_id,
                event_id,
                seat_id,
                status,
                source_type,
                source_id,
                original_user_id,
                valid_from,
                valid_until,
                created_by,
                metadata
            ) VALUES (
                v_qr_code,
                NEW.user_id,
                v_event.event_id,
                NEW.seat_id,
                'ENABLED',
                'SUBSCRIPTION',
                NEW.id,
                NEW.user_id,
                NEW.valid_from::TIMESTAMPTZ,
                NEW.valid_until::TIMESTAMPTZ + INTERVAL '1 day',
                NEW.created_by,
                jsonb_build_object(
                    'subscription_number', NEW.subscription_number,
                    'auto_generated', true,
                    'generated_at', NOW()
                )
            );
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer automatiquement les droits d'accès depuis tickets
CREATE OR REPLACE FUNCTION create_access_rights_from_ticket()
RETURNS TRIGGER AS $$
DECLARE
    v_qr_code VARCHAR;
    v_event_code VARCHAR;
    i INTEGER;
BEGIN
    -- Créer des droits d'accès quand le ticket est confirmé
    IF NEW.booking_status = 'CONFIRMED' AND (OLD IS NULL OR OLD.booking_status != 'CONFIRMED') THEN
        
        -- Récupérer le code de l'événement
        SELECT code INTO v_event_code FROM events WHERE id = NEW.event_id;
        
        -- Créer autant de droits d'accès que de quantité de billets
        FOR i IN 1..NEW.quantity LOOP
            -- Générer QR code unique
            v_qr_code := generate_qr_code(v_event_code, 'TKT');
            
            -- Créer le droit d'accès
            INSERT INTO access_rights (
                qr_code,
                user_id,
                event_id,
                status,
                source_type,
                source_id,
                original_user_id,
                valid_from,
                valid_until,
                metadata
            ) VALUES (
                v_qr_code,
                COALESCE(NEW.user_id, gen_random_uuid()), -- Gérer les achats invités
                NEW.event_id,
                'ENABLED',
                'TICKET',
                NEW.id,
                COALESCE(NEW.user_id, gen_random_uuid()),
                (SELECT date FROM events WHERE id = NEW.event_id) - INTERVAL '2 hours',
                (SELECT date FROM events WHERE id = NEW.event_id) + INTERVAL '6 hours',
                jsonb_build_object(
                    'ticket_number', NEW.ticket_number,
                    'ticket_index', i,
                    'is_guest_purchase', NEW.is_guest_purchase,
                    'guest_email', NEW.guest_email,
                    'auto_generated', true,
                    'generated_at', NOW()
                )
            );
        END LOOP;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction de nettoyage des réservations expirées
CREATE OR REPLACE FUNCTION cleanup_expired_bookings()
RETURNS INTEGER AS $$
DECLARE
    v_cleaned_count INTEGER := 0;
BEGIN
    -- Annuler les tickets avec réservation expirée
    UPDATE tickets 
    SET booking_status = 'EXPIRED',
        cancelled_at = NOW(),
        cancellation_reason = 'Automatic cleanup - booking window expired'
    WHERE booking_status = 'RESERVED' 
    AND booking_expires_at IS NOT NULL 
    AND booking_expires_at < NOW();
    
    GET DIAGNOSTICS v_cleaned_count = ROW_COUNT;
    
    RETURN v_cleaned_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction de statistiques de contrôle d'accès
CREATE OR REPLACE FUNCTION get_access_control_stats(
    p_event_id UUID,
    p_start_time TIMESTAMPTZ DEFAULT NULL,
    p_end_time TIMESTAMPTZ DEFAULT NULL
)
RETURNS TABLE(
    total_scans BIGINT,
    successful_entries BIGINT,
    denied_entries BIGINT,
    unique_users BIGINT,
    average_response_time NUMERIC,
    peak_queue_size INTEGER
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        COUNT(*) as total_scans,
        COUNT(*) FILTER (WHERE status = 'SUCCESS' AND action = 'ENTRY') as successful_entries,
        COUNT(*) FILTER (WHERE status = 'DENIED' AND action = 'ENTRY') as denied_entries,
        COUNT(DISTINCT user_id) as unique_users,
        ROUND(AVG(response_time_ms), 2) as average_response_time,
        MAX(queue_size) as peak_queue_size
    FROM access_control_log
    WHERE event_id = p_event_id
    AND (p_start_time IS NULL OR timestamp >= p_start_time)
    AND (p_end_time IS NULL OR timestamp <= p_end_time);
END;
$$ LANGUAGE plpgsql;

-- Fonction de validation en temps réel d'un QR code
CREATE OR REPLACE FUNCTION validate_qr_code(
    p_qr_code VARCHAR,
    p_event_id UUID,
    p_access_point_id UUID DEFAULT NULL
)
RETURNS TABLE(
    is_valid BOOLEAN,
    access_right_id UUID,
    user_id UUID,
    status access_right_status,
    denial_reason TEXT,
    zone_id UUID,
    seat_id UUID,
    metadata JSONB
) AS $$
DECLARE
    v_access_right RECORD;
    v_blacklist_count INTEGER;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    -- Récupérer le droit d'accès
    SELECT * INTO v_access_right
    FROM access_rights ar
    WHERE ar.qr_code = p_qr_code
    AND ar.event_id = p_event_id;
    
    -- QR code inexistant
    IF v_access_right IS NULL THEN
        RETURN QUERY SELECT FALSE, NULL::UUID, NULL::UUID, NULL::access_right_status, 'QR code invalide', NULL::UUID, NULL::UUID, NULL::JSONB;
        RETURN;
    END IF;
    
    -- Vérifier blacklist
    SELECT COUNT(*) INTO v_blacklist_count
    FROM blacklist
    WHERE is_active = TRUE
    AND (
        (blacklist_type = 'USER' AND identifier = v_access_right.user_id::TEXT) OR
        (blacklist_type = 'QR' AND identifier = p_qr_code)
    )
    AND start_date <= v_now
    AND (end_date IS NULL OR end_date >= v_now);
    
    IF v_blacklist_count > 0 THEN
        RETURN QUERY SELECT FALSE, v_access_right.id, v_access_right.user_id, v_access_right.status, 'Utilisateur sur liste noire', v_access_right.zone_id, v_access_right.seat_id, v_access_right.metadata;
        RETURN;
    END IF;
    
    -- Vérifications de validité
    CASE v_access_right.status
        WHEN 'USED' THEN
            RETURN QUERY SELECT FALSE, v_access_right.id, v_access_right.user_id, v_access_right.status, 'QR code déjà utilisé', v_access_right.zone_id, v_access_right.seat_id, v_access_right.metadata;
        WHEN 'EXPIRED' THEN
            RETURN QUERY SELECT FALSE, v_access_right.id, v_access_right.user_id, v_access_right.status, 'QR code expiré', v_access_right.zone_id, v_access_right.seat_id, v_access_right.metadata;
        WHEN 'CANCELLED', 'SUSPENDED' THEN
            RETURN QUERY SELECT FALSE, v_access_right.id, v_access_right.user_id, v_access_right.status, 'QR code annulé ou suspendu', v_access_right.zone_id, v_access_right.seat_id, v_access_right.metadata;
        WHEN 'DISABLED' THEN
            RETURN QUERY SELECT FALSE, v_access_right.id, v_access_right.user_id, v_access_right.status, 'QR code désactivé', v_access_right.zone_id, v_access_right.seat_id, v_access_right.metadata;
        ELSE
            -- Vérifier les dates de validité
            IF v_now < v_access_right.valid_from THEN
                RETURN QUERY SELECT FALSE, v_access_right.id, v_access_right.user_id, v_access_right.status, 'QR code pas encore valide', v_access_right.zone_id, v_access_right.seat_id, v_access_right.metadata;
            ELSIF v_now > v_access_right.valid_until THEN
                RETURN QUERY SELECT FALSE, v_access_right.id, v_access_right.user_id, v_access_right.status, 'QR code expiré (date)', v_access_right.zone_id, v_access_right.seat_id, v_access_right.metadata;
            ELSE
                -- QR code valide
                RETURN QUERY SELECT TRUE, v_access_right.id, v_access_right.user_id, v_access_right.status, NULL::TEXT, v_access_right.zone_id, v_access_right.seat_id, v_access_right.metadata;
            END IF;
    END CASE;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 6. TRIGGERS
-- =====================================================

-- Triggers pour updated_at automatique
CREATE TRIGGER trigger_subscription_plans_updated_at
    BEFORE UPDATE ON subscription_plans
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_ticket_types_updated_at
    BEFORE UPDATE ON ticket_types
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_subscriptions_updated_at
    BEFORE UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_tickets_updated_at
    BEFORE UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_access_rights_updated_at
    BEFORE UPDATE ON access_rights
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_zone_mapping_overrides_updated_at
    BEFORE UPDATE ON zone_mapping_overrides
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_ticket_templates_updated_at
    BEFORE UPDATE ON ticket_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_blacklist_updated_at
    BEFORE UPDATE ON blacklist
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_event_ticket_config_updated_at
    BEFORE UPDATE ON event_ticket_config
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_pricing_rules_updated_at
    BEFORE UPDATE ON pricing_rules
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Triggers métier
CREATE TRIGGER trigger_subscription_overlap_validation
    BEFORE INSERT OR UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION validate_subscription_overlaps();

CREATE TRIGGER trigger_subscription_access_rights_creation
    AFTER INSERT OR UPDATE ON subscriptions
    FOR EACH ROW
    EXECUTE FUNCTION create_access_rights_from_subscription();

CREATE TRIGGER trigger_ticket_access_rights_creation
    AFTER INSERT OR UPDATE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION create_access_rights_from_ticket();

-- =====================================================
-- 7. VUES UTILES
-- =====================================================

-- Vue des droits d'accès avec détails utilisateur et événement
CREATE VIEW v_access_rights_detailed AS
SELECT 
    ar.id,
    ar.qr_code,
    ar.status,
    ar.source_type,
    ar.transfer_count,
    ar.valid_from,
    ar.valid_until,
    ar.used_at,
    
    -- Utilisateur
    u.first_name,
    u.last_name,
    u.email,
    
    -- Événement
    e.name as event_name,
    e.date as event_date,
    e.status as event_status,
    
    -- Zone et place
    vz.name as zone_name,
    vz.category as zone_category,
    s.sector,
    s.row_number,
    s.seat_number,
    
    -- Métadonnées
    ar.metadata
FROM access_rights ar
JOIN users u ON ar.user_id = u.id
JOIN events e ON ar.event_id = e.id
LEFT JOIN venue_zones vz ON ar.zone_id = vz.id
LEFT JOIN seats s ON ar.seat_id = s.id;

-- Vue des statistiques de billetterie par événement
CREATE VIEW v_event_ticketing_stats AS
SELECT 
    e.id as event_id,
    e.name as event_name,
    e.date as event_date,
    
    -- Statistiques billets
    COUNT(t.id) as total_tickets_sold,
    SUM(t.quantity) as total_seats_sold,
    SUM(t.total_price) as total_revenue,
    COUNT(t.id) FILTER (WHERE t.payment_status = 'PAID') as paid_tickets,
    COUNT(t.id) FILTER (WHERE t.booking_status = 'PENDING') as pending_tickets,
    
    -- Statistiques abonnements
    COUNT(DISTINCT s.id) as active_subscriptions,
    
    -- Statistiques accès
    COUNT(ar.id) as total_access_rights,
    COUNT(ar.id) FILTER (WHERE ar.status = 'ENABLED') as active_access_rights,
    COUNT(ar.id) FILTER (WHERE ar.status = 'USED') as used_access_rights,
    
    -- Capacité
    COALESCE(e.capacity_override, v.total_capacity) as venue_capacity,
    ROUND(
        (COUNT(ar.id) FILTER (WHERE ar.status IN ('ENABLED', 'USED'))::FLOAT / 
         COALESCE(e.capacity_override, v.total_capacity) * 100), 2
    ) as occupancy_percentage
    
FROM events e
LEFT JOIN venues v ON e.venue_id = v.id
LEFT JOIN tickets t ON e.id = t.event_id
LEFT JOIN subscriptions s ON s.valid_from <= e.date AND s.valid_until >= e.date AND s.status = 'ACTIVE'
LEFT JOIN access_rights ar ON e.id = ar.event_id
GROUP BY e.id, e.name, e.date, e.capacity_override, v.total_capacity;

-- Vue des revenus par utilisateur
CREATE VIEW v_user_revenue_summary AS
SELECT 
    u.id as user_id,
    u.first_name,
    u.last_name,
    u.email,
    
    -- Revenus billets
    COALESCE(SUM(t.total_price) FILTER (WHERE t.payment_status = 'PAID'), 0) as ticket_revenue,
    COUNT(t.id) FILTER (WHERE t.payment_status = 'PAID') as tickets_purchased,
    
    -- Revenus abonnements
    COALESCE(SUM(s.price_paid) FILTER (WHERE s.status = 'ACTIVE'), 0) as subscription_revenue,
    COUNT(s.id) FILTER (WHERE s.status = 'ACTIVE') as active_subscriptions,
    
    -- Total
    COALESCE(SUM(t.total_price) FILTER (WHERE t.payment_status = 'PAID'), 0) + 
    COALESCE(SUM(s.price_paid) FILTER (WHERE s.status = 'ACTIVE'), 0) as total_revenue,
    
    -- Dates
    MIN(COALESCE(t.created_at, s.created_at)) as first_purchase,
    MAX(COALESCE(t.created_at, s.created_at)) as last_purchase
    
FROM users u
LEFT JOIN tickets t ON u.id = t.user_id
LEFT JOIN subscriptions s ON u.id = s.user_id
GROUP BY u.id, u.first_name, u.last_name, u.email;

-- Vue des contrôles d'accès récents
CREATE VIEW v_recent_access_controls AS
SELECT 
    acl.id,
    acl.timestamp,
    acl.action,
    acl.status,
    acl.denial_reason,
    acl.qr_code_scanned,
    acl.response_time_ms,
    acl.queue_size,
    
    -- Événement
    e.name as event_name,
    e.date as event_date,
    
    -- Utilisateur
    u.first_name,
    u.last_name,
    u.email,
    
    -- Point d'accès
    ap.name as access_point_name,
    ap.location as access_point_location,
    
    -- Contrôleur
    controller.first_name as controller_first_name,
    controller.last_name as controller_last_name
    
FROM access_control_log acl
JOIN events e ON acl.event_id = e.id
LEFT JOIN users u ON acl.user_id = u.id
LEFT JOIN access_points ap ON acl.access_point_id = ap.id
JOIN users controller ON acl.controller_id = controller.id
ORDER BY acl.timestamp DESC;

-- Vue des problèmes de contrôle d'accès
CREATE VIEW v_access_control_issues AS
SELECT 
    acl.id,
    acl.timestamp,
    acl.event_id,
    acl.qr_code_scanned,
    acl.status,
    acl.denial_reason,
    acl.response_time_ms,
    
    -- Événement
    e.name as event_name,
    
    -- Classification du problème
    CASE 
        WHEN acl.response_time_ms > 5000 THEN 'SLOW_RESPONSE'
        WHEN acl.denial_reason = 'TECHNICAL_ERROR' THEN 'TECHNICAL_ISSUE'
        WHEN acl.denial_reason = 'INVALID_QR' THEN 'INVALID_QR'
        WHEN acl.denial_reason = 'ALREADY_USED' THEN 'DUPLICATE_SCAN'
        ELSE 'OTHER'
    END as issue_category,
    
    -- Gravité
    CASE 
        WHEN acl.response_time_ms > 10000 OR acl.denial_reason = 'TECHNICAL_ERROR' THEN 'HIGH'
        WHEN acl.response_time_ms > 5000 OR acl.status = 'DENIED' THEN 'MEDIUM'
        ELSE 'LOW'
    END as severity
    
FROM access_control_log acl
JOIN events e ON acl.event_id = e.id
WHERE 
    acl.status IN ('DENIED', 'ERROR') OR 
    acl.response_time_ms > 3000
ORDER BY acl.timestamp DESC;

-- Vue des abonnements expirant bientôt
CREATE VIEW v_expiring_subscriptions AS
SELECT 
    s.id,
    s.subscription_number,
    s.valid_until,
    s.auto_renew,
    s.status,
    
    -- Utilisateur
    u.first_name,
    u.last_name,
    u.email,
    u.phone,
    
    -- Plan
    sp.name as plan_name,
    sp.price as plan_price,
    
    -- Calculs
    s.valid_until - CURRENT_DATE as days_until_expiry,
    CASE 
        WHEN s.valid_until - CURRENT_DATE <= 7 THEN 'URGENT'
        WHEN s.valid_until - CURRENT_DATE <= 30 THEN 'SOON'
        ELSE 'NORMAL'
    END as urgency_level
    
FROM subscriptions s
JOIN users u ON s.user_id = u.id
JOIN subscription_plans sp ON s.subscription_plan_id = sp.id
WHERE s.status = 'ACTIVE'
AND s.valid_until BETWEEN CURRENT_DATE AND CURRENT_DATE + INTERVAL '60 days'
ORDER BY s.valid_until ASC;

-- =====================================================
-- 8. DONNÉES D'INITIALISATION
-- =====================================================

-- Types de billets standards
INSERT INTO ticket_types (id, code, name, description, base_price, currency, transferable, refundable, max_quantity_per_order, is_active) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'STANDARD', 'Billet Standard', 'Accès aux tribunes principales', 25.00, 'TND', TRUE, FALSE, 8, TRUE),
('770e8400-e29b-41d4-a716-446655440002', 'PREMIUM', 'Billet Premium', 'Accès zones premium avec services', 45.00, 'TND', TRUE, TRUE, 4, TRUE),
('770e8400-e29b-41d4-a716-446655440003', 'VIP', 'Billet VIP', 'Accès zones VIP avec restauration', 80.00, 'TND', TRUE, TRUE, 2, TRUE),
('770e8400-e29b-41d4-a716-446655440004', 'STUDENT', 'Billet Étudiant', 'Tarif réduit pour étudiants', 15.00, 'TND', FALSE, FALSE, 2, TRUE),
('770e8400-e29b-41d4-a716-446655440005', 'CHILD', 'Billet Enfant', 'Gratuit pour les moins de 12 ans', 0.00, 'TND', FALSE, FALSE, 4, TRUE);

-- Plans d'abonnements standards
INSERT INTO subscription_plans (id, code, name, description, type, price, currency, valid_from, valid_until, transferable, max_transfers, auto_renew, includes_playoffs, priority_booking, is_active) VALUES
('880e8400-e29b-41d4-a716-446655440001', 'FULL_SEASON_2025', 'Abonnement Saison Complète 2025', 'Accès à tous les matchs domicile de la saison', 'FULL_SEASON', 450.00, 'TND', '2024-09-01', '2025-05-31', TRUE, 2, TRUE, TRUE, TRUE, TRUE),
('880e8400-e29b-41d4-a716-446655440002', 'HALF_SEASON_2025', 'Abonnement Mi-Saison 2025', 'Accès à la moitié des matchs domicile', 'HALF_SEASON', 250.00, 'TND', '2025-01-01', '2025-05-31', TRUE, 1, FALSE, FALSE, TRUE, TRUE),
('880e8400-e29b-41d4-a716-446655440003', 'VIP_ANNUAL_2025', 'Abonnement VIP Annuel 2025', 'Accès VIP à tous les événements', 'VIP_ANNUAL', 1200.00, 'TND', '2025-01-01', '2025-12-31', TRUE, 3, TRUE, TRUE, TRUE, TRUE),
('880e8400-e29b-41d4-a716-446655440004', 'FLEX_10_2025', 'Abonnement Flex 10 matchs', 'Choix de 10 matchs dans la saison', 'FLEX', 200.00, 'TND', '2024-09-01', '2025-05-31', FALSE, 0, FALSE, FALSE, FALSE, TRUE);

-- Règles de tarification
INSERT INTO pricing_rules (id, code, name, description, rule_type, applies_to, discount_value, min_quantity, valid_from, valid_until, usage_limit_total, auto_apply, is_active) VALUES
('990e8400-e29b-41d4-a716-446655440001', 'EARLY_BIRD_2025', 'Tarif Anticipé 2025', 'Réduction pour achats avant octobre', 'EARLY_BIRD', 'BOTH', 15.00, NULL, '2024-08-01 00:00:00+01', '2024-10-01 23:59:59+01', 1000, TRUE, TRUE),
('990e8400-e29b-41d4-a716-446655440002', 'GROUP_4PLUS', 'Tarif Groupe 4+', 'Réduction pour groupes de 4 personnes ou plus', 'GROUP', 'TICKETS', 10.00, 4, NULL, NULL, NULL, TRUE, TRUE),
('990e8400-e29b-41d4-a716-446655440003', 'STUDENT_DISCOUNT', 'Réduction Étudiant', 'Réduction étudiants avec justificatif', 'PROMOTIONAL', 'TICKETS', 25.00, NULL, NULL, NULL, NULL, FALSE, TRUE),
('990e8400-e29b-41d4-a716-446655440004', 'LOYALTY_MEMBER', 'Fidélité Supporters', 'Réduction membres fidèles', 'LOYALTY', 'BOTH', 12.00, NULL, NULL, NULL, NULL, FALSE, TRUE);

-- Templates de billets
INSERT INTO ticket_templates (id, code, name, description, type, format, orientation, elements, layout, is_default, is_active) VALUES
(
    'aa0e8400-e29b-41d4-a716-446655440001', 
    'STANDARD_TICKET', 
    'Template Billet Standard', 
    'Template par défaut pour billets standards',
    'TICKET', 
    'PDF', 
    'PORTRAIT',
    '{"qr_code": {"size": "large", "position": "top_right"}, "logo": {"position": "top_left"}, "event_info": {"position": "center"}, "user_info": {"position": "bottom"}}',
    '{"width": 210, "height": 297, "margins": {"top": 20, "bottom": 20, "left": 15, "right": 15}}',
    TRUE, 
    TRUE
),
(
    'aa0e8400-e29b-41d4-a716-446655440002', 
    'VIP_TICKET', 
    'Template Billet VIP', 
    'Template premium pour billets VIP',
    'TICKET', 
    'PDF', 
    'LANDSCAPE',
    '{"qr_code": {"size": "xlarge", "position": "right"}, "logo": {"position": "top_center"}, "event_info": {"position": "center_left"}, "vip_benefits": {"position": "bottom"}}',
    '{"width": 297, "height": 210, "margins": {"top": 15, "bottom": 15, "left": 20, "right": 20}}',
    FALSE, 
    TRUE
);

-- =====================================================
-- 9. COMMENTAIRES SUR LES TABLES
-- =====================================================

COMMENT ON TABLE subscription_plans IS 'Catalogue des plans d''abonnements disponibles à la vente';
COMMENT ON TABLE ticket_types IS 'Types de billets avec prix de base et configuration';
COMMENT ON TABLE subscriptions IS 'Instances d''abonnements souscrits par les utilisateurs';
COMMENT ON TABLE tickets IS 'Billets individuels achetés par les utilisateurs';
COMMENT ON TABLE access_rights IS 'Table centrale unifiant tous les droits d''accès avec QR codes';
COMMENT ON TABLE access_control_log IS 'Journal de tous les contrôles d''accès physiques';
COMMENT ON TABLE access_transactions_log IS 'Journal des transactions sur les droits d''accès';
COMMENT ON TABLE pricing_rules IS 'Règles de tarification et promotions';
COMMENT ON TABLE blacklist IS 'Liste noire des utilisateurs/devices/IPs bloqués';
COMMENT ON TABLE ticket_templates IS 'Templates pour génération des billets PDF';

-- Commentaires sur les colonnes importantes
COMMENT ON COLUMN access_rights.qr_code IS 'Code QR unique pour validation physique';
COMMENT ON COLUMN access_rights.source_type IS 'Type de source: SUBSCRIPTION, TICKET, INVITATION, etc.';
COMMENT ON COLUMN access_rights.source_id IS 'ID de la source (subscription_id, ticket_id, etc.)';
COMMENT ON COLUMN access_rights.metadata IS 'Métadonnées JSON spécifiques au type d''accès';
COMMENT ON COLUMN subscriptions.transfers_used IS 'Nombre de transferts déjà effectués';
COMMENT ON COLUMN tickets.quantity IS 'Nombre de places dans ce billet';
COMMENT ON COLUMN blacklist.scope IS 'Portée: EVENT, VENUE, CLUB, GLOBAL';

-- =====================================================
-- 10. CONFIGURATION SÉCURITÉ ROW LEVEL
-- =====================================================

-- Activer RLS sur les tables sensibles
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_rights ENABLE ROW LEVEL SECURITY;
ALTER TABLE access_control_log ENABLE ROW LEVEL SECURITY;

-- Politique pour subscriptions - utilisateurs voient leurs propres abonnements
CREATE POLICY subscriptions_user_policy ON subscriptions
    FOR ALL
    USING (user_id = current_setting('app.current_user_id')::UUID);

-- Politique pour tickets - utilisateurs voient leurs propres billets
CREATE POLICY tickets_user_policy ON tickets
    FOR ALL
    USING (user_id = current_setting('app.current_user_id')::UUID OR user_id IS NULL);

-- Politique pour access_rights - utilisateurs voient leurs propres droits
CREATE POLICY access_rights_user_policy ON access_rights
    FOR SELECT
    USING (user_id = current_setting('app.current_user_id')::UUID);

-- Politique pour staff - accès complet en lecture
CREATE POLICY staff_ticketing_read_policy ON subscriptions
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

-- Politique similaire pour tickets et access_rights
CREATE POLICY staff_tickets_read_policy ON tickets
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

CREATE POLICY staff_access_rights_read_policy ON access_rights
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

-- Politique pour contrôleurs d'accès - modification des logs
CREATE POLICY access_controllers_log_policy ON access_control_log
    FOR INSERT
    WITH CHECK (
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

-- Création des rôles applicatifs (exemple)
/*
-- Rôle pour l'application billetterie
CREATE ROLE entrix_ticketing_role;
GRANT SELECT, INSERT, UPDATE ON subscription_plans, ticket_types, pricing_rules TO entrix_ticketing_role;
GRANT ALL PRIVILEGES ON subscriptions, tickets, access_rights TO entrix_ticketing_role;

-- Rôle pour le contrôle d'accès
CREATE ROLE entrix_access_control_role;
GRANT SELECT ON access_rights TO entrix_access_control_role;
GRANT INSERT ON access_control_log TO entrix_access_control_role;
GRANT UPDATE (status, used_at, used_at_access_point) ON access_rights TO entrix_access_control_role;

-- Rôle pour les rapports (lecture seule)
CREATE ROLE entrix_reports_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO entrix_reports_role;

-- Rôle pour la maintenance
CREATE ROLE entrix_maintenance_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO entrix_maintenance_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO entrix_maintenance_role;
*/

-- =====================================================
-- SCRIPT TERMINÉ AVEC SUCCÈS
-- =====================================================

-- Vérification finale - Tables créées
SELECT 
    schemaname,
    tablename,
    tableowner
FROM pg_tables 
WHERE schemaname = 'public' 
AND tablename IN (
    'subscription_plans', 'subscriptions', 'ticket_types', 'tickets',
    'access_rights', 'access_transactions_log', 'access_control_log',
    'pricing_rules', 'event_ticket_config', 'zone_mapping_overrides',
    'ticket_templates', 'blacklist'
)
ORDER BY tablename;

-- Vérification des énumérations
SELECT 
    t.typname as enum_name,
    array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname IN (
    'subscription_plan_type', 'subscription_status', 'access_right_status',
    'access_source_type', 'access_transaction_type', 'access_action',
    'access_status', 'denial_reason', 'blacklist_type', 'pricing_rule_type'
)
GROUP BY t.typname
ORDER BY t.typname;

-- Vérification des index critiques
SELECT 
    indexname,
    tablename,
    indexdef
FROM pg_indexes 
WHERE schemaname = 'public'
AND indexname LIKE '%access_rights%'
ORDER BY indexname;

-- Messages de fin
SELECT 'Script SQL Module Billetterie & Contrôle d''Accès exécuté avec succès!' AS status;
SELECT 'Tables créées: 12 tables principales + tables de liaison' AS tables_info;
SELECT 'Énumérations créées: 16 types pour flexibilité maximale' AS enums_info;
SELECT 'Fonctions créées: 9 fonctions utilitaires pour logique métier' AS functions_info;
SELECT 'Vues créées: 6 vues pour rapports et monitoring' AS views_info;
SELECT 'Index: 60+ index optimisés pour performances contrôle d''accès' AS indexes_info;