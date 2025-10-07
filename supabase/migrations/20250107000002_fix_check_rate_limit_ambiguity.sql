-- Fix ambiguous column reference in check_rate_limit function
-- The variable name "window_start" conflicts with the column name
-- Solution: Rename local variables to avoid ambiguity

DROP FUNCTION IF EXISTS public.check_rate_limit(uuid, text, integer);

CREATE FUNCTION public.check_rate_limit(
    p_user_id uuid,
    p_api_endpoint text,
    p_limit_per_hour integer
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
    current_count integer;
    v_window_start timestamp with time zone;  -- Renamed with v_ prefix to avoid ambiguity
    v_window_end timestamp with time zone;
BEGIN
    v_window_start := DATE_TRUNC('hour', NOW());
    v_window_end := v_window_start + interval '1 hour';
    
    SELECT COALESCE(request_count, 0)
    INTO current_count
    FROM public.api_rate_limits
    WHERE user_id = p_user_id
        AND api_endpoint = p_api_endpoint
        AND window_start = v_window_start;  -- Now unambiguous
    
    IF current_count IS NULL THEN
        INSERT INTO public.api_rate_limits (user_id, api_endpoint, request_count, limit_per_hour, window_start, window_end)
        VALUES (p_user_id, p_api_endpoint, 1, p_limit_per_hour, v_window_start, v_window_end);
        RETURN true;
    ELSIF current_count < p_limit_per_hour THEN
        UPDATE public.api_rate_limits
        SET request_count = request_count + 1
        WHERE user_id = p_user_id 
            AND api_endpoint = p_api_endpoint 
            AND window_start = v_window_start;  -- Now unambiguous
        RETURN true;
    ELSE
        RETURN false;
    END IF;
END;
$$;

