REVOKE EXECUTE ON FUNCTION public.top_selling_products(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.top_selling_products(integer) TO service_role;