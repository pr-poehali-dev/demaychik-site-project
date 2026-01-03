CREATE TABLE business_notes (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL,
    content TEXT NOT NULL,
    rich_text JSONB,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE business_members (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    role VARCHAR(50) DEFAULT 'member',
    joined_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT unique_business_member UNIQUE (business_id, user_id)
);

CREATE TABLE business_chat (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    message TEXT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE advertisements (
    id SERIAL PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    content TEXT NOT NULL,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_business_notes_business_id ON business_notes(business_id);
CREATE INDEX idx_business_members_business_id ON business_members(business_id);
CREATE INDEX idx_business_members_user_id ON business_members(user_id);
CREATE INDEX idx_business_chat_business_id ON business_chat(business_id);
CREATE INDEX idx_advertisements_is_active ON advertisements(is_active);