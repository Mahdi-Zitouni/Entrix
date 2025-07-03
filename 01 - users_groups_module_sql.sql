-- =====================================================
-- SCRIPT SQL POSTGRESQL - UTILISATEURS/ROLES/GROUPES
-- Plateforme Entrix - Système de Gestion des Utilisateurs
-- Version: 1.0
-- Date: Juin 2025
-- =====================================================

-- =====================================================
-- 1. SUPPRESSION DES OBJETS EXISTANTS (Ordre inverse)
-- =====================================================

-- Suppression des tables de liaison
DROP TABLE IF EXISTS user_groups CASCADE;
DROP TABLE IF EXISTS user_roles CASCADE;

-- Suppression des tables principales
DROP TABLE IF EXISTS user_profiles CASCADE;
DROP TABLE IF EXISTS users CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS roles CASCADE;

-- Suppression des énumérations
DROP TYPE IF EXISTS membership_status CASCADE;
DROP TYPE IF EXISTS group_type CASCADE;
DROP TYPE IF EXISTS gender CASCADE;

-- Suppression des fonctions et triggers
DROP FUNCTION IF EXISTS update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS validate_user_role_hierarchy() CASCADE;
DROP FUNCTION IF EXISTS cleanup_expired_memberships() CASCADE;

-- =====================================================
-- 2. CRÉATION DES ÉNUMÉRATIONS
-- =====================================================

-- Énumération pour le genre
CREATE TYPE gender AS ENUM (
    'MALE',     -- Masculin
    'FEMALE',   -- Féminin
    'OTHER'     -- Autre/Non spécifié
);

-- Énumération pour le type de groupe
CREATE TYPE group_type AS ENUM (
    'ACCESS',    -- Groupe de droits d'accès uniquement
    'MARKETING', -- Groupe de segmentation marketing uniquement
    'MIXED'      -- Groupe mixte (accès + marketing)
);

-- Énumération pour le statut d'appartenance
CREATE TYPE membership_status AS ENUM (
    'ACTIVE',    -- Appartenance active
    'SUSPENDED', -- Suspendue temporairement  
    'EXPIRED',   -- Expirée (dépassement date limite)
    'CANCELLED'  -- Annulée définitivement
);

-- =====================================================
-- 3. CRÉATION DES TABLES PRINCIPALES
-- =====================================================

-- Table des utilisateurs (identité et authentification)
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) NOT NULL UNIQUE,
    phone VARCHAR(20),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    avatar TEXT,
    password VARCHAR(255) NOT NULL,
    
    -- Statut
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    email_verified TIMESTAMPTZ,
    phone_verified TIMESTAMPTZ,
    
    -- Audit
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    last_login TIMESTAMPTZ
);

-- Table des profils utilisateurs (informations étendues)
CREATE TABLE user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE,
    
    -- Démographie
    date_of_birth DATE,
    gender gender,
    cin VARCHAR(8) UNIQUE,
    address TEXT,
    city VARCHAR(100),
    country VARCHAR(2) NOT NULL DEFAULT 'TN',
    
    -- Préférences
    language VARCHAR(5) NOT NULL DEFAULT 'fr',
    notifications BOOLEAN NOT NULL DEFAULT TRUE,
    newsletter BOOLEAN NOT NULL DEFAULT FALSE,
    
    -- Supporter spécifique
    supporter_since DATE,
    favorite_player VARCHAR(100),
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contrainte de clé étrangère
    CONSTRAINT fk_user_profiles_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

-- Table des rôles (catégories générales)
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(50) NOT NULL UNIQUE,
    name VARCHAR(100) NOT NULL,
    description TEXT,
    level INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table des groupes (droits spécifiques et segmentation)
