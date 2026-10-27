-- items.date_start was a moving fake date (pdp shifted it forward). Real start dates live on item_schedules; the item date may be empty now.
ALTER TABLE items MODIFY date_start DATE NULL;
