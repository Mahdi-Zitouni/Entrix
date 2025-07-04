import { MigrationInterface, QueryRunner } from "typeorm";

export class AddVenueServiceAndCIN1751459419106 implements MigrationInterface {
    name = 'AddVenueServiceAndCIN1751459419106'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "venues" RENAME COLUMN "globalAmenities" TO "globalServices"`);
        await queryRunner.query(`CREATE TABLE "venue_services" ("id" character varying(255) NOT NULL, "name" character varying NOT NULL, "description" character varying, "category" character varying NOT NULL, "isIncludedInPrice" boolean NOT NULL DEFAULT false, "additionalCost" numeric, "capacity" integer, "operatingHours" jsonb, "isActive" boolean NOT NULL DEFAULT true, "metadata" jsonb, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "venueId" character varying(255), "zoneId" character varying(255), CONSTRAINT "PK_e08e1c489bda9dff4eed304ba67" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "zone_mapping_overrides" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "originalZoneId" character varying NOT NULL, "overrideZoneId" character varying NOT NULL, "metadata" jsonb, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "subscription_plan_id" uuid NOT NULL, "event_id" uuid NOT NULL, CONSTRAINT "PK_d8c96d3dd9959925566c1f20ef1" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_fc938a9104f14898b73298e43a" ON "zone_mapping_overrides" ("event_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_882f303ce24c1ea772880288f0" ON "zone_mapping_overrides" ("subscription_plan_id") `);
        await queryRunner.query(`CREATE TYPE "public"."ticket_templates_templatetype_enum" AS ENUM('TICKET', 'SUBSCRIPTION', 'INVITATION', 'PASS', 'RECEIPT')`);
        await queryRunner.query(`CREATE TYPE "public"."ticket_templates_templateformat_enum" AS ENUM('PDF', 'HTML', 'PNG', 'THERMAL')`);
        await queryRunner.query(`CREATE TYPE "public"."ticket_templates_orientation_enum" AS ENUM('PORTRAIT', 'LANDSCAPE')`);
        await queryRunner.query(`CREATE TABLE "ticket_templates" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "templateType" "public"."ticket_templates_templatetype_enum" NOT NULL, "templateFormat" "public"."ticket_templates_templateformat_enum" NOT NULL, "orientation" "public"."ticket_templates_orientation_enum" NOT NULL, "name" character varying NOT NULL, "description" character varying, "templateContent" text NOT NULL, "isActive" boolean NOT NULL DEFAULT true, "metadata" jsonb, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), CONSTRAINT "UQ_f43c4f09a95a8f19981b0165e5c" UNIQUE ("templateType", "name"), CONSTRAINT "PK_67fabea948b9172a185bba6d4ea" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_f33764572a2d3612ef35cce6b2" ON "ticket_templates" ("templateContent") `);
        await queryRunner.query(`CREATE INDEX "IDX_76d927c35c91455ced3de26ab1" ON "ticket_templates" ("isActive") `);
        await queryRunner.query(`CREATE INDEX "IDX_4563ca7d0f4a791bafada104df" ON "ticket_templates" ("templateFormat") `);
        await queryRunner.query(`CREATE INDEX "IDX_c256c0947bcd0217c9a3733ff0" ON "ticket_templates" ("templateType") `);
        await queryRunner.query(`CREATE TYPE "public"."pricing_rules_ruletype_enum" AS ENUM('PERCENTAGE', 'FIXED_AMOUNT', 'BULK_DISCOUNT', 'EARLY_BIRD', 'LOYALTY', 'GROUP', 'PROMOTIONAL')`);
        await queryRunner.query(`CREATE TABLE "pricing_rules" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "code" character varying NOT NULL, "ruleType" "public"."pricing_rules_ruletype_enum" NOT NULL, "value" numeric, "promoCode" character varying, "isActive" boolean NOT NULL DEFAULT true, "validFrom" TIMESTAMP WITH TIME ZONE, "validUntil" TIMESTAMP WITH TIME ZONE, "metadata" jsonb, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "event_id" uuid, "ticket_type_id" uuid, CONSTRAINT "UQ_efc279e7b5467d404fc49c88246" UNIQUE ("code"), CONSTRAINT "PK_fda27bb8db4630894decda61ff6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_ad150e6ea5db4d7649bc6e6554" ON "pricing_rules" ("promoCode") `);
        await queryRunner.query(`CREATE INDEX "IDX_fba7f02465771485ac181fd396" ON "pricing_rules" ("validFrom", "validUntil") `);
        await queryRunner.query(`CREATE INDEX "IDX_d990f3040ab6a7803d7807f7cd" ON "pricing_rules" ("isActive") `);
        await queryRunner.query(`CREATE INDEX "IDX_d5744de34336feec9ce8547167" ON "pricing_rules" ("ruleType") `);
        await queryRunner.query(`CREATE INDEX "IDX_efc279e7b5467d404fc49c8824" ON "pricing_rules" ("code") `);
        await queryRunner.query(`CREATE TYPE "public"."blacklist_blacklisttype_enum" AS ENUM('USER', 'EMAIL', 'PHONE', 'IP', 'DEVICE', 'CARD')`);
        await queryRunner.query(`CREATE TYPE "public"."blacklist_scope_enum" AS ENUM('EVENT', 'VENUE', 'CLUB', 'GLOBAL')`);
        await queryRunner.query(`CREATE TYPE "public"."blacklist_appealstatus_enum" AS ENUM('NONE', 'PENDING', 'ACCEPTED', 'REJECTED')`);
        await queryRunner.query(`CREATE TYPE "public"."blacklist_severity_enum" AS ENUM('LOW', 'MEDIUM', 'HIGH', 'CRITICAL')`);
        await queryRunner.query(`CREATE TABLE "blacklist" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "blacklistType" "public"."blacklist_blacklisttype_enum" NOT NULL, "identifier" character varying NOT NULL, "scope" "public"."blacklist_scope_enum" NOT NULL, "scopeId" character varying, "isActive" boolean NOT NULL DEFAULT true, "startDate" TIMESTAMP WITH TIME ZONE, "endDate" TIMESTAMP WITH TIME ZONE, "metadata" jsonb, "appealStatus" "public"."blacklist_appealstatus_enum" NOT NULL DEFAULT 'NONE', "severity" "public"."blacklist_severity_enum" NOT NULL DEFAULT 'LOW', "notes" character varying, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid, "event_id" uuid, CONSTRAINT "PK_04dc42a96bf0914cda31b579702" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_7c0d14871c3102676abd8d6e51" ON "blacklist" ("severity") `);
        await queryRunner.query(`CREATE INDEX "IDX_effc493becac100ca5a6ff7ca6" ON "blacklist" ("appealStatus") `);
        await queryRunner.query(`CREATE INDEX "IDX_b393638f89c928aa7ba244f9ee" ON "blacklist" ("startDate", "endDate") `);
        await queryRunner.query(`CREATE INDEX "IDX_410109a2d03d1185528c40a791" ON "blacklist" ("scope", "scopeId") `);
        await queryRunner.query(`CREATE INDEX "IDX_02dc40ff9e2d88e3fdbf43c21c" ON "blacklist" ("isActive") `);
        await queryRunner.query(`CREATE INDEX "IDX_19a42e6133b909b1ade1aeb2eb" ON "blacklist" ("blacklistType", "identifier") `);
        await queryRunner.query(`CREATE TABLE "event_ticket_config" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "price" numeric NOT NULL, "quantityAvailable" integer NOT NULL, "maxPerUser" integer, "salesStart" TIMESTAMP WITH TIME ZONE, "salesEnd" TIMESTAMP WITH TIME ZONE, "metadata" jsonb, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "event_id" uuid NOT NULL, "ticket_type_id" uuid NOT NULL, CONSTRAINT "PK_7693a9ed42c3da12988cc1fb15f" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_9ef81e4d8d128d69360406e425" ON "event_ticket_config" ("ticket_type_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_7b696537d073a11c41438765f4" ON "event_ticket_config" ("event_id") `);
        await queryRunner.query(`CREATE TYPE "public"."access_rights_status_enum" AS ENUM('ENABLED', 'DISABLED', 'USED', 'EXPIRED', 'TRANSFERRED', 'CANCELLED', 'SUSPENDED')`);
        await queryRunner.query(`CREATE TYPE "public"."access_rights_sourcetype_enum" AS ENUM('SUBSCRIPTION', 'TICKET', 'INVITATION', 'STAFF', 'PRESS', 'VIP', 'TRANSFER')`);
        await queryRunner.query(`CREATE TABLE "access_rights" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "qrCode" character varying NOT NULL, "status" "public"."access_rights_status_enum" NOT NULL DEFAULT 'ENABLED', "sourceType" "public"."access_rights_sourcetype_enum" NOT NULL, "sourceId" character varying, "validFrom" TIMESTAMP WITH TIME ZONE, "validUntil" TIMESTAMP WITH TIME ZONE, "metadata" jsonb, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "updatedAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "user_id" uuid NOT NULL, "event_id" uuid NOT NULL, "subscription_id" uuid, "ticket_id" uuid, CONSTRAINT "UQ_4b5dad9c839212ea452c9a01f3b" UNIQUE ("qrCode"), CONSTRAINT "PK_2abf8864233ebeec738695dbe96" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_aa6259b9a9fadb1e41a5948c88" ON "access_rights" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_3f2c84778bf81eabd4431b60dd" ON "access_rights" ("event_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_352f60633bbdf0160da69e5b02" ON "access_rights" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_4b5dad9c839212ea452c9a01f3" ON "access_rights" ("qrCode") `);
        await queryRunner.query(`CREATE TYPE "public"."access_control_log_action_enum" AS ENUM('ENTRY', 'EXIT', 'RE_ENTRY', 'ZONE_CHANGE', 'VALIDATION')`);
        await queryRunner.query(`CREATE TYPE "public"."access_control_log_status_enum" AS ENUM('SUCCESS', 'DENIED', 'WARNING', 'ERROR')`);
        await queryRunner.query(`CREATE TYPE "public"."access_control_log_denialreason_enum" AS ENUM('INVALID_QR', 'ALREADY_USED', 'EXPIRED', 'WRONG_EVENT', 'WRONG_ZONE', 'WRONG_TIME', 'BLACKLISTED', 'TECHNICAL_ERROR', 'INSUFFICIENT_RIGHTS', 'CAPACITY_FULL')`);
        await queryRunner.query(`CREATE TABLE "access_control_log" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "accessPointId" character varying, "action" "public"."access_control_log_action_enum" NOT NULL, "status" "public"."access_control_log_status_enum" NOT NULL, "denialReason" "public"."access_control_log_denialreason_enum", "timestamp" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "metadata" jsonb, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "event_id" uuid NOT NULL, "user_id" uuid, "access_right_id" uuid NOT NULL, "ticket_id" uuid, CONSTRAINT "PK_5c286467c9261727bf7df999eb0" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_330bcba1eac9522a4f97b096ec" ON "access_control_log" ("status") `);
        await queryRunner.query(`CREATE INDEX "IDX_aeab6a0af67879892624d3e696" ON "access_control_log" ("accessPointId") `);
        await queryRunner.query(`CREATE INDEX "IDX_8c16f30d2a9c0968bbb6fca1c4" ON "access_control_log" ("timestamp") `);
        await queryRunner.query(`CREATE INDEX "IDX_4292efd3ff42529f42a92a5dce" ON "access_control_log" ("user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_b3af0ca85dbbda7895aee0a578" ON "access_control_log" ("event_id") `);
        await queryRunner.query(`CREATE TYPE "public"."access_transactions_log_transactiontype_enum" AS ENUM('CREATION', 'TRANSFER', 'RESALE', 'REFUND', 'UPGRADE', 'DOWNGRADE', 'CANCELLATION', 'SUSPENSION')`);
        await queryRunner.query(`CREATE TABLE "access_transactions_log" ("id" uuid NOT NULL DEFAULT uuid_generate_v4(), "transactionType" "public"."access_transactions_log_transactiontype_enum" NOT NULL, "amount" numeric, "notes" character varying, "metadata" jsonb, "createdAt" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(), "access_right_id" uuid NOT NULL, "event_id" uuid, "from_user_id" uuid, "to_user_id" uuid, CONSTRAINT "PK_ee8ee59e0904e6dd5138ab14c52" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE INDEX "IDX_78caf507297acb9907ea1fab35" ON "access_transactions_log" ("createdAt") `);
        await queryRunner.query(`CREATE INDEX "IDX_3778e5bd95d156df8a44bd7bf7" ON "access_transactions_log" ("to_user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_d011c9d06ef0e111b5cbebd003" ON "access_transactions_log" ("from_user_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_4f495844cf60670eb6e94fef51" ON "access_transactions_log" ("event_id") `);
        await queryRunner.query(`CREATE INDEX "IDX_3722efa6867e1a6ae3a3acdd11" ON "access_transactions_log" ("access_right_id") `);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD "cin" character varying(8)`);
        await queryRunner.query(`ALTER TABLE "user_profiles" ADD CONSTRAINT "UQ_1700767b5b06c06ccdef63914d2" UNIQUE ("cin")`);
        await queryRunner.query(`COMMENT ON COLUMN "user_profiles"."cin" IS 'Numéro de Carte d''Identité Nationale (CIN), 8 chiffres Tunisie'`);
        await queryRunner.query(`ALTER TABLE "venue_services" ADD CONSTRAINT "FK_738da117062c66a2542d096d94d" FOREIGN KEY ("venueId") REFERENCES "venues"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "venue_services" ADD CONSTRAINT "FK_9006816688358b9ff077fec7b8a" FOREIGN KEY ("zoneId") REFERENCES "venue_zones"("id") ON DELETE CASCADE ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "zone_mapping_overrides" ADD CONSTRAINT "FK_882f303ce24c1ea772880288f08" FOREIGN KEY ("subscription_plan_id") REFERENCES "subscription_plans"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "zone_mapping_overrides" ADD CONSTRAINT "FK_fc938a9104f14898b73298e43a5" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pricing_rules" ADD CONSTRAINT "FK_adbe14e1fc154a3cb7b2ae5c913" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "pricing_rules" ADD CONSTRAINT "FK_6b01260bec23077f7bab9b463d8" FOREIGN KEY ("ticket_type_id") REFERENCES "ticket_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "blacklist" ADD CONSTRAINT "FK_737fd64e4d088f113eae9a232cd" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "blacklist" ADD CONSTRAINT "FK_d6fbe8ac69b390cb716909e0011" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "event_ticket_config" ADD CONSTRAINT "FK_7b696537d073a11c41438765f43" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "event_ticket_config" ADD CONSTRAINT "FK_9ef81e4d8d128d69360406e425b" FOREIGN KEY ("ticket_type_id") REFERENCES "ticket_types"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "access_rights" ADD CONSTRAINT "FK_352f60633bbdf0160da69e5b02a" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "access_rights" ADD CONSTRAINT "FK_3f2c84778bf81eabd4431b60dd8" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "access_rights" ADD CONSTRAINT "FK_b334ed60813aafc2adfaa422f0a" FOREIGN KEY ("subscription_id") REFERENCES "subscriptions"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "access_rights" ADD CONSTRAINT "FK_6d965bf3da71edd57c45cba3e2f" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "access_control_log" ADD CONSTRAINT "FK_b3af0ca85dbbda7895aee0a5789" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "access_control_log" ADD CONSTRAINT "FK_4292efd3ff42529f42a92a5dcec" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "access_control_log" ADD CONSTRAINT "FK_6bf5c2907b355cb933f68fc5fb4" FOREIGN KEY ("access_right_id") REFERENCES "access_rights"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "access_control_log" ADD CONSTRAINT "FK_2a70b1609a2e975090da773d845" FOREIGN KEY ("ticket_id") REFERENCES "tickets"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "access_transactions_log" ADD CONSTRAINT "FK_3722efa6867e1a6ae3a3acdd113" FOREIGN KEY ("access_right_id") REFERENCES "access_rights"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "access_transactions_log" ADD CONSTRAINT "FK_4f495844cf60670eb6e94fef518" FOREIGN KEY ("event_id") REFERENCES "events"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "access_transactions_log" ADD CONSTRAINT "FK_d011c9d06ef0e111b5cbebd0031" FOREIGN KEY ("from_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "access_transactions_log" ADD CONSTRAINT "FK_3778e5bd95d156df8a44bd7bf72" FOREIGN KEY ("to_user_id") REFERENCES "users"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "access_transactions_log" DROP CONSTRAINT "FK_3778e5bd95d156df8a44bd7bf72"`);
        await queryRunner.query(`ALTER TABLE "access_transactions_log" DROP CONSTRAINT "FK_d011c9d06ef0e111b5cbebd0031"`);
        await queryRunner.query(`ALTER TABLE "access_transactions_log" DROP CONSTRAINT "FK_4f495844cf60670eb6e94fef518"`);
        await queryRunner.query(`ALTER TABLE "access_transactions_log" DROP CONSTRAINT "FK_3722efa6867e1a6ae3a3acdd113"`);
        await queryRunner.query(`ALTER TABLE "access_control_log" DROP CONSTRAINT "FK_2a70b1609a2e975090da773d845"`);
        await queryRunner.query(`ALTER TABLE "access_control_log" DROP CONSTRAINT "FK_6bf5c2907b355cb933f68fc5fb4"`);
        await queryRunner.query(`ALTER TABLE "access_control_log" DROP CONSTRAINT "FK_4292efd3ff42529f42a92a5dcec"`);
        await queryRunner.query(`ALTER TABLE "access_control_log" DROP CONSTRAINT "FK_b3af0ca85dbbda7895aee0a5789"`);
        await queryRunner.query(`ALTER TABLE "access_rights" DROP CONSTRAINT "FK_6d965bf3da71edd57c45cba3e2f"`);
        await queryRunner.query(`ALTER TABLE "access_rights" DROP CONSTRAINT "FK_b334ed60813aafc2adfaa422f0a"`);
        await queryRunner.query(`ALTER TABLE "access_rights" DROP CONSTRAINT "FK_3f2c84778bf81eabd4431b60dd8"`);
        await queryRunner.query(`ALTER TABLE "access_rights" DROP CONSTRAINT "FK_352f60633bbdf0160da69e5b02a"`);
        await queryRunner.query(`ALTER TABLE "event_ticket_config" DROP CONSTRAINT "FK_9ef81e4d8d128d69360406e425b"`);
        await queryRunner.query(`ALTER TABLE "event_ticket_config" DROP CONSTRAINT "FK_7b696537d073a11c41438765f43"`);
        await queryRunner.query(`ALTER TABLE "blacklist" DROP CONSTRAINT "FK_d6fbe8ac69b390cb716909e0011"`);
        await queryRunner.query(`ALTER TABLE "blacklist" DROP CONSTRAINT "FK_737fd64e4d088f113eae9a232cd"`);
        await queryRunner.query(`ALTER TABLE "pricing_rules" DROP CONSTRAINT "FK_6b01260bec23077f7bab9b463d8"`);
        await queryRunner.query(`ALTER TABLE "pricing_rules" DROP CONSTRAINT "FK_adbe14e1fc154a3cb7b2ae5c913"`);
        await queryRunner.query(`ALTER TABLE "zone_mapping_overrides" DROP CONSTRAINT "FK_fc938a9104f14898b73298e43a5"`);
        await queryRunner.query(`ALTER TABLE "zone_mapping_overrides" DROP CONSTRAINT "FK_882f303ce24c1ea772880288f08"`);
        await queryRunner.query(`ALTER TABLE "venue_services" DROP CONSTRAINT "FK_9006816688358b9ff077fec7b8a"`);
        await queryRunner.query(`ALTER TABLE "venue_services" DROP CONSTRAINT "FK_738da117062c66a2542d096d94d"`);
        await queryRunner.query(`COMMENT ON COLUMN "user_profiles"."cin" IS 'Numéro de Carte d''Identité Nationale (CIN), 8 chiffres Tunisie'`);
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP CONSTRAINT "UQ_1700767b5b06c06ccdef63914d2"`);
        await queryRunner.query(`ALTER TABLE "user_profiles" DROP COLUMN "cin"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3722efa6867e1a6ae3a3acdd11"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4f495844cf60670eb6e94fef51"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d011c9d06ef0e111b5cbebd003"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3778e5bd95d156df8a44bd7bf7"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_78caf507297acb9907ea1fab35"`);
        await queryRunner.query(`DROP TABLE "access_transactions_log"`);
        await queryRunner.query(`DROP TYPE "public"."access_transactions_log_transactiontype_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b3af0ca85dbbda7895aee0a578"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4292efd3ff42529f42a92a5dce"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_8c16f30d2a9c0968bbb6fca1c4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_aeab6a0af67879892624d3e696"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_330bcba1eac9522a4f97b096ec"`);
        await queryRunner.query(`DROP TABLE "access_control_log"`);
        await queryRunner.query(`DROP TYPE "public"."access_control_log_denialreason_enum"`);
        await queryRunner.query(`DROP TYPE "public"."access_control_log_status_enum"`);
        await queryRunner.query(`DROP TYPE "public"."access_control_log_action_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4b5dad9c839212ea452c9a01f3"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_352f60633bbdf0160da69e5b02"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_3f2c84778bf81eabd4431b60dd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_aa6259b9a9fadb1e41a5948c88"`);
        await queryRunner.query(`DROP TABLE "access_rights"`);
        await queryRunner.query(`DROP TYPE "public"."access_rights_sourcetype_enum"`);
        await queryRunner.query(`DROP TYPE "public"."access_rights_status_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7b696537d073a11c41438765f4"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_9ef81e4d8d128d69360406e425"`);
        await queryRunner.query(`DROP TABLE "event_ticket_config"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_19a42e6133b909b1ade1aeb2eb"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_02dc40ff9e2d88e3fdbf43c21c"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_410109a2d03d1185528c40a791"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_b393638f89c928aa7ba244f9ee"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_effc493becac100ca5a6ff7ca6"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_7c0d14871c3102676abd8d6e51"`);
        await queryRunner.query(`DROP TABLE "blacklist"`);
        await queryRunner.query(`DROP TYPE "public"."blacklist_severity_enum"`);
        await queryRunner.query(`DROP TYPE "public"."blacklist_appealstatus_enum"`);
        await queryRunner.query(`DROP TYPE "public"."blacklist_scope_enum"`);
        await queryRunner.query(`DROP TYPE "public"."blacklist_blacklisttype_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_efc279e7b5467d404fc49c8824"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d5744de34336feec9ce8547167"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_d990f3040ab6a7803d7807f7cd"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fba7f02465771485ac181fd396"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_ad150e6ea5db4d7649bc6e6554"`);
        await queryRunner.query(`DROP TABLE "pricing_rules"`);
        await queryRunner.query(`DROP TYPE "public"."pricing_rules_ruletype_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_c256c0947bcd0217c9a3733ff0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_4563ca7d0f4a791bafada104df"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_76d927c35c91455ced3de26ab1"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_f33764572a2d3612ef35cce6b2"`);
        await queryRunner.query(`DROP TABLE "ticket_templates"`);
        await queryRunner.query(`DROP TYPE "public"."ticket_templates_orientation_enum"`);
        await queryRunner.query(`DROP TYPE "public"."ticket_templates_templateformat_enum"`);
        await queryRunner.query(`DROP TYPE "public"."ticket_templates_templatetype_enum"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_882f303ce24c1ea772880288f0"`);
        await queryRunner.query(`DROP INDEX "public"."IDX_fc938a9104f14898b73298e43a"`);
        await queryRunner.query(`DROP TABLE "zone_mapping_overrides"`);
        await queryRunner.query(`DROP TABLE "venue_services"`);
        await queryRunner.query(`ALTER TABLE "venues" RENAME COLUMN "globalServices" TO "globalAmenities"`);
    }

}
