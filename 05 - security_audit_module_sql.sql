-- =====================================================
-- SCRIPT SQL POSTGRESQL - MODULE SÉCURITÉ & AUDIT
-- Plateforme Entrix - Système de Sécurité et Audit
-- Version: 1.0
-- Date: Juin 2025
-- =====================================================

-- =====================================================
-- 1. SUPPRESSION DES OBJETS EXISTANTS (Ordre inverse)
-- =====================================================

-- Suppression des tables
DROP TABLE IF EXISTS security_policies CASCADE;
DROP TABLE IF EXISTS rate_limiting CASCADE;
DROP TABLE IF EXISTS mfa_tokens CASCADE;
DROP TABLE IF EXISTS security_events CASCADE;
DROP TABLE IF EXISTS login_attempts CASCADE;
DROP TABLE IF EXISTS user_sessions CASCADE;
DROP TABLE IF EXISTS audit_logs CASCADE;

-- Suppression des énumérations
DROP TYPE IF EXISTS mfa_method CASCADE;
DROP TYPE IF EXISTS security_level CASCADE;
DROP TYPE IF EXISTS audit_action CASCADE;

-- Suppression des fonctions et triggers
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS audit_trigger_function() CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_sessions() CASCADE;
DROP FUNCTION IF EXISTS check_rate_limit() CASCADE;
DROP FUNCTION IF EXISTS generate_mfa_token() CASCADE;
DROP FUNCTION IF EXISTS validate_mfa_token() CASCADE;
DROP FUNCTION IF EXISTS detect_security_anomaly() CASCADE;

-- =====================================================
-- 2. CRÉATION DES ÉNUMÉRATIONS
-- =====================================================

-- Actions d'audit
CREATE TYPE audit_action AS ENUM (
    'CREATE',           -- Création d'entité
    'READ',             -- Lecture d'entité
    'UPDATE',           -- Modification d'entité
    'DELETE',           -- Suppression d'entité
    'LOGIN',            -- Connexion utilisateur
    'LOGOUT',           -- Déconnexion utilisateur
    'ACCESS',           -- Accès physique (QR scan)
    'PAYMENT',          -- Transaction de paiement
    'TRANSFER',         -- Transfert de droits
    'EXPORT',           -- Export de données
    'IMPORT',           -- Import de données
    'ADMIN_ACTION'      -- Action d'administration
);

-- Niveaux de sécurité
CREATE TYPE security_level AS ENUM (
    'LOW',              -- Faible
    'MEDIUM',           -- Moyen
    'HIGH',             -- Élevé
    'CRITICAL'          -- Critique
);

-- Méthodes MFA
CREATE TYPE mfa_method AS ENUM (
    'SMS',              -- SMS vers téléphone
    'EMAIL',            -- Email de vérification
    'TOTP',             -- Time-based One-Time Password
    'APP_PUSH'          -- Notification push application
);

-- =====================================================
-- 3. CRÉATION DES TABLES PRINCIPALES
-- =====================================================

-- Table des logs d'audit
CREATE TABLE audit_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    action audit_action NOT NULL,
    entity_type VARCHAR(100) NOT NULL,
    entity_id UUID,
    user_id UUID,
    session_id UUID,
    ip_address INET,
    user_agent TEXT,
    old_values JSONB,
    new_values JSONB,
    metadata JSONB,
    severity security_level NOT NULL DEFAULT 'MEDIUM',
    success BOOLEAN NOT NULL DEFAULT TRUE,
    error_message TEXT,
    duration_ms INTEGER,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT fk_audit_logs_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_audit_logs_session 
        FOREIGN KEY (session_id) REFERENCES user_sessions(id) ON DELETE SET NULL,
    CONSTRAINT chk_audit_logs_duration 
        CHECK (duration_ms IS NULL OR duration_ms >= 0)
);

-- Table des sessions utilisateurs
CREATE TABLE user_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    session_token VARCHAR(255) NOT NULL UNIQUE,
    refresh_token VARCHAR(255),
    ip_address INET NOT NULL,
    user_agent TEXT,
    device_fingerprint VARCHAR(255),
    location JSONB,
    is_mobile BOOLEAN NOT NULL DEFAULT FALSE,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    last_activity TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at TIMESTAMPTZ NOT NULL,
    logout_reason VARCHAR(100),
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    ended_at TIMESTAMPTZ,
    
    -- Contraintes
    CONSTRAINT fk_user_sessions_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT chk_user_sessions_expires 
        CHECK (expires_at > created_at),
    CONSTRAINT chk_user_sessions_ended 
        CHECK (ended_at IS NULL OR ended_at >= created_at)
);

