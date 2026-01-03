CREATE TABLE transactions (
    id SERIAL PRIMARY KEY,
    business_id INTEGER NOT NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('income', 'expense')),
    amount DECIMAL(15, 2) NOT NULL,
    category VARCHAR(100) NOT NULL,
    description TEXT,
    date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_transactions_business_id ON transactions(business_id);
CREATE INDEX idx_transactions_date ON transactions(date);