-- Runs only the FIRST time the postgres container starts (empty data volume).
-- inventory_dev is created automatically from POSTGRES_DB in docker-compose.yml.
CREATE DATABASE inventory_test;
CREATE DATABASE inventory_qa;