CREATE TABLE groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    code VARCHAR(100) NOT NULL UNIQUE,
    name VARCHAR(200) NOT NULL,
    description TEXT,
    type group_type NOT NULL,
    
    -- Validité temporelle
    valid_from TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    
    -- Configuration
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    max_members INTEGER,
    
    -- Métadonnées (JSON)
    metadata JSONB,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Table de liaison utilisateur-rôle
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role_id UUID NOT NULL,
    
    -- Validité
    assigned_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    status membership_status NOT NULL DEFAULT 'ACTIVE',
    
    -- Métadonnées
    assigned_by UUID,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT fk_user_roles_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role_id 
        FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_assigned_by 
        FOREIGN KEY (assigned_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uk_user_roles_user_role 
        UNIQUE (user_id, role_id)
);

-- Table de liaison utilisateur-groupe
CREATE TABLE user_groups (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    group_id UUID NOT NULL,
    
    -- Validité
    joined_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    valid_until TIMESTAMPTZ,
    status membership_status NOT NULL DEFAULT 'ACTIVE',
    
    -- Métadonnées spécifiques à l'appartenance
    metadata JSONB,
    added_by UUID,
    notes TEXT,
    
    -- Timestamps
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    -- Contraintes
    CONSTRAINT fk_user_groups_user_id 
        FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_groups_group_id 
        FOREIGN KEY (group_id) REFERENCES groups(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_groups_added_by 
        FOREIGN KEY (added_by) REFERENCES users(id) ON DELETE SET NULL,
    CONSTRAINT uk_user_groups_user_group 
        UNIQUE (user_id, group_id)
);

-- =====================================================
-- 4. INDEX POUR PERFORMANCES
-- =====================================================

-- Index sur les tables principales
CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_phone ON users(phone);
CREATE INDEX idx_users_active ON users(is_active);
CREATE INDEX idx_users_last_login ON users(last_login);

CREATE INDEX idx_user_profiles_user_id ON user_profiles(user_id);
CREATE INDEX idx_user_profiles_city ON user_profiles(city);
CREATE INDEX idx_user_profiles_supporter_since ON user_profiles(supporter_since);

CREATE INDEX idx_roles_code ON roles(code);
CREATE INDEX idx_roles_level ON roles(level);
CREATE INDEX idx_roles_active ON roles(is_active);

CREATE INDEX idx_groups_code ON groups(code);
CREATE INDEX idx_groups_type ON groups(type);
CREATE INDEX idx_groups_active ON groups(is_active);
CREATE INDEX idx_groups_valid_dates ON groups(valid_from, valid_until);

-- Index sur les tables de liaison
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_role_id ON user_roles(role_id);
CREATE INDEX idx_user_roles_status ON user_roles(status);
CREATE INDEX idx_user_roles_valid_until ON user_roles(valid_until);

CREATE INDEX idx_user_groups_user_id ON user_groups(user_id);
CREATE INDEX idx_user_groups_group_id ON user_groups(group_id);
CREATE INDEX idx_user_groups_status ON user_groups(status);
CREATE INDEX idx_user_groups_valid_until ON user_groups(valid_until);

-- Index composites pour requêtes optimisées
CREATE INDEX idx_user_roles_user_status_active ON user_roles(user_id, status) 
    WHERE status = 'ACTIVE';
CREATE INDEX idx_user_groups_user_status_active ON user_groups(user_id, status) 
    WHERE status = 'ACTIVE';

-- =====================================================
-- 5. CONTRAINTES MÉTIER
-- =====================================================

-- Contraintes sur les utilisateurs
ALTER TABLE users ADD CONSTRAINT chk_users_email_format 
    CHECK (email ~* '^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$');

ALTER TABLE users ADD CONSTRAINT chk_users_phone_format 
    CHECK (phone IS NULL OR phone ~* '^\+?[0-9\s\-\.]{8,20}$');

-- Contraintes sur les rôles
ALTER TABLE roles ADD CONSTRAINT chk_roles_level_range 
    CHECK (level >= 0 AND level <= 100);

-- Contraintes sur les groupes
ALTER TABLE groups ADD CONSTRAINT chk_groups_max_members 
    CHECK (max_members IS NULL OR max_members > 0);

ALTER TABLE groups ADD CONSTRAINT chk_groups_valid_dates 
    CHECK (valid_until IS NULL OR valid_until > valid_from);

-- Contraintes sur les liaisons
ALTER TABLE user_roles ADD CONSTRAINT chk_user_roles_valid_dates 
    CHECK (valid_until IS NULL OR valid_until > assigned_at);

ALTER TABLE user_groups ADD CONSTRAINT chk_user_groups_valid_dates 
    CHECK (valid_until IS NULL OR valid_until > joined_at);

-- Contraintes sur les profils utilisateurs
ALTER TABLE user_profiles ADD CONSTRAINT chk_user_profiles_cin_format 
    CHECK (cin IS NULL OR cin ~ '^[0-9]{8}$');

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

-- Fonction pour valider la hiérarchie des rôles
CREATE OR REPLACE FUNCTION validate_user_role_hierarchy()
RETURNS TRIGGER AS $$
DECLARE
    v_current_max_level INTEGER;
    v_new_level INTEGER;
BEGIN
    -- Récupérer le niveau maximum actuel de l'utilisateur
    SELECT COALESCE(MAX(r.level), -1) 
    INTO v_current_max_level
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = NEW.user_id 
    AND ur.status = 'ACTIVE'
    AND ur.id != COALESCE(NEW.id, gen_random_uuid());
    
    -- Récupérer le niveau du nouveau rôle
    SELECT level INTO v_new_level
    FROM roles WHERE id = NEW.role_id;
    
    -- Autoriser seulement si le nouveau niveau est cohérent
    IF v_new_level < v_current_max_level THEN
        RAISE EXCEPTION 'Cannot assign role with level % when user already has level %', 
            v_new_level, v_current_max_level;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour nettoyer les appartenances expirées
CREATE OR REPLACE FUNCTION cleanup_expired_memberships()
RETURNS INTEGER AS $$
DECLARE
    v_cleaned_count INTEGER := 0;
BEGIN
    -- Marquer comme EXPIRED les rôles et groupes expirés
    UPDATE user_roles 
    SET status = 'EXPIRED'
    WHERE status = 'ACTIVE' 
    AND valid_until IS NOT NULL 
    AND valid_until < NOW();
    
    GET DIAGNOSTICS v_cleaned_count = ROW_COUNT;
    
    UPDATE user_groups 
    SET status = 'EXPIRED'
    WHERE status = 'ACTIVE' 
    AND valid_until IS NOT NULL 
    AND valid_until < NOW();
    
    GET DIAGNOSTICS v_cleaned_count = v_cleaned_count + ROW_COUNT;
    
    RETURN v_cleaned_count;
END;
$$ LANGUAGE plpgsql;

-- Fonction pour obtenir le rôle principal d'un utilisateur
CREATE OR REPLACE FUNCTION get_user_primary_role(p_user_id UUID)
RETURNS TABLE(role_code VARCHAR, role_name VARCHAR, role_level INTEGER) AS $$
BEGIN
    RETURN QUERY
    SELECT r.code, r.name, r.level
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = p_user_id 
    AND ur.status = 'ACTIVE'
    AND (ur.valid_until IS NULL OR ur.valid_until > NOW())
    ORDER BY r.level DESC
    LIMIT 1;
END;
$$ LANGUAGE plpgsql;

-- Fonction de nettoyage quotidien
CREATE OR REPLACE FUNCTION daily_cleanup()
RETURNS TEXT AS $$
DECLARE
    v_result TEXT;
    v_cleaned INTEGER;
BEGIN
    -- Nettoyer les appartenances expirées
    SELECT cleanup_expired_memberships() INTO v_cleaned;
    
    -- Retourner le résumé
    v_result := format('Daily cleanup completed: %s expired memberships processed', v_cleaned);
    
    RETURN v_result;
END;
$$ LANGUAGE plpgsql;

-- =====================================================
-- 7. TRIGGERS
-- =====================================================

-- Triggers pour updated_at automatique
CREATE TRIGGER trigger_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_user_profiles_updated_at
    BEFORE UPDATE ON user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_roles_updated_at
    BEFORE UPDATE ON roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_groups_updated_at
    BEFORE UPDATE ON groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_user_roles_updated_at
    BEFORE UPDATE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER trigger_user_groups_updated_at
    BEFORE UPDATE ON user_groups
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Trigger pour validation hiérarchie des rôles
CREATE TRIGGER trigger_user_roles_hierarchy_validation
    BEFORE INSERT OR UPDATE ON user_roles
    FOR EACH ROW
    EXECUTE FUNCTION validate_user_role_hierarchy();

-- =====================================================
-- 8. VUES UTILES
-- =====================================================

-- Vue des utilisateurs avec leur rôle principal
CREATE VIEW v_users_with_primary_role AS
SELECT 
    u.id,
    u.email,
    u.first_name,
    u.last_name,
    u.is_active,
    u.created_at,
    u.last_login,
    pr.role_code as primary_role_code,
    pr.role_name as primary_role_name,
    pr.role_level as primary_role_level
FROM users u
LEFT JOIN LATERAL get_user_primary_role(u.id) pr ON true;

-- Vue des groupes avec le nombre de membres
CREATE VIEW v_groups_with_member_count AS
SELECT 
    g.id,
    g.code,
    g.name,
    g.type,
    g.is_active,
    g.max_members,
    g.valid_from,
    g.valid_until,
    COUNT(ug.user_id) FILTER (WHERE ug.status = 'ACTIVE') as active_members_count,
    COUNT(ug.user_id) as total_members_count,
    CASE 
        WHEN g.max_members IS NOT NULL THEN 
            (COUNT(ug.user_id) FILTER (WHERE ug.status = 'ACTIVE')::FLOAT / g.max_members * 100)
        ELSE NULL 
    END as occupancy_percentage
FROM groups g
LEFT JOIN user_groups ug ON g.id = ug.group_id
GROUP BY g.id, g.code, g.name, g.type, g.is_active, g.max_members, g.valid_from, g.valid_until;

-- Vue des appartenances actives
CREATE VIEW v_active_memberships AS
SELECT 
    u.id as user_id,
    u.email,
    u.first_name,
    u.last_name,
    'ROLE' as membership_type,
    r.code as membership_code,
    r.name as membership_name,
    r.level as priority_level,
    ur.assigned_at as joined_at,
    ur.valid_until,
    ur.status
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE ur.status = 'ACTIVE'
AND (ur.valid_until IS NULL OR ur.valid_until > NOW())

UNION ALL

SELECT 
    u.id as user_id,
    u.email,
    u.first_name,
    u.last_name,
    'GROUP' as membership_type,
    g.code as membership_code,
    g.name as membership_name,
    0 as priority_level,
    ug.joined_at,
    ug.valid_until,
    ug.status
FROM users u
JOIN user_groups ug ON u.id = ug.user_id
JOIN groups g ON ug.group_id = g.id
WHERE ug.status = 'ACTIVE'
AND (ug.valid_until IS NULL OR ug.valid_until > NOW())

ORDER BY user_id, priority_level DESC, joined_at;

-- =====================================================
-- 9. DONNÉES D'INITIALISATION
-- =====================================================

-- Insertion des rôles standards
INSERT INTO roles (id, code, name, description, level, is_active) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'USER', 'Utilisateur Standard', 'Accès de base à la billetterie publique', 0, TRUE),
('550e8400-e29b-41d4-a716-446655440002', 'BADGE_CHECKER', 'Contrôleur de Badge', 'Accès contrôle des badges et vérification d''identité', 30, TRUE),
('550e8400-e29b-41d4-a716-446655440003', 'ADMIN', 'Administrateur', 'Gestion avancée de la plateforme et des utilisateurs', 50, TRUE),
('550e8400-e29b-41d4-a716-446655440004', 'SUPERADMIN', 'Super Administrateur', 'Accès complet à toutes les fonctionnalités et configurations système', 100, TRUE);

