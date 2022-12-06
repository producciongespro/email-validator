import os
import time 
from dotenv import load_dotenv
from flask import Flask, render_template, request
from flask_socketio import SocketIO, send
from src.controller import *


load_dotenv()
app = Flask(__name__)
UPLOAD_FOLDER= os.getenv('UPLOAD_FOLDER')
DATA_STUDENTS= os.getenv('DATA_STUDENTS')
app.config['UPLOAD_FOLDER']= UPLOAD_FOLDER
app.config['DATA_STUDENTS']= DATA_STUDENTS

app.config['SECRET_KEY'] = "secreta"
socketio = SocketIO(app)

enrollment=""


@app.route("/")
def home ():
    global enrollment
    enrollment = loadEnrollment (app.config['DATA_STUDENTS'])   
    #print ("students", enrollment)
    return render_template(  "home.html")

@socketio.on('message')
def handleMEssage(msg):
    print ("Message", msg)
    resend()

def resend ():
    send("hola desde el server")
    time.sleep(2)
    send ("Hola de nuevo")
    time.sleep(2)
    send ("Nos vemos...")
    


@app.route('/validator', methods = ['POST'])
def upload_file():
    socketio.emit("test")  
    emails = read_file(request, 'file')
    print("emails", emails)
    socketio.emit("ddd") 
    res = validate_emails(emails, enrollment)     
    
    if res:
        return render_template(  "results.html", wrong_emails=res )
    return render_template(  "all-ggod.html" )
  



if __name__ == "__main__":
    app.run( debug=True )