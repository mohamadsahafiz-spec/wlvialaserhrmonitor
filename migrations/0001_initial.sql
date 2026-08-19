-- Initial D1 Migration for LMS Multi-Device Cloud Sync

CREATE TABLE IF NOT EXISTS machines (
    id TEXT PRIMARY KEY,
    machine_no TEXT NOT NULL,
    machine_name TEXT NOT NULL,
    serial_no TEXT,
    manufacturer TEXT,
    model TEXT,
    department TEXT,
    lasers TEXT NOT NULL,
    maintenance_history TEXT NOT NULL,
    last_updated TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);