-- Insertion des groupes d'accès standards
INSERT INTO groups (id, code, name, description, type, valid_from, valid_until, max_members, metadata) VALUES
-- Groupes d'accès saisonniers
('660e8400-e29b-41d4-a716-446655440001', 'TRIBUNES_2025', 'Abonnés Tribunes Saison 2025', 'Accès à tous les matchs domicile en tribune principale', 'ACCESS', '2024-09-01', '2025-05-31', 8800, '{"zones": ["tribune_principale"], "services": ["parking_standard"], "season": "2024-2025"}'),

('660e8400-e29b-41d4-a716-446655440002', 'VIP_LOGES_2025', 'Loges VIP Saison 2025', 'Accès loges VIP avec services premium', 'ACCESS', '2024-09-01', '2025-05-31', 200, '{"zones": ["loges_vip", "salon_vip"], "services": ["parking_vip", "cocktail", "restauration"], "amenities": ["climatisation", "wifi_premium"]}'),

-- Groupes staff
('660e8400-e29b-41d4-a716-446655440003', 'STAFF_SECURITY', 'Équipe Sécurité', 'Personnel de sécurité du stade', 'ACCESS', NOW(), NULL, 50, '{"clearanceLevel": "high", "zones": ["all"], "equipment": ["radio", "badge"]}'),

