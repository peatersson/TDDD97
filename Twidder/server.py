from flask import Flask, request, app, render_template
from geventwebsocket.handler import WebSocketHandler
from gevent import pywsgi
from geventwebsocket import WebSocketError
import database_helper
import json
import hashlib, uuid

#python -m flask initdb

app = Flask(__name__, static_url_path='')

_LOGGED_OUT_ = 1
current_sockets = dict()


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
        if not result:
            return_code = create_return_code(False, 'Wrong username or password')
        else:
            hashed_password = hashlib.sha512(password + result[7]).hexdigest()

            if hashed_password == result[1]:
                token = generate_token()
                logged_in_status = database_helper.get_logged_in_user_by_email(email)
                if logged_in_status:
                    database_helper.remove_logged_in_user(logged_in_status[1])
                    if email in current_sockets.keys():
                        ws = current_sockets[email]
                        status = create_return_code(False, 'Session logged out', {'statusCode': _LOGGED_OUT_})
                        ws.send(json.dumps(status))
                        del current_sockets[email]

                database_helper.add_logged_in_user(email, token)
                return_code = create_return_code(True, 'User successfully logged in', token)
            else:
                return_code = create_return_code(False, 'Wrong username or password')
        return json.dumps(return_code)


def generate_token():
    """ Generates a fairly random token """
    return str(uuid.uuid4())


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
            salt = uuid.uuid4().hex
            password_hash = hashlib.sha512(password + salt).hexdigest()
            result = database_helper.add_user(email, password_hash, firstname, familyname, gender, city, country, salt)
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
        email = request.form['email']
        hash = request.form['hash']
        user = database_helper.get_logged_in_user_by_email(email)

        if user:
            params = "&email="+email+"&hash="
            token = user[1]
            if check_hash(hash, params, token):
                database_helper.remove_logged_in_user(token)
                return_code = create_return_code(True, 'User logged out')
            else:
                return_code = create_return_code(False, 'Bad Token')
        else:
            return_code = create_return_code(False, 'You are not logged in')
        return json.dumps(return_code)


@app.route('/changePass', methods=['POST'])
def change_password():
    hash = request.form['hash']
    oldPass = request.form['old']
    newPass = request.form['new']
    email = request.form['email']

    logged_in_user = database_helper.get_logged_in_user_by_email(email)

    if logged_in_user:
        token = logged_in_user[1]
        params = "&email=" + email + "&old=" + oldPass + "&new=" + newPass + "&hash="
        if check_hash(hash, params, token):
            if validate_password(newPass):
                if check_password(token, oldPass):
                    user = database_helper.get_user_by_email(email)
                    salt = user[7]
                    result = database_helper.update_password(email, create_hash(newPass, salt))
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
    else:
        return_code = create_return_code(False, 'You are not logged in')

    return json.dumps(return_code)


def create_hash(password, salt):
    return hashlib.sha512(password + salt).hexdigest()


def check_hash(hash, params, token):
    return hashlib.sha512(params + token).hexdigest() == hash


def check_password(token, password):
    result = database_helper.get_user_by_token(token)
    salt = result[7]
    password_hash = hashlib.sha512(password + salt).hexdigest()
    if result:
        return password_hash == result[1]
    else:
        return False


@app.route('/getUserDataByToken', methods=['POST'])
def get_user_data_by_token():
    email = request.form['email']
    hash = request.form['hash']
    user = database_helper.get_logged_in_user_by_email(email)

    if user:
        params = "&email="+email+"&hash="
        token = user[1]
        result = database_helper.get_user_by_email(email)
        if check_hash(hash, params, token):
            found_user = {'email': result[0], 'firstname': result[2], 'familyname': result[3], 'gender': result[4],
                          'city': result[5], 'country': result[6]}
            return_code = create_return_code(True, 'User found', found_user)
        else:
            return_code = create_return_code(False, 'Bad token')
    else:
        return_code = create_return_code(False, 'User not found')
    return json.dumps(return_code)


@app.route('/getUserDataByEmail', methods=['POST'])
def get_user_data_by_email():
    hash = request.form['hash']
    email = request.form['email']
    searched = request.form['searched']
    user = database_helper.get_logged_in_user_by_email(email)

    if user:
        token = user[1]
        params = "&email="+email+"&searched="+searched+"&hash="
        if check_hash(hash, params, token):
            result = database_helper.get_user_by_email(searched)
            if result:
                found_user = {'email': result[0], 'firstname': result[2], 'familyname': result[3], 'gender': result[4],
                              'city': result[5], 'country': result[6]}
                return_code = create_return_code(True, 'Userdata found', found_user)
            else:
                return_code = create_return_code(False, 'User not found')
        else:
            return_code = create_return_code(False, 'Bad token')
    else:
        return_code = create_return_code(False, 'You are not logged in')
    return json.dumps(return_code)


