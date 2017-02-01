from flask import Flask, render_template, request, app
import database_helper
import json

app = Flask(__name__)

@app.route('/')
def index():
    return render_template('client.html')


@app.cli.command('initdb')
def initdb_command():
    database_helper.init_db(app)
    print("db initialized")


@app.route('/signIn', methods=['POST'])
def sign_in():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        result = database_helper.find_user_by_email(email)
        if not result and password == result[1]:
            return_code = {'success': False, 'message': 'Wrong username or password'}
        else:
            token = generate_token(email)
            if not database_helper.add_logged_in_user(email, token):
                return_code = {'success': False, 'message': 'Could not log in user, try again'}
            else:
                return_code = {'success': True, 'message': 'User successfully logged in', 'data': token}

        return json.dumps(return_code)

def generate_token(email):
    # maybe upgrade
    return email


@app.route('/signUp', methods=['POST'])
def sign_up():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']
        firstname = request.form['firstname']
        familyname = request.form['familyname']
        gender = request.form['gender']
        city = request.form['city']
        country = request.form['country']

        return_code = validate_signup(email, password, firstname, familyname, gender, city, country)

        if return_code['success']:
            result = database_helper.add_user(email, password, firstname, familyname, gender, city, country)
            if result:
                return_code = {'success': True, 'message': 'User successfully created'}
            else:
                return_code = {'success': False, 'message': 'User already exists'}
        return json.dumps(return_code)



def validate_signup(email, password, firstname, familyname, gender, city, country):
    if not (len(password) >= 6):
        return {'success': False, 'message': 'Password to short'}
    if not (email and firstname and familyname and gender and city and country):
        return {'success': False, 'message': 'Enter valid info'}
    if not '@' in email:
        return {'success': False, 'message': 'Enter valid email'}
    return {'success': True}


@app.route('/signOut', methods=['POST'])
def sign_out():
    if request.method == 'POST':
        token = request.form['token']

        if database_helper.get_user_by_token(token):
            database_helper.remove_logged_in_user(token)
            return_code = {'success': True, 'message': 'User logged out'}
        else:
            return_code = {'success': False, 'message': 'Bad Token'}
        return json.dumps(return_code)



def change_password(token, old_password, new_password):
    pass


@app.route('/getToken', methods=['POST'])
def get_user_data_by_token():
    token = request.form['token']
    result = database_helper.find_user_by_token(token)

    if result:
        return_code = {'success': True, 'message': 'User found', 'data': result}
    else:
        return_code = {'success': False, 'message': 'User not found'}
    return json.dumps(return_code)


def get_user_data_by_email(token, email):
    pass


def get_user_messages_by_token(token):
    pass


def get_user_messages_by_email(token, email):
    pass


def post_message(token, message, email):
    pass