('660e8400-e29b-41d4-a716-446655440004', 'ACCESS_CONTROLLERS', 'Contrôleurs d''Accès', 'Personnel contrôle des entrées', 'ACCESS', NOW(), NULL, 20, '{"zones": ["entry_points"], "equipment": ["scanner", "tablet"]}'),

-- Groupes marketing
('660e8400-e29b-41d4-a716-446655440005', 'SUPPORTERS_ANCIENS', 'Supporters Historiques', 'Supporters du club depuis plus de 10 ans', 'MARKETING', '2024-01-01', NULL, NULL, '{"minYearsSupport": 10, "benefits": ["discount_15_percent", "priority_tickets"], "communications": ["newsletter_exclusive", "invitations_events"]}'),

('660e8400-e29b-41d4-a716-446655440006', 'FAMILLES_ENFANTS', 'Familles avec Enfants', 'Familles avec enfants de moins de 12 ans', 'MARKETING', NOW(), NULL, NULL, '{"targetAge": "under_12", "benefits": ["child_discount", "family_activities"], "communications": ["family_newsletter"]}'),

('660e8400-e29b-41d4-a716-446655440007', 'CORPORATE_CLIENTS', 'Clients Corporate', 'Clients entreprises et partenaires', 'MARKETING', NOW(), NULL, NULL, '{"clientType": "business", "benefits": ["bulk_discounts", "custom_packages"], "communications": ["business_updates", "networking_events"]}');

