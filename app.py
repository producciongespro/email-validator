import os
from dotenv import load_dotenv
from flask import Flask, render_template, request
from src.controller import *


load_dotenv()
app = Flask(__name__)
UPLOAD_FOLDER= os.getenv('UPLOAD_FOLDER')
app.config['UPLOAD_FOLDER']= UPLOAD_FOLDER
enrollment=""


@app.route("/")
def home ():
    global enrollment
    enrollment = loadEnrollment ('static/data/students.csv')   
    print ("students", enrollment)
    return render_template(  "home.html")


@app.route('/uploader', methods = ['POST'])
def upload_file():
    pathFile = uploadFile(request, 'file', app.config['UPLOAD_FOLDER'] )
    print("pathFile", pathFile)
    emails = readCSV(pathFile)
    res = validate_emails(emails, enrollment)
    

    return render_template(  "results.html", wrong_emails=res )
    






if __name__ == "__main__":
    app.run( debug=True )