def create_return_code(boolean, message="", data="-"):
    """ Help-function for creating return codes according to our protocol
    :param boolean: Boolean stating query success
    :param message: String describing the result (default is "")
    :param data: Data that is to be sent (default is "-")
    :return: Dictionary containing the fields above
    """
    return {'success': boolean, 'message': message, 'data': data}


@app.route('/getUserMessagesByToken', methods=['POST'])
def get_user_messages_by_token():
    email = request.form['email']
    hash = request.form['hash']
    user = database_helper.get_logged_in_user_by_email(email)

    if user:
        params = "&email="+email+"&hash="
        token = user[1]
        if check_hash(hash, params, token):
            result = database_helper.get_message_by_email(user[0])
            if result:
                messages = parse_messages(result)
                return_code = create_return_code(True, 'Messages retrieved', messages)
            else:
                return_code = create_return_code(False, 'Could not retrieve messages')
        else:
            return_code = create_return_code(False, 'Bad token')
    else:
        return_code = create_return_code(False, 'You are not logged in')
    return json.dumps(return_code)


def parse_messages(messages):
    data = []
    for m in messages:
        data.append({'id': m[0], 'writer': m[1], 'content': m[3]})
    return data


@app.route('/getMessageByEmail', methods=['POST'])
def get_user_messages_by_email():
    hash = request.form['hash']
    email = request.form['email']
    searched = request.form['searched']

    user = database_helper.get_logged_in_user_by_email(email)
    if user:
        params = "&email="+email+"&searched="+searched+"&hash="
        token = user[1]
        if check_hash(hash, params, token):
            if email_check(searched):
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
    else:
        return_code = create_return_code(False, 'You are not logged in')

    return json.dumps(return_code)


@app.route('/postMessage', methods=['POST'])
def post_message():
    sender = request.form['email']
    receiver = request.form['toEmail']
    message = request.form['message']
    hash = request.form['hash']
    user = database_helper.get_logged_in_user_by_email(sender)
    if user:
        params = "&email="+sender+"&toEmail="+receiver+"&message="+message+"&hash="
        token = user[1]
        if check_hash(hash, params, token):
            if email_check(receiver):
                unique_id = generate_token()
                result = database_helper.add_message(unique_id, sender, receiver, message)

                if result:
                    return_code = create_return_code(True, 'Message posted')
                else:
                    return_code = create_return_code(False, 'Message could not be posted')
            else:
                return_code = create_return_code(False, 'User does not exist')
        else:
            return_code = create_return_code(False, 'Bad token')
    else:
        return_code = create_return_code(False, 'You are not logged in')

    return json.dumps(return_code)


def token_check(token):
    return database_helper.get_logged_in_user_by_token(token)


def email_check(email):
    return database_helper.get_user_by_email(email)


@app.route('/socket')
def socket_connection():
    if request.environ.get('wsgi.websocket'):
        ws = request.environ['wsgi.websocket']

        try:
            msg = ws.receive()
            data = json.loads(msg)
        except WebSocketError as e:
            print(e)

        if data:
            params = data['email']
            hashed_params = data['hash']
            user = database_helper.get_logged_in_user_by_email(data['email'])

            if user:
                token = user[1]
                if check_hash(hashed_params, params, token):
                    current_sockets[data['email']] = ws

        try:
            while True:
                # handle incoming request via sockets
                msg = ws.receive()
        except WebSocketError as e:
            # user probably refreshed the page -> remove the corresponding socket
            for key in current_sockets.keys():
                if current_sockets[key] == ws:
                    del current_sockets[key]
                    break
    return ''


@app.route('/deleteMessage', methods=['POST'])
def delete_message():
    message_id = request.form['id']
    hash = request.form['hash']
    email = request.form['email']
    user = database_helper.get_logged_in_user_by_email(email)

    if user:
        token = user[1]
        params = "&email="+email+"&id="+message_id+"&hash="

        if check_hash(hash, params, token):
            result = database_helper.delete_message(message_id)
            if result:
                return_code = create_return_code(True, "Message deleted")
            else:
                return_code = create_return_code(False, "Message could not be deleted")
        else:
            return_code = create_return_code(False, "Bad token")
    else:
        return_code = create_return_code(False, "You are not logged in")
    return json.dumps(return_code)


if __name__ == '__main__':
    http_server = pywsgi.WSGIServer(('', 5000), app, handler_class=WebSocketHandler)
    http_server.serve_forever()

