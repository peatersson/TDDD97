import _sqlite3
from flask import g

conn = _sqlite3.connect('database.db')
c = conn.cursor()


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
    return _sqlite3.connect('database.db')


def find_user(email):
    """c = connect_to_database()
    cursor = c.cursor()"""
    try:
        c.execute('''SELECT user FROM users WHERE email=? ''', email, )
        result = c.fetchone()
        return result[0]
    except:
        return False


def add_user(email, password, firstname, familyname, gender, city, country):
    user = [email, password, firstname, familyname, gender, city, country]

    try:
        conn.execute('''INSERT INTO users VALUES (?,?,?,?,?,?,?)''', user)
        conn.commit()
    except:
        return False

    return True
