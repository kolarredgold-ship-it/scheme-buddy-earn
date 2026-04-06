INSERT INTO storage.buckets (id, name, public) VALUES ('scheme-images', 'scheme-images', true) ON CONFLICT (id) DO NOTHING;

CREATE POLICY "Anyone can view scheme images" ON storage.objects FOR SELECT USING (bucket_id = 'scheme-images');

CREATE POLICY "Admins can upload scheme images" ON storage.objects FOR INSERT WITH CHECK (bucket_id = 'scheme-images' AND public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Admins can delete scheme images" ON storage.objects FOR DELETE USING (bucket_id = 'scheme-images' AND public.has_role(auth.uid(), 'admin'));