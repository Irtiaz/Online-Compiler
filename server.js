// server.js (Backend)
const express = require('express');
const bodyParser = require('body-parser');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');
const app = express();

app.use(bodyParser.json());
app.use(express.static('public'));

app.post('/compile', (req, res) => {
    const { code, input } = req.body; // Accept both code and input
    const fileName = `temp_${Date.now()}.c`;
    const inputFile = `${fileName}.in`;
    const filePath = path.join(__dirname, fileName);

    // Save the code to a file
    fs.writeFileSync(filePath, code);

    // Save input to a file
    if (input) {
        fs.writeFileSync(inputFile, input);
    }

    // Compile the code
    exec(`gcc ${filePath} -o ${filePath}.out`, (compileErr) => {
        if (compileErr) {
            fs.unlinkSync(filePath);
            if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile);
            return res.send({ output: compileErr.message });
        }

        // Run the compiled program with input redirection
        const command = input ? `${filePath}.out < ${inputFile}` : `${filePath}.out`;
        exec(command, (runErr, stdout, stderr) => {
            fs.unlinkSync(filePath);
            fs.unlinkSync(`${filePath}.out`);
            if (fs.existsSync(inputFile)) fs.unlinkSync(inputFile);

            if (runErr) {
                return res.send({ output: stderr || runErr.message });
            }
            res.send({ output: stdout });
        });
    });
});

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

