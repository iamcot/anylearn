-- Tables of the old PHP portal that nothing in the new apps reads or writes. They are renamed, not dropped:
-- delete the *_old tables by hand after a month or two without problems.
RENAME TABLE
  `contracts` TO `contracts_old`,
  `sale_activities` TO `sale_activities_old`,
  `activitybonuses` TO `activitybonuses_old`,
  `spms` TO `spms_old`,
  `user_specs` TO `user_specs_old`,
  `user_spec_links` TO `user_spec_links_old`,
  `item_specs` TO `item_specs_old`,
  `item_spec_links` TO `item_spec_links_old`,
  `user_reviews` TO `user_reviews_old`,
  `migrations` TO `migrations_old`,
  `password_resets` TO `password_resets_old`;
