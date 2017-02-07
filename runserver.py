from gevent.wsgi import WSGIServer
from Twidder import app

http_server = WSGIServer(('', 4000), app)
http_server.serve_forever()