-- =====================================================
-- 10. COMMENTAIRES SUR LES TABLES
-- =====================================================

COMMENT ON TABLE users IS 'Table centrale des utilisateurs avec authentification et informations de base';
COMMENT ON TABLE user_profiles IS 'Profils étendus des utilisateurs avec démographie et préférences';
COMMENT ON TABLE roles IS 'Rôles généraux définissant les niveaux d''accès globaux';
COMMENT ON TABLE groups IS 'Groupes spécifiques pour droits granulaires et segmentation marketing';
COMMENT ON TABLE user_roles IS 'Liaison utilisateur-rôle avec gestion temporelle';
COMMENT ON TABLE user_groups IS 'Liaison utilisateur-groupe avec métadonnées spécifiques';

-- Commentaires sur les colonnes importantes
COMMENT ON COLUMN users.id IS 'Identifiant unique UUID pour toutes les foreign keys';
COMMENT ON COLUMN users.password IS 'Mot de passe hashé avec bcrypt (coût 12 minimum)';
COMMENT ON COLUMN roles.level IS 'Niveau hiérarchique du rôle (0-100, plus élevé = plus de droits)';
COMMENT ON COLUMN groups.metadata IS 'Configuration JSON flexible pour droits et paramètres spécifiques';
COMMENT ON COLUMN user_groups.metadata IS 'Données spécifiques à l''appartenance (place assignée, etc.)';

