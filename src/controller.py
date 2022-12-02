import os
import csv
from werkzeug.utils import secure_filename


ALLOWED_EXTENSIONS = set (['csv', 'xlsx', 'pdf' ])
DELIMITER=','


def allowedFile(file):
    file = file.split(".")
    if file[1] in ALLOWED_EXTENSIONS:
        return True
    return False


def uploadFile (req, name, folder ):
    file = req.files[name]
    filename = secure_filename(file.filename) 
    #print (file)
    #print (filename)
    if file and  allowedFile(filename):
        file.save(os.path.join( folder, filename ))
        return os.path.join( folder, filename )
    return False

def read_file (request, name ):
    emails = []
    for line in request.files.get(name):
        string = str(line)
        record = string.split("'")        
        record = record[1]
        email = record.split(",")[0]
        emails.append(email)
    return emails

def loadEnrollment (pathFile):
    students=[]    
    with open(pathFile, newline='') as csvfile:
        spamreader = csv.reader(csvfile, delimiter=DELIMITER, quotechar='|')
        for row in spamreader:                       
            students.append(row[0])
    return students



def readCSV (pathFile):
    emails=[]    
    with open(pathFile, newline='') as csvfile:
        spamreader = csv.reader(csvfile, delimiter=DELIMITER, quotechar='|')
        for row in spamreader:            
            emails.append(row[0])
    return emails

def getCorreoErroneo (matricula, correo):  
    encontrado = False
    for item in matricula:
        #print(item, "-------------", correo        )
        if correo == item:             
            encontrado = True
    if encontrado:
        retorno = False
    else:
        retorno = correo
    return retorno

def validate_emails (emails, enrollment):

    incorrectos = []
    i=0
    print ("Verificando correos erróneos. Por favor espere....")
    for email in emails:
        i+=1        
        tmp = getCorreoErroneo(enrollment, email )        
        if tmp:
            incorrectos.append( "(" + str(i) +") "+ tmp)
    return incorrectos





"""""
def validator ():
    file = request.files['file']
    filename = secure_filename(file.filename) 
    print (filename)
    if file and  allowedFile(filename):
        file.save(os.path.join( app.config ['UPLOAD_FOLDER'], filename ))

    result = ALLOWED_EXTENSIONS

    return render_template("results.html", result=result )

"""""