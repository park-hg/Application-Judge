const fs = require("fs")
const Judge = require("../models/judge");
const { posthandler } = require("../models/lambda");

exports.mainView = function(req, res) {
  fs.readFile("./views/index.html", "utf8", function(err, buf) {
    res.end(buf);
  })
}

exports.judgeCode = async function(req, res) {
  // judge 서버에 채점 요청
  console.log("submit from MAIN SERVER::::::", req.body);
  const result = await Judge(req.body['gitId'], req.body['problemId'], req.body['lang'], req.body['code']);
  console.log("judge Over!!", result);
  res.status(200).json(result);
}

exports.judgeLambda = async function(req, res) {
  console.log("submit to lambda", req.body);
  let body = {
    gitId: req.body['gitId'],
    problemId: req.body['problemId'],
    lang: req.body['lang'],
    code: req.body['code']
  }
  body = JSON.stringify(body);
  const result = await posthandler(body);
  console.log("judge Over!!", result);
  res.status(200).json(result);
}

