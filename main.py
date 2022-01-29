from os import environ
from flask import Flask, render_template, make_response, jsonify
from flask_restful import Api, Resource, request, fields, marshal_with, reqparse

from flask_praetorian import Praetorian, current_user, auth_required, exceptions
from flask_cors import CORS
from app import app, db
from model import User
from sqlalchemy import exc

guard = Praetorian()
cors = CORS()

guard.init_app(app, User)
cors.init_app(app)

api = Api(app)


class Records(db.Model):
    recordId = db.Column(db.Integer, primary_key = True)
    dateKey = db.Column(db.BigInteger)
    userId = db.Column(db.Integer, nullable = False)
    contentType = db.Column(db.String(20), nullable = False)
    content = db.Column(db.String(), nullable = False)
    complete = db.Column(db.String(10), default = "false")

    #def __repr__(self):
    #    return f"Records(dateKey = {self.datekey}, contentType = {self.contentType}, content = {self.content}, complete = {self.complete})"


record_put_args = reqparse.RequestParser()
record_put_args.add_argument("dateKey", type=int, required=True)
record_put_args.add_argument("userId", type=int, required=True)
record_put_args.add_argument("contentType", type=str, required=True)
record_put_args.add_argument("content", type=str, required=True)
record_put_args.add_argument("complete", type=str, required=True)
resource_fields = {
    'dateKey': fields.Integer,
    'userId': fields.Integer,
    'contentType': fields.String,
    'content': fields.String,
    'complete': fields.String
}

class Main(Resource):
    def get(self):
        return make_response(render_template('index.html'), 200)
    
    @marshal_with(resource_fields)
    @auth_required
    def post(self):
        print("Запрос получения записей для / получен:")

        print(current_user().username)
        
        records = Records.query.filter_by(userId = current_user().id).all()
        
        return records,202

class UsersRoutes(Resource):
    @auth_required
    def get(self):
        user = current_user()
        return {
            "username": user.username,
            "sex": user.sex,
            "rememberPassword": user.rememberPassword
        }, 200
        

    def post(self):                              #login
        username = request.form['username']
        password = request.form['password']
        remem = request.form['rememberPassword']
        if remem == 'false':
            remem = False
        else:
            remem = True
        try:
            user = guard.authenticate(username, password)
            ret = {"access_token": guard.encode_jwt_token(user), "username": user.username, "sex": user.sex}
            
            user.rememberPassword = remem
            db.session.add(user)
            db.session.commit()
            print(f"Обновили rememberPassword для {user.username}")
            
            return ret, 200
        except exceptions.AuthenticationError as err:
            print("Неверный пароль " + str(err))
            return {"error":"password"},401
        except exceptions.MissingUserError as err:
            print("Неверный логин " + str(err))
            return {"error":"username"},401
        except Exception as err:
            print("Неизвестная ошибка " + str(err))
            return 400

    def put(self):                              #registration
        print("Запрос на добавление нового пользователя:")
        
        username = request.form['username']
        password = request.form['password']
        sex = request.form['sex']
        print(username,password)
        
        if User.query.filter_by(username = username).first() != None:
            print("Ошибка в уникальности")
            return {"error":"UniqueError"},409
        
        #добавляем в таблицу Users нового пользователя
        db.session.add(
            User(
                username = username,
                hashed_password = guard.hash_password(password),
                sex = sex
            )
        )
        db.session.commit()

        return 201
        



class NoteRoutes(Resource):

    @auth_required
    def put(self):
        print("Запрос post для /note получен:")
        print(request.form['dateKey'],request.form['content'])
        print(current_user().username)
        newNote = Records(dateKey = request.form['dateKey'],userId = current_user().id, contentType = request.form['contentType'], content = request.form['content'], complete = request.form['complete'])
        try:
            db.session.add(newNote)
            db.session.commit()
            return 201
        except Exception as err:
            print("Сбой в базе данных: " + str(err))
            return 400

    @auth_required
    def patch(self):
        print("Запрос patch для /note получен:")
        print(request.form['keyDate'],request.form['newContent'],request.form['completed'])
    
        patchNote = Records.query.filter_by(userId = current_user().id,dateKey = request.form['keyDate'], contentType = "note").first()
        patchNote.content = request.form['newContent']
        if (request.form['completed'] == 'true'):
            patchNote.complete = 'true'
        try:
            db.session.add(patchNote)
            db.session.commit()
            return 202
        except Exception as err:
            print("Сбой в базе данных: " + str(err))
            return 400
        
    @auth_required
    def delete(self):
        print("Запрос delete для /note получен:")
        recordKey = request.form['recordKey']
        print(recordKey)
        
        delNote = Records.query.filter_by(userId = current_user().id,dateKey = recordKey, contentType = "note").first()

        try:
            db.session.delete(delNote)
            db.session.commit()
            return 204
        except Exception as err:
            print("Сбой в базе данных: " + str(err))
            return 400



class MemoryRoutes(Resource):

    @auth_required
    def put(self):
        print("Запрос post для /memory получен:")
        print(request.form['dateKey'],request.form['content'])
        print(current_user().id)
        newMemory = Records(dateKey = request.form['dateKey'],userId = current_user().id, contentType = request.form['contentType'], content = request.form['content'], complete = request.form['complete'])
        try:
            db.session.add(newMemory)
            db.session.commit()
            return 201
        except Exception as err:
            print("Сбой в базе данных: " + str(err))
            return 400

    @auth_required
    def patch(self):
        print("Запрос patch для /memory получен:")
        print(request.form['keyDate'],request.form['newContent'],request.form['completed'])
        
        patchMemory = Records.query.filter_by(userId = current_user().id,dateKey = request.form['keyDate'], contentType = "memory").first()
        patchMemory.content = request.form['newContent']
        
        try:
            db.session.add(patchMemory)
            db.session.commit()
            return 202
        except Exception as err:
            print("Сбой в базе данных: " + str(err))
            return 400
        
    @auth_required
    def delete(self):
        print("Запрос delete для /note получен:")
        recordKey = request.form['recordKey']
        print(recordKey)
        
        delMemory = Records.query.filter_by(userId = current_user().id,dateKey = recordKey, contentType = "memory").first()

        try:
            db.session.delete(delMemory)
            db.session.commit()
            return 204
        except Exception as err:
            print("Сбой в базе данных: " + str(err))
            return 400


api.add_resource(Main, "/")
api.add_resource(UsersRoutes,"/user")
api.add_resource(NoteRoutes,"/note")
api.add_resource(MemoryRoutes,"/memory")

if __name__ == "__main__":
    print('Инициализация базы данных...')
    db.create_all()
    print('Запуск приложения...')
    app.run(debug=False, port="80")
    print('Приложение запустилось!')
