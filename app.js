import 'dotenv/config';
import express from 'express';
import multer from 'multer';
import fs from 'node:fs';
import path from 'node:path';
import { Readable } from 'node:stream';
import { parse as csvParse } from 'csv-parse';

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_STUDENTS = process.env.DATA_STUDENTS || './data/students.csv';
const FILE_FIELDNAME = process.env.FILE_FIELDNAME || 'file';

// sirve archivos estáticos (frontend)
const publicDir = path.join(process.cwd(), 'public');
app.use(express.static(publicDir));

// límites y almacenamiento en memoria para subidas
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 } // 5 MB
});

/** Normaliza correos */
const normalize = (s) => (s ?? '')
  .replace('\ufeff', '')
  .trim()
  .toLowerCase();

/** Carga la matrícula (CSV primera columna) a un Set */
async function loadEnrollment(pathFile) {
  return new Promise((resolve, reject) => {
    const set = new Set();
    if (!fs.existsSync(pathFile)) return reject(new Error(`No existe ${pathFile}`));
    fs.createReadStream(pathFile, { encoding: 'utf8' })
      .pipe(csvParse({ delimiter: ',', bom: true }))
      .on('data', (row) => {
        if (!row?.length) return;
        const email = normalize(row[0]);
        if (!email || ['email', 'correo', 'mail'].includes(email)) return;
        set.add(email);
      })
      .on('end', () => resolve(set))
      .on('error', reject);
  });
}

let ENROLLMENT_SET = null;

// precarga matrícula
(async () => {
  ENROLLMENT_SET = await loadEnrollment(DATA_STUDENTS);
  console.log(`Matrícula cargada: ${ENROLLMENT_SET.size} correos.`);
})().catch((e) => {
  console.error('Error cargando matrícula:', e);
  process.exit(1);
});

// healthcheck simple
app.get('/health', (_, res) => res.json({ ok: true }));

/**
 * POST /validator
 * espera multipart/form-data con un campo 'file' (CSV)
 * responde JSON con filas erróneas
 */
app.post('/validator', upload.single(FILE_FIELDNAME), async (req, res) => {
  if (!ENROLLMENT_SET) {
    return res.status(503).json({ ok: false, message: 'Matrícula no cargada aún.' });
  }

  if (!req.file || !req.file.originalname) {
    return res.status(400).json({ ok: false, message: 'No se envió archivo.' });
  }

  const isCsv = req.file.mimetype?.includes('csv') || req.file.originalname.toLowerCase().endsWith('.csv');
  if (!isCsv) {
    return res.status(400).json({ ok: false, message: 'Solo se permite CSV.' });
  }

  const wrongEmails = [];
  const correctEmails = [];
  let index = 0;

  try {
    const readable = Readable.from([req.file.buffer]);
    readable
      .pipe(csvParse({ delimiter: ',', bom: true }))
      .on('data', (row) => {
        if (!row?.length) return;
        index += 1;
        const email = normalize(row[0]);
        if (!email || ['email', 'correo', 'mail'].includes(email)) return;

        if (ENROLLMENT_SET.has(email)) {
          // está en students.csv → correcto
          correctEmails.push({ index, email });
        } else {
          // no está → erróneo
          wrongEmails.push({ index, email });
        }
      })
      .on('end', () => {
        res.json({
          ok: true,
          totalRows: index,
          wrongCount: wrongEmails.length,
          wrongEmails,
          correctCount: correctEmails.length,
          correctEmails
        });
      })
      .on('error', (err) => {
        res.status(500).json({ ok: false, message: `Error leyendo CSV: ${err.message}` });
      });
  } catch (err) {
    res.status(500).json({ ok: false, message: `Error procesando archivo: ${err.message}` });
  }
});


// fallback a index.html para rutas no encontradas (SPA-friendly)
app.get('*', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.listen(PORT, () => {
  console.log(`✅ Ready on http://localhost:${PORT}`);
});
