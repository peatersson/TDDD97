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


def find_user_by_email(email):
    db = get_db()
    cur = db.cursor()
    try:
        cur.execute('''SELECT * FROM users WHERE email=?''', [email], )
        result = cur.fetchall()
        return result
    except:
        return False


def find_user_by_token(token):
    db = get_db()
    cur = db.cursor()
    try:
        user = get_user_by_token(token)
        cur.execute('''SELECT * FROM users WHERE email=?''', [user[0]], )
        result = cur.fetchall()
        return result
    except:
        return False



def add_user(email, password, firstname, familyname, gender, city, country):
    user = [email, password, firstname, familyname, gender, city, country]
    db = get_db()
    try:
        db.execute('''INSERT INTO users VALUES (?,?,?,?,?,?,?)''', user, )
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


def get_user_by_token(token):
    db = get_db()
    cur = db.cursor()
    try:
        cur.execute('''SELECT * FROM loggedInUsers WHERE token=?''', [token], )
        result = cur.fetchall()
        return result
    except:
        return False


def remove_logged_in_user(token):
    db = get_db()
    try:
        c.execute('''DELETE FROM loggedInUsers WHERE token=?''', [token], )
        c.commit()
    except:
        return False






