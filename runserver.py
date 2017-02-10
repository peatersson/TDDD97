from gevent.wsgi import WSGIServer
from geventwebsocket.handler import WebSocketHandler
from Twidder import app

if __name__ == '__main__':
    http_server = WSGIServer(('', 5000), app, WebSocketHandler)
    http_server.serve_forever()