-- Table des tentatives de connexion
CREATE TABLE login_attempts (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL,
    user_id UUID,
    ip_address INET NOT NULL,
    user_agent TEXT,
    success BOOLEAN NOT NULL,
    failure_reason VARCHAR(100),
    mfa_required BOOLEAN NOT NULL DEFAULT FALSE,
    mfa_success BOOLEAN,
    geolocation JSONB,
    is_suspicious BOOLEAN NOT NULL DEFAULT FALSE,
    session_id UUID,
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT fk_login_attempts_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_login_attempts_session 
        FOREIGN KEY (session_id) REFERENCES user_sessions(id) ON DELETE SET NULL,
    CONSTRAINT chk_login_attempts_mfa 
        CHECK ((mfa_required = FALSE) OR (mfa_required = TRUE AND mfa_success IS NOT NULL))
);

-- Table des événements de sécurité
CREATE TABLE security_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type VARCHAR(100) NOT NULL,
    severity security_level NOT NULL,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    source_ip INET,
    target_user_id UUID,
    related_session_id UUID,
    detection_method VARCHAR(100) NOT NULL,
    auto_response VARCHAR(100),
    is_resolved BOOLEAN NOT NULL DEFAULT FALSE,
    resolved_by UUID,
    resolved_at TIMESTAMPTZ,
    false_positive BOOLEAN NOT NULL DEFAULT FALSE,
    evidence JSONB,
    impact_assessment JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT fk_security_events_target_user 
        FOREIGN KEY (target_user_id) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT fk_security_events_session 
        FOREIGN KEY (related_session_id) REFERENCES user_sessions(id) ON DELETE SET NULL,
    CONSTRAINT fk_security_events_resolved_by 
        FOREIGN KEY (resolved_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_security_events_resolved 
        CHECK ((is_resolved = FALSE) OR (is_resolved = TRUE AND resolved_by IS NOT NULL AND resolved_at IS NOT NULL))
);

-- Table des tokens MFA
CREATE TABLE mfa_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    token VARCHAR(10) NOT NULL,
    method mfa_method NOT NULL,
    purpose VARCHAR(50) NOT NULL,
    phone_number VARCHAR(20),
    email VARCHAR(255),
    is_used BOOLEAN NOT NULL DEFAULT FALSE,
    used_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts_count INTEGER NOT NULL DEFAULT 0,
    max_attempts INTEGER NOT NULL DEFAULT 3,
    ip_address INET,
    session_id UUID,
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT fk_mfa_tokens_user 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_mfa_tokens_session 
        FOREIGN KEY (session_id) REFERENCES user_sessions(id) ON DELETE SET NULL,
    CONSTRAINT chk_mfa_tokens_expires 
        CHECK (expires_at > created_at),
    CONSTRAINT chk_mfa_tokens_attempts 
        CHECK (attempts_count >= 0 AND attempts_count <= max_attempts),
    CONSTRAINT chk_mfa_tokens_used 
        CHECK ((is_used = FALSE) OR (is_used = TRUE AND used_at IS NOT NULL)),
    CONSTRAINT chk_mfa_tokens_phone_sms 
        CHECK ((method != 'SMS') OR (method = 'SMS' AND phone_number IS NOT NULL)),
    CONSTRAINT chk_mfa_tokens_email_method 
        CHECK ((method != 'EMAIL') OR (method = 'EMAIL' AND email IS NOT NULL))
);

-- Table de limitation de débit
CREATE TABLE rate_limiting (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    identifier VARCHAR(255) NOT NULL,
    identifier_type VARCHAR(20) NOT NULL,
    endpoint VARCHAR(200) NOT NULL,
    requests_count INTEGER NOT NULL DEFAULT 0,
    time_window INTEGER NOT NULL,
    limit_threshold INTEGER NOT NULL,
    is_blocked BOOLEAN NOT NULL DEFAULT FALSE,
    blocked_until TIMESTAMPTZ,
    block_reason VARCHAR(100),
    first_request TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_request TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT chk_rate_limiting_identifier_type 
        CHECK (identifier_type IN ('IP', 'USER', 'SESSION')),
    CONSTRAINT chk_rate_limiting_counts 
        CHECK (requests_count >= 0 AND limit_threshold > 0 AND time_window > 0),
    CONSTRAINT chk_rate_limiting_blocked 
        CHECK ((is_blocked = FALSE) OR (is_blocked = TRUE AND blocked_until IS NOT NULL)),
    CONSTRAINT chk_rate_limiting_requests_order 
        CHECK (last_request >= first_request),
    CONSTRAINT uk_rate_limiting_identifier_endpoint 
        UNIQUE (identifier, endpoint)
);

