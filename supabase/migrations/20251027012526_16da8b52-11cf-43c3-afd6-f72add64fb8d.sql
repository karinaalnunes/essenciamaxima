-- Permitir INSERT para qualquer um solicitar recuperação de senha
CREATE POLICY "allow_public_insert_password_reset" 
ON password_reset_codes 
FOR INSERT 
WITH CHECK (true);

-- Permitir SELECT para validar códigos de recuperação
CREATE POLICY "allow_public_select_password_reset" 
ON password_reset_codes 
FOR SELECT 
USING (true);

-- Permitir UPDATE para marcar códigos como usados
CREATE POLICY "allow_public_update_password_reset" 
ON password_reset_codes 
FOR UPDATE 
USING (true);