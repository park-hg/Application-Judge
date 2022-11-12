const fs = require("fs");
const { spawn } = require("child_process");
const { totalInputDict, totalOutputDict } = require("./readText");
const uuid = require("uuid");

require("dotenv").config();

const extension = {
	Python: "py",
	JavaScript: "js",
	C: "c",
	"C++": "cpp",
	Java: "java",
};

const command = {
	Python: "python3",
	JavaScript: "node",
	C: "c",
	"C++": "cpp",
	Java: "java",
};

function promisifiedSpawn(srcfile, problemId, lang, idx) {
	let output, error;
	return new Promise((resolve, reject) => {
		try {
			const child = spawn(command[lang], [srcfile], {
				// excute with guest permissions
				uid: parseInt(process.env.UID),
			});

			// timeout: 3000,
			let timeout = setTimeout(() => {
				output = "시간초과";
				child.kill("SIGKILL");
			}, 3000);

			child.stdin.write(totalInputDict[problemId][idx]);
			child.stdin.end();

			child.stderr.on("data", (err) => {
				if (err) {
					error = err.toString();
				}
			});

			child.stdout.on("data", (data) => {
				// 미리 구해놓은 정답 파일 크기의 2배를 넘어가면 출력초과
				if (Buffer.byteLength(data) > Math.max(Buffer.byteLength(totalOutputDict[problemId][idx]) * 2, 1000)) {
					output = "출력초과";
					child.kill("SIGKILL");
				} else output = data.toString().trim();
			});

			child.on("error", (err) => {
				console.log(err);
			});

			child.on("close", (code) => {
				if (code === 0 || !code) resolve(output);
				else resolve(error);
			});

			child.on("exit", () => clearTimeout(timeout));
		} catch (e) {
			console.log("process spawn failed!", e);
		}
	});
}

async function createExecFile(lang, code) {
	const filename = uuid.v4();
	try {
		fs.writeFile(`./code/submission/${filename}.${extension[lang]}`, code, { mode: 0o755 }, (err) => {
			if (err) throw err;
		});

		return filename;
	} catch (err) {
		console.error(`Fail to create file ${err}`);
	}
}

async function execCode(problemId, lang, filename) {
	const srcfile = `code/submission/${filename}.${extension[lang]}`;
	const inputLength = totalInputDict[problemId].length;
	const processes = new Array(inputLength);
	for (let i = 0; i < inputLength; i++) {
		processes[i] = promisifiedSpawn(srcfile, problemId, lang, i);
	}
	let results = await Promise.all(processes);
	return results;
}

async function computeResults(problemId, userOutput) {
	const results = [];
	try {
		for (let i = 0; i < totalOutputDict[problemId].length; i++) {
			results.push(userOutput[i] == totalOutputDict[problemId][i]);
		}
		return results;
	} catch (e) {
		console.log("compare output error", e);
	}
}

async function deleteFile(lang, filename) {
	fs.unlink(`./code/submission/${filename}.${extension[lang]}`, function (err) {
		if (err !== null) {
			console.log(`Fail to delete file ${err.code}`);
			return false;
		}
	});
	return true;
}

async function judgeCode(userId, problemId, lang, code) {
	try {
		if (userId === undefined || userId === "" || problemId === undefined || lang === undefined || code === undefined) {
			return {
				results: [],
				passRate: [],
				msg: [`you passed undefined params!!! userId: ${userId}, problemId: ${problemId}, lang: ${lang}, code: ${code}`],
			};
		}
		const filename = await createExecFile(lang, code);
		const outputs = await execCode(problemId, lang, filename);
		const results = await computeResults(problemId, outputs);

		let passRate = results.reduce((a, b) => a + b, 0);
		passRate = (passRate / results.length) * 100;

		await deleteFile(lang, filename);

		return {
			results,
			passRate,
			msg: outputs,
		};
	} catch (e) {
		console.log(e);
		return {
			results: [],
			passRate: -1,
			msg: e,
		};
	}
}

module.exports = judgeCode;
