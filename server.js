import cors from "cors";
import dotenv from "dotenv";
import express from "express";
import fs from "fs";
import path from "path";

dotenv.config();

// Initialize App
const app = express();
app.use(cors());
const __dirname = path.resolve();

app.get('/UF/', (req, res) => {
  res.header("Content-Type",'application/json');
  const sickImmunizer = req.query.sickImmunizer;
  const local = req.query.local;
  if (sickImmunizer) {
    if (sickImmunizer.includes(",")) {
      const result = {};
      for (let arg of sickImmunizer.split(",")) {
        result[arg] =
          JSON.parse(fs.readFileSync(
            path.join(
              __dirname,
              `./api/UF/${local}/sicks/${arg}.json`
            )
          ));
      }
      res.send(result);
    } else {
      res.sendFile(path.join(__dirname, `./api/UF/${local}/sicks/${sickImmunizer}.json`));
    }

    return;
  }
  
  const citiesAcronym = req.query.citiesAcronym;
  res.sendFile(path.join(__dirname, `./api/UF/${local}/${citiesAcronym}.json`));
});

app.get('/:arg', (req, res) => {
  res.header("Content-Type",'application/json');
  res.sendFile(path.join(__dirname, `./api/${req.params.arg}.json`));
});

app.get('/', (req, res) => {
  res.header("Content-Type",'application/json');
  const sickImmunizer = req.query.sickImmunizer;
  if (sickImmunizer) {
    if (sickImmunizer.includes(",")) {
      const sickImmunizers = sickImmunizer.split(",");
      const result = {};
      for (let arg of sickImmunizers) {
        result[arg] =
          JSON.parse(fs.readFileSync(
            path.join(
              __dirname,
              `./api/sicks/${arg}.json`
            )
          ));
      }
      res.send(result);

    } else {
      res.sendFile(path.join(__dirname, `./api/sicks/${req.query.sickImmunizer}.json`));
    }
    return;
  }
  const citiesAcronym = req.query.citiesAcronym;
  if (citiesAcronym) {
    res.sendFile(path.join(__dirname, `./api/${'citiesAcronym' + citiesAcronym}.json`));
  }
});

const port = process.env.SERVER_HOST_PORT;
app.listen(port, () => {
  console.log(`\nServer started at ${port}!\n`);
});

