import os
import csv
from werkzeug.utils import secure_filename


ALLOWED_EXTENSIONS = set (['csv', 'xlsx', 'pdf' ])
DELIMITER=','


def allowed_file(file):
    file = file.split(".")
    if file[1] in ALLOWED_EXTENSIONS:
        return True
    return False


def upload_file (req, name, folder ):
    file = req.files[name]
    filename = secure_filename(file.filename) 
    #print (file)
    #print (filename)
    if file and  allowed_file(filename):
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

def load_enrollment (pathFile):
    students=[]    
    with open(pathFile, newline='') as csvfile:
        spamreader = csv.reader(csvfile, delimiter=DELIMITER, quotechar='|')
        for row in spamreader:                       
            students.append(row[0])
    return students



def read_csv (pathFile):
    emails=[]    
    with open(pathFile, newline='') as csvfile:
        spamreader = csv.reader(csvfile, delimiter=DELIMITER, quotechar='|')
        for row in spamreader:            
            emails.append(row[0])
    return emails

def get_wrong_email (enrollment, email):  
    found = False
    for item in enrollment:
        #print(item, "-------------", correo        )
        if email == item:             
            found = True
    if found:
        return False
    else:
        return email
    


def validate_emails (emails, enrollment):
    wrongs = []
    i=0
    print ("Verificando correos erróneos. Por favor espere....")
    for email in emails:
        i+=1        
        tmp = get_wrong_email(enrollment, email )        
        if tmp:
            wrongs.append( "(" + str(i) +") "+ tmp)
    return wrongs





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