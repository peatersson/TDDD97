from flask import Flask, render_template, request, app
import _json
import database_helper

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('client.html')


@app.cli.command('initdb')
def initdb_command():
    database_helper.init_db(app)
    print("db initialized")


def sign_in(email, password):
    # find user
    # add to logged in users
    pass


@app.route('/signUp', methods=['POST'])
def sign_up():
    if request.method == 'POST':
        email = request.form['email']
        # ta fram alla värden och använd som input i databasen

        result = database_helper.add_user('test1', 'test', 'test', 'test', 'test', 'test', 'test')
        if result:
            return email

        return "nej"

def sign_out(token):
    pass


def change_password(token, old_password, new_password):
    pass


def get_user_data_by_token(token):
    pass


def get_user_data_by_email(token, email):
    pass


def get_user_messages_by_token(token):
    pass


def get_user_messages_by_email(token, email):
    pass


def post_message(token, message, email):
    pass