-- Table des politiques de sécurité
CREATE TABLE security_policies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    policy_name VARCHAR(100) NOT NULL UNIQUE,
    policy_type VARCHAR(50) NOT NULL,
    target_role VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    priority INTEGER NOT NULL DEFAULT 0,
    configuration JSONB NOT NULL,
    created_by UUID,
    description TEXT,
    effective_date TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    review_date TIMESTAMPTZ,
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT fk_security_policies_created_by 
        FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT chk_security_policies_type 
        CHECK (policy_type IN ('AUTHENTICATION', 'AUTHORIZATION', 'AUDIT', 'GENERAL')),
    CONSTRAINT chk_security_policies_priority 
        CHECK (priority >= 0),
    CONSTRAINT chk_security_policies_review_date 
        CHECK (review_date IS NULL OR review_date > effective_date)
);

-- =====================================================
-- 4. CRÉATION DES INDEX POUR PERFORMANCES
-- =====================================================

-- Index sur audit_logs (critiques pour requêtes fréquentes)
CREATE INDEX idx_audit_logs_user_id ON audit_logs(user_id);
CREATE INDEX idx_audit_logs_entity ON audit_logs(entity_type, entity_id);
CREATE INDEX idx_audit_logs_action ON audit_logs(action);
CREATE INDEX idx_audit_logs_severity ON audit_logs(severity);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
CREATE INDEX idx_audit_logs_user_action_date ON audit_logs(user_id, action, created_at);
CREATE INDEX idx_audit_logs_entity_action ON audit_logs(entity_type, action);

