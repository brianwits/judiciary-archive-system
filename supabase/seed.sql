-- Demo cases (run after creating at least one staff/admin user via Auth)
-- Replace :user_id with your auth.users id when running manually.

INSERT INTO public.cases (case_number, title, court, status, filed_date, description)
VALUES
  ('CR-2024-001', 'State v. Example', 'High Court', 'open', '2024-01-15', 'Sample criminal matter for demonstration.'),
  ('CV-2023-088', 'Acme Corp v. Beta Ltd', 'Commercial Court', 'closed', '2023-06-02', 'Contract dispute, judgment entered.'),
  ('FA-2022-012', 'In re Estate of Doe', 'Family Division', 'archived', '2022-03-10', 'Probate file archived per retention policy.')
ON CONFLICT (case_number) DO NOTHING;
