-- Глобальные таблицы

CREATE TABLE global.settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  prefix VARCHAR(32) NOT NULL,
  db_name VARCHAR(64) NOT NULL,
  configs JSON NOT NULL
);

CREATE TABLE global.configurations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(64) NOT NULL,
  value DECIMAL(20,4) NOT NULL,
  prefix VARCHAR(32)
);

CREATE TABLE global.casino_convert_settings (
  id INT AUTO_INCREMENT PRIMARY KEY,
  prefix VARCHAR(32) NOT NULL,
  provider VARCHAR(64) NOT NULL,
  currency VARCHAR(16) NOT NULL
);

-- Казино

CREATE TABLE casino.games (
  uuid VARCHAR(64) PRIMARY KEY,
  aggregator VARCHAR(64),
  provider_uid VARCHAR(64),
  provider VARCHAR(64),
  name VARCHAR(128),
  deleted BOOLEAN DEFAULT 0,
  active BOOLEAN DEFAULT 1,
  type VARCHAR(32),
  site_section VARCHAR(64),
  additional_id VARCHAR(64)
);

CREATE TABLE casino.aspect_configs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  prefix VARCHAR(32) NOT NULL,
  configs JSON NOT NULL
);

CREATE TABLE casino.limits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id VARCHAR(64) NOT NULL,
  bet_limit DECIMAL(20,4) NOT NULL
);

CREATE TABLE casino.restrictions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  code VARCHAR(64) NOT NULL,
  ggr DECIMAL(20,4) DEFAULT 0,
  max_ggr DECIMAL(20,4)
);

CREATE TABLE casino.section_limits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  prefix VARCHAR(32),
  site_section VARCHAR(64),
  bet_limit DECIMAL(20,4)
);

CREATE TABLE casino.provider_limits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  prefix VARCHAR(32),
  provider VARCHAR(64),
  bet_limit DECIMAL(20,4)
);

CREATE TABLE casino.final_game_limits (
  id INT AUTO_INCREMENT PRIMARY KEY,
  prefix VARCHAR(32),
  final_game_id VARCHAR(64),
  bet_limit DECIMAL(20,4)
);

-- Транзакции и раунды

CREATE TABLE casino_rounds (
  id INT AUTO_INCREMENT PRIMARY KEY,
  round_id VARCHAR(64) NOT NULL,
  user_id INT NOT NULL,
  bet_amount DECIMAL(20,4),
  win_amount DECIMAL(20,4),
  status INT DEFAULT 0,
  aggregator VARCHAR(64),
  provider VARCHAR(64),
  uuid VARCHAR(64),
  currency VARCHAR(16),
  additional_info JSON
);

CREATE TABLE casino_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  amount DECIMAL(20,4),
  transaction_id VARCHAR(128) UNIQUE,
  player_id INT,
  action INT,
  aggregator VARCHAR(64),
  provider VARCHAR(64),
  game_id VARCHAR(64),
  currency VARCHAR(16),
  session_id VARCHAR(64),
  section VARCHAR(64),
  round_id VARCHAR(64),
  freespin_id VARCHAR(64),
  bet_transaction_id VARCHAR(64),
  change_balance DECIMAL(20,4)
);

CREATE TABLE casino_converted_transactions (
  id VARCHAR(128) PRIMARY KEY,
  amount DECIMAL(20,4),
  converted_amount DECIMAL(20,4),
  user_id INT,
  action INT,
  aggregator VARCHAR(64),
  provider VARCHAR(64),
  uuid VARCHAR(64),
  currency VARCHAR(16),
  currency_to VARCHAR(16),
  rate DECIMAL(20,8)
);

-- Пользователи и агенты

CREATE TABLE users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(64),
  balance DECIMAL(20,4),
  real_balance DECIMAL(20,4),
  plus_bonus DECIMAL(20,4),
  currency VARCHAR(16),
  active BOOLEAN DEFAULT 1,
  deleted BOOLEAN DEFAULT 0,
  created_at DATETIME,
  options JSON
);

CREATE TABLE agents (
  id INT AUTO_INCREMENT PRIMARY KEY,
  agent_id INT,
  active BOOLEAN DEFAULT 1,
  deleted BOOLEAN DEFAULT 0
);

-- Баланс и история

CREATE TABLE wagering_balance (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  balance DECIMAL(20,4),
  status TINYINT DEFAULT 1,
  free_spin BOOLEAN DEFAULT 0,
  expires_at DATETIME
);

CREATE TABLE wagering_transactions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  wagering_id INT NOT NULL,
  user_id INT NOT NULL,
  amount DECIMAL(20,4),
  balance_before DECIMAL(20,4),
  balance_after DECIMAL(20,4),
  reference VARCHAR(255)
);

CREATE TABLE balance_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  user_id INT NOT NULL,
  type INT NOT NULL,
  amount DECIMAL(20,4),
  balance DECIMAL(20,4),
  info TEXT
);

CREATE TABLE drop_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  uuid VARCHAR(64),
  user_id INT,
  amount DECIMAL(20,4)
);
