CREATE TABLE IF NOT EXISTS user (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(100) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL DEFAULT 'ROLE_USER',
  enabled BOOLEAN NOT NULL DEFAULT TRUE,
  avatar VARCHAR(1024) NOT NULL DEFAULT ''
);

CREATE TABLE IF NOT EXISTS boards (
  id INT AUTO_INCREMENT PRIMARY KEY,
  board_name VARCHAR(100) NOT NULL UNIQUE,
  img_url VARCHAR(1024) NOT NULL DEFAULT '',
  slogan VARCHAR(255) NOT NULL DEFAULT '',
  recommend BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE IF NOT EXISTS article (
  article_id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  board VARCHAR(100) NOT NULL,
  board_id INT NOT NULL,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  first_img_url VARCHAR(1024) NOT NULL DEFAULT '',
  love INT NOT NULL DEFAULT 0,
  time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  INDEX idx_article_love (love),
  INDEX idx_article_time (time),
  INDEX idx_article_board_id (board_id),
  INDEX idx_article_user_id (user_id),
  CONSTRAINT fk_article_user FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
  CONSTRAINT fk_article_board FOREIGN KEY (board_id) REFERENCES boards(id)
);

CREATE TABLE IF NOT EXISTS message (
  message_id INT AUTO_INCREMENT PRIMARY KEY,
  article_id INT NOT NULL,
  user_id INT NOT NULL,
  content TEXT NOT NULL,
  time TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  love INT NOT NULL DEFAULT 0,
  INDEX idx_message_article_id (article_id),
  INDEX idx_message_user_id (user_id),
  CONSTRAINT fk_message_article FOREIGN KEY (article_id) REFERENCES article(article_id) ON DELETE CASCADE,
  CONSTRAINT fk_message_user FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS user_favorite_boards (
  user_id INT NOT NULL,
  board_id INT NOT NULL,
  PRIMARY KEY (user_id, board_id),
  CONSTRAINT fk_favorite_user FOREIGN KEY (user_id) REFERENCES user(id) ON DELETE CASCADE,
  CONSTRAINT fk_favorite_board FOREIGN KEY (board_id) REFERENCES boards(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS donation_order (
  id BIGINT AUTO_INCREMENT PRIMARY KEY,
  merchant_trade_no VARCHAR(20) NOT NULL UNIQUE,
  article_id INT DEFAULT NULL,
  amount DECIMAL(10, 0) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
  ecpay_trade_no VARCHAR(50) DEFAULT NULL,
  rtn_code VARCHAR(20) DEFAULT NULL,
  rtn_msg VARCHAR(255) DEFAULT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  paid_at TIMESTAMP NULL DEFAULT NULL,
  updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_donation_order_article_id (article_id),
  INDEX idx_donation_order_status (status)
);

INSERT INTO user (id, username, password, role, enabled, avatar)
VALUES
  (1, 'admi', 'aaa', 'ROLE_USER', TRUE, 'https://elasticbeanstalk-ap-northeast-3-460820365574.s3.ap-northeast-3.amazonaws.com/yellowPinkET.png')
ON DUPLICATE KEY UPDATE username = VALUES(username);

INSERT INTO boards (id, board_name, img_url, slogan, recommend)
VALUES
  (1, '閒聊', 'https://images.unsplash.com/photo-1529156069898-49953e39b3ac?auto=format&fit=crop&w=200&q=80', '分享日常與生活大小事', TRUE),
  (2, '美食', 'https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&w=200&q=80', '餐廳、料理與宵夜清單', TRUE),
  (3, '旅遊', 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=200&q=80', '旅行計畫與景點紀錄', TRUE),
  (4, '科技', 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=200&q=80', '開發、產品與新工具', FALSE)
ON DUPLICATE KEY UPDATE board_name = VALUES(board_name);

INSERT INTO article (article_id, title, board, board_id, user_id, content, first_img_url, love, time)
VALUES
  (1, '本地開發環境啟動成功', '閒聊', 1, 1, '這是一篇本地種子文章，可以用來確認列表、閱讀與留言功能。', '', 8, NOW()),
  (2, '午餐推薦清單', '美食', 2, 1, '歡迎分享今天吃到的好店。', '', 5, NOW() - INTERVAL 1 HOUR),
  (3, '週末小旅行', '旅遊', 3, 1, '整理幾個適合週末出門走走的地方。', '', 3, NOW() - INTERVAL 2 HOUR)
ON DUPLICATE KEY UPDATE title = VALUES(title);

INSERT INTO message (message_id, article_id, user_id, content, love, time)
VALUES
  (1, 1, 1, '留言功能也可以用這筆資料測試。', 2, NOW())
ON DUPLICATE KEY UPDATE content = VALUES(content);

INSERT IGNORE INTO user_favorite_boards (user_id, board_id)
VALUES (1, 1), (1, 2);
