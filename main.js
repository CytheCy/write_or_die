const { spawn } = require('child_process');
const pythonProcess = spawn('python', ["script.py", "arg1"]);

pythonProcess.stdout.on('data', (data) => {
    console.log(`Python says: ${data}`);
});