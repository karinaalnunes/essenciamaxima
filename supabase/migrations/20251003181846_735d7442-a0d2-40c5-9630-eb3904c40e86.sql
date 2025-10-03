-- Allow authenticated users to submit leads
CREATE POLICY "Authenticated users can submit leads" 
ON public.leads
FOR INSERT 
TO authenticated
WITH CHECK (true);