-- --------------------------------------------------
-- 1. Drop existing tables (in dependency order)
-- --------------------------------------------------
DROP TABLE IF EXISTS ticket_evidence_media;
DROP TABLE IF EXISTS ticket_part_changes;
DROP TABLE IF EXISTS ticket_evidences;
DROP TABLE IF EXISTS tickets;
DROP TABLE IF EXISTS product_categories;
DROP TABLE IF EXISTS categories;
DROP TABLE IF EXISTS products;
DROP TABLE IF EXISTS customers;
DROP TABLE IF EXISTS users;

-- --------------------------------------------------
-- 2. Users table
-- --------------------------------------------------
CREATE TABLE users (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT NOT NULL
        CHECK (role IN ('super_admin','admin','manager','support')),
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------
-- 3. Customers table
-- --------------------------------------------------
CREATE TABLE customers (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    email TEXT NOT NULL UNIQUE,
    phone TEXT,
    address TEXT,
    company TEXT,
    rfc TEXT,
    status TEXT NOT NULL DEFAULT 'active'
        CHECK (status IN ('active','inactive')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------
-- 4. Products table
-- --------------------------------------------------
CREATE TABLE products (
    id BIGSERIAL PRIMARY KEY,
    sku TEXT UNIQUE,
    name TEXT NOT NULL,
    description TEXT,
    image_url TEXT,
    thumb_url TEXT,
    cost NUMERIC(12,2) NOT NULL CHECK (cost >= 0),
    price NUMERIC(12,2) NOT NULL CHECK (price >= 0),
    price_offer NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (price_offer >= 0),
    price_package NUMERIC(12,2) NOT NULL DEFAULT 0 CHECK (price_package >= 0),
    package_qty INTEGER NOT NULL DEFAULT 0 CHECK (package_qty >= 0),
    stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
    images_url TEXT[] DEFAULT '{}'::TEXT[],
    metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
    status TEXT NOT NULL DEFAULT 'active',
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------
-- 5. Categories table
-- --------------------------------------------------
CREATE TABLE categories (
    id BIGSERIAL PRIMARY KEY,
    name TEXT NOT NULL,
    parent_id BIGINT
        REFERENCES categories(id) ON DELETE SET NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE (name)
);

-- --------------------------------------------------
-- 6. Product–Category pivot table
-- --------------------------------------------------
CREATE TABLE product_categories (
    product_id BIGINT NOT NULL
        REFERENCES products(id) ON DELETE CASCADE,
    category_id BIGINT NOT NULL
        REFERENCES categories(id) ON DELETE CASCADE,
    PRIMARY KEY (product_id, category_id)
);

-- --------------------------------------------------
-- 7. Tickets table
-- --------------------------------------------------
CREATE TABLE tickets (
    id BIGSERIAL PRIMARY KEY,
    customer_id BIGINT NOT NULL
        REFERENCES customers(id) ON DELETE CASCADE,
    technician_id BIGINT NOT NULL
        REFERENCES users(id) ON DELETE CASCADE,
    status TEXT NOT NULL DEFAULT 'open'
        CHECK (status IN ('open','in_progress','closed')),
    description TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------
-- 8. Ticket evidences (one row per event)
-- --------------------------------------------------
CREATE TABLE ticket_evidences (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL
        REFERENCES tickets(id) ON DELETE CASCADE,
    type TEXT NOT NULL
        CHECK (type IN ('reception','part_removed','part_installed','delivery')),
    user_id BIGINT NOT NULL
        REFERENCES users(id) ON DELETE SET NULL,
    comment TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------
-- 9. Evidence media (images & videos)
-- --------------------------------------------------
CREATE TABLE ticket_evidence_media (
    id BIGSERIAL PRIMARY KEY,
    evidence_id BIGINT NOT NULL
        REFERENCES ticket_evidences(id) ON DELETE CASCADE,
    media_type TEXT NOT NULL
        CHECK (media_type IN ('image','video')),
    storage_id TEXT NOT NULL,      -- external storage identifier
    url TEXT NOT NULL,             -- access URL
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------
-- 10. Ticket part changes
-- --------------------------------------------------
CREATE TABLE ticket_part_changes (
    id BIGSERIAL PRIMARY KEY,
    ticket_id BIGINT NOT NULL
        REFERENCES tickets(id) ON DELETE CASCADE,
    removed_part_name VARCHAR(255) NOT NULL,
    installed_part_name VARCHAR(255) NOT NULL,
    removed_evidence_id BIGINT NOT NULL
        REFERENCES ticket_evidences(id) ON DELETE CASCADE,
    installed_evidence_id BIGINT NOT NULL
        REFERENCES ticket_evidences(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- --------------------------------------------------
-- 11. Seed data (example)
-- --------------------------------------------------
INSERT INTO users (name, email, password, role)
VALUES
  ('Super Admin', 'admin@gmail.com', '$2b$10$vHeurs.MZNjncuYULvVMDe2tFdUfaOcvQkcwA5nVC2td0R7Az3NIm', 'super_admin'),
  ('Technician', 'tecnico@gmail.com', '$2b$10$vHeurs.MZNjncuYULvVMDe2tFdUfaOcvQkcwA5nVC2td0R7Az3NIm', 'support');

INSERT INTO customers (name, last_name, email, phone, address, company, rfc, status)
VALUES
  ('Juan', 'Pérez', 'customer1@gmail.com', '1234567890', 'Av. Principal 123', 'Empresa ABC', 'ABC123456789', 'active'),
  ('María', 'González', 'customer2@gmail.com', '0987654321', 'Calle Secundaria 456', 'Empresa XYZ', 'XYZ987654321', 'active');

INSERT INTO tickets (customer_id, technician_id, status, description)
VALUES
  (1, 2, 'open', 'Ticket 1'),
  (2, 2, 'open', 'Ticket 2');

INSERT INTO ticket_evidences (ticket_id, type, user_id, comment)
VALUES
  (1, 'reception', 2, 'Evidencia 1'),
  (2, 'reception', 2, 'Evidencia 2');

INSERT INTO ticket_evidence_media (evidence_id, media_type, storage_id, url)
VALUES
  (1, 'image', 'storage1', 'https://example.com/image1.jpg'),
  (2, 'image', 'storage2', 'https://example.com/image2.jpg');

INSERT INTO ticket_part_changes (ticket_id, removed_part_name, installed_part_name, removed_evidence_id, installed_evidence_id)
VALUES
  (1, 'Part 1', 'Part 2', 1, 2),
  (2, 'Part 3', 'Part 4', 3, 4);