"""
API для авторизации, регистрации и управления пользователями
"""
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime, timedelta
import hashlib
import secrets

def get_db_connection():
    """Создание подключения к БД"""
    return psycopg2.connect(os.environ['DATABASE_URL'])

def hash_password(password: str) -> str:
    """Хеширование пароля"""
    return hashlib.sha256(password.encode()).hexdigest()

def generate_token() -> str:
    """Генерация токена для 'Запомнить меня'"""
    return secrets.token_urlsafe(32)

def handler(event: dict, context) -> dict:
    """Обработчик API запросов для авторизации"""
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    path = event.get('queryStringParameters', {}).get('path', '')
    request_context = event.get('requestContext', {})
    ip_address = request_context.get('identity', {}).get('sourceIp', '')
    
    try:
        conn = get_db_connection()
        body = json.loads(event.get('body', '{}'))
        
        if method == 'POST':
            if path == 'register':
                result = register_user(conn, body, ip_address)
            elif path == 'login':
                result = login_user(conn, body, ip_address)
            elif path == 'check-remember':
                result = check_remember_token(conn, body, ip_address)
            elif path == 'update-profile':
                result = update_profile(conn, body)
            elif path == 'admin/verify-user':
                result = admin_verify_user(conn, body)
            elif path == 'admin/block-user':
                result = admin_block_user(conn, body)
            elif path == 'admin/get-users':
                result = admin_get_users(conn, body)
            else:
                result = {'error': 'Invalid path'}
        
        elif method == 'GET':
            if path == 'check-subscription':
                user_id = event.get('queryStringParameters', {}).get('user_id')
                result = check_subscription(conn, user_id)
            else:
                result = {'error': 'Invalid path'}
        
        else:
            result = {'error': 'Method not allowed'}
        
        conn.close()
        
        return {
            'statusCode': 200,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps(result, ensure_ascii=False, default=str),
            'isBase64Encoded': False
        }
    
    except Exception as e:
        return {
            'statusCode': 500,
            'headers': {
                'Content-Type': 'application/json',
                'Access-Control-Allow-Origin': '*'
            },
            'body': json.dumps({'error': str(e)}, ensure_ascii=False),
            'isBase64Encoded': False
        }

def register_user(conn, body, ip_address):
    """Регистрация нового пользователя"""
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT id FROM users WHERE email = %s", (body['email'],))
        if cur.fetchone():
            return {'error': 'Пользователь с таким email уже существует'}
        
        password_hash = hash_password(body['password'])
        remember_token = generate_token() if body.get('remember_me') else None
        subscription_ends_at = datetime.now() + timedelta(days=7)
        
        cur.execute("""
            INSERT INTO users (
                username, email, password_hash, phone_number, 
                is_premium, subscription_ends_at, ip_address, remember_token
            )
            VALUES (%s, %s, %s, %s, TRUE, %s, %s, %s)
            RETURNING id, username, email, avatar_url, is_premium, premium_icon, 
                      subscription_ends_at, is_blocked, remember_token
        """, (
            body['username'],
            body['email'],
            password_hash,
            body.get('phone_number'),
            subscription_ends_at,
            ip_address,
            remember_token
        ))
        user = cur.fetchone()
        conn.commit()
        
        return {'success': True, 'user': user, 'remember_token': remember_token}

def login_user(conn, body, ip_address):
    """Вход пользователя"""
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        password_hash = hash_password(body['password'])
        
        cur.execute("""
            SELECT id, username, email, avatar_url, is_premium, premium_icon,
                   subscription_ends_at, is_blocked, is_admin
            FROM users
            WHERE email = %s AND password_hash = %s
        """, (body['email'], password_hash))
        user = cur.fetchone()
        
        if not user:
            return {'error': 'Неверный email или пароль'}
        
        if user['is_blocked']:
            return {'error': 'Ваш аккаунт заблокирован'}
        
        if user['subscription_ends_at'] and datetime.now() > user['subscription_ends_at']:
            return {'error': 'Подписка истекла. Продлите подписку для доступа'}
        
        remember_token = None
        if body.get('remember_me'):
            remember_token = generate_token()
            cur.execute("""
                UPDATE users SET remember_token = %s, ip_address = %s
                WHERE id = %s
            """, (remember_token, ip_address, user['id']))
            conn.commit()
        
        return {'success': True, 'user': user, 'remember_token': remember_token}

