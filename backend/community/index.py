"""
API для управления вопросами, ответами и лайками в сообществе DEMAYNCHIK
"""
import json
import os
import psycopg2
from psycopg2.extras import RealDictCursor
from datetime import datetime

def get_db_connection():
    """Создание подключения к БД"""
    return psycopg2.connect(os.environ['DATABASE_URL'])

def handler(event: dict, context) -> dict:
    """Обработчик API запросов для сообщества"""
    method = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-User-Id',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    headers = event.get('headers', {})
    user_id = headers.get('x-user-id') or headers.get('X-User-Id')
    path = event.get('queryStringParameters', {}).get('path', '')
    
    try:
        conn = get_db_connection()
        
        if method == 'GET':
            if path == 'questions':
                result = get_questions(conn)
            elif path.startswith('question/'):
                question_id = path.split('/')[-1]
                result = get_question_with_answers(conn, question_id)
            else:
                result = {'error': 'Invalid path'}
        
        elif method == 'POST':
            body = json.loads(event.get('body', '{}'))
            
            if path == 'question':
                result = create_question(conn, user_id, body)
            elif path == 'answer':
                result = create_answer(conn, user_id, body)
            elif path == 'like':
                result = toggle_like(conn, user_id, body)
            elif path == 'user':
                result = create_or_update_user(conn, body)
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

def get_questions(conn):
    """Получить все вопросы с информацией об авторах"""
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT 
                q.id, q.title, q.content, q.category, q.created_at,
                u.id as user_id, u.username, u.avatar_url, u.is_premium,
                COUNT(DISTINCT a.id) as answer_count
            FROM questions q
            LEFT JOIN users u ON q.user_id = u.id
            LEFT JOIN answers a ON q.id = a.question_id
            GROUP BY q.id, u.id
            ORDER BY q.created_at DESC
        """)
        questions = cur.fetchall()
        conn.commit()
        return {'questions': questions}

def get_question_with_answers(conn, question_id):
    """Получить вопрос со всеми ответами и лайками"""
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT 
                q.id, q.title, q.content, q.category, q.created_at,
                u.id as user_id, u.username, u.avatar_url, u.is_premium
            FROM questions q
            LEFT JOIN users u ON q.user_id = u.id
            WHERE q.id = %s
        """, (question_id,))
        question = cur.fetchone()
        
        if not question:
            return {'error': 'Question not found'}
        
        cur.execute("""
            SELECT 
                a.id, a.content, a.created_at,
                u.id as user_id, u.username, u.avatar_url, u.is_premium,
                COUNT(DISTINCT al.id) as like_count
            FROM answers a
            LEFT JOIN users u ON a.user_id = u.id
            LEFT JOIN answer_likes al ON a.id = al.answer_id
            WHERE a.question_id = %s
            GROUP BY a.id, u.id
            ORDER BY like_count DESC, a.created_at ASC
        """, (question_id,))
        answers = cur.fetchall()
        
        for answer in answers:
            cur.execute("""
                SELECT user_id FROM answer_likes WHERE answer_id = %s
            """, (answer['id'],))
            answer['liked_by'] = [row[0] for row in cur.fetchall()]
        
        conn.commit()
        question['answers'] = answers
        return question

def create_question(conn, user_id, body):
    """Создать новый вопрос"""
    if not user_id:
        return {'error': 'User ID required'}
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            INSERT INTO questions (user_id, title, content, category)
            VALUES (%s, %s, %s, %s)
            RETURNING id, created_at
        """, (user_id, body['title'], body['content'], body['category']))
        result = cur.fetchone()
        conn.commit()
        return {'success': True, 'question_id': result['id'], 'created_at': result['created_at']}

def create_answer(conn, user_id, body):
    """Создать новый ответ"""
    if not user_id:
        return {'error': 'User ID required'}
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            INSERT INTO answers (question_id, user_id, content)
            VALUES (%s, %s, %s)
            RETURNING id, created_at
        """, (body['question_id'], user_id, body['content']))
        result = cur.fetchone()
        conn.commit()
        return {'success': True, 'answer_id': result['id'], 'created_at': result['created_at']}

def toggle_like(conn, user_id, body):
    """Поставить или убрать лайк"""
    if not user_id:
        return {'error': 'User ID required'}
    
    answer_id = body['answer_id']
    
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            SELECT id FROM answer_likes WHERE answer_id = %s AND user_id = %s
        """, (answer_id, user_id))
        existing = cur.fetchone()
        
        if existing:
            cur.execute("""
                DELETE FROM answer_likes WHERE answer_id = %s AND user_id = %s
            """, (answer_id, user_id))
            action = 'removed'
        else:
            cur.execute("""
                INSERT INTO answer_likes (answer_id, user_id) VALUES (%s, %s)
            """, (answer_id, user_id))
            action = 'added'
        
        cur.execute("""
            SELECT COUNT(*) as count FROM answer_likes WHERE answer_id = %s
        """, (answer_id,))
        count = cur.fetchone()['count']
        
        conn.commit()
        return {'success': True, 'action': action, 'like_count': count}

def create_or_update_user(conn, body):
    """Создать или обновить пользователя"""
    with conn.cursor(cursor_factory=RealDictCursor) as cur:
        cur.execute("""
            INSERT INTO users (username, email, avatar_url, is_premium, ip_address)
            VALUES (%s, %s, %s, %s, %s)
            ON CONFLICT (email) 
            DO UPDATE SET 
                username = EXCLUDED.username,
                avatar_url = EXCLUDED.avatar_url,
                is_premium = EXCLUDED.is_premium,
                ip_address = EXCLUDED.ip_address
            RETURNING id
        """, (
            body['username'],
            body['email'],
            body.get('avatar_url'),
            body.get('is_premium', False),
            body.get('ip_address')
        ))
        result = cur.fetchone()
        conn.commit()
        return {'success': True, 'user_id': result['id']}
