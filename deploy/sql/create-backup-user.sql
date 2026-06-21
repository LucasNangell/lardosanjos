-- Usuário dedicado para backup (permissões mínimas — NÃO usar root em produção)
-- Execute uma vez no MySQL de produção como administrador.

CREATE USER IF NOT EXISTS 'lardosanjos_backup'@'%' IDENTIFIED BY 'CHANGE_ME_BACKUP_USER_PASSWORD';
GRANT SELECT, SHOW VIEW, TRIGGER, LOCK TABLES, EVENT ON lardosanjos.* TO 'lardosanjos_backup'@'%';
FLUSH PRIVILEGES;
