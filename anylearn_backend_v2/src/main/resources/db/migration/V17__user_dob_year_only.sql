-- A guest tells us only the birth year of a child; the full date is asked at checkout.
-- While dob_year_only = 1 the stored dob is January 1st of that year.
ALTER TABLE users ADD COLUMN dob_year_only TINYINT(1) NOT NULL DEFAULT 0;
