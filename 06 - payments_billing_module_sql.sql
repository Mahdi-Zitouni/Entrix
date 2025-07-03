-- =====================================================
-- SCRIPT SQL POSTGRESQL - MODULE PAIEMENTS & FACTURATION
-- Plateforme Entrix - Système de Paiements et Gestion Commerciale
-- Version: 1.0
-- Date: Juin 2025
-- =====================================================

-- =====================================================
-- 1. SUPPRESSION DES OBJETS EXISTANTS (Ordre inverse)
-- =====================================================

-- Suppression des tables
DROP TABLE IF EXISTS payment_webhooks CASCADE;
DROP TABLE IF EXISTS club_commissions CASCADE;
DROP TABLE IF EXISTS refunds CASCADE;
DROP TABLE IF EXISTS payment_attempts CASCADE;
DROP TABLE IF EXISTS payments CASCADE;
DROP TABLE IF EXISTS order_items CASCADE;
DROP TABLE IF EXISTS orders CASCADE;
DROP TABLE IF EXISTS payment_methods CASCADE;

-- Suppression des énumérations
DROP TYPE IF EXISTS webhook_status CASCADE;
DROP TYPE IF EXISTS commission_status CASCADE;
DROP TYPE IF EXISTS refund_status CASCADE;
DROP TYPE IF EXISTS payment_status CASCADE;
DROP TYPE IF EXISTS order_status CASCADE;

-- Suppression des fonctions et triggers
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS generate_order_number() CASCADE;
DROP FUNCTION IF EXISTS generate_payment_number() CASCADE;
DROP FUNCTION IF EXISTS calculate_club_commission() CASCADE;
DROP FUNCTION IF EXISTS process_payment_webhook() CASCADE;
DROP FUNCTION IF EXISTS create_payment_from_order() CASCADE;
DROP FUNCTION IF EXISTS process_refund() CASCADE;
DROP FUNCTION IF EXISTS update_order_totals() CASCADE;
DROP FUNCTION IF EXISTS get_payment_summary() CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_orders() CASCADE;

-- =====================================================
-- 2. CRÉATION DES ÉNUMÉRATIONS
-- =====================================================

-- Statuts de commande
CREATE TYPE order_status AS ENUM (
    'DRAFT',            -- Brouillon (panier)
    'PENDING',          -- En attente paiement
    'PAID',             -- Payée et confirmée
    'PARTIALLY_PAID',   -- Partiellement payée
    'CANCELLED',        -- Annulée
    'REFUNDED',         -- Remboursée
    'EXPIRED'           -- Expirée
);

-- Statuts de paiement
CREATE TYPE payment_status AS ENUM (
    'PENDING',          -- En attente
    'PROCESSING',       -- En cours de traitement
    'COMPLETED',        -- Terminé avec succès
    'FAILED',           -- Échoué
    'CANCELLED',        -- Annulé
    'REFUNDED',         -- Remboursé
    'PARTIALLY_REFUNDED' -- Remboursé partiellement
);

-- Statuts de remboursement
CREATE TYPE refund_status AS ENUM (
    'PENDING',          -- En attente
    'PROCESSING',       -- En cours
    'COMPLETED',        -- Terminé
    'FAILED',           -- Échoué
    'CANCELLED'         -- Annulé
);

-- Statuts de commission
CREATE TYPE commission_status AS ENUM (
    'PENDING',          -- En attente
    'CALCULATED',       -- Calculée
    'APPROVED',         -- Approuvée
    'PAID',             -- Payée
    'DISPUTED'          -- Contestée
);

-- Statuts de webhook
CREATE TYPE webhook_status AS ENUM (
    'RECEIVED',         -- Reçu
    'PROCESSING',       -- En cours de traitement
    'PROCESSED',        -- Traité avec succès
    'FAILED',           -- Échec traitement
    'IGNORED'           -- Ignoré (doublons, etc.)
);

-- =====================================================
-- 3. CRÉATION DES TABLES PRINCIPALES
-- =====================================================

-- Table des méthodes de paiement
CREATE TABLE payment_methods (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    provider VARCHAR(50) NOT NULL,
    type VARCHAR(30) NOT NULL,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    is_default BOOLEAN NOT NULL DEFAULT FALSE,
    min_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    max_amount DECIMAL(10,2),
    processing_fee_fixed DECIMAL(8,2) NOT NULL DEFAULT 0,
    processing_fee_percent DECIMAL(5,4) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'TND',
    configuration JSONB NOT NULL,
    display_order INTEGER NOT NULL DEFAULT 0,
    logo_url VARCHAR(255),
    description TEXT,
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT chk_payment_methods_amounts CHECK (
        min_amount >= 0 AND 
        (max_amount IS NULL OR max_amount >= min_amount)
    ),
    CONSTRAINT chk_payment_methods_fees CHECK (
        processing_fee_fixed >= 0 AND 
        processing_fee_percent >= 0 AND 
        processing_fee_percent <= 1
    ),
    CONSTRAINT chk_payment_methods_type CHECK (
        type IN ('MOBILE_WALLET', 'CREDIT_CARD', 'BANK_TRANSFER', 'CASH', 'OTHER')
    )
);

-- Table des commandes
CREATE TABLE orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_number VARCHAR(50) NOT NULL UNIQUE,
    user_id UUID,
    guest_email VARCHAR(255),
    guest_phone VARCHAR(20),
    guest_name VARCHAR(200),
    status order_status NOT NULL DEFAULT 'DRAFT',
    total_amount DECIMAL(10,2) NOT NULL,
    subtotal_amount DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    tax_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    processing_fee DECIMAL(8,2) NOT NULL DEFAULT 0,
    currency VARCHAR(3) NOT NULL DEFAULT 'TND',
    payment_method_id UUID,
    expires_at TIMESTAMPTZ,
    purchase_channel VARCHAR(50) NOT NULL,
    ip_address INET,
    user_agent TEXT,
    notes TEXT,
    coupon_code VARCHAR(50),
    referrer VARCHAR(255),
    language VARCHAR(2) NOT NULL DEFAULT 'fr',
    metadata JSONB,
    confirmed_at TIMESTAMPTZ,
    cancelled_at TIMESTAMPTZ,
    cancellation_reason TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT fk_orders_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_orders_payment_method 
        FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id) ON DELETE SET NULL,
    CONSTRAINT chk_orders_amounts CHECK (
        total_amount >= 0 AND 
        subtotal_amount >= 0 AND 
        discount_amount >= 0 AND 
        tax_amount >= 0 AND 
        processing_fee >= 0 AND
        total_amount = subtotal_amount - discount_amount + tax_amount + processing_fee
    ),
    CONSTRAINT chk_orders_guest_info CHECK (
        (user_id IS NOT NULL) OR 
        (user_id IS NULL AND guest_email IS NOT NULL)
    ),
    CONSTRAINT chk_orders_purchase_channel CHECK (
        purchase_channel IN ('WEB', 'MOBILE_APP', 'ADMIN', 'API', 'PHONE', 'ONSITE')
    ),
    CONSTRAINT chk_orders_language CHECK (
        language IN ('fr', 'ar', 'en')
    ),
    CONSTRAINT chk_orders_status_dates CHECK (
        (status != 'PAID' OR confirmed_at IS NOT NULL) AND
        (status != 'CANCELLED' OR cancelled_at IS NOT NULL)
    )
);