-- Index sur user_sessions (critiques pour authentification)
CREATE INDEX idx_user_sessions_user_id ON user_sessions(user_id);
CREATE INDEX idx_user_sessions_token ON user_sessions(session_token);
CREATE INDEX idx_user_sessions_active ON user_sessions(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_user_sessions_expires ON user_sessions(expires_at);
CREATE INDEX idx_user_sessions_last_activity ON user_sessions(last_activity);
CREATE INDEX idx_user_sessions_ip ON user_sessions(ip_address);

-- Index sur login_attempts (critiques pour détection attaques)
CREATE INDEX idx_login_attempts_email ON login_attempts(email);
CREATE INDEX idx_login_attempts_ip ON login_attempts(ip_address);
CREATE INDEX idx_login_attempts_success ON login_attempts(success);
CREATE INDEX idx_login_attempts_suspicious ON login_attempts(is_suspicious) WHERE is_suspicious = TRUE;
CREATE INDEX idx_login_attempts_created_at ON login_attempts(created_at);
CREATE INDEX idx_login_attempts_ip_time ON login_attempts(ip_address, created_at);
CREATE INDEX idx_login_attempts_user_time ON login_attempts(user_id, created_at);

-- Index sur security_events
CREATE INDEX idx_security_events_type ON security_events(event_type);
CREATE INDEX idx_security_events_severity ON security_events(severity);
CREATE INDEX idx_security_events_resolved ON security_events(is_resolved);
CREATE INDEX idx_security_events_source_ip ON security_events(source_ip);
CREATE INDEX idx_security_events_target_user ON security_events(target_user_id);
CREATE INDEX idx_security_events_created_at ON security_events(created_at);

-- Index sur mfa_tokens (critiques pour validation temps réel)
CREATE INDEX idx_mfa_tokens_user_id ON mfa_tokens(user_id);
CREATE INDEX idx_mfa_tokens_token ON mfa_tokens(token);
CREATE INDEX idx_mfa_tokens_method ON mfa_tokens(method);
CREATE INDEX idx_mfa_tokens_expires ON mfa_tokens(expires_at);
CREATE INDEX idx_mfa_tokens_active ON mfa_tokens(is_used) WHERE is_used = FALSE;

-- Index sur rate_limiting
CREATE INDEX idx_rate_limiting_identifier ON rate_limiting(identifier, identifier_type);
CREATE INDEX idx_rate_limiting_endpoint ON rate_limiting(endpoint);
CREATE INDEX idx_rate_limiting_blocked ON rate_limiting(is_blocked) WHERE is_blocked = TRUE;
CREATE INDEX idx_rate_limiting_time_window ON rate_limiting(last_request);

-- Index sur security_policies
CREATE INDEX idx_security_policies_type ON security_policies(policy_type);
CREATE INDEX idx_security_policies_active ON security_policies(is_active) WHERE is_active = TRUE;
CREATE INDEX idx_security_policies_priority ON security_policies(priority);

-- =====================================================
-- 5. CONTRAINTES SUPPLÉMENTAIRES
-- =====================================================

-- Contrainte pour valider le format email dans login_attempts
ALTER TABLE login_attempts ADD CONSTRAINT chk_login_attempts_email_format 
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

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

-- Fonction générique d'audit
CREATE OR REPLACE FUNCTION audit_trigger_function() 
RETURNS TRIGGER AS $$
DECLARE
    v_old_values JSONB;
    v_new_values JSONB;
    v_action audit_action;
    v_user_id UUID;
    v_session_id UUID;
BEGIN
    -- Déterminer l'action
    IF TG_OP = 'INSERT' THEN
        v_action := 'CREATE';
        v_new_values := to_jsonb(NEW);
        v_old_values := NULL;
    ELSIF TG_OP = 'UPDATE' THEN
        v_action := 'UPDATE';
        v_old_values := to_jsonb(OLD);
        v_new_values := to_jsonb(NEW);
    ELSIF TG_OP = 'DELETE' THEN
        v_action := 'DELETE';
        v_old_values := to_jsonb(OLD);
        v_new_values := NULL;
    END IF;
    
    -- Récupérer user_id et session_id depuis le contexte de l'application
    BEGIN
        v_user_id := current_setting('app.current_user_id')::UUID;
    EXCEPTION
        WHEN OTHERS THEN
            v_user_id := NULL;
    END;
    
    BEGIN
        v_session_id := current_setting('app.current_session_id')::UUID;
    EXCEPTION
        WHEN OTHERS THEN
            v_session_id := NULL;
    END;
    
    -- Insérer le log d'audit
    INSERT INTO audit_logs (
        action,
        entity_type,
        entity_id,
        user_id,
        session_id,
        old_values,
        new_values,
        severity,
        success
    ) VALUES (
        v_action,
        TG_TABLE_NAME,
        COALESCE(
            (CASE WHEN TG_OP = 'DELETE' THEN OLD.id ELSE NEW.id END),
            gen_random_uuid()
        ),
        v_user_id,
        v_session_id,
        v_old_values,
        v_new_values,
        'MEDIUM',
        TRUE
    );
    
    -- Retourner la ligne appropriée
    IF TG_OP = 'DELETE' THEN
        RETURN OLD;
    ELSE
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour nettoyer les sessions expirées
CREATE OR REPLACE FUNCTION cleanup_expired_sessions()
RETURNS INTEGER AS $$
DECLARE
    v_deleted_count INTEGER;
BEGIN
    -- Marquer comme terminées les sessions expirées
    UPDATE user_sessions 
    SET is_active = FALSE,
        ended_at = NOW(),
        logout_reason = 'EXPIRED'
    WHERE is_active = TRUE 
    AND expires_at < NOW();
    
    GET DIAGNOSTICS v_deleted_count = ROW_COUNT;
    
    -- Supprimer les anciennes sessions (plus de 90 jours)
    DELETE FROM user_sessions 
    WHERE ended_at IS NOT NULL 
    AND ended_at < NOW() - INTERVAL '90 days';
    
    RETURN v_deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour vérifier les limites de débit
CREATE OR REPLACE FUNCTION check_rate_limit(
    p_identifier VARCHAR,
    p_identifier_type VARCHAR,
    p_endpoint VARCHAR,
    p_limit_threshold INTEGER DEFAULT 60,
    p_time_window INTEGER DEFAULT 3600
)
RETURNS BOOLEAN AS $$
DECLARE
    v_current_count INTEGER;
    v_rate_limit_record RECORD;
    v_now TIMESTAMPTZ := NOW();
BEGIN
    -- Récupérer ou créer l'enregistrement de limitation
    SELECT * INTO v_rate_limit_record
    FROM rate_limiting 
    WHERE identifier = p_identifier 
    AND endpoint = p_endpoint;
    
    IF v_rate_limit_record IS NULL THEN
        -- Créer un nouvel enregistrement
        INSERT INTO rate_limiting (
            identifier, identifier_type, endpoint, 
            requests_count, time_window, limit_threshold,
            first_request, last_request
        ) VALUES (
            p_identifier, p_identifier_type, p_endpoint,
            1, p_time_window, p_limit_threshold,
            v_now, v_now
        );
        RETURN TRUE;
    END IF;
    
    -- Vérifier si nous sommes dans une nouvelle fenêtre de temps
    IF v_now > v_rate_limit_record.first_request + INTERVAL '1 second' * p_time_window THEN
        -- Réinitialiser le compteur pour une nouvelle fenêtre
        UPDATE rate_limiting 
        SET requests_count = 1,
            first_request = v_now,
            last_request = v_now,
            is_blocked = FALSE,
            blocked_until = NULL
        WHERE id = v_rate_limit_record.id;
        RETURN TRUE;
    END IF;
    
    -- Incrémenter le compteur
    v_current_count := v_rate_limit_record.requests_count + 1;
    
    -- Vérifier si la limite est dépassée
    IF v_current_count > p_limit_threshold THEN
        -- Bloquer l'accès
        UPDATE rate_limiting 
        SET requests_count = v_current_count,
            last_request = v_now,
            is_blocked = TRUE,
            blocked_until = v_rate_limit_record.first_request + INTERVAL '1 second' * p_time_window,
            block_reason = 'RATE_LIMIT_EXCEEDED'
        WHERE id = v_rate_limit_record.id;
        RETURN FALSE;
    ELSE
        -- Mettre à jour le compteur
        UPDATE rate_limiting 
        SET requests_count = v_current_count,
            last_request = v_now
        WHERE id = v_rate_limit_record.id;
        RETURN TRUE;
    END IF;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour générer un token MFA
CREATE OR REPLACE FUNCTION generate_mfa_token(
    p_user_id UUID,
    p_method mfa_method,
    p_purpose VARCHAR DEFAULT 'LOGIN',
    p_phone_number VARCHAR DEFAULT NULL,
    p_email VARCHAR DEFAULT NULL,
    p_validity_minutes INTEGER DEFAULT 5
)
RETURNS VARCHAR AS $$
DECLARE
    v_token VARCHAR;
    v_expires_at TIMESTAMPTZ;
BEGIN
    -- Générer un token aléatoire à 6 chiffres
    v_token := LPAD(FLOOR(RANDOM() * 1000000)::TEXT, 6, '0');
    v_expires_at := NOW() + INTERVAL '1 minute' * p_validity_minutes;
    
    -- Invalider les anciens tokens du même utilisateur pour le même purpose
    UPDATE mfa_tokens 
    SET is_used = TRUE, used_at = NOW()
    WHERE user_id = p_user_id 
    AND purpose = p_purpose 
    AND is_used = FALSE;
    
    -- Insérer le nouveau token
    INSERT INTO mfa_tokens (
        user_id, token, method, purpose,
        phone_number, email, expires_at,
        ip_address
    ) VALUES (
        p_user_id, v_token, p_method, p_purpose,
        p_phone_number, p_email, v_expires_at,
        COALESCE(inet_client_addr(), '127.0.0.1'::INET)
    );
    
    RETURN v_token;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour valider un token MFA
CREATE OR REPLACE FUNCTION validate_mfa_token(
    p_user_id UUID,
    p_token VARCHAR,
    p_purpose VARCHAR DEFAULT 'LOGIN'
)
RETURNS BOOLEAN AS $$
DECLARE
    v_token_record RECORD;
BEGIN
    -- Récupérer le token
    SELECT * INTO v_token_record
    FROM mfa_tokens 
    WHERE user_id = p_user_id 
    AND token = p_token 
    AND purpose = p_purpose 
    AND is_used = FALSE
    AND expires_at > NOW()
    ORDER BY created_at DESC
    LIMIT 1;
    
    IF v_token_record IS NULL THEN
        -- Token invalide ou expiré
        -- Incrémenter les tentatives si le token existe
        UPDATE mfa_tokens 
        SET attempts_count = attempts_count + 1
        WHERE user_id = p_user_id 
        AND token = p_token 
        AND purpose = p_purpose;
        
        RETURN FALSE;
    END IF;
    
    -- Marquer le token comme utilisé
    UPDATE mfa_tokens 
    SET is_used = TRUE, used_at = NOW()
    WHERE id = v_token_record.id;
    
    RETURN TRUE;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour détecter les anomalies de sécurité
CREATE OR REPLACE FUNCTION detect_security_anomaly(
    p_user_id UUID,
    p_ip_address INET,
    p_user_agent TEXT,
    p_action VARCHAR
)
RETURNS BOOLEAN AS $$
DECLARE
    v_anomaly_detected BOOLEAN := FALSE;
    v_recent_ips INTEGER;
    v_failed_attempts INTEGER;
    v_unusual_location BOOLEAN := FALSE;
BEGIN
    -- Vérifier les IPs multiples dans les dernières 24h
    SELECT COUNT(DISTINCT ip_address) 
    INTO v_recent_ips
    FROM login_attempts 
    WHERE user_id = p_user_id 
    AND created_at > NOW() - INTERVAL '24 hours'
    AND success = TRUE;
    
    IF v_recent_ips > 5 THEN
        v_anomaly_detected := TRUE;
    END IF;
    
    -- Vérifier les tentatives d'échec récentes
    SELECT COUNT(*) 
    INTO v_failed_attempts
    FROM login_attempts 
    WHERE user_id = p_user_id 
    AND created_at > NOW() - INTERVAL '1 hour'
    AND success = FALSE;
    
    IF v_failed_attempts > 10 THEN
        v_anomaly_detected := TRUE;
    END IF;
    
    -- Si anomalie détectée, créer un événement de sécurité
    IF v_anomaly_detected THEN
        INSERT INTO security_events (
            event_type, severity, title, description,
            source_ip, target_user_id, detection_method
        ) VALUES (
            'SUSPICIOUS_ACTIVITY', 'HIGH',
            'Activité suspecte détectée',
            format('Activité anormale pour l''utilisateur %s: IPs multiples=%s, échecs récents=%s', 
                   p_user_id, v_recent_ips, v_failed_attempts),
            p_ip_address, p_user_id, 'AUTOMATED_ANALYSIS'
        );
    END IF;
    
    RETURN v_anomaly_detected;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir un résumé de sécurité
CREATE OR REPLACE FUNCTION get_security_summary(
    p_user_id UUID DEFAULT NULL,
    p_hours INTEGER DEFAULT 24
)
RETURNS TABLE(
    metric VARCHAR,
    value BIGINT,
    severity VARCHAR
) AS $$
BEGIN
    RETURN QUERY
    WITH security_metrics AS (
        -- Sessions actives
        SELECT 'active_sessions'::VARCHAR as metric, 
               COUNT(*)::BIGINT as value,
               'MEDIUM'::VARCHAR as severity
        FROM user_sessions 
        WHERE is_active = TRUE
        AND (p_user_id IS NULL OR user_id = p_user_id)
        
        UNION ALL
        
        -- Tentatives de connexion échouées
        SELECT 'failed_logins'::VARCHAR, 
               COUNT(*)::BIGINT,
               CASE WHEN COUNT(*) > 100 THEN 'HIGH' ELSE 'LOW' END::VARCHAR
        FROM login_attempts 
        WHERE success = FALSE 
        AND created_at > NOW() - INTERVAL '1 hour' * p_hours
        AND (p_user_id IS NULL OR user_id = p_user_id)
        
        UNION ALL
        
        -- Événements de sécurité non résolus
        SELECT 'unresolved_security_events'::VARCHAR,
               COUNT(*)::BIGINT,
               CASE WHEN COUNT(*) > 10 THEN 'CRITICAL' ELSE 'MEDIUM' END::VARCHAR
        FROM security_events 
        WHERE is_resolved = FALSE
        AND created_at > NOW() - INTERVAL '1 hour' * p_hours
        AND (p_user_id IS NULL OR target_user_id = p_user_id)
        
        UNION ALL
        
        -- IPs bloquées par rate limiting
        SELECT 'blocked_ips'::VARCHAR,
               COUNT(DISTINCT identifier)::BIGINT,
               'MEDIUM'::VARCHAR
        FROM rate_limiting 
        WHERE is_blocked = TRUE
        AND identifier_type = 'IP'
    )
    SELECT sm.metric, sm.value, sm.severity FROM security_metrics sm;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. TRIGGERS
-- =====================================================

-- Triggers pour updated_at automatique
CREATE TRIGGER trigger_rate_limiting_updated_at
    BEFORE UPDATE ON rate_limiting
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_security_policies_updated_at
    BEFORE UPDATE ON security_policies
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Triggers d'audit pour tables sensibles (optionnel - peut être trop verbeux)
/*
CREATE TRIGGER trigger_users_audit
    AFTER INSERT OR UPDATE OR DELETE ON users
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();
    
CREATE TRIGGER trigger_tickets_audit
    AFTER INSERT OR UPDATE OR DELETE ON tickets
    FOR EACH ROW
    EXECUTE FUNCTION audit_trigger_function();
*/

-- Trigger pour détection automatique d'anomalies lors des connexions
CREATE OR REPLACE FUNCTION trigger_detect_login_anomaly()
RETURNS TRIGGER AS $$
BEGIN
    -- Détecter anomalies seulement pour les connexions réussies
    IF NEW.success = TRUE AND NEW.user_id IS NOT NULL THEN
        PERFORM detect_security_anomaly(
            NEW.user_id,
            NEW.ip_address,
            NEW.user_agent,
            'LOGIN'
        );
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_login_attempts_anomaly_detection
    AFTER INSERT ON login_attempts
    FOR EACH ROW
    EXECUTE FUNCTION trigger_detect_login_anomaly();

-- =====================================================
-- 8. VUES UTILES
-- =====================================================

-- Vue des sessions actives avec détails utilisateur
CREATE VIEW v_active_sessions AS
SELECT 
    us.id,
    us.user_id,
    u.first_name,
    u.last_name,
    u.email,
    us.ip_address,
    us.user_agent,
    us.is_mobile,
    us.last_activity,
    us.expires_at,
    us.created_at,
    EXTRACT(EPOCH FROM (NOW() - us.last_activity))::INTEGER as inactive_seconds,
    EXTRACT(EPOCH FROM (us.expires_at - NOW()))::INTEGER as expires_in_seconds,
    us.location
FROM user_sessions us
JOIN users u ON us.user_id = u.id
WHERE us.is_active = TRUE
ORDER BY us.last_activity DESC;

-- Vue des événements de sécurité récents
CREATE VIEW v_recent_security_events AS
SELECT 
    se.id,
    se.event_type,
    se.severity,
    se.title,
    se.description,
    se.source_ip,
    se.target_user_id,
    u.email as target_user_email,
    se.detection_method,
    se.auto_response,
    se.is_resolved,
    se.created_at,
    EXTRACT(EPOCH FROM (NOW() - se.created_at))::INTEGER as age_seconds
FROM security_events se
LEFT JOIN users u ON se.target_user_id = u.id
WHERE se.created_at > NOW() - INTERVAL '7 days'
ORDER BY se.created_at DESC;

-- Vue des tentatives de connexion suspectes
CREATE VIEW v_suspicious_login_attempts AS
SELECT 
    la.id,
    la.email,
    la.ip_address,
    la.user_agent,
    la.failure_reason,
    la.is_suspicious,
    la.geolocation,
    la.created_at,
    u.first_name,
    u.last_name,
    COUNT(*) OVER (PARTITION BY la.ip_address) as attempts_from_ip,
    COUNT(*) OVER (PARTITION BY la.email) as attempts_for_email
FROM login_attempts la
LEFT JOIN users u ON la.user_id = u.id
WHERE la.success = FALSE 
AND (la.is_suspicious = TRUE OR la.created_at > NOW() - INTERVAL '24 hours')
ORDER BY la.created_at DESC;

-- Vue des utilisateurs avec le plus d'activité d'audit
CREATE VIEW v_audit_activity_summary AS
SELECT 
    al.user_id,
    u.first_name,
    u.last_name,
    u.email,
    COUNT(*) as total_actions,
    COUNT(*) FILTER (WHERE al.action = 'LOGIN') as login_count,
    COUNT(*) FILTER (WHERE al.action = 'CREATE') as create_count,
    COUNT(*) FILTER (WHERE al.action = 'UPDATE') as update_count,
    COUNT(*) FILTER (WHERE al.action = 'DELETE') as delete_count,
    COUNT(*) FILTER (WHERE al.severity = 'HIGH') as high_severity_count,
    MAX(al.created_at) as last_activity
FROM audit_logs al
JOIN users u ON al.user_id = u.id
WHERE al.created_at > NOW() - INTERVAL '30 days'
GROUP BY al.user_id, u.first_name, u.last_name, u.email
ORDER BY total_actions DESC;

-- Vue des métriques de rate limiting
CREATE VIEW v_rate_limiting_stats AS
SELECT 
    rl.endpoint,
    rl.identifier_type,
    COUNT(*) as total_identifiers,
    COUNT(*) FILTER (WHERE rl.is_blocked = TRUE) as blocked_count,
    AVG(rl.requests_count) as avg_requests,
    MAX(rl.requests_count) as max_requests,
    COUNT(*) FILTER (WHERE rl.last_request > NOW() - INTERVAL '1 hour') as active_last_hour
FROM rate_limiting rl
GROUP BY rl.endpoint, rl.identifier_type
ORDER BY blocked_count DESC, avg_requests DESC;

-- =====================================================
-- 9. DONNÉES D'INITIALISATION
-- =====================================================

-- Politiques de sécurité par défaut
INSERT INTO security_policies (id, policy_name, policy_type, target_role, configuration, description, is_active) VALUES
(
    '550e8400-e29b-41d4-a716-446655440001',
    'DEFAULT_PASSWORD_POLICY',
    'AUTHENTICATION',
    'USER',
    '{"min_length": 8, "require_uppercase": true, "require_lowercase": true, "require_numbers": true, "require_symbols": false, "max_age_days": 90, "prevent_reuse_count": 5}',
    'Politique de mot de passe par défaut pour tous les utilisateurs',
    TRUE
),
(
    '550e8400-e29b-41d4-a716-446655440002',
    'ADMIN_PASSWORD_POLICY', 
    'AUTHENTICATION',
    'ADMIN',
    '{"min_length": 12, "require_uppercase": true, "require_lowercase": true, "require_numbers": true, "require_symbols": true, "max_age_days": 60, "prevent_reuse_count": 10, "mfa_required": true}',
    'Politique de mot de passe renforcée pour les administrateurs',
    TRUE
),
(
    '550e8400-e29b-41d4-a716-446655440003',
    'SESSION_TIMEOUT_POLICY',
    'AUTHENTICATION', 
    'ALL',
    '{"idle_timeout_minutes": 30, "absolute_timeout_hours": 8, "concurrent_sessions_limit": 3, "remember_me_days": 30}',
    'Politique de gestion des sessions utilisateur',
    TRUE
),
(
    '550e8400-e29b-41d4-a716-446655440004',
    'AUDIT_RETENTION_POLICY',
    'AUDIT',
    'ALL', 
    '{"retention_days": 365, "high_severity_retention_days": 2555, "archive_after_days": 90, "compress_after_days": 30}',
    'Politique de rétention des logs d\'audit',
    TRUE
);

-- =====================================================
-- 10. COMMENTAIRES SUR LES TABLES
-- =====================================================

COMMENT ON TABLE audit_logs IS 'Journal central d''audit de toutes les actions du système';
COMMENT ON TABLE user_sessions IS 'Sessions utilisateurs actives avec gestion sécurisée';
COMMENT ON TABLE login_attempts IS 'Tentatives de connexion avec détection d''anomalies';
COMMENT ON TABLE security_events IS 'Événements de sécurité et incidents détectés';
COMMENT ON TABLE mfa_tokens IS 'Tokens d''authentification multi-facteurs';
COMMENT ON TABLE rate_limiting IS 'Limitation de débit par IP/utilisateur/endpoint';
COMMENT ON TABLE security_policies IS 'Politiques de sécurité configurables';

-- Commentaires sur les colonnes importantes
COMMENT ON COLUMN audit_logs.old_values IS 'Valeurs avant modification (JSON)';
COMMENT ON COLUMN audit_logs.new_values IS 'Nouvelles valeurs après modification (JSON)';
COMMENT ON COLUMN user_sessions.device_fingerprint IS 'Empreinte unique de l''appareil';
COMMENT ON COLUMN security_events.evidence IS 'Preuves et données contextuelles de l''incident';
COMMENT ON COLUMN mfa_tokens.attempts_count IS 'Nombre de tentatives d''utilisation du token';

-- =====================================================
-- 11. CONFIGURATION SÉCURITÉ ROW LEVEL
-- =====================================================

-- Activer RLS sur les tables sensibles
ALTER TABLE audit_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE mfa_tokens ENABLE ROW LEVEL SECURITY;

-- Politique pour audit_logs - utilisateurs ne voient que leurs propres logs
CREATE POLICY audit_logs_user_policy ON audit_logs
    FOR SELECT
    USING (user_id = current_setting('app.current_user_id')::UUID);

-- Politique pour sessions - utilisateurs ne voient que leurs sessions
CREATE POLICY user_sessions_user_policy ON user_sessions
    FOR ALL
    USING (user_id = current_setting('app.current_user_id')::UUID);

-- Politique pour tokens MFA - utilisateurs ne voient que leurs tokens
CREATE POLICY mfa_tokens_user_policy ON mfa_tokens
    FOR ALL
    USING (user_id = current_setting('app.current_user_id')::UUID);

-- Politique pour staff - accès complet en lecture
CREATE POLICY staff_audit_read_policy ON audit_logs
    FOR SELECT
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = current_setting('app.current_user_id')::UUID
            AND r.code IN ('STAFF', 'ADMIN', 'SECURITY')
            AND ur.status = 'ACTIVE'
        )
    );

