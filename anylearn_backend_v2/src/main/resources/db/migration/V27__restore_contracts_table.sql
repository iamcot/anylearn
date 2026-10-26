-- V24 renamed `contracts` to `contracts_old` by mistake: the table is still in use (partner contracts; the status is
-- mirrored in users.is_signed). Put it back when V24 had renamed it; harmless when it never did.
SET @restore_contracts = IF(
  (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'contracts_old') > 0
  AND (SELECT COUNT(*) FROM information_schema.tables WHERE table_schema = DATABASE() AND table_name = 'contracts') = 0,
  'RENAME TABLE `contracts_old` TO `contracts`',
  'SELECT 1');
PREPARE restore_contracts_stmt FROM @restore_contracts;
EXECUTE restore_contracts_stmt;
DEALLOCATE PREPARE restore_contracts_stmt;
