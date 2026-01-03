CREATE TABLE businesses (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    icon VARCHAR(50) DEFAULT '💼',
    color VARCHAR(50) DEFAULT 'blue',
    is_online BOOLEAN DEFAULT FALSE,
    online_code VARCHAR(20) UNIQUE,
    is_archived BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_businesses_user_id ON businesses(user_id);
CREATE INDEX idx_businesses_online_code ON businesses(online_code);