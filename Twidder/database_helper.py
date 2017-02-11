import sqlite3
from flask import g


def init_db(app):
    db = get_db()
    with app.open_resource('database.sql', mode='r') as f:
        db.cursor().executescript(f.read())
    db.commit()


def get_db():
    db = getattr(g, '_database', None)
    if db is None:
        db = g._database = connect_to_database()
    return db


def connect_to_database():
    return sqlite3.connect('database.db')


def get_user_by_email(email):
    db = get_db()
    cur = db.cursor()
    try:
        cur.execute('''SELECT * FROM users WHERE email=?''', [email], )
        result = cur.fetchone()
        return [result[0], result[1], result[2], result[3], result[4], result[5], result[6], result[7]]
    except:
        return False


def get_user_by_token(token):
    db = get_db()
    cur = db.cursor()
    try:
        user = get_logged_in_user_by_token(token)
        cur.execute('''SELECT * FROM users WHERE email=?''', [user[0]], )
        result = cur.fetchone()
        return [result[0], result[1], result[2], result[3], result[4], result[5], result[6], result[7]]
    except:
        return False


def add_user(email, password, firstname, familyname, gender, city, country, salt):
    user = [email, password, firstname, familyname, gender, city, country, salt]
    db = get_db()
    try:
        db.execute('''INSERT INTO users VALUES (?,?,?,?,?,?,?,?)''', user, )
        db.commit()
        return True
    except:
        return False


def add_logged_in_user(email, token):
    user = [email, token]
    db = get_db()
    try:
        db.execute('''INSERT INTO loggedInUsers VALUES (?,?)''', user, )
        db.commit()
        return True
    except:
        return False


def get_logged_in_user_by_token(token):
    db = get_db()
    cur = db.cursor()
    try:
        cur.execute('''SELECT * FROM loggedInUsers WHERE token=?''', [token], )
        result = cur.fetchone()
        return result
    except:
        print("cant fetch user")
        return False


def get_logged_in_user_by_email(email):
    db = get_db()
    cur = db.cursor()
    try:
        cur.execute('''SELECT * FROM loggedInUsers WHERE email=?''', [email], )
        result = cur.fetchone()
        return result
    except:
        return False


def remove_logged_in_user(token):
    db = get_db()
    try:
        db.execute('''DELETE FROM loggedInUsers WHERE token=?''', [token], )
        db.commit()
        return True
    except:
        return False


def add_message(unique_id, sender_email, receiver, message):
    db = get_db()
    message_info = [unique_id, sender_email, receiver, message]
    try:
        db.execute('''INSERT INTO messages VALUES (?,?,?,?)''', message_info, )
        db.commit()
        return True
    except:
        return False


def get_message_by_email(email):
    db = get_db()
    cur = db.cursor()
    try:
        cur.execute('''SELECT * FROM messages WHERE toUser=?''', [email], )
        result = cur.fetchall()
        return result
    except:
        return False


def update_password(email, newPass):
    db = get_db()
    info = [newPass, email]
    try:
        db.execute('''UPDATE users SET password =? WHERE email =?''', info, )
        db.commit()
        return True
    except:
        return False


def delete_message(message_id):
    db = get_db()
    try:
        db.execute('''DELETE FROM messages WHERE id = ?''', [message_id], )
        db.commit()
        return True
    except:
        return False