-- Politique pour gestionnaires de sécurité
CREATE POLICY security_staff_policy ON security_events
    FOR ALL
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = current_setting('app.current_user_id')::UUID
            AND r.code IN ('ADMIN', 'SECURITY')
            AND ur.status = 'ACTIVE'
        )
    );

-- =====================================================
-- 12. GRANTS ET SÉCURITÉ
-- =====================================================

-- Création des rôles applicatifs (exemple)
/*
-- Rôle pour l'authentification
CREATE ROLE entrix_auth_role;
GRANT SELECT, INSERT, UPDATE ON user_sessions, login_attempts, mfa_tokens TO entrix_auth_role;
GRANT INSERT ON audit_logs, security_events TO entrix_auth_role;
GRANT ALL PRIVILEGES ON rate_limiting TO entrix_auth_role;

-- Rôle pour la sécurité
CREATE ROLE entrix_security_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO entrix_security_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO entrix_security_role;

-- Rôle pour l'audit (lecture seule)
CREATE ROLE entrix_audit_role;
GRANT SELECT ON audit_logs, security_events, login_attempts TO entrix_audit_role;
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
    'audit_logs', 'user_sessions', 'login_attempts', 'security_events',
    'mfa_tokens', 'rate_limiting', 'security_policies'
)
ORDER BY tablename;

-- Vérification des énumérations
SELECT 
    t.typname as enum_name,
    array_agg(e.enumlabel ORDER BY e.enumsortorder) as values
FROM pg_type t 
JOIN pg_enum e ON t.oid = e.enumtypid 
WHERE t.typname IN ('audit_action', 'security_level', 'mfa_method')
GROUP BY t.typname
ORDER BY t.typname;

-- Vérification des fonctions principales
SELECT 
    proname as function_name,
    pronargs as argument_count
FROM pg_proc 
WHERE proname IN (
    'cleanup_expired_sessions', 'check_rate_limit', 'generate_mfa_token',
    'validate_mfa_token', 'detect_security_anomaly', 'get_security_summary'
)
ORDER BY proname;

-- Messages de fin
SELECT 'Script SQL Module Sécurité & Audit exécuté avec succès!' AS status;
SELECT 'Tables créées: 7 tables principales pour sécurité complète' AS tables_info;
SELECT 'Énumérations créées: 3 types pour classification sécuritaire' AS enums_info;
SELECT 'Fonctions créées: 8 fonctions pour logique sécurité temps réel' AS functions_info;
SELECT 'Vues créées: 5 vues pour monitoring et rapports sécurité' AS views_info;
SELECT 'Sécurité: RLS activé + politiques granulaires par rôle' AS security_info;