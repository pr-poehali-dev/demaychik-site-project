"""
API для управления бизнесами, транзакциями и онлайн-бизнесами
"""
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime
import random
import string

def get_db_connection():
    """Создание подключения к БД"""
    return psycopg2.connect(os.environ['DATABASE_URL'])

def generate_online_code():
    """Генерация уникального кода для онлайн-бизнеса"""
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choice(chars) for _ in range(20))

def handler(event: dict, context) -> dict:
    """Обработчик API запросов для бизнесов"""
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    user_id_str = headers.get('x-user-id') or headers.get('X-User-Id')
    user_id = int(user_id_str) if user_id_str else None
    path = event.get('queryStringParameters', {}).get('path', '')
    
    try:
        conn = get_db_connection()
        
        if method == 'GET':
            if path == 'businesses':
                result = get_user_businesses(conn, user_id)
            elif path.startswith('business/'):
                business_id = path.split('/')[-1]
                result = get_business_details(conn, business_id, user_id)
            elif path == 'transactions':
                business_id = event.get('queryStringParameters', {}).get('business_id')
                result = get_transactions(conn, business_id)
            elif path == 'chat':
                business_id = event.get('queryStringParameters', {}).get('business_id')
                result = get_chat_messages(conn, business_id)
            elif path == 'advertisement':
                result = get_active_advertisement(conn)
            else:
                result = {'error': 'Invalid path'}
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            
            if path == 'business':
                result = create_business(conn, user_id, body)
            elif path == 'transaction':
                result = create_transaction(conn, user_id, body)
            elif path == 'note':
                result = create_or_update_note(conn, user_id, body)
            elif path == 'join-business':
                result = join_business(conn, user_id, body)
            elif path == 'chat':
                result = send_chat_message(conn, user_id, body)
            else:
                result = {'error': 'Invalid path'}
        
        elif method == 'PUT':
            body = json.loads(event.get('body', '{}'))
            
            if path == 'business':
                result = update_business(conn, user_id, body)
            elif path == 'archive-business':
                result = archive_business(conn, user_id, body)
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

def get_user_businesses(conn, user_id):
    """Получить все бизнесы пользователя (свои + участник)"""
    if not user_id:
        return {'error': 'User ID required'}
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT DISTINCT b.*, 
                CASE WHEN b.user_id = %s THEN 'owner' ELSE bm.role END as my_role,
                COUNT(DISTINCT t.id) as transaction_count,
                COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END), 0) as balance
            FROM businesses b
            LEFT JOIN business_members bm ON b.id = bm.business_id AND bm.user_id = %s
            LEFT JOIN transactions t ON b.id = t.business_id
            WHERE (b.user_id = %s OR bm.user_id = %s) AND b.is_archived = FALSE
            GROUP BY b.id, bm.role
            ORDER BY b.created_at DESC
            LIMIT 20
        """, (user_id, user_id, user_id, user_id))
        businesses = cur.fetchall()
        conn.commit()
        return {'businesses': businesses}

def get_business_details(conn, business_id, user_id):
    """Получить детальную информацию о бизнесе"""
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT b.*, 
                COUNT(DISTINCT bm.id) as member_count,
                COALESCE(SUM(CASE WHEN t.type = 'income' THEN t.amount ELSE -t.amount END), 0) as balance
            FROM businesses b
            LEFT JOIN business_members bm ON b.id = bm.business_id
            LEFT JOIN transactions t ON b.id = t.business_id
            WHERE b.id = %s
            GROUP BY b.id
        """, (business_id,))
        business = cur.fetchone()
        
        if not business:
            return {'error': 'Business not found'}
        
        cur.execute("""
            SELECT u.id, u.username, u.avatar_url, u.is_premium, bm.role
            FROM business_members bm
            JOIN users u ON bm.user_id = u.id
            WHERE bm.business_id = %s
            ORDER BY bm.joined_at ASC
        """, (business_id,))
        members = cur.fetchall()
        
        cur.execute("""
            SELECT * FROM business_notes WHERE business_id = %s ORDER BY updated_at DESC LIMIT 1
        """, (business_id,))
        note = cur.fetchone()
        
        conn.commit()
        business['members'] = members
        business['note'] = note
        return business

def create_business(conn, user_id, body):
    """Создать новый бизнес"""
    if not user_id:
        return {'error': 'User ID required'}
    
    is_online = body.get('is_online', False)
    online_code = None
    
    if is_online:
        with conn.cursor(cursor_factory=RealDictCursor) as cur:
            while True:
                online_code = generate_online_code()
                cur.execute("SELECT id FROM businesses WHERE online_code = %s", (online_code,))
                if not cur.fetchone():
                    break
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            INSERT INTO businesses (user_id, name, description, icon, color, is_online, online_code)
            VALUES (%s, %s, %s, %s, %s, %s, %s)
            RETURNING id, created_at, online_code
        """, (
            user_id,
            body['name'],
            body.get('description', ''),
            body.get('icon', '💼'),
            body.get('color', 'blue'),
            is_online,
            online_code
        ))
        result = cur.fetchone()
        
        if is_online:
            cur.execute("""
                INSERT INTO business_members (business_id, user_id, role)
                VALUES (%s, %s, 'owner')
            """, (result['id'], user_id))
        
        conn.commit()
        return {'success': True, 'business_id': result['id'], 'online_code': result['online_code']}

def update_business(conn, user_id, body):
    """Обновить бизнес"""
    if not user_id:
        return {'error': 'User ID required'}
    
    business_id = body.get('business_id')
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            UPDATE businesses 
            SET name = %s, description = %s, icon = %s, color = %s, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s AND user_id = %s
            RETURNING id
        """, (
            body.get('name'),
            body.get('description'),
            body.get('icon'),
            body.get('color'),
            business_id,
            user_id
        ))
        result = cur.fetchone()
        conn.commit()
        
        if result:
            return {'success': True}
        return {'error': 'Business not found or access denied'}

