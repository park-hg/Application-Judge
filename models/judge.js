require("dotenv").config();
const fs = require("fs");
const { spawnSync, spawn, execFile } = require("child_process");
const { totalInputDict, totalOutputDict } = require("./readText");
const uuid = require("uuid");

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

async function createExecFile(lang, code) {
  const filename = uuid.v4();
  try {
    fs.writeFile(
      `./code/submission/${filename}.${extension[lang]}`,
      code,
      {'mode': 0o755},
      (err) => {
        if (err) throw err;
      }
    );

    return filename;
  } catch (err) {
    console.error(`Fail to create file ${err}`);
  }
}


async function execCode(userId, problemId, lang, filename) {
  const srcfile = `code/submission/${filename}.${extension[lang]}`;
  const outputs = [];
  const errors = [];
  for (let i = 0; i < totalInputDict[problemId].length; i++) {
    const child = spawn(command[lang], [srcfile], {
      /* 미리 구해놓은 정답 파일 크기의 2배를 넘어가면 출력초과 */
      // maxBuffer: Math.max(totalOutputDict[problemId][i].length * 2, 1000),
      /* timeout 3s */
      timeout: 3000,
      /* excute with guest permissions */
      // uid: parseInt(process.env.UID),
    });
    
    child.stdin.write(totalInputDict[problemId][i]);
    child.stdin.end();

    child.stderr.on('data', (err) => {
      if (err) {
        errors.push(err.toString().split(" ")[3]);
        if (err === 'ENOBUFS') outputs.push("출력초과");
        else if (err === 'ETIMEDOUT') outputs.push("시간초과");
        else outputs.push(err.toString().split(" ")[3]);
      }
    })

    child.stdout.on('data', (data) => {
      outputs.push(data.toString().trim() == totalOutputDict[problemId][i]);
    })

    child.on('close', (code) => {
      if (!code) {
        console.log(outputs);
        console.log(errors);
      }
    })
  }
  return { outputs, errors };
}

async function deleteFile(userId, problemId, lang, filename) {

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
    if (
      userId === undefined ||
      userId === "" ||
      problemId === undefined ||
      lang === undefined ||
      code === undefined
    ) {
      return {
        results: [],
        passRate: [],
        msg: [
          `you passed undefined params!!! userId: ${userId}, problemId: ${problemId}, lang: ${lang}, code: ${code}`,
        ],
      };
    }
    const filename = await createExecFile(lang, code);
    const { outputs, errors } = await execCode(
      userId,
      problemId,
      lang,
      filename
    );

    // const results = await compareOutput(problemId, outputs);
    // await deleteFile(userId, problemId, lang, filename);
    if (errors.length !== 0) {
      return {
        results,
        passRate: 0,
        msg: errors,
      };
    }

    // let passRate = results.reduce((a, b) => a + b, 0);
    // passRate = (passRate / results.length) * 100;

    // return {
    //   results,
    //   passRate,
    //   msg: outputs,
    // };
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
