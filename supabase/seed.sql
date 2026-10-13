-- Starter content. Run once after 0001_init.sql.
-- The service descriptions are neutral placeholders. Replace them with the
-- client's own wording from the admin area (SRS 3.2.2.2).
-- The FAQs only state facts that are already in the SRS. Edit or extend them
-- from the admin area.

insert into public.services (name, short_description, full_description, display_order) values
  ('Roof Installation',
   'New roofs for homes, additions, and garages.',
   'We install complete roofing systems on new residential construction, home additions, and detached garages. Call or request a free quote to talk through materials and timing for your project.',
   1),
  ('Roof Repair',
   'Fixes for leaks, missing shingles, and storm damage.',
   'We find the cause of leaks and repair damaged or missing shingles, flashing, and vents so your roof keeps doing its job. Send us photos with your quote request so we can see the problem.',
   2),
  ('Roof Replacement',
   'Full tear-off and replacement of worn-out roofs.',
   'When a roof has reached the end of its life, we remove the old roofing and install a new system. Request a free quote and we will assess your roof and walk you through the options.',
   3),
  ('Gutter Cleaning',
   'Clearing gutters and downspouts so water drains away.',
   'We clear leaves and debris from gutters and downspouts so rain and snow melt drain away from your roof and foundation.',
   4),
  ('Installation of Gutter Guards',
   'Guards that keep debris out of your gutters.',
   'We install gutter guards that keep leaves and debris out of your gutters, so they stay clear for longer between cleanings.',
   5),
  ('Chimney Removal',
   'Safe removal of unused chimneys.',
   'We remove unused chimneys and close up the roof where the chimney stood, so the area is watertight.',
   6),
  ('Renovations',
   'Residential renovation projects.',
   'Along with roofing, we take on residential renovation work. Describe your project in a quote request and we will follow up to discuss it.',
   7);

insert into public.faqs (question, answer, category, display_order) values
  ('Do you work on commercial buildings?',
   'No. We work on residential homes only.',
   'Our Services', 1),
  ('What services do you offer?',
   'Roof installation, roof repair, roof replacement, gutter cleaning, gutter guard installation, chimney removal, and renovations. See the Services page for details.',
   'Our Services', 2),
  ('What areas do you serve?',
   'We serve Winnipeg and the surrounding areas. If you are not sure whether we cover your location, call or email us.',
   'Service Area', 1),
  ('How do I request a free quote?',
   'Fill in the Request a Free Quote form with your contact details, the type of service, the project location, and a short description. We will reply by email or phone.',
   'Requesting a Quote', 1),
  ('Can I send photos with my quote request?',
   'Yes. You can attach up to 5 photos (JPEG, PNG, or WebP) to the quote form. Photos help us understand the work before we contact you.',
   'Requesting a Quote', 2),
  ('Can I pay or book online?',
   'No. The website does not take payments or bookings. Pricing and payment are arranged directly with us, and payment is settled after the work is completed.',
   'General', 1);
