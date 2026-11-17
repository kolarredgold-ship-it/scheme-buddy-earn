ALTER TABLE public.reports ADD COLUMN IF NOT EXISTS download_count integer NOT NULL DEFAULT 0, ADD COLUMN IF NOT EXISTS last_downloaded_at timestamptz;
CREATE OR REPLACE FUNCTION public.claim_report_generation(_report_id uuid) RETURNS jsonb LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _uid uuid := auth.uid(); _result jsonb; _saved jsonb;
BEGIN
 IF _uid IS NULL THEN RETURN jsonb_build_object('ok',false,'reason','guest'); END IF;
 PERFORM id FROM public.reports WHERE id=_report_id AND user_id=_uid FOR UPDATE;
 IF NOT FOUND THEN RETURN jsonb_build_object('ok',false,'reason','not_found'); END IF;
 SELECT form_data INTO _saved FROM public.report_generations WHERE user_id=_uid AND report_type='full' AND form_data->>'reportId'=_report_id::text LIMIT 1;
 IF FOUND THEN RETURN jsonb_build_object('ok',true,'source','resume','free',coalesce((_saved->>'free')::boolean,false)); END IF;
 IF public.has_role(_uid,'admin'::public.app_role) THEN
  INSERT INTO public.report_generations(user_id,report_type,form_data) VALUES(_uid,'full',jsonb_build_object('reportId',_report_id,'free',false));
  RETURN jsonb_build_object('ok',true,'source','admin','free',false);
 END IF;
 PERFORM id FROM public.profiles WHERE user_id=_uid FOR UPDATE;
 _result := public.consume_tool_credit('full',jsonb_build_object('reportId',_report_id,'source','generate-report'));
 IF coalesce((_result->>'ok')::boolean,false) THEN
  UPDATE public.report_generations SET form_data=form_data || jsonb_build_object('free',_result->>'source'='free') WHERE user_id=_uid AND report_type='full' AND form_data->>'reportId'=_report_id::text;
 END IF;
 RETURN _result || jsonb_build_object('free',_result->>'source'='free');
END $$;
REVOKE ALL ON FUNCTION public.claim_report_generation(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.claim_report_generation(uuid) TO authenticated, service_role;
CREATE OR REPLACE FUNCTION public.record_report_download(_report_id uuid) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
 UPDATE public.reports SET download_count=download_count+1,last_downloaded_at=now() WHERE id=_report_id AND user_id=auth.uid();
 IF NOT FOUND THEN RAISE EXCEPTION 'Report not found'; END IF;
END $$;
REVOKE ALL ON FUNCTION public.record_report_download(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.record_report_download(uuid) TO authenticated, service_role;