def check_remember_token(conn, body, ip_address):
    """Проверка токена 'Запомнить меня'"""
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT id, username, email, avatar_url, is_premium, premium_icon,
                   subscription_ends_at, is_blocked, is_admin
            FROM users
            WHERE remember_token = %s AND ip_address = %s
        """, (body.get('token'), ip_address))
        user = cur.fetchone()
        
        if user:
            if user['is_blocked']:
                return {'error': 'Аккаунт заблокирован'}
            if user['subscription_ends_at'] and datetime.now() > user['subscription_ends_at']:
                return {'error': 'Подписка истекла'}
            return {'success': True, 'user': user}
        
        cur.execute("""
            SELECT id, username, email, avatar_url, is_premium, premium_icon,
                   subscription_ends_at, is_blocked, remember_token, is_admin
            FROM users
            WHERE ip_address = %s AND remember_token IS NOT NULL AND is_blocked = FALSE
            ORDER BY created_at DESC
            LIMIT 3
        """, (ip_address,))
        suggestions = cur.fetchall()
        
        return {'success': False, 'suggestions': suggestions}

def update_profile(conn, body):
    """Обновление профиля пользователя"""
    user_id = body.get('user_id')
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        updates = []
        params = []
        
        if 'avatar_url' in body:
            updates.append('avatar_url = %s')
            params.append(body['avatar_url'])
        
        if 'premium_icon' in body:
            updates.append('premium_icon = %s')
            params.append(body['premium_icon'])
        
        if updates:
            params.append(user_id)
            cur.execute(f"""
                UPDATE users SET {', '.join(updates)}
                WHERE id = %s
                RETURNING id, username, avatar_url, premium_icon
            """, params)
            user = cur.fetchone()
            conn.commit()
            return {'success': True, 'user': user}
        
        return {'error': 'No updates provided'}

def check_subscription(conn, user_id):
    """Проверка статуса подписки"""
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT subscription_ends_at, is_blocked, is_premium
            FROM users WHERE id = %s
        """, (user_id,))
        user = cur.fetchone()
        
        if not user:
            return {'error': 'User not found'}
        
        now = datetime.now()
        is_active = not user['is_blocked'] and (
            not user['subscription_ends_at'] or now < user['subscription_ends_at']
        )
        
        days_left = 0
        if user['subscription_ends_at']:
            days_left = max(0, (user['subscription_ends_at'] - now).days)
        
        return {
            'is_active': is_active,
            'is_blocked': user['is_blocked'],
            'days_left': days_left,
            'subscription_ends_at': user['subscription_ends_at']
        }

def admin_verify_user(conn, body):
    """Админ: выдать галочку верификации"""
    admin_id = body.get('admin_id')
    target_user_id = body.get('user_id')
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT is_admin FROM users WHERE id = %s", (admin_id,))
        admin = cur.fetchone()
        
        if not admin or not admin['is_admin']:
            return {'error': 'Access denied'}
        
        cur.execute("""
            UPDATE users SET is_verified = TRUE WHERE id = %s
            RETURNING id, username, is_verified
        """, (target_user_id,))
        user = cur.fetchone()
        conn.commit()
        
        return {'success': True, 'user': user}

def admin_block_user(conn, body):
    """Админ: заблокировать/разблокировать пользователя"""
    admin_id = body.get('admin_id')
    target_user_id = body.get('user_id')
    is_blocked = body.get('is_blocked', True)
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT is_admin FROM users WHERE id = %s", (admin_id,))
        admin = cur.fetchone()
        
        if not admin or not admin['is_admin']:
            return {'error': 'Access denied'}
        
        cur.execute("""
            UPDATE users SET is_blocked = %s WHERE id = %s
            RETURNING id, username, is_blocked
        """, (is_blocked, target_user_id))
        user = cur.fetchone()
        conn.commit()
        
        return {'success': True, 'user': user}

def admin_get_users(conn, body):
    """Админ: получить список пользователей"""
    admin_id = body.get('admin_id')
    search = body.get('search', '')
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("SELECT is_admin FROM users WHERE id = %s", (admin_id,))
        admin = cur.fetchone()
        
        if not admin or not admin['is_admin']:
            return {'error': 'Access denied'}
        
        cur.execute("""
            SELECT id, username, email, phone_number, is_premium, is_blocked, 
                   is_verified, subscription_ends_at, created_at
            FROM users
            WHERE username ILIKE %s OR email ILIKE %s
            ORDER BY created_at DESC
            LIMIT 100
        """, (f'%{search}%', f'%{search}%'))
        users = cur.fetchall()
        conn.commit()
        
        return {'success': True, 'users': users}
