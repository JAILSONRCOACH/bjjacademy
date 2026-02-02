-- Allow public read access to registration_invites for valid tokens (public registration flow)
CREATE POLICY "Allow public read access to active registration invites"
ON public.registration_invites
FOR SELECT
USING (active = true);