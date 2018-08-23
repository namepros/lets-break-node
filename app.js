const http = require('http');
const util = require('util');
const fs = require('fs');

const hostname = '127.0.0.1';
const port1 = 3000;
const port2 = 4000;

const server1 = http.createServer((req, res) => {
	res.statusCode = 200;
	res.setHeader('Content-Type', 'text/html; charset=utf-8');

	let x = 0;
	for (let i = 0; i < 1000000000; i++) {
		x += 1;
	}

	res.end(`<!DOCTYPE html><html><head></head><body style="background:white">Result: ${x}</body></html>`);
});

const readFileAsync = util.promisify(fs.readFile);
let persistentVar = 0;
let expectedVar = 0;

const server2 = http.createServer(async (req, res) => {
	const writeAsync = util.promisify((d, c) => res.write(d, 'utf8', c));

	res.statusCode = 200;
	res.setHeader('Content-Type', 'text/html; charset=utf-8');
	await writeAsync('<!DOCTYPE html><html><head></head><body style="background:white">');

	for (let i = 0; i < 100; i++) {
		let x = persistentVar;

		for (let j = 0; j < 100; j++) {
			const data = await readFileAsync('data.txt');
			await writeAsync(data);
		}
		
		expectedVar++;
		persistentVar = x + 1;
	}

	// Should always be a multiple of 100--but it won't be most of the time
	res.end(`Result: ${persistentVar} (expected: ${expectedVar})</body></html>`);
});

server1.listen(port1, hostname, () => {
	console.log(`Server running at http://${hostname}:${port1}/`);
});

server2.listen(port2, hostname, () => {
	console.log(`Server running at http://${hostname}:${port2}/`);
});