def archive_business(conn, user_id, body):
    """Архивировать бизнес (soft delete)"""
    if not user_id:
        return {'error': 'User ID required'}
    
    business_id = body.get('business_id')
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            UPDATE businesses 
            SET is_archived = TRUE, updated_at = CURRENT_TIMESTAMP
            WHERE id = %s AND user_id = %s
            RETURNING id
        """, (business_id, user_id))
        result = cur.fetchone()
        conn.commit()
        
        if result:
            return {'success': True}
        return {'error': 'Business not found or access denied'}

def create_transaction(conn, user_id, body):
    """Создать транзакцию"""
    if not user_id:
        return {'error': 'User ID required'}
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            INSERT INTO transactions (business_id, type, amount, category, description, created_by)
            VALUES (%s, %s, %s, %s, %s, %s)
            RETURNING id, created_at
        """, (
            body['business_id'],
            body['type'],
            body['amount'],
            body['category'],
            body.get('description', ''),
            user_id
        ))
        result = cur.fetchone()
        conn.commit()
        return {'success': True, 'transaction_id': result['id']}

def get_transactions(conn, business_id):
    """Получить транзакции бизнеса"""
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT t.*, u.username
            FROM transactions t
            LEFT JOIN users u ON t.created_by = u.id
            WHERE t.business_id = %s
            ORDER BY t.date DESC
            LIMIT 500
        """, (business_id,))
        transactions = cur.fetchall()
        conn.commit()
        return {'transactions': transactions}

def create_or_update_note(conn, user_id, body):
    """Создать или обновить заметку"""
    if not user_id:
        return {'error': 'User ID required'}
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT id FROM business_notes WHERE business_id = %s
        """, (body['business_id'],))
        existing = cur.fetchone()
        
        if existing:
            cur.execute("""
                UPDATE business_notes 
                SET content = %s, rich_text = %s, updated_at = CURRENT_TIMESTAMP
                WHERE business_id = %s
                RETURNING id
            """, (body['content'], json.dumps(body.get('rich_text', {})), body['business_id']))
        else:
            cur.execute("""
                INSERT INTO business_notes (business_id, content, rich_text, created_by)
                VALUES (%s, %s, %s, %s)
                RETURNING id
            """, (body['business_id'], body['content'], json.dumps(body.get('rich_text', {})), user_id))
        
        result = cur.fetchone()
        conn.commit()
        return {'success': True, 'note_id': result['id']}

def join_business(conn, user_id, body):
    """Присоединиться к онлайн-бизнесу по коду"""
    if not user_id:
        return {'error': 'User ID required'}
    
    online_code = body.get('online_code')
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT id, name FROM businesses WHERE online_code = %s AND is_online = TRUE
        """, (online_code,))
        business = cur.fetchone()
        
        if not business:
            return {'error': 'Бизнес с таким кодом не найден'}
        
        cur.execute("""
            INSERT INTO business_members (business_id, user_id, role)
            VALUES (%s, %s, 'member')
            ON CONFLICT (business_id, user_id) DO NOTHING
            RETURNING id
        """, (business['id'], user_id))
        result = cur.fetchone()
        conn.commit()
        
        if result:
            return {'success': True, 'business_id': business['id'], 'business_name': business['name']}
        return {'error': 'Вы уже участник этого бизнеса'}

def send_chat_message(conn, user_id, body):
    """Отправить сообщение в чат онлайн-бизнеса"""
    if not user_id:
        return {'error': 'User ID required'}
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            INSERT INTO business_chat (business_id, user_id, message)
            VALUES (%s, %s, %s)
            RETURNING id, created_at
        """, (body['business_id'], user_id, body['message']))
        result = cur.fetchone()
        conn.commit()
        return {'success': True, 'message_id': result['id'], 'created_at': result['created_at']}

def get_chat_messages(conn, business_id):
    """Получить сообщения чата"""
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT bc.*, u.username, u.avatar_url, u.is_premium
            FROM business_chat bc
            JOIN users u ON bc.user_id = u.id
            WHERE bc.business_id = %s
            ORDER BY bc.created_at ASC
            LIMIT 500
        """, (business_id,))
        messages = cur.fetchall()
        conn.commit()
        return {'messages': messages}

def get_active_advertisement(conn):
    """Получить активную рекламу"""
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT id, title, content, image_url, created_at
            FROM advertisements
            WHERE is_active = TRUE
            ORDER BY created_at DESC
            LIMIT 1
        """)
        ad = cur.fetchone()
        conn.commit()
        return {'advertisement': ad}