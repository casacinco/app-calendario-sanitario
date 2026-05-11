-- Adiciona metadados de arquivo real à biblioteca de conteúdo
ALTER TABLE content_library_files ADD COLUMN file_size INTEGER;
ALTER TABLE content_library_files ADD COLUMN original_name TEXT;
