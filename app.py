from flask import Flask
from flask_sqlalchemy import SQLAlchemy

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'postgres://postgres:root@2.133.103.36:5432/day_to_day'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
print('Подключение к базе данных...')
db = SQLAlchemy(app)


app.config["SECRET_KEY"] = "top secret"
app.config["JWT_ACCESS_LIFESPAN"] = {"hours": 24}
app.config["JWT_REFRESH_LIFESPAN"] = {"days": 30}