from flask import Flask, request, app, render_template
import database_helper
import json
from geventwebsocket.handler import WebSocketHandler
from gevent.pywsgi import WSGIServer


app = Flask(__name__, static_url_path='')


@app.route('/', methods=['GET', 'POST'])
def welcome_view():
    return app.send_static_file('client.html')


@app.cli.command('initdb')
def initdb_command():
    database_helper.init_db(app)
    print("db initialized")


@app.route('/signIn', methods=['POST'])
def sign_in():
    if request.method == 'POST':
        email = request.form['email']
        password = request.form['password']

        result = database_helper.get_user_by_email(email)
        if not (result and password == result[1]):
            return_code = create_return_code(False, 'Wrong username or password')
        else:
            token = generate_token(email)
            if not database_helper.add_logged_in_user(email, token):
                return_code = create_return_code(False, 'Could not log in user, try again')
            else:
                return_code = create_return_code(True, 'User successfully logged in', token)

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
                return_code = create_return_code(True, 'User successfully created')
            else:
                return_code = create_return_code(False, 'User already exists')
        return json.dumps(return_code)


def validate_password(password):
    return len(password) >= 6


def validate_signup(email, password, firstname, familyname, gender, city, country):
    if not validate_password(password):
        return create_return_code(False, 'Password to short')
    if not (email and firstname and familyname and gender and city and country):
        return create_return_code(False, 'Enter valid info')
    if not '@' in email:
        return create_return_code(False, 'Enter valid email')
    return create_return_code(True)


@app.route('/signOut', methods=['POST'])
def sign_out():
    if request.method == 'POST':
        token = request.form['token']

        if database_helper.get_logged_in_user_by_token(token):
            database_helper.remove_logged_in_user(token)
            return_code = create_return_code(True, 'User logged out')
        else:
            return_code = create_return_code(False, 'Bad Token')
        return json.dumps(return_code)


@app.route('/changePass', methods=['POST'])
def change_password():
    token = request.form['token']
    oldPass = request.form['old']
    newPass = request.form['new']

    user = database_helper.get_logged_in_user_by_token(token)

    if user:
        if validate_password(newPass):
            if check_password(token, oldPass):
                email = user[0]
                result = database_helper.update_password(email, newPass)
                if result:
                    return_code = create_return_code(True, 'Password changed')
                else:
                    return_code = create_return_code(False, 'Could not change password')
            else:
                return_code = create_return_code(False, 'Wrong password')
        else:
            return_code = create_return_code(False, 'Enter a valid password')
    else:
        return_code = create_return_code(False, 'Bad token')

    return json.dumps(return_code)


def check_password(token, password):
    result = database_helper.get_user_by_token(token)

    if result:
        return password == result[1]
    else:
        return False


@app.route('/getUserDataByToken', methods=['POST'])
def get_user_data_by_token():
    token = request.form['token']
    result = database_helper.get_user_by_token(token)

    if result:
        found_user = {'email': result[0], 'firstname': result[2], 'familyname': result[3], 'gender': result[4],
                      'city': result[5], 'country': result[6]}
        return_code = create_return_code(True, 'User found', found_user)
    else:
        return_code = create_return_code(False, 'User not found')
    return json.dumps(return_code)


@app.route('/getUserDataByEmail', methods=['POST'])
def get_user_data_by_email():
    token = request.form['token']
    email = request.form['email']

    if token_check(token):
        result = database_helper.get_user_by_email(email)
        if result:
            found_user = {'email': result[0], 'firstname': result[2], 'familyname': result[3], 'gender': result[4],
                          'city': result[5], 'country': result[6]}
            return_code = create_return_code(True, 'Userdata found', found_user)
        else:
            return_code = create_return_code(False, 'User not found')
    else:
        return_code = create_return_code(False, 'Bad token')

    return json.dumps(return_code)


def create_return_code(boolean, message="", data="-"):
    """ Help-function for creating return codes according to our protocol
    :param boolean: Boolean stating success query
    :param message: String describing the result (default is "")
    :param data: Data from the database-fetch (default is "-")
    :return: Dictionary containing the fields above
    """
    return {'success': boolean, 'message': message, 'data': data}


@app.route('/getUserMessagesByToken', methods=['POST'])
def get_user_messages_by_token():
    token = request.form['token']
    user = token_check(token)

    if user:
        result = database_helper.get_message_by_email(user[0])
        if result:
            messages = parse_messages(result)
            return_code = create_return_code(True, 'Messages retrieved', messages)
        else:
            return_code = create_return_code(False, 'Could not retrieve messages')
    else:
        return_code = create_return_code(False, 'Bad token')

    return json.dumps(return_code)


def parse_messages(messages):
    data = []
    for m in messages:
        data.append({'writer': m[0], 'content': m[2]})
    return data


@app.route('/getMessageByEmail', methods=['POST'])
def get_user_messages_by_email():
    token = request.form['token']
    email = request.form['email']

    if token_check(token):
        if email_check(email):
            result = database_helper.get_message_by_email(email)

            if result:
                messages = parse_messages(result)
                return_code = create_return_code(True, 'Messages retrieved', messages)
            else:
                return_code = create_return_code(False, 'Could not retrieve messages')
        else:
            return_code = create_return_code(False, 'User not found')
    else:
        return_code = create_return_code(False, 'Bad token')

    return json.dumps(return_code)


@app.route('/postMessage', methods=['POST'])
def post_message():
    token = request.form['token']
    receiver = request.form['email']
    message = request.form['message']
    sender = database_helper.get_logged_in_user_by_token(token)

    if sender:
        if email_check(receiver):
            sender_email = sender[0]
            result = database_helper.add_message(sender_email, receiver, message)

            if result:
                return_code = create_return_code(True, 'Message posted')
            else:
                return_code = create_return_code(False, 'Message could not be posted')
        else:
            return_code = create_return_code(False, 'User does not exist')
    else:
        return_code = create_return_code(False, 'Bad token')

    return json.dumps(return_code)

def token_check(token):
    return database_helper.get_logged_in_user_by_token(token)


def email_check(email):
    return database_helper.get_user_by_email(email)


@app.route('/api')
def api():
    if request.environ.get('wsgi.websocket'):
        ws = request.environ['wsgi.websocket']



        while True:
            message = ws.wait()
            ws.send(message)
    return ''


if __name__ == '__main__':
    app.debug = True
    http_server = WSGIServer(('', 5000), app, handler_class=WebSocketHandler)
    http_server.serve_forever()