-- =====================================================
-- 11. CONFIGURATION SÉCURITÉ ROW LEVEL
-- =====================================================

-- Activer RLS sur les tables sensibles
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_groups ENABLE ROW LEVEL SECURITY;

-- Politique pour utilisateurs - accès à son propre profil
CREATE POLICY users_own_data_policy ON users
    FOR ALL
    USING (id = current_setting('app.current_user_id')::UUID);

-- Politique pour profils - accès à son propre profil
CREATE POLICY user_profiles_own_data_policy ON user_profiles
    FOR ALL
    USING (user_id = current_setting('app.current_user_id')::UUID);

-- Politique pour rôles - lecture seule pour tous, modification pour staff
CREATE POLICY user_roles_read_policy ON user_roles
    FOR SELECT
    USING (TRUE);

CREATE POLICY user_roles_modify_policy ON user_roles
    FOR INSERT, UPDATE, DELETE
    USING (
        EXISTS (
            SELECT 1 FROM user_roles ur 
            JOIN roles r ON ur.role_id = r.id
            WHERE ur.user_id = current_setting('app.current_user_id')::UUID
            AND r.code IN ('STAFF', 'ADMIN')
            AND ur.status = 'ACTIVE'
        )
    );

-- Politique similaire pour groupes
CREATE POLICY user_groups_read_policy ON user_groups
    FOR SELECT
    USING (TRUE);

CREATE POLICY user_groups_modify_policy ON user_groups
    FOR INSERT, UPDATE, DELETE
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
-- 12. GRANTS ET SÉCURITÉ
-- =====================================================

-- Exemple de grants pour différents rôles applicatifs
-- (À adapter selon votre architecture de sécurité)

/*
-- Rôle pour l'application web
CREATE ROLE entrix_app_role;
GRANT SELECT, INSERT, UPDATE ON users, user_profiles, user_roles, user_groups TO entrix_app_role;
GRANT SELECT ON roles, groups TO entrix_app_role;

-- Rôle pour les rapports (lecture seule)
CREATE ROLE entrix_readonly_role;
GRANT SELECT ON ALL TABLES IN SCHEMA public TO entrix_readonly_role;

-- Rôle pour les tâches de maintenance
CREATE ROLE entrix_maintenance_role;
GRANT ALL PRIVILEGES ON ALL TABLES IN SCHEMA public TO entrix_maintenance_role;
GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO entrix_maintenance_role;
*/

-- =====================================================
-- SCRIPT TERMINÉ AVEC SUCCÈS
-- =====================================================

-- Vérification finale - Affichage des tables créées
SELECT 
    table_name,
    table_type
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name IN ('users', 'user_profiles', 'roles', 'groups', 'user_roles', 'user_groups')
ORDER BY table_name;

-- Affichage des énumérations créées
SELECT 
    enumtypid::regtype AS enum_name,
    enumlabel AS enum_value
FROM pg_enum
WHERE enumtypid::regtype::text IN ('gender', 'group_type', 'membership_status')
ORDER BY enum_name, enumsortorder;

-- Message de fin
SELECT 'Script SQL PostgreSQL exécuté avec succès!' AS status;
SELECT 'Tables créées: users, user_profiles, roles, groups, user_roles, user_groups' AS tables_created;
SELECT 'Énumérations créées: gender, group_type, membership_status' AS enums_created;
SELECT 'Fonctions créées: update_updated_at_column, validate_user_role_hierarchy, cleanup_expired_memberships, get_user_primary_role, daily_cleanup' AS functions_created;
SELECT 'Vues créées: v_users_with_primary_role, v_groups_with_member_count, v_active_memberships' AS views_created;