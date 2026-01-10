-- Add admin policies to mvv_documents table
CREATE POLICY "Admins can view all mvv documents" 
ON public.mvv_documents 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all mvv documents" 
ON public.mvv_documents 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can delete all mvv documents" 
ON public.mvv_documents 
FOR DELETE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin policies to organizational_anamnesis table
CREATE POLICY "Admins can view all anamnesis" 
ON public.organizational_anamnesis 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can update all anamnesis" 
ON public.organizational_anamnesis 
FOR UPDATE 
USING (has_role(auth.uid(), 'admin'::app_role));

-- Add admin policy to profiles table (for CRM to fetch contact info)
CREATE POLICY "Admins can view all profiles" 
ON public.profiles 
FOR SELECT 
USING (has_role(auth.uid(), 'admin'::app_role));