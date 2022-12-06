import os
from dotenv import load_dotenv
from flask import Flask, render_template, request
from src.controller import *


load_dotenv()
app = Flask(__name__)
UPLOAD_FOLDER= os.getenv('UPLOAD_FOLDER')
DATA_STUDENTS= os.getenv('DATA_STUDENTS')
app.config['UPLOAD_FOLDER']= UPLOAD_FOLDER
app.config['DATA_STUDENTS']= DATA_STUDENTS
enrollment=""


@app.route("/")
def home ():
    global enrollment
    enrollment = loadEnrollment (app.config['DATA_STUDENTS'])   
    print ("students", enrollment)
    return render_template(  "home.html")


@app.route('/validator', methods = ['POST'])
def upload_file():
    emails = read_file(request, 'file')    
    res = validate_emails(emails, enrollment)

    if res:
        return render_template(  "results.html", wrong_emails=res )
    return render_template(  "all-ggod.html" )
  



if __name__ == "__main__":
    app.run( debug=True )