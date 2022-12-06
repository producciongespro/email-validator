import os
import time
from dotenv import load_dotenv
from flask import Flask, render_template, request
from src.controller import *


load_dotenv()
app = Flask(__name__)
app.config['UPLOAD_FOLDER']= os.getenv('UPLOAD_FOLDER')
app.config['DATA_STUDENTS']= os.getenv('DATA_STUDENTS')
app.config['FILE_NAME']= os.getenv('FILE_NAME')


enrollment=""


@app.route("/")
def home ():
    global enrollment
    enrollment = load_enrollment (app.config['DATA_STUDENTS'])   
    #print ("students", enrollment)
    return render_template(  "home.html")


@app.route('/validator', methods = ['POST'])
def upload_file():
    file = request.files.get(app.config['FILE_NAME'])
    #print("request.files >>>>>>--------", file.filename )
    if file.filename == "":
        return render_template(  "not-valid.html" )
    else:            
        emails = read_file(request, file)    
        res = validate_emails(emails, enrollment)
        time.sleep(2)
        if res:
            return render_template(  "results.html", wrong_emails=res )
        return render_template(  "all-ggod.html" )
  



if __name__ == "__main__":
    app.run( debug=True )