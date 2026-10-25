-- What visitors search for, and what they ask us to find when nothing matches.
CREATE TABLE search_logs (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  ref VARCHAR(40) NOT NULL,                  -- made by the browser per search, so a click can name its search
  user_id BIGINT NULL,
  session_key VARCHAR(64) NULL,              -- random id kept in the browser, not personal data
  keyword VARCHAR(255) NULL,
  keyword_normalized VARCHAR(255) NULL,      -- lower case, no accents, single spaces
  mode VARCHAR(20) NULL,                     -- class / school / teacher
  category VARCHAR(100) NULL,
  age_filter VARCHAR(10) NULL,
  price_filter VARCHAR(10) NULL,
  location_filter VARCHAR(10) NULL,
  format_filter VARCHAR(10) NULL,
  audience VARCHAR(10) NULL,                 -- child / self, from the guest "who is it for" answer
  learner_age INT NULL,
  result_count INT NOT NULL DEFAULT 0,
  clicked_item_id BIGINT NULL,
  clicked_at DATETIME NULL,
  created_at DATETIME NOT NULL,
  UNIQUE KEY uq_search_logs_ref (ref),
  INDEX idx_search_logs_created (created_at),
  INDEX idx_search_logs_keyword (keyword_normalized),
  INDEX idx_search_logs_session (session_key, created_at)
);

CREATE TABLE course_requests (
  id BIGINT UNSIGNED NOT NULL AUTO_INCREMENT PRIMARY KEY,
  user_id BIGINT NULL,
  contact_name VARCHAR(100) NULL,
  contact_phone VARCHAR(20) NOT NULL,
  subject VARCHAR(255) NOT NULL,
  subject_normalized VARCHAR(255) NOT NULL,
  learner_age INT NULL,
  province_code VARCHAR(10) NULL,
  district_text VARCHAR(100) NULL,
  budget_max BIGINT NULL,                    -- VND per month
  preferred_time VARCHAR(30) NULL,           -- weekday_evening / weekend / summer / flexible
  mode VARCHAR(20) NULL,                     -- offline / online / any
  note TEXT NULL,
  source_ref VARCHAR(40) NULL,               -- search_logs.ref of the search that found nothing
  status VARCHAR(20) NOT NULL DEFAULT 'new', -- new / contacting / matched / no_partner / closed
  matched_item_id BIGINT NULL,
  admin_note VARCHAR(500) NULL,
  handled_by BIGINT NULL,
  created_at DATETIME NOT NULL,
  updated_at DATETIME NOT NULL,
  INDEX idx_course_requests_status (status, created_at),
  INDEX idx_course_requests_phone (contact_phone, created_at)
);
