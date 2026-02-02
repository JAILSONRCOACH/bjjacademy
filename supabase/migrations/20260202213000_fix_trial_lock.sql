-- Update function to strictly check trial_end date
CREATE OR REPLACE FUNCTION public.academy_has_access(_academy_id UUID)
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 
        FROM public.academy_subscriptions
        WHERE academy_id = _academy_id
        AND (
            status = 'active'
            OR (
                status = 'trialing' 
                AND (trial_end IS NULL OR trial_end > now()) -- Allow access if trial_end is future
            )
            OR (
                status = 'past_due' 
                AND current_period_end > (now() - INTERVAL '3 days')
            )
        )
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