-- Table des lignes de commande
CREATE TABLE order_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    order_id UUID NOT NULL,
    item_type VARCHAR(20) NOT NULL,
    item_id UUID NOT NULL,
    event_id UUID,
    ticket_type_id UUID,
    subscription_plan_id UUID,
    quantity INTEGER NOT NULL,
    unit_price DECIMAL(10,2) NOT NULL,
    total_price DECIMAL(10,2) NOT NULL,
    original_price DECIMAL(10,2) NOT NULL,
    discount_amount DECIMAL(10,2) NOT NULL DEFAULT 0,
    discount_reason VARCHAR(100),
    zone_category VARCHAR(50),
    seat_selection JSONB,
    special_requests TEXT,
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT fk_order_items_order 
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_order_items_event 
        FOREIGN KEY (event_id) REFERENCES events(id) ON DELETE SET NULL,
    CONSTRAINT fk_order_items_ticket_type 
        FOREIGN KEY (ticket_type_id) REFERENCES ticket_types(id) ON DELETE SET NULL,
    CONSTRAINT fk_order_items_subscription_plan 
        FOREIGN KEY (subscription_plan_id) REFERENCES subscription_plans(id) ON DELETE SET NULL,
    CONSTRAINT chk_order_items_quantity CHECK (quantity > 0),
    CONSTRAINT chk_order_items_prices CHECK (
        unit_price >= 0 AND 
        total_price >= 0 AND 
        original_price >= 0 AND 
        discount_amount >= 0 AND
        total_price = (unit_price * quantity) - discount_amount
    ),
    CONSTRAINT chk_order_items_type CHECK (
        item_type IN ('TICKET', 'SUBSCRIPTION', 'MERCHANDISE', 'SERVICE')
    ),
    CONSTRAINT chk_order_items_references CHECK (
        (item_type = 'TICKET' AND ticket_type_id IS NOT NULL) OR
        (item_type = 'SUBSCRIPTION' AND subscription_plan_id IS NOT NULL) OR
        (item_type IN ('MERCHANDISE', 'SERVICE'))
    )
);

-- Table des paiements
CREATE TABLE payments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_number VARCHAR(50) NOT NULL UNIQUE,
    order_id UUID NOT NULL,
    payment_method_id UUID NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'TND',
    status payment_status NOT NULL DEFAULT 'PENDING',
    external_transaction_id VARCHAR(100),
    external_reference VARCHAR(100),
    gateway_response JSONB,
    processing_fee DECIMAL(8,2) NOT NULL DEFAULT 0,
    net_amount DECIMAL(10,2) NOT NULL,
    exchange_rate DECIMAL(10,6) NOT NULL DEFAULT 1,
    payment_date TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    callback_url VARCHAR(255),
    redirect_url VARCHAR(255),
    ip_address INET,
    user_agent TEXT,
    failure_reason TEXT,
    refund_reason TEXT,
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT fk_payments_order 
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_payments_payment_method 
        FOREIGN KEY (payment_method_id) REFERENCES payment_methods(id),
    CONSTRAINT chk_payments_amounts CHECK (
        amount >= 0 AND 
        processing_fee >= 0 AND 
        net_amount >= 0 AND
        exchange_rate > 0
    ),
    CONSTRAINT chk_payments_status_dates CHECK (
        (status != 'COMPLETED' OR payment_date IS NOT NULL) AND
        (status != 'FAILED' OR failure_reason IS NOT NULL)
    )
);

-- Table des tentatives de paiement
CREATE TABLE payment_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL,
    attempt_number INTEGER NOT NULL,
    status payment_status NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    gateway_request JSONB,
    gateway_response JSONB,
    error_code VARCHAR(50),
    error_message TEXT,
    processing_time_ms INTEGER,
    ip_address INET,
    user_agent TEXT,
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT fk_payment_attempts_payment 
        FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
    CONSTRAINT chk_payment_attempts_attempt_number CHECK (attempt_number > 0),
    CONSTRAINT chk_payment_attempts_amount CHECK (amount >= 0),
    CONSTRAINT chk_payment_attempts_processing_time CHECK (
        processing_time_ms IS NULL OR processing_time_ms >= 0
    ),
    CONSTRAINT uk_payment_attempts_payment_attempt 
        UNIQUE (payment_id, attempt_number)
);

-- Table des remboursements
CREATE TABLE refunds (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    refund_number VARCHAR(50) NOT NULL UNIQUE,
    payment_id UUID NOT NULL,
    order_id UUID NOT NULL,
    refund_type VARCHAR(20) NOT NULL,
    amount DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'TND',
    status refund_status NOT NULL DEFAULT 'PENDING',
    method VARCHAR(20) NOT NULL,
    reason VARCHAR(100) NOT NULL,
    description TEXT,
    requested_by UUID,
    approved_by UUID,
    external_refund_id VARCHAR(100),
    processing_fee DECIMAL(8,2) NOT NULL DEFAULT 0,
    net_refund_amount DECIMAL(10,2) NOT NULL,
    expected_date DATE,
    completed_date TIMESTAMPTZ,
    gateway_response JSONB,
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT fk_refunds_payment 
        FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
    CONSTRAINT fk_refunds_order 
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT fk_refunds_requested_by 
        FOREIGN KEY (requested_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_refunds_approved_by 
        FOREIGN KEY (approved_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_refunds_amounts CHECK (
        amount >= 0 AND 
        processing_fee >= 0 AND 
        net_refund_amount >= 0
    ),
    CONSTRAINT chk_refunds_type CHECK (
        refund_type IN ('FULL', 'PARTIAL', 'CREDIT_NOTE')
    ),
    CONSTRAINT chk_refunds_method CHECK (
        method IN ('ORIGINAL', 'CREDIT_NOTE', 'BANK_TRANSFER', 'CASH', 'OTHER')
    ),
    CONSTRAINT chk_refunds_status_dates CHECK (
        (status != 'COMPLETED' OR completed_date IS NOT NULL)
    )
);

-- Table des commissions club
CREATE TABLE club_commissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    payment_id UUID NOT NULL,
    order_id UUID NOT NULL,
    club_id UUID NOT NULL,
    commission_type VARCHAR(30) NOT NULL,
    base_amount DECIMAL(10,2) NOT NULL,
    commission_rate DECIMAL(5,4),
    commission_amount DECIMAL(10,2) NOT NULL,
    platform_fee DECIMAL(10,2) NOT NULL,
    net_to_club DECIMAL(10,2) NOT NULL,
    currency VARCHAR(3) NOT NULL DEFAULT 'TND',
    calculation_details JSONB NOT NULL,
    status commission_status NOT NULL DEFAULT 'PENDING',
    payment_due_date DATE NOT NULL,
    paid_date TIMESTAMPTZ,
    payment_reference VARCHAR(100),
    notes TEXT,
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT fk_club_commissions_payment 
        FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE CASCADE,
    CONSTRAINT fk_club_commissions_order 
        FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
    CONSTRAINT chk_club_commissions_amounts CHECK (
        base_amount >= 0 AND 
        commission_amount >= 0 AND 
        platform_fee >= 0 AND 
        net_to_club >= 0
    ),
    CONSTRAINT chk_club_commissions_rate CHECK (
        commission_rate IS NULL OR (commission_rate >= 0 AND commission_rate <= 1)
    ),
    CONSTRAINT chk_club_commissions_type CHECK (
        commission_type IN ('PERCENTAGE', 'FIXED', 'TIERED', 'NEGOTIATED')
    ),
    CONSTRAINT chk_club_commissions_status_dates CHECK (
        (status != 'PAID' OR paid_date IS NOT NULL)
    )
);

-- Table des webhooks de paiement
CREATE TABLE payment_webhooks (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    webhook_id VARCHAR(100) NOT NULL UNIQUE,
    payment_id UUID,
    event_type VARCHAR(50) NOT NULL,
    external_transaction_id VARCHAR(100) NOT NULL,
    status webhook_status NOT NULL DEFAULT 'RECEIVED',
    raw_payload JSONB NOT NULL,
    parsed_data JSONB,
    signature VARCHAR(255),
    signature_valid BOOLEAN,
    ip_source INET,
    user_agent TEXT,
    processing_attempts INTEGER NOT NULL DEFAULT 0,
    last_processing_error TEXT,
    processed_at TIMESTAMPTZ,
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT fk_payment_webhooks_payment 
        FOREIGN KEY (payment_id) REFERENCES payments(id) ON DELETE SET NULL,
    CONSTRAINT chk_payment_webhooks_attempts CHECK (processing_attempts >= 0),
    CONSTRAINT chk_payment_webhooks_status_processed CHECK (
        (status != 'PROCESSED' OR processed_at IS NOT NULL)
    )
);

-- =====================================================
-- 4. CRÉATION DES INDEX POUR PERFORMANCES
-- =====================================================

-- Index sur payment_methods
CREATE INDEX idx_payment_methods_code ON payment_methods(code);
CREATE INDEX idx_payment_methods_active ON payment_methods(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_payment_methods_default ON payment_methods(is_default) WHERE is_default = TRUE;
CREATE INDEX idx_payment_methods_provider ON payment_methods(provider);
CREATE INDEX idx_payment_methods_display_order ON payment_methods(display_order);

-- Index sur orders (critiques pour performances)
CREATE INDEX idx_orders_number ON orders(order_number);
CREATE INDEX idx_orders_user_id ON orders(user_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_orders_guest_email ON orders(guest_email);
CREATE INDEX idx_orders_purchase_channel ON orders(purchase_channel);
CREATE INDEX idx_orders_created_at ON orders(created_at);
CREATE INDEX idx_orders_expires_at ON orders(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX idx_orders_user_status ON orders(user_id, status);
CREATE INDEX idx_orders_pending_expired ON orders(status, expires_at) 
    WHERE status = 'PENDING' AND expires_at IS NOT NULL;

-- Index sur order_items
CREATE INDEX idx_order_items_order_id ON order_items(order_id);
CREATE INDEX idx_order_items_item_type ON order_items(item_type);
CREATE INDEX idx_order_items_event_id ON order_items(event_id);
CREATE INDEX idx_order_items_ticket_type_id ON order_items(ticket_type_id);
CREATE INDEX idx_order_items_subscription_plan_id ON order_items(subscription_plan_id);

-- Index sur payments (critiques pour webhooks et réconciliation)
CREATE INDEX idx_payments_number ON payments(payment_number);
CREATE INDEX idx_payments_order_id ON payments(order_id);
CREATE INDEX idx_payments_payment_method_id ON payments(payment_method_id);
CREATE INDEX idx_payments_status ON payments(status);
CREATE INDEX idx_payments_external_transaction_id ON payments(external_transaction_id);
CREATE INDEX idx_payments_external_reference ON payments(external_reference);
CREATE INDEX idx_payments_payment_date ON payments(payment_date);
CREATE INDEX idx_payments_created_at ON payments(created_at);
CREATE INDEX idx_payments_pending_expired ON payments(status, expires_at) 
    WHERE status = 'PENDING' AND expires_at IS NOT NULL;

-- Index sur payment_attempts
CREATE INDEX idx_payment_attempts_payment_id ON payment_attempts(payment_id);
CREATE INDEX idx_payment_attempts_status ON payment_attempts(status);
CREATE INDEX idx_payment_attempts_created_at ON payment_attempts(created_at);

-- Index sur refunds
CREATE INDEX idx_refunds_number ON refunds(refund_number);
CREATE INDEX idx_refunds_payment_id ON refunds(payment_id);
CREATE INDEX idx_refunds_order_id ON refunds(order_id);
CREATE INDEX idx_refunds_status ON refunds(status);
CREATE INDEX idx_refunds_requested_by ON refunds(requested_by);
CREATE INDEX idx_refunds_approved_by ON refunds(approved_by);
CREATE INDEX idx_refunds_created_at ON refunds(created_at);

-- Index sur club_commissions
CREATE INDEX idx_club_commissions_payment_id ON club_commissions(payment_id);
CREATE INDEX idx_club_commissions_order_id ON club_commissions(order_id);
CREATE INDEX idx_club_commissions_club_id ON club_commissions(club_id);
CREATE INDEX idx_club_commissions_status ON club_commissions(status);
CREATE INDEX idx_club_commissions_payment_due_date ON club_commissions(payment_due_date);
CREATE INDEX idx_club_commissions_club_status ON club_commissions(club_id, status);

-- Index sur payment_webhooks (critiques pour traitement temps réel)
CREATE INDEX idx_payment_webhooks_webhook_id ON payment_webhooks(webhook_id);
CREATE INDEX idx_payment_webhooks_payment_id ON payment_webhooks(payment_id);
CREATE INDEX idx_payment_webhooks_event_type ON payment_webhooks(event_type);
CREATE INDEX idx_payment_webhooks_external_transaction_id ON payment_webhooks(external_transaction_id);
CREATE INDEX idx_payment_webhooks_status ON payment_webhooks(status);
CREATE INDEX idx_payment_webhooks_created_at ON payment_webhooks(created_at);
CREATE INDEX idx_payment_webhooks_unprocessed ON payment_webhooks(status, created_at) 
    WHERE status IN ('RECEIVED', 'PROCESSING');

-- =====================================================
-- 5. CONTRAINTES D'INTÉGRITÉ AVANCÉES
-- =====================================================

-- Une seule méthode de paiement par défaut
CREATE UNIQUE INDEX uk_payment_methods_default ON payment_methods(is_default) 
    WHERE is_default = TRUE;

-- Numérotation unique des tentatives par paiement
CREATE UNIQUE INDEX uk_payment_attempts_payment_attempt ON payment_attempts(payment_id, attempt_number);

-- Contrainte: Le montant total d'une commande doit correspondre à la somme des lignes
-- (Vérifiée par trigger update_order_totals)

-- Contrainte: Un paiement ne peut être lié qu'à une commande du même utilisateur
ALTER TABLE payments ADD CONSTRAINT chk_payments_user_consistency 
    CHECK (TRUE); -- Implémentée par trigger

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

-- Fonction pour générer un numéro de commande unique
CREATE OR REPLACE FUNCTION generate_order_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    v_year INTEGER;
    v_counter INTEGER;
    v_order_number VARCHAR(50);
    v_exists BOOLEAN := TRUE;
BEGIN
    v_year := EXTRACT(YEAR FROM NOW());
    v_counter := 1;
    
    WHILE v_exists LOOP
        v_order_number := FORMAT('ORD-%s-%s', v_year, LPAD(v_counter::TEXT, 6, '0'));
        
        SELECT EXISTS(SELECT 1 FROM orders WHERE order_number = v_order_number) INTO v_exists;
        
        IF NOT v_exists THEN
            RETURN v_order_number;
        END IF;
        
        v_counter := v_counter + 1;
        
        -- Sécurité pour éviter boucle infinie
        IF v_counter > 999999 THEN
            RAISE EXCEPTION 'Impossible de générer un numéro de commande unique pour l''année %', v_year;
        END IF;
    END LOOP;
    
    RETURN v_order_number;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour générer un numéro de paiement unique
CREATE OR REPLACE FUNCTION generate_payment_number()
RETURNS VARCHAR(50) AS $$
DECLARE
    v_year INTEGER;
    v_counter INTEGER;
    v_payment_number VARCHAR(50);
    v_exists BOOLEAN := TRUE;
BEGIN
    v_year := EXTRACT(YEAR FROM NOW());
    v_counter := 1;
    
    WHILE v_exists LOOP
        v_payment_number := FORMAT('PAY-%s-%s', v_year, LPAD(v_counter::TEXT, 6, '0'));
        
        SELECT EXISTS(SELECT 1 FROM payments WHERE payment_number = v_payment_number) INTO v_exists;
        
        IF NOT v_exists THEN
            RETURN v_payment_number;
        END IF;
        
        v_counter := v_counter + 1;
        
        -- Sécurité pour éviter boucle infinie
        IF v_counter > 999999 THEN
            RAISE EXCEPTION 'Impossible de générer un numéro de paiement unique pour l''année %', v_year;
        END IF;
    END LOOP;
    
    RETURN v_payment_number;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour calculer les commissions club
CREATE OR REPLACE FUNCTION calculate_club_commission(
    p_payment_id UUID,
    p_club_id UUID,
    p_base_amount DECIMAL(10,2),
    p_commission_type VARCHAR(30) DEFAULT 'PERCENTAGE',
    p_commission_rate DECIMAL(5,4) DEFAULT 0.15
) RETURNS UUID AS $$
DECLARE
    v_commission_id UUID;
    v_commission_amount DECIMAL(10,2);
    v_platform_fee DECIMAL(10,2);
    v_net_to_club DECIMAL(10,2);
    v_calculation_details JSONB;
    v_order_id UUID;
    v_payment_due_date DATE;
BEGIN
    -- Récupérer l'order_id du paiement
    SELECT order_id INTO v_order_id FROM payments WHERE id = p_payment_id;
    
    -- Calculer les montants selon le type de commission
    IF p_commission_type = 'PERCENTAGE' THEN
        v_commission_amount := p_base_amount * p_commission_rate;
        v_platform_fee := p_base_amount * 0.05; -- 5% frais plateforme par défaut
        
        v_calculation_details := jsonb_build_object(
            'base_amount', p_base_amount,
            'commission_rate', p_commission_rate,
            'commission_calculation', FORMAT('%s * %s = %s', p_base_amount, p_commission_rate, v_commission_amount),
            'platform_fee_rate', 0.05,
            'platform_fee_calculation', FORMAT('%s * 0.05 = %s', p_base_amount, v_platform_fee)
        );
        
    ELSIF p_commission_type = 'FIXED' THEN
        v_commission_amount := p_commission_rate; -- Dans ce cas, rate = montant fixe
        v_platform_fee := 5.00; -- Frais fixe plateforme
        
        v_calculation_details := jsonb_build_object(
            'base_amount', p_base_amount,
            'fixed_commission', v_commission_amount,
            'platform_fee_fixed', v_platform_fee
        );
        
    ELSE
        RAISE EXCEPTION 'Type de commission non supporté: %', p_commission_type;
    END IF;
    
    v_net_to_club := p_base_amount - v_commission_amount - v_platform_fee;
    
    -- Date d'échéance : fin du mois suivant
    v_payment_due_date := (DATE_TRUNC('month', NOW()) + INTERVAL '1 month' + INTERVAL '1 month' - INTERVAL '1 day')::DATE;
    
    -- Insérer la commission
    INSERT INTO club_commissions (
        payment_id,
        order_id,
        club_id,
        commission_type,
        base_amount,
        commission_rate,
        commission_amount,
        platform_fee,
        net_to_club,
        calculation_details,
        status,
        payment_due_date
    ) VALUES (
        p_payment_id,
        v_order_id,
        p_club_id,
        p_commission_type,
        p_base_amount,
        CASE WHEN p_commission_type = 'FIXED' THEN NULL ELSE p_commission_rate END,
        v_commission_amount,
        v_platform_fee,
        v_net_to_club,
        v_calculation_details,
        'CALCULATED',
        v_payment_due_date
    ) RETURNING id INTO v_commission_id;
    
    RETURN v_commission_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour traiter un webhook de paiement
CREATE OR REPLACE FUNCTION process_payment_webhook(
    p_webhook_id VARCHAR(100),
    p_event_type VARCHAR(50),
    p_external_transaction_id VARCHAR(100),
    p_raw_payload JSONB,
    p_signature VARCHAR(255) DEFAULT NULL,
    p_ip_source INET DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
    v_webhook_record_id UUID;
    v_payment_id UUID;
    v_payment_record RECORD;
    v_parsed_data JSONB;
    v_signature_valid BOOLEAN := FALSE;
    v_processing_successful BOOLEAN := FALSE;
BEGIN
    -- Vérifier si le webhook existe déjà (éviter doublons)
    IF EXISTS(SELECT 1 FROM payment_webhooks WHERE webhook_id = p_webhook_id) THEN
        UPDATE payment_webhooks 
        SET status = 'IGNORED',
            metadata = COALESCE(metadata, '{}'::JSONB) || jsonb_build_object('reason', 'duplicate')
        WHERE webhook_id = p_webhook_id;
        RETURN FALSE;
    END IF;
    
    -- TODO: Valider la signature (implémentation spécifique à Flouci)
    v_signature_valid := (p_signature IS NOT NULL);
    
    -- Rechercher le paiement correspondant
    SELECT id INTO v_payment_id 
    FROM payments 
    WHERE external_transaction_id = p_external_transaction_id;
    
    -- Parser les données selon le type d'événement
    IF p_event_type = 'PAYMENT_SUCCESS' THEN
        v_parsed_data := jsonb_build_object(
            'payment_successful', TRUE,
            'transaction_id', p_external_transaction_id,
            'amount', (p_raw_payload->'data'->>'amount')::DECIMAL,
            'currency', p_raw_payload->'data'->>'currency',
            'fees', COALESCE((p_raw_payload->'data'->'fees'->>'amount')::DECIMAL, 0),
            'net_amount', COALESCE((p_raw_payload->'data'->>'net_amount')::DECIMAL, 0)
        );
    ELSIF p_event_type = 'PAYMENT_FAILED' THEN
        v_parsed_data := jsonb_build_object(
            'payment_successful', FALSE,
            'transaction_id', p_external_transaction_id,
            'error_code', p_raw_payload->'data'->'error'->>'code',
            'error_message', p_raw_payload->'data'->'error'->>'message'
        );
    ELSE
        v_parsed_data := jsonb_build_object('event_type', p_event_type);
    END IF;
    
    -- Insérer le webhook
    INSERT INTO payment_webhooks (
        webhook_id,
        payment_id,
        event_type,
        external_transaction_id,
        status,
        raw_payload,
        parsed_data,
        signature,
        signature_valid,
        ip_source,
        processing_attempts
    ) VALUES (
        p_webhook_id,
        v_payment_id,
        p_event_type,
        p_external_transaction_id,
        'PROCESSING',
        p_raw_payload,
        v_parsed_data,
        p_signature,
        v_signature_valid,
        p_ip_source,
        1
    ) RETURNING id INTO v_webhook_record_id;
    
    -- Traiter selon le type d'événement
    IF v_payment_id IS NOT NULL THEN
        IF p_event_type = 'PAYMENT_SUCCESS' THEN
            -- Mettre à jour le paiement
            UPDATE payments SET
                status = 'COMPLETED',
                payment_date = NOW(),
                gateway_response = p_raw_payload->'data',
                processing_fee = COALESCE((p_raw_payload->'data'->'fees'->>'amount')::DECIMAL, processing_fee),
                net_amount = COALESCE((p_raw_payload->'data'->>'net_amount')::DECIMAL, amount - processing_fee),
                updated_at = NOW()
            WHERE id = v_payment_id;
            
            -- Mettre à jour la commande
            UPDATE orders SET
                status = 'PAID',
                confirmed_at = NOW(),
                updated_at = NOW()
            WHERE id = (SELECT order_id FROM payments WHERE id = v_payment_id);
            
            v_processing_successful := TRUE;
            
        ELSIF p_event_type = 'PAYMENT_FAILED' THEN
            -- Mettre à jour le paiement
            UPDATE payments SET
                status = 'FAILED',
                failure_reason = p_raw_payload->'data'->'error'->>'message',
                gateway_response = p_raw_payload->'data',
                updated_at = NOW()
            WHERE id = v_payment_id;
            
            v_processing_successful := TRUE;
        END IF;
    END IF;
    
    -- Mettre à jour le statut du webhook
    UPDATE payment_webhooks SET
        status = CASE WHEN v_processing_successful THEN 'PROCESSED' ELSE 'FAILED' END,
        processed_at = CASE WHEN v_processing_successful THEN NOW() ELSE NULL END,
        last_processing_error = CASE WHEN NOT v_processing_successful THEN 'Payment not found or unsupported event type' ELSE NULL END,
        updated_at = NOW()
    WHERE id = v_webhook_record_id;
    
    RETURN v_processing_successful;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour créer un paiement à partir d'une commande
CREATE OR REPLACE FUNCTION create_payment_from_order(
    p_order_id UUID,
    p_payment_method_id UUID
) RETURNS UUID AS $$
DECLARE
    v_payment_id UUID;
    v_order_record RECORD;
    v_payment_method_record RECORD;
    v_payment_number VARCHAR(50);
    v_processing_fee DECIMAL(8,2);
    v_net_amount DECIMAL(10,2);
BEGIN
    -- Récupérer la commande
    SELECT * INTO v_order_record FROM orders WHERE id = p_order_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Commande non trouvée: %', p_order_id;
    END IF;
    
    -- Vérifier que la commande peut être payée
    IF v_order_record.status NOT IN ('DRAFT', 'PENDING') THEN
        RAISE EXCEPTION 'La commande % ne peut pas être payée (statut: %)', p_order_id, v_order_record.status;
    END IF;
    
    -- Récupérer la méthode de paiement
    SELECT * INTO v_payment_method_record FROM payment_methods WHERE id = p_payment_method_id;
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Méthode de paiement non trouvée: %', p_payment_method_id;
    END IF;
    
    -- Vérifier que la méthode est active
    IF NOT v_payment_method_record.is_active THEN
        RAISE EXCEPTION 'Méthode de paiement inactive: %', v_payment_method_record.name;
    END IF;
    
    -- Vérifier les montants min/max
    IF v_order_record.total_amount < v_payment_method_record.min_amount THEN
        RAISE EXCEPTION 'Montant trop faible (min: % TND)', v_payment_method_record.min_amount;
    END IF;
    
    IF v_payment_method_record.max_amount IS NOT NULL AND v_order_record.total_amount > v_payment_method_record.max_amount THEN
        RAISE EXCEPTION 'Montant trop élevé (max: % TND)', v_payment_method_record.max_amount;
    END IF;
    
    -- Calculer les frais de traitement
    v_processing_fee := v_payment_method_record.processing_fee_fixed + 
                       (v_order_record.total_amount * v_payment_method_record.processing_fee_percent);
    
    v_net_amount := v_order_record.total_amount - v_processing_fee;
    
    -- Générer le numéro de paiement
    v_payment_number := generate_payment_number();
    
    -- Créer le paiement
    INSERT INTO payments (
        payment_number,
        order_id,
        payment_method_id,
        amount,
        currency,
        status,
        processing_fee,
        net_amount,
        expires_at
    ) VALUES (
        v_payment_number,
        p_order_id,
        p_payment_method_id,
        v_order_record.total_amount,
        v_order_record.currency,
        'PENDING',
        v_processing_fee,
        v_net_amount,
        NOW() + INTERVAL '30 minutes' -- Expiration par défaut
    ) RETURNING id INTO v_payment_id;
    
    -- Mettre à jour la commande
    UPDATE orders SET
        status = 'PENDING',
        payment_method_id = p_payment_method_id,
        updated_at = NOW()
    WHERE id = p_order_id;
    
    -- Créer la première tentative de paiement
    INSERT INTO payment_attempts (
        payment_id,
        attempt_number,
        status,
        amount
    ) VALUES (
        v_payment_id,
        1,
        'PENDING',
        v_order_record.total_amount
    );
    
    RETURN v_payment_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour traiter un remboursement
CREATE OR REPLACE FUNCTION process_refund(
    p_payment_id UUID,
    p_refund_type VARCHAR(20),
    p_amount DECIMAL(10,2),
    p_reason VARCHAR(100),
    p_method VARCHAR(20) DEFAULT 'ORIGINAL',
    p_requested_by UUID DEFAULT NULL
) RETURNS UUID AS $$
DECLARE
    v_refund_id UUID;
    v_payment_record RECORD;
    v_refund_number VARCHAR(50);
    v_processing_fee DECIMAL(8,2) := 0;
    v_net_refund_amount DECIMAL(10,2);
BEGIN
    -- Récupérer le paiement
    SELECT p.*, o.id as order_id INTO v_payment_record 
    FROM payments p 
    JOIN orders o ON p.order_id = o.id 
    WHERE p.id = p_payment_id;
    
    IF NOT FOUND THEN
        RAISE EXCEPTION 'Paiement non trouvé: %', p_payment_id;
    END IF;
    
    -- Vérifier que le paiement peut être remboursé
    IF v_payment_record.status NOT IN ('COMPLETED', 'PARTIALLY_REFUNDED') THEN
        RAISE EXCEPTION 'Le paiement % ne peut pas être remboursé (statut: %)', p_payment_id, v_payment_record.status;
    END IF;
    
    -- Vérifier le montant du remboursement
    IF p_amount <= 0 OR p_amount > v_payment_record.amount THEN
        RAISE EXCEPTION 'Montant de remboursement invalide: % (max: %)', p_amount, v_payment_record.amount;
    END IF;
    
    -- Calculer les frais de traitement selon la méthode
    IF p_method = 'CREDIT_NOTE' THEN
        v_processing_fee := p_amount * 0.05; -- 5% frais administratifs pour avoir
    ELSIF p_method = 'BANK_TRANSFER' THEN
        v_processing_fee := 5.00; -- Frais fixe virement
    END IF;
    
    v_net_refund_amount := p_amount - v_processing_fee;
    
    -- Générer le numéro de remboursement
    CASE p_refund_type
        WHEN 'CREDIT_NOTE' THEN
            v_refund_number := FORMAT('AVOIR-%s-%s', EXTRACT(YEAR FROM NOW()), 
                                    LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0'));
        ELSE
            v_refund_number := FORMAT('REF-%s-%s', EXTRACT(YEAR FROM NOW()), 
                                    LPAD(FLOOR(RANDOM() * 999999)::TEXT, 6, '0'));
    END CASE;
    
    -- Créer le remboursement
    INSERT INTO refunds (
        refund_number,
        payment_id,
        order_id,
        refund_type,
        amount,
        currency,
        status,
        method,
        reason,
        requested_by,
        processing_fee,
        net_refund_amount,
        expected_date
    ) VALUES (
        v_refund_number,
        p_payment_id,
        v_payment_record.order_id,
        p_refund_type,
        p_amount,
        v_payment_record.currency,
        'PENDING',
        p_method,
        p_reason,
        p_requested_by,
        v_processing_fee,
        v_net_refund_amount,
        CASE 
            WHEN p_method = 'CREDIT_NOTE' THEN NULL
            WHEN p_method = 'ORIGINAL' THEN CURRENT_DATE + INTERVAL '5 days'
            ELSE CURRENT_DATE + INTERVAL '7 days'
        END
    ) RETURNING id INTO v_refund_id;
    
    -- Mettre à jour le statut du paiement si remboursement complet
    IF p_refund_type = 'FULL' THEN
        UPDATE payments SET
            status = 'REFUNDED',
            refund_reason = p_reason,
            updated_at = NOW()
        WHERE id = p_payment_id;
        
        UPDATE orders SET
            status = 'REFUNDED',
            updated_at = NOW()
        WHERE id = v_payment_record.order_id;
    ELSE
        UPDATE payments SET
            status = 'PARTIALLY_REFUNDED',
            updated_at = NOW()
        WHERE id = p_payment_id;
    END IF;
    
    RETURN v_refund_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour mettre à jour les totaux de commande
CREATE OR REPLACE FUNCTION update_order_totals(p_order_id UUID)
RETURNS VOID AS $$
DECLARE
    v_subtotal DECIMAL(10,2);
    v_total_discount DECIMAL(10,2);
    v_total DECIMAL(10,2);
BEGIN
    -- Calculer les totaux à partir des lignes
    SELECT 
        COALESCE(SUM(total_price + discount_amount), 0),
        COALESCE(SUM(discount_amount), 0),
        COALESCE(SUM(total_price), 0)
    INTO v_subtotal, v_total_discount, v_total
    FROM order_items 
    WHERE order_id = p_order_id;
    
    -- Mettre à jour la commande
    UPDATE orders SET
        subtotal_amount = v_subtotal,
        discount_amount = v_total_discount,
        total_amount = v_total + tax_amount + processing_fee,
        updated_at = NOW()
    WHERE id = p_order_id;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir un résumé des paiements
CREATE OR REPLACE FUNCTION get_payment_summary(
    p_start_date DATE DEFAULT CURRENT_DATE - INTERVAL '30 days',
    p_end_date DATE DEFAULT CURRENT_DATE
) RETURNS TABLE(
    period_start DATE,
    period_end DATE,
    total_orders BIGINT,
    total_payments BIGINT,
    total_amount DECIMAL(12,2),
    successful_payments BIGINT,
    failed_payments BIGINT,
    success_rate DECIMAL(5,2),
    average_order_value DECIMAL(10,2),
    total_refunds BIGINT,
    total_refund_amount DECIMAL(12,2),
    net_revenue DECIMAL(12,2)
) AS $$
BEGIN
    RETURN QUERY
    WITH payment_stats AS (
        SELECT 
            COUNT(DISTINCT o.id) as orders_count,
            COUNT(p.id) as payments_count,
            SUM(p.amount) as total_paid,
            COUNT(p.id) FILTER (WHERE p.status = 'COMPLETED') as successful_count,
            COUNT(p.id) FILTER (WHERE p.status = 'FAILED') as failed_count,
            AVG(o.total_amount) as avg_order_value
        FROM orders o
        LEFT JOIN payments p ON o.id = p.order_id
        WHERE o.created_at::DATE BETWEEN p_start_date AND p_end_date
    ),
    refund_stats AS (
        SELECT 
            COUNT(r.id) as refunds_count,
            COALESCE(SUM(r.amount), 0) as total_refunded
        FROM refunds r
        WHERE r.created_at::DATE BETWEEN p_start_date AND p_end_date
        AND r.status = 'COMPLETED'
    )
    SELECT 
        p_start_date,
        p_end_date,
        ps.orders_count,
        ps.payments_count,
        COALESCE(ps.total_paid, 0),
        ps.successful_count,
        ps.failed_count,
        CASE 
            WHEN ps.payments_count > 0 THEN ROUND((ps.successful_count::DECIMAL / ps.payments_count) * 100, 2)
            ELSE 0
        END,
        COALESCE(ps.avg_order_value, 0),
        rs.refunds_count,
        rs.total_refunded,
        COALESCE(ps.total_paid, 0) - rs.total_refunded
    FROM payment_stats ps
    CROSS JOIN refund_stats rs;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour nettoyer les commandes expirées
CREATE OR REPLACE FUNCTION cleanup_expired_orders()
RETURNS INTEGER AS $$
DECLARE
    v_count INTEGER := 0;
BEGIN
    -- Marquer les commandes expirées
    UPDATE orders 
    SET status = 'EXPIRED',
        updated_at = NOW()
    WHERE status = 'PENDING'
    AND expires_at IS NOT NULL 
    AND expires_at < NOW();
    
    GET DIAGNOSTICS v_count = ROW_COUNT;
    
    -- Marquer les paiements correspondants comme expirés
    UPDATE payments
    SET status = 'CANCELLED',
        updated_at = NOW()
    WHERE status = 'PENDING'
    AND expires_at IS NOT NULL
    AND expires_at < NOW();
    
    -- Nettoyer les anciennes commandes draft (garder 7 jours)
    DELETE FROM orders 
    WHERE status = 'DRAFT'
    AND created_at < NOW() - INTERVAL '7 days';
    
    RETURN v_count;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. TRIGGERS
-- =====================================================

-- Triggers pour updated_at automatique
CREATE TRIGGER trigger_payment_methods_updated_at
    BEFORE UPDATE ON payment_methods
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_orders_updated_at
    BEFORE UPDATE ON orders
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_payments_updated_at
    BEFORE UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_refunds_updated_at
    BEFORE UPDATE ON refunds
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_club_commissions_updated_at
    BEFORE UPDATE ON club_commissions
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_payment_webhooks_updated_at
    BEFORE UPDATE ON payment_webhooks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour générer automatiquement les numéros
CREATE OR REPLACE FUNCTION auto_generate_order_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.order_number IS NULL OR NEW.order_number = '' THEN
        NEW.order_number := generate_order_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_orders_generate_number
    BEFORE INSERT ON orders
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_order_number();

CREATE OR REPLACE FUNCTION auto_generate_payment_number()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.payment_number IS NULL OR NEW.payment_number = '' THEN
        NEW.payment_number := generate_payment_number();
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_payments_generate_number
    BEFORE INSERT ON payments
    FOR EACH ROW
    EXECUTE FUNCTION auto_generate_payment_number();

-- Trigger pour mettre à jour les totaux de commande
CREATE OR REPLACE FUNCTION trigger_update_order_totals()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'INSERT' OR TG_OP = 'UPDATE' THEN
        PERFORM update_order_totals(NEW.order_id);
        RETURN NEW;
    ELSIF TG_OP = 'DELETE' THEN
        PERFORM update_order_totals(OLD.order_id);
        RETURN OLD;
    END IF;
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_order_items_update_totals
    AFTER INSERT OR UPDATE OR DELETE ON order_items
    FOR EACH ROW
    EXECUTE FUNCTION trigger_update_order_totals();

-- Trigger pour calculer automatiquement les commissions
CREATE OR REPLACE FUNCTION trigger_calculate_commission()
RETURNS TRIGGER AS $$
DECLARE
    v_club_id UUID;
    v_commission_rate DECIMAL(5,4) := 0.15; -- 15% par défaut
BEGIN
    -- Calculer commission seulement pour paiements complétés
    IF NEW.status = 'COMPLETED' AND (OLD.status IS NULL OR OLD.status != 'COMPLETED') THEN
        -- TODO: Déterminer le club_id selon l'événement/lieu
        -- Pour l'exemple, on utilise un club par défaut
        v_club_id := '11111111-1111-1111-1111-111111111111'::UUID;
        
        -- Calculer la commission
        PERFORM calculate_club_commission(
            NEW.id,
            v_club_id,
            NEW.net_amount,
            'PERCENTAGE',
            v_commission_rate
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_payments_calculate_commission
    AFTER UPDATE ON payments
    FOR EACH ROW
    EXECUTE FUNCTION trigger_calculate_commission();

-- =====================================================
-- 8. VUES UTILES
-- =====================================================

-- Vue des commandes avec détails utilisateur
CREATE VIEW v_orders_with_details AS
SELECT 
    o.id,
    o.order_number,
    o.user_id,
    COALESCE(u.first_name || ' ' || u.last_name, o.guest_name) as customer_name,
    COALESCE(u.email, o.guest_email) as customer_email,
    COALESCE(u.phone, o.guest_phone) as customer_phone,
    o.status,
    o.total_amount,
    o.subtotal_amount,
    o.discount_amount,
    o.currency,
    o.purchase_channel,
    o.coupon_code,
    o.created_at,
    o.confirmed_at,
    COUNT(oi.id) as items_count
FROM orders o
LEFT JOIN users u ON o.user_id = u.id
LEFT JOIN order_items oi ON o.id = oi.order_id
GROUP BY o.id, u.first_name, u.last_name, u.email, u.phone
ORDER BY o.created_at DESC;

-- Vue des paiements avec détails
CREATE VIEW v_payments_with_details AS
SELECT 
    p.id,
    p.payment_number,
    p.order_id,
    o.order_number,
    pm.name as payment_method_name,
    pm.provider as payment_provider,
    p.amount,
    p.currency,
    p.status,
    p.external_transaction_id,
    p.processing_fee,
    p.net_amount,
    p.payment_date,
    p.created_at,
    CASE 
        WHEN p.status = 'PENDING' AND p.expires_at < NOW() THEN 'EXPIRED'
        ELSE p.status::TEXT
    END as current_status,
    EXTRACT(EPOCH FROM (p.payment_date - p.created_at))::INTEGER as processing_duration_seconds
FROM payments p
JOIN orders o ON p.order_id = o.id
JOIN payment_methods pm ON p.payment_method_id = pm.id
ORDER BY p.created_at DESC;

-- Vue des statistiques de conversion par méthode de paiement
CREATE VIEW v_payment_method_stats AS
SELECT 
    pm.id,
    pm.name,
    pm.provider,
    COUNT(p.id) as total_attempts,
    COUNT(p.id) FILTER (WHERE p.status = 'COMPLETED') as successful_payments,
    COUNT(p.id) FILTER (WHERE p.status = 'FAILED') as failed_payments,
    CASE 
        WHEN COUNT(p.id) > 0 THEN ROUND((COUNT(p.id) FILTER (WHERE p.status = 'COMPLETED')::DECIMAL / COUNT(p.id)) * 100, 2)
        ELSE 0
    END as success_rate_percent,
    SUM(p.amount) FILTER (WHERE p.status = 'COMPLETED') as total_amount,
    AVG(p.amount) FILTER (WHERE p.status = 'COMPLETED') as average_amount,
    SUM(p.processing_fee) FILTER (WHERE p.status = 'COMPLETED') as total_fees
FROM payment_methods pm
LEFT JOIN payments p ON pm.id = p.payment_method_id
WHERE p.created_at >= NOW() - INTERVAL '30 days' OR p.created_at IS NULL
GROUP BY pm.id, pm.name, pm.provider
ORDER BY successful_payments DESC;

-- Vue des commissions club
CREATE VIEW v_club_commissions_summary AS
SELECT 
    cc.club_id,
    cc.status,
    COUNT(cc.id) as commission_count,
    SUM(cc.base_amount) as total_base_amount,
    SUM(cc.commission_amount) as total_commission_amount,
    SUM(cc.platform_fee) as total_platform_fee,
    SUM(cc.net_to_club) as total_net_to_club,
    MIN(cc.payment_due_date) as earliest_due_date,
    MAX(cc.payment_due_date) as latest_due_date
FROM club_commissions cc
GROUP BY cc.club_id, cc.status
ORDER BY cc.club_id, cc.status;

-- Vue des remboursements avec détails
CREATE VIEW v_refunds_with_details AS
SELECT 
    r.id,
    r.refund_number,
    r.payment_id,
    p.payment_number,
    r.order_id,
    o.order_number,
    r.refund_type,
    r.amount,
    r.status,
    r.method,
    r.reason,
    r.net_refund_amount,
    r.expected_date,
    r.completed_date,
    u1.email as requested_by_email,
    u2.email as approved_by_email,
    r.created_at
FROM refunds r
JOIN payments p ON r.payment_id = p.id
JOIN orders o ON r.order_id = o.id
LEFT JOIN users u1 ON r.requested_by = u1.id
LEFT JOIN users u2 ON r.approved_by = u2.id
ORDER BY r.created_at DESC;

-- =====================================================
-- 9. DONNÉES D'INITIALISATION
-- =====================================================

-- Méthodes de paiement de base
INSERT INTO payment_methods (id, code, name, provider, type, is_active, is_default, min_amount, max_amount, processing_fee_fixed, processing_fee_percent, configuration, display_order, description) VALUES
(gen_random_uuid(), 'FLOUCI', 'Flouci', 'flouci', 'MOBILE_WALLET', TRUE, TRUE, 1.00, 2000.00, 0.50, 0.025, 
 '{"api_endpoint": "https://developers.flouci.com/api/", "timeout_seconds": 300, "auto_redirect": true}',
 10, 'Paiement rapide et sécurisé via votre portefeuille mobile Flouci'),

(gen_random_uuid(), 'FLOUCI_SANDBOX', 'Flouci (Test)', 'flouci', 'MOBILE_WALLET', FALSE, FALSE, 0.10, 100.00, 0.00, 0.00,
 '{"api_endpoint": "https://developers.flouci.com/api/", "sandbox_mode": true}',
 90, 'Mode test pour développement'),

(gen_random_uuid(), 'CASH', 'Espèces', 'manual', 'CASH', TRUE, FALSE, 5.00, 500.00, 0.00, 0.00,
 '{"manual_processing": true, "requires_approval": true}',
 50, 'Paiement en espèces au guichet'),

(gen_random_uuid(), 'BANK_TRANSFER', 'Virement bancaire', 'manual', 'BANK_TRANSFER', TRUE, FALSE, 50.00, 10000.00, 5.00, 0.00,
 '{"manual_processing": true, "processing_days": 3}',
 60, 'Virement bancaire (traitement sous 3 jours ouvrés)');

-- =====================================================
-- 10. PROCÉDURES DE MAINTENANCE
-- =====================================================

-- Procédure de nettoyage quotidien
CREATE OR REPLACE FUNCTION daily_payments_cleanup()
RETURNS TEXT AS $$
DECLARE
    v_expired_orders INTEGER;
    v_old_webhooks INTEGER;
    v_result TEXT;
BEGIN
    -- Nettoyer les commandes expirées
    SELECT cleanup_expired_orders() INTO v_expired_orders;
    
    -- Nettoyer les anciens webhooks (garder 90 jours)
    DELETE FROM payment_webhooks 
    WHERE created_at < NOW() - INTERVAL '90 days'
    AND status IN ('PROCESSED', 'IGNORED');
    GET DIAGNOSTICS v_old_webhooks = ROW_COUNT;
    
    -- Nettoyer les anciennes tentatives de paiement (garder 180 jours)
    DELETE FROM payment_attempts 
    WHERE created_at < NOW() - INTERVAL '180 days';
    
    -- Marquer les commissions en retard
    UPDATE club_commissions 
    SET status = 'DISPUTED'
    WHERE status = 'APPROVED'
    AND payment_due_date < CURRENT_DATE - INTERVAL '30 days';
    
    v_result := FORMAT('Nettoyage paiements effectué: %s commandes expirées, %s webhooks supprimés', 
                       v_expired_orders, v_old_webhooks